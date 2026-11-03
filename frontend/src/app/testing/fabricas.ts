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
