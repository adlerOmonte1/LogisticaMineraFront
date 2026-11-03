/** Valores del rol tal como viajan por la API (`Rol.OPCIONES` del backend). */
export type Rol = 'ADMINISTRADOR' | 'ADMINISTRATIVO' | 'SUPERVISOR';

export const ROLES: readonly Rol[] = ['ADMINISTRADOR', 'ADMINISTRATIVO', 'SUPERVISOR'];

/** Nombre del rol en la interfaz (marco de tesis §8). */
export const ETIQUETA_ROL: Readonly<Record<Rol, string>> = {
  ADMINISTRADOR: 'Administrador',
  ADMINISTRATIVO: 'Administrativo',
  SUPERVISOR: 'Supervisor de planta',
};
