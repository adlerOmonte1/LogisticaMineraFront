import { Consolidado } from '@models/consolidacion.model';
import { Aviso, CalendarioMes, FilaIngreso, InicioDia, ResultadoConsulta } from '@models/consulta.model';
import { Evento } from '@models/evento.model';
import { Lote, LoteFila, ResumenLote } from '@models/lote.model';
import { Rol } from '@models/rol.model';
import { TrazabilidadIngreso } from '@models/trazabilidad.model';
import { RespuestaLogin, UsuarioSesion } from '@models/usuario.model';
import { Vehiculo } from '@models/vehiculo.model';

/** Datos de prueba reutilizables. Solo los importan los `*.spec.ts`. */

export function crearToken(vencimientoMs: number): string {
  const codificar = (objeto: object): string =>
    btoa(JSON.stringify(objeto)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${codificar({ alg: 'HS256', typ: 'JWT' })}.${codificar({ exp: Math.floor(vencimientoMs / 1000) })}.firma`;
}

export function crearUsuarioSesion(cambios: Partial<UsuarioSesion> = {}): UsuarioSesion {
  return {
    id: 1,
    username: 'admin.prueba',
    nombre_completo: 'Administrador De prueba',
    rol: 'ADMINISTRADOR',
    debe_cambiar_clave: false,
    ...cambios,
  };
}

export function crearRespuestaLogin(
  rol: Rol = 'ADMINISTRADOR',
  cambios: Partial<UsuarioSesion> = {},
): RespuestaLogin {
  return {
    access: crearToken(Date.now() + 30 * 60 * 1000),
    refresh: 'refresh-de-prueba',
    usuario: crearUsuarioSesion({ rol, ...cambios }),
  };
}

export function crearVehiculo(cambios: Partial<Vehiculo> = {}): Vehiculo {
  return {
    id: 7,
    placa: 'ABC-123',
    titularidad: 'PROPIO',
    capacidad_tn: '30.00',
    transportista: null,
    transportista_nombre: null,
    tara_tn: '12.00',
    fecha_destare: '2026-10-01T08:00:00-05:00',
    usuario_destare: 'supervisor.prueba',
    pendiente_destare: false,
    activo: true,
    ...cambios,
  };
}

export function paginaDe<T>(results: T[], next: string | null = null) {
  return { count: results.length, next, previous: null, results };
}

import { Ingreso } from '@models/ingreso.model';
import { BorradorIngreso } from '@models/registro-ingreso.model';

export function crearBorrador(cambios: Partial<BorradorIngreso> = {}): BorradorIngreso {
  return {
    borrador: 'token-firmado',
    hora_inicio_registro: '2026-11-03T16:33:51-05:00',
    sin_respaldo_fotografico: false,
    motivo_sin_respaldo: null,
    reconocimiento: {
      exito: true,
      motor: 'tesseract-local',
      version_motor: '5.5.0',
      umbral_confianza: 0.8,
      aviso: null,
      campos: [
        {
          nombre: 'PLACA',
          valor: 'V2K-841',
          confianza: 0.735,
          dudoso: true,
          aviso: 'Verifique este dato: lectura con baja confianza',
        },
        { nombre: 'FECHA', valor: '2026-10-30', confianza: 0.86, dudoso: false, aviso: null },
        { nombre: 'PESO_BRUTO', valor: '29.80', confianza: 0.906, dudoso: false, aviso: null },
      ],
    },
    propuesta: {
      placa: 'V2K-841',
      fecha: '2026-10-30',
      peso_bruto_tn: '29.80',
      hora: '16:33',
      hora_es_propuesta: true,
    },
    vehiculo: {
      id: 1,
      placa: 'V2K-841',
      titularidad: 'PROPIO',
      capacidad_tn: '18.00',
      tara_tn: '11.80',
      pendiente_destare: false,
      activo: true,
    },
    aviso_placa: null,
    inconsistencias: [],
    puede_agregar_tipo_mineral: false,
    aviso_tipo_mineral: 'Si no está en la lista, pida a un administrativo que lo registre',
    ...cambios,
  };
}

export function crearIngreso(cambios: Partial<Ingreso> = {}): Ingreso {
  return {
    id: 331,
    codigo: 'ING-2026-00331',
    estado: 'REGISTRADO',
    placa: 'V2K-841',
    vehiculo: 1,
    tipo_vehiculo: 'PROPIO',
    tipo_mineral: 1,
    tipo_mineral_codigo: 'MOA',
    tipo_mineral_nombre: 'Mineral óxido Pingüino',
    fecha_hora_pesaje: '2026-09-14T16:33:00-05:00',
    hora_inicio_registro: '2026-11-03T16:33:51-05:00',
    hora_fin_registro: '2026-11-03T16:37:12-05:00',
    peso_bruto_tn: '25.00',
    tara_tn: '11.80',
    peso_neto_tn: '13.20',
    sin_respaldo_fotografico: false,
    motivo_sin_respaldo: '',
    motivo_sin_respaldo_texto: '',
    imagen_url: '/api/v1/ingresos/331/imagen/',
    registrado_por: 'supervisor.prueba',
    motivo_anulacion: null,
    anulado_por: null,
    reconocimiento: { id: 29, hubo_reconocimiento: true, motivo: null },
    correccion_revertible: null,
    ...cambios,
  };
}

import { DetalleIngreso } from '@models/detalle-ingreso.model';

export function crearDetalle(cambios: Partial<DetalleIngreso> = {}): DetalleIngreso {
  const ingreso: Omit<Ingreso, 'reconocimiento'> & Partial<Pick<Ingreso, 'reconocimiento'>> = crearIngreso();
  delete ingreso.reconocimiento;
  return {
    ...ingreso,
    reconocimiento: {
      disponible: true,
      id: 29,
      ingreso: 331,
      codigo_ingreso: 'ING-2026-00331',
      motor: 'tesseract-local',
      version_motor: '5.5.0',
      fecha_proceso: '2026-11-03T16:33:51-05:00',
      umbral_confianza: '0.80',
      exito: true,
      causa_fallo: '',
      motivo_fallo: null,
      campos: [
        {
          nombre_campo: 'PLACA',
          valor_reconocido: 'V2K-841',
          valor_confirmado: 'V2K-841',
          confianza: '0.735',
          fue_corregido: false,
          dudoso: true,
        },
        {
          nombre_campo: 'FECHA',
          valor_reconocido: '2026-10-30',
          valor_confirmado: '2026-09-14',
          confianza: '0.86',
          fue_corregido: true,
          dudoso: false,
        },
        {
          nombre_campo: 'PESO_BRUTO',
          valor_reconocido: '29.80',
          valor_confirmado: '25.00',
          confianza: '0.906',
          fue_corregido: true,
          dudoso: false,
        },
      ],
      puede_corregir_ingreso: true,
    },
    respaldo: { tipo: 'IMAGEN', url: '/api/v1/consulta/ingresos/331/ticket/' },
    validaciones: {
      disponible: true,
      resultados: [
        {
          id: 1,
          regla: 'V1',
          momento: 'PROPUESTA',
          cumple: true,
          detalle: '',
          resolucion: 'NO_APLICA',
          justificacion: '',
          fecha_hora: '2026-11-03T16:37:12-05:00',
        },
        {
          id: 2,
          regla: 'V4',
          momento: 'CONFIRMACION',
          cumple: false,
          detalle: '',
          resolucion: 'JUSTIFICADA',
          justificacion: 'Carga autorizada',
          fecha_hora: '2026-11-03T16:37:12-05:00',
        },
        {
          id: 3,
          regla: 'V2',
          momento: 'CONFIRMACION',
          cumple: null,
          detalle: '',
          resolucion: 'NO_APLICA',
          justificacion: '',
          fecha_hora: '2026-11-03T16:37:12-05:00',
        },
      ],
    },
    trazabilidad: {
      ingreso: 'ING-2026-00331',
      anulado: false,
      lote: null,
      mensaje: 'El ingreso aún no tiene lote y no ha recorrido ninguna etapa',
      lineas: [],
      ruta_por_decidir: false,
      etapas_recorridas: 0,
      etapas_totales: 0,
      proceso_completo: false,
    },
    historial: [],
    ...cambios,
  };
}

/** Un evento de auditoría: la creación de un ingreso por el Supervisor. */
export function crearEvento(cambios: Partial<Evento> = {}): Evento {
  return {
    id: 901,
    fecha_hora: '2026-11-03T16:37:12-05:00',
    accion: 'CREAR',
    accion_texto: 'Crear',
    operacion: null,
    entidad: 'Ingreso',
    id_entidad: 331,
    referencia: 'ING-2026-00331',
    usuario: 'sup.prueba',
    cambios: [],
    valores_anteriores: null,
    valores_nuevos: null,
    motivo: '',
    direccion_ip: '10.0.0.8',
    ingresos_relacionados: [],
    ...cambios,
  };
}

/** Una corrección con su antes y después y el motivo (HU-M09-02 CA02). */
export function crearEventoCorreccion(cambios: Partial<Evento> = {}): Evento {
  return crearEvento({
    id: 902,
    fecha_hora: '2026-11-04T09:10:00-05:00',
    accion: 'MODIFICAR',
    accion_texto: 'Modificar',
    operacion: 'CORRECCION',
    usuario: 'admin.prueba',
    cambios: [
      { campo: 'peso_bruto_tn', anterior: '31.50', nuevo: '31.80' },
      { campo: 'tipo_mineral', anterior: null, nuevo: 'ZINC' },
    ],
    valores_anteriores: { peso_bruto_tn: '31.50', tipo_mineral: null },
    valores_nuevos: { operacion: 'CORRECCION', peso_bruto_tn: '31.80', tipo_mineral: 'ZINC' },
    motivo: 'La balanza marcó 31.80',
    ...cambios,
  });
}

/** Un lote en recorrido con un ingreso y el secado como único «siguiente paso». */
export function crearLote(cambios: Partial<Lote> = {}): Lote {
  return {
    id: 12,
    codigo: 'LOT-2026-0012',
    nombre: 'Lote prueba',
    estado: 'EN_RECORRIDO',
    fecha_apertura: '2026-11-02',
    fecha_inicio_recorrido: '2026-11-03T08:00:00-05:00',
    ruta: '',
    destino: '',
    destino_texto: '',
    observacion_cierre: '',
    fecha_cierre: null,
    usuario_cierre: null,
    composicion: [
      {
        tipo_mineral: { id: 1, codigo: 'ZN', nombre: 'Zinc' },
        otro_mineral: false,
        autorizacion: null,
        ingresos: [
          {
            id: 331,
            codigo: 'ING-2026-00331',
            fecha_hora_pesaje: '2026-11-01T10:00:00-05:00',
            peso_neto_tn: '13.20',
            estado: 'REGISTRADO',
            tardio: false,
            secado_propio: false,
            otro_mineral: false,
          },
        ],
        cantidad: 1,
        toneladas: '13.20',
      },
    ],
    total: { ingresos: 1, toneladas: '13.20' },
    partes: [],
    recorrido: [],
    bigbags: [],
    siguientes: [{ carga: 'Lote prueba', parte: null, ingreso: null, etapa: 'SECADO', elegir_ruta: false }],
    pendientes: ['Falta registrar el secado'],
    ...cambios,
  };
}

export function crearLoteFila(cambios: Partial<LoteFila> = {}): LoteFila {
  return {
    id: 12,
    codigo: 'LOT-2026-0012',
    nombre: 'Lote prueba',
    estado: 'EN_RECORRIDO',
    tipo_mineral: 1,
    tipo_mineral_nombre: 'Zinc',
    fecha_apertura: '2026-11-02',
    fecha_inicio_recorrido: '2026-11-03T08:00:00-05:00',
    ruta: '',
    destino: '',
    ingresos: 1,
    toneladas: '13.20',
    ...cambios,
  };
}

export function crearResumenLote(cambios: Partial<ResumenLote> = {}): ResumenLote {
  return {
    pendientes: [],
    toneladas_registradas: '13.20',
    bigbags: 9,
    ensacado_aproximado_tn: '13.50',
    diferencia_tn: '0.30',
    es_estimacion: true,
    partes: [
      {
        nombre: 'Lote prueba',
        ruta: 'MOLIENDA_ENSACADO',
        fraccion: '1',
        toneladas_aproximadas: '13.20',
        horas_molienda: '4.00',
        toneladas_por_hora: '3.30',
      },
    ],
    horas_desde_apertura: 50.5,
    horas_desde_inicio: 30,
    ultimo_ensacado: '2026-11-04T10:00:00-05:00',
    ...cambios,
  };
}

/** Un ingreso en un lote con la ruta «Zaranda» y el secado ya hecho. */
export function crearTrazabilidad(cambios: Partial<TrazabilidadIngreso> = {}): TrazabilidadIngreso {
  return {
    ingreso: 'ING-2026-00331',
    anulado: false,
    lote: {
      id: 12,
      codigo: 'LOT-2026-0012',
      nombre: 'Lote prueba',
      estado: 'EN_RECORRIDO',
      destino: null,
      fecha_cierre: null,
    },
    secado: {
      propio: false,
      completado: true,
      fecha_hora: '2026-11-03T09:00:00-05:00',
      usuario: 'sup.prueba',
    },
    lineas: [
      {
        nombre: 'Lote prueba',
        ruta: 'ZARANDEO_ENSACADO',
        etapas: [
          {
            codigo: 'SECADO',
            nombre: 'Secado',
            completada: true,
            fecha_hora: '2026-11-03T09:00:00-05:00',
            usuario: 'sup.prueba',
          },
          { codigo: 'ZARANDEO', nombre: 'Zarandeo', completada: false, fecha_hora: null, usuario: null },
          { codigo: 'ENSACADO', nombre: 'Ensacado', completada: false, fecha_hora: null, usuario: null },
        ],
      },
    ],
    ruta_por_decidir: false,
    etapas_recorridas: 1,
    etapas_totales: 3,
    proceso_completo: false,
    ...cambios,
  };
}

/** Una fila de listado: un ingreso registrado de volquete propio. */
export function crearFilaIngreso(cambios: Partial<FilaIngreso> = {}): FilaIngreso {
  return {
    id: 331,
    codigo: 'ING-2026-00331',
    fecha_hora_pesaje: '2026-11-03T16:33:00-05:00',
    placa: 'V2K-841',
    tipo_vehiculo: 'PROPIO',
    tipo_mineral: 'Zinc',
    peso_bruto_tn: '32.40',
    peso_neto_tn: '13.20',
    pendiente_destare: false,
    estado: 'REGISTRADO',
    estado_texto: 'Registrado',
    motivo_anulacion: null,
    sin_respaldo_fotografico: false,
    motivo_sin_respaldo: null,
    ...cambios,
  };
}

export function crearResultadoConsulta(
  filas: FilaIngreso[] = [crearFilaIngreso()],
  cambios: Partial<ResultadoConsulta> = {},
): ResultadoConsulta {
  return {
    count: filas.length,
    next: null,
    previous: null,
    results: filas,
    totales: {
      ingresos: filas.length,
      registrados: filas.length,
      en_proceso: 0,
      anulados: 0,
      toneladas: '13.20',
    },
    filtros: { fecha_desde: '2026-11-01', fecha_hasta: '2026-11-03' },
    mensaje: filas.length ? null : 'No hay ingresos con estos filtros',
    ...cambios,
  };
}

/** El inicio de un Administrador con una llegada hoy y un destare pendiente. */
export function crearInicio(cambios: Partial<InicioDia> = {}): InicioDia {
  return {
    fecha: '2026-11-03',
    ingresos_hoy: {
      cantidad: 2,
      ultimo: { hora: '16:33', placa: 'V2K-841' },
      mensaje: null,
      enlace: '/consulta/calendario',
    },
    toneladas_hoy: {
      toneladas: '13.20',
      en_proceso: 1,
      mensaje: 'Sin contar 1 en proceso',
      enlace: '/consolidacion',
    },
    pendientes_destare: { cantidad: 1, placas: ['ABC-123'], enlace: '/ingresos/destares' },
    lotes_en_proceso: { cantidad: 3, enlace: '/lotes' },
    ultimos_ingresos: [crearFilaIngreso()],
    ultimos_siete_dias: [
      { fecha: '2026-10-28', toneladas: '0.00' },
      { fecha: '2026-10-29', toneladas: '10.00' },
      { fecha: '2026-10-30', toneladas: '0.00' },
      { fecha: '2026-10-31', toneladas: '20.00' },
      { fecha: '2026-11-01', toneladas: '5.00' },
      { fecha: '2026-11-02', toneladas: '0.00' },
      { fecha: '2026-11-03', toneladas: '13.20' },
    ],
    ...cambios,
  };
}

/** Un mes con llegadas el día 3 (con En proceso) y el día 5 (con anulados). */
export function crearCalendario(anio = 2026, mes = 11, cambios: Partial<CalendarioMes> = {}): CalendarioMes {
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const dias = Array.from({ length: ultimo }, (_, i) => {
    const n = i + 1;
    return {
      fecha: `${anio}-${String(mes).padStart(2, '0')}-${String(n).padStart(2, '0')}`,
      ingresos: n === 3 ? 2 : n === 5 ? 1 : 0,
      toneladas: n === 3 ? '13.20' : n === 5 ? '9.00' : '0.00',
      con_en_proceso: n === 3,
      con_anulados: n === 5,
    };
  });
  return {
    anio,
    mes,
    dias,
    resumen: { ingresos: 3, toneladas: '22.20', dias_con_llegadas: 2, en_proceso: 1 },
    ...cambios,
  };
}

export function crearAviso(cambios: Partial<Aviso> = {}): Aviso {
  return {
    tipo: 'DESTARE',
    titulo: 'ING-2026-00331 espera el destare',
    detalle: 'Vehículo ABC-123, peso bruto 32.40 t',
    enlace: '/ingresos/destares',
    ingreso: 331,
    ...cambios,
  };
}

/** Noviembre de 2026 con dos minerales, un En proceso y un anulado (el mes en curso de los datos). */
export function crearConsolidado(cambios: Partial<Consolidado> = {}): Consolidado {
  return {
    anio: 2026,
    mes: 11,
    tipos_mineral: [
      {
        tipo_mineral: 1,
        codigo: 'MOA',
        nombre: 'Mineral óxido Pingüino',
        ingresos: 3,
        toneladas: '49.20',
        participacion: '58.02',
      },
      {
        tipo_mineral: 2,
        codigo: 'MOB',
        nombre: 'Mineral óxido tipo B',
        ingresos: 2,
        toneladas: '35.60',
        participacion: '41.98',
      },
    ],
    total_toneladas: '84.80',
    total_ingresos: 5,
    en_proceso: { cantidad: 1, codigos: ['ING-2026-00005'] },
    anulados_excluidos: 1,
    mensaje: null,
    en_proceso_mensaje: 'Hay 1 ingresos en proceso en el periodo, pendientes del destare',
    al_corte: 'Total al corte de hoy, 04/11/2026',
    ...cambios,
  };
}
