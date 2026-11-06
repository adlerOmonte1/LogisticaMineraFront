import {
  CatalogoRecorrido,
  CodigoEtapa,
  IngresoDeComposicion,
  Lote,
  PasoRecorrido,
  SiguientePaso,
} from '@models/lote.model';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';
import { aCentesimas, deCentesimas } from '@shared/utils/decimal';

const toneladas = new ToneladasPipe();

/**
 * Lo que dibuja «Recorrido del mineral» como en la maqueta: la etapa común, la división y una
 * columna por parte, cada etapa en su tarjeta. Solo **acomoda** lo que manda el servidor: una
 * tarjeta está hecha si hay un paso en `recorrido`, y es la siguiente si hay un `siguientes` que
 * la nombra. El cliente no decide qué etapa sigue (RNF-M06-07).
 */

export type EstadoTarjeta = 'ok' | 'next' | 'pend' | 'wait';

export interface TarjetaEtapa {
  etapa: CodigoEtapa;
  nombre: string;
  estado: EstadoTarjeta;
  paso: PasoRecorrido | null;
  siguiente: SiguientePaso | null;
}

export interface BigbagsLinea {
  cantidad: number;
  /** Suma de cantidad × peso aproximado: estimación, nunca total (RNF-M06-09). */
  aproximadoTn: string;
}

export interface LineaFlujo {
  clave: string;
  nombre: string;
  /** «Molido, 1/4 del lote, ≈ 5,43 t». */
  detalle: string;
  parte: number | null;
  /** `null` mientras el lote no tiene ruta: se muestra «Ruta por definir». */
  etapas: TarjetaEtapa[] | null;
  /** Con ruta por definir, el paso del servidor que la pide. */
  elegirRuta: SiguientePaso | null;
  ensacada: boolean;
  completa: boolean;
  bigbags: BigbagsLinea | null;
}

export interface ComplementoFlujo {
  ingreso: IngresoDeComposicion;
  secado: TarjetaEtapa;
  /** Lo que el servidor ofrece después para este ingreso, además de su secado. */
  otros: SiguientePaso[];
  pasos: PasoRecorrido[];
}

export interface FlujoLote {
  secado: TarjetaEtapa;
  dividido: boolean;
  lineas: LineaFlujo[];
  complementos: ComplementoFlujo[];
  /** Siguientes que no encajan en ninguna tarjeta: se ofrecen igual, para no perder ninguno. */
  sueltos: SiguientePaso[];
  avance: { hechas: number; total: number };
}

const NOMBRE_ETAPA: Readonly<Record<CodigoEtapa, string>> = {
  SECADO: 'Secado',
  ZARANDEO: 'Zarandeo',
  MOLIENDA: 'Molienda',
  ENSACADO: 'Ensacado',
};

