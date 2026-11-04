import { Rol } from '@models/rol.model';
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
    trazabilidad: null,
    historial: [],
    ...cambios,
  };
}
