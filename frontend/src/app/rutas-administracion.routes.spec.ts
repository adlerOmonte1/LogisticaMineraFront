import { RUTAS_ADMINISTRACION } from './rutas-administracion.routes';

describe('RUTAS_ADMINISTRACION', () => {
  const hijas = RUTAS_ADMINISTRACION[0].children ?? [];

  it('Administración tiene las tres pestañas de la maqueta: Usuarios, Permisos y Auditoría', () => {
    expect(hijas.map((ruta) => ruta.path)).toEqual(['', 'usuarios', 'permisos', 'auditoria']);
  });

  it('la pestaña Auditoría es del feature de M09, con su permiso, y ya no es una pantalla pendiente', () => {
    const auditoria = hijas.find((ruta) => ruta.path === 'auditoria');
    expect(auditoria?.children?.[0].canActivate?.length).toBe(1);
    expect(auditoria?.data).toBeUndefined();
  });
});
