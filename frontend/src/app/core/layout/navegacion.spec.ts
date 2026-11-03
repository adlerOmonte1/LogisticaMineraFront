import { Rol } from '@models/rol.model';
import { rolTienePermiso } from '../autorizacion/permisos';
import { NAVEGACION, agruparPorSeccion, filtrarPorPermiso, itemsDeBarraInferior } from './navegacion';

function menuDe(rol: Rol): string[] {
  return filtrarPorPermiso(NAVEGACION, (permiso) => rolTienePermiso(rol, permiso)).map(
    (item) => item.etiqueta,
  );
}

describe('Menú por rol (HU-M01-03 CA01)', () => {
  it('el Supervisor ve solo inicio, ingresos con destares y calendario, trazabilidad y consulta', () => {
    expect(menuDe('SUPERVISOR')).toEqual([
      'Inicio',
      'Ingresos',
      'Destares',
      'Calendario',
      'Trazabilidad',
      'Consulta',
    ]);
  });

  it('el Administrativo ve además la consolidación y los catálogos, sin cierre de lotes ni administración', () => {
    const menu = menuDe('ADMINISTRATIVO');
    expect(menu).toContain('Consolidación');
    expect(menu).toContain('Catálogos');
    expect(menu).not.toContain('Cierre de lotes');
    expect(menu).not.toContain('Administración');
  });

  it('el Administrador lo ve todo', () => {
    expect(menuDe('ADMINISTRADOR').length).toBe(NAVEGACION.length);
  });

  it('agrupa por sección conservando el orden', () => {
    const grupos = agruparPorSeccion(NAVEGACION);
    expect(grupos.map((g) => g.seccion)).toEqual(['General', 'Gestión']);
    expect(grupos[1].items.map((i) => i.etiqueta)).toEqual(['Catálogos', 'Administración']);
  });

  it('la barra inferior lleva el registro al centro', () => {
    const barra = itemsDeBarraInferior(NAVEGACION).map((i) => i.etiqueta);
    expect(barra).toEqual(['Inicio', 'Ingresos', 'Registrar ingreso', 'Trazabilidad', 'Consulta']);
  });
});
