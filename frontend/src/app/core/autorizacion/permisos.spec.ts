import { DEFINICION_PERMISOS, MATRIZ_PERMISOS, Permiso, rolTienePermiso } from './permisos';

describe('Matriz de permisos (lectura de permissions.py)', () => {
  it('define las quince operaciones del backend, cada una una vez', () => {
    const permisos = DEFINICION_PERMISOS.map((d) => d.permiso);
    expect(new Set(permisos).size).toBe(15);
    expect(Object.keys(MATRIZ_PERMISOS).length).toBe(15);
  });

  it('el Supervisor registra ingresos, destares, vehículos y etapas, y consulta', () => {
    const permitidos: Permiso[] = [
      'CONSULTAR',
      'REGISTRAR_INGRESO',
      'DAR_ALTA_VEHICULO',
      'REGISTRAR_DESTARE',
      'REGISTRAR_ETAPA',
    ];
    for (const { permiso } of DEFINICION_PERMISOS) {
      expect(rolTienePermiso('SUPERVISOR', permiso)).withContext(permiso).toBe(permitidos.includes(permiso));
    }
  });

  it('el Administrativo gestiona, pero no anula, ni modifica taras, ni cierra lotes, ni administra', () => {
    const negados: Permiso[] = [
      'ANULAR_INGRESO',
      'MODIFICAR_TARA',
      'CERRAR_LOTE',
      'GESTIONAR_USUARIOS',
      'CONSULTAR_AUDITORIA',
    ];
    for (const { permiso } of DEFINICION_PERMISOS) {
      expect(rolTienePermiso('ADMINISTRATIVO', permiso))
        .withContext(permiso)
        .toBe(!negados.includes(permiso));
    }
  });

  it('el Administrador lo puede todo; sin rol, nada', () => {
    for (const { permiso } of DEFINICION_PERMISOS) {
      expect(rolTienePermiso('ADMINISTRADOR', permiso)).toBeTrue();
      expect(rolTienePermiso(null, permiso)).toBeFalse();
    }
  });
});
