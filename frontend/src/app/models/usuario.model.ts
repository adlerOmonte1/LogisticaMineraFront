import { Rol } from './rol.model';

/** Usuario de la sesión: lo devuelve el login y no hay endpoint «yo» (D-F02). */
export interface UsuarioSesion {
  id: number;
  username: string;
  nombre_completo: string;
  rol: Rol;
  debe_cambiar_clave: boolean;
}

export interface Credenciales {
  username: string;
  password: string;
}

export interface RespuestaLogin {
  access: string;
  refresh: string;
  usuario: UsuarioSesion;
}

export interface RespuestaRenovacion {
  access: string;
}

/** Fila del listado de usuarios (`UsuarioListSerializer`). */
export interface UsuarioResumen {
  id: number;
  username: string;
  nombres: string;
  apellidos: string;
  rol: Rol;
  is_active: boolean;
}

/** Recurso completo (`UsuarioDetailSerializer`). */
export interface UsuarioDetalle extends UsuarioResumen {
  date_joined: string;
}

export interface NuevoUsuario {
  username: string;
  nombres: string;
  apellidos: string;
  password: string;
  rol: Rol;
}

export type CambiosUsuario = Partial<Omit<NuevoUsuario, 'password'>>;

export interface FiltroUsuarios {
  rol?: Rol | null;
  incluir_inactivos?: boolean;
}

export interface ClaveTemporal {
  username: string;
  clave_temporal: string;
}

export interface CambioClave {
  password_actual: string;
  password_nueva: string;
  password_nueva_confirmacion: string;
}