export function construirFlujo(lote: Lote, catalogo: CatalogoRecorrido | null): FlujoLote {
  const nombreEtapa = (codigo: CodigoEtapa): string =>
    catalogo?.etapas.find((e) => e.codigo === codigo)?.nombre ?? NOMBRE_ETAPA[codigo];
  const usados = new Set<SiguientePaso>();
  const tomar = (condicion: (s: SiguientePaso) => boolean): SiguientePaso | null => {
    const hallado = lote.siguientes.find((s) => !usados.has(s) && condicion(s)) ?? null;
    if (hallado) {
      usados.add(hallado);
    }
    return hallado;
  };
  const delLote = (p: PasoRecorrido): boolean => p.ingreso_tardio === null;

  // Etapa común
  const pasoSecado = lote.recorrido.find((p) => p.etapa === 'SECADO' && p.parte === null && delLote(p));
  const sigSecado = tomar((s) => s.etapa === 'SECADO' && s.ingreso === null && s.parte === null);
  const secado: TarjetaEtapa = {
    etapa: 'SECADO',
    nombre: nombreEtapa('SECADO'),
    paso: pasoSecado ?? null,
    siguiente: sigSecado,
    estado: pasoSecado ? 'ok' : sigSecado ? 'next' : lote.estado === 'ABIERTO' ? 'wait' : 'pend',
  };

  const tarjetas = (etapas: readonly CodigoEtapa[], parte: number | null): TarjetaEtapa[] =>
    etapas.map((etapa) => {
      const paso = lote.recorrido.find((p) => p.etapa === etapa && p.parte === parte && delLote(p)) ?? null;
      const siguiente = paso
        ? null
        : tomar((s) => s.etapa === etapa && s.parte === parte && s.ingreso === null && !s.elegir_ruta);
      return {
        etapa,
        nombre: nombreEtapa(etapa),
        paso,
        siguiente,
        estado: paso ? 'ok' : siguiente ? 'next' : 'pend',
      };
    });
  const etapasDeRuta = (ruta: string | null): CodigoEtapa[] | null =>
    catalogo?.rutas.find((r) => r.codigo === ruta)?.etapas ?? null;
  const bigbagsDe = (parte: number | null): BigbagsLinea | null => {
    const registros = lote.bigbags.filter((b) => b.parte === parte);
    if (registros.length === 0) {
      return null;
    }
    const centesimas = registros.reduce(
      (suma, b) => suma + b.cantidad * (aCentesimas(b.peso_aproximado_tn) ?? 0),
      0,
    );
    return {
      cantidad: registros.reduce((suma, b) => suma + b.cantidad, 0),
      aproximadoTn: deCentesimas(centesimas),
    };
  };
  const linea = (base: Omit<LineaFlujo, 'ensacada' | 'completa' | 'bigbags'>): LineaFlujo => {
    const etapas = base.etapas ?? [];
    return {
      ...base,
      ensacada: etapas.some((t) => t.etapa === 'ENSACADO' && t.paso !== null),
      completa: etapas.length > 0 && etapas.every((t) => t.paso !== null),
      bigbags: bigbagsDe(base.parte),
    };
  };

  let lineas: LineaFlujo[];
  if (lote.partes.length > 0) {
    lineas = lote.partes.map((parte) =>
      linea({
        clave: `parte-${parte.id}`,
        nombre: parte.nombre,
        detalle: `${parte.ruta_texto}, ${parte.fraccion} del lote, ≈ ${toneladas.transform(parte.toneladas_aproximadas)}`,
        parte: parte.id,
        etapas: tarjetas(etapasDeRuta(parte.ruta) ?? [], parte.id),
        elegirRuta: null,
      }),
    );
  } else {
    const etapas = etapasDeRuta(lote.ruta || null);
    const rutaTexto = catalogo?.rutas.find((r) => r.codigo === lote.ruta)?.nombre;
    lineas = [
      linea({
        clave: 'lote',
        nombre: 'Todo el lote',
        detalle: `${rutaTexto ?? 'Ruta por definir'}, ${toneladas.transform(lote.total.toneladas)}`,
        parte: null,
        etapas: etapas ? tarjetas(etapas, null) : null,
        elegirRuta: etapas ? null : tomar((s) => s.elegir_ruta && s.parte === null && s.ingreso === null),
      }),
    ];
  }

  // Ingresos agregados después del secado: cada uno con su secado propio (HU-M06-01 CA13).
  const tardios = lote.composicion
    .flatMap((grupo) => grupo.ingresos)
    .filter(
      (ingreso) =>
        ingreso.secado_propio ||
        lote.recorrido.some((p) => p.ingreso_tardio === ingreso.id) ||
        lote.siguientes.some((s) => s.ingreso === ingreso.id),
    );
  const complementos = tardios.map((ingreso) => {
    const pasos = lote.recorrido.filter((p) => p.ingreso_tardio === ingreso.id);
    const pasoSecadoPropio = pasos.find((p) => p.etapa === 'SECADO') ?? null;
    const sigSecadoPropio = pasoSecadoPropio
      ? null
      : tomar((s) => s.ingreso === ingreso.id && s.etapa === 'SECADO');
    const otros: SiguientePaso[] = [];
    let otro = tomar((s) => s.ingreso === ingreso.id);
    while (otro) {
      otros.push(otro);
      otro = tomar((s) => s.ingreso === ingreso.id);
    }
    return {
      ingreso,
      pasos,
      otros,
      secado: {
        etapa: 'SECADO' as const,
        nombre: 'Secado propio',
        paso: pasoSecadoPropio,
        siguiente: sigSecadoPropio,
        estado: (pasoSecadoPropio ? 'ok' : sigSecadoPropio ? 'next' : 'pend') as EstadoTarjeta,
      },
    };
  });

  const total = 1 + lineas.reduce((suma, l) => suma + (l.etapas?.length ?? 2), 0) + complementos.length;
  const hechas = Math.min(lote.recorrido.length, total);

  return {
    secado,
    dividido: lote.partes.length > 1,
    lineas,
    complementos,
    sueltos: lote.siguientes.filter((s) => !usados.has(s)),
    avance: lote.estado === 'CERRADO' ? { hechas: total, total } : { hechas, total },
  };
}
