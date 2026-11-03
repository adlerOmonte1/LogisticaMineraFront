import { Permiso } from '../autorizacion/permisos';

export type SeccionNavegacion = 'General' | 'Gestión';

export interface ItemNavegacion {
  etiqueta: string;
  ruta: string;
  icono: string;
  permiso: Permiso;
  seccion: SeccionNavegacion;
  /** Activa solo con la ruta exacta (`/consulta` no debe marcarse en `/consulta/ingresos`). */
  exacta?: boolean;
}

export interface GrupoNavegacion {
  seccion: SeccionNavegacion;
  items: readonly ItemNavegacion[];
}

/**
 * Menú del sistema: mismo orden y textos que el `NAV` de la maqueta, con las rutas del
 * cliente (docs/pantallas.md §2). Cada entrada lleva el permiso que la habilita; el menú de
 * cada rol se deduce de la matriz, no se escribe aparte (HU-M01-03 CA01).
 */
export const NAVEGACION: readonly ItemNavegacion[] = [
  { etiqueta: 'Inicio', ruta: '/inicio', icono: 'home', permiso: 'CONSULTAR', seccion: 'General' },
  {
    etiqueta: 'Ingresos',
    ruta: '/consulta/ingresos',
    icono: 'inbox',
    permiso: 'CONSULTAR',
    seccion: 'General',
  },
  {
    etiqueta: 'Destares',
    ruta: '/ingresos/destares',
    icono: 'scale',
    permiso: 'REGISTRAR_DESTARE',
    seccion: 'General',
  },
  {
    etiqueta: 'Calendario',
    ruta: '/consulta/calendario',
    icono: 'calendar_month',
    permiso: 'CONSULTAR',
    seccion: 'General',
  },
  {
    etiqueta: 'Trazabilidad',
    ruta: '/lotes',
    icono: 'account_tree',
    permiso: 'CONSULTAR',
    seccion: 'General',
  },
  {
    etiqueta: 'Cierre de lotes',
    ruta: '/lotes/cierre',
    icono: 'task_alt',
    permiso: 'CERRAR_LOTE',
    seccion: 'General',
  },
  {
    etiqueta: 'Consulta',
    ruta: '/consulta',
    icono: 'search',
    permiso: 'CONSULTAR',
    seccion: 'General',
    exacta: true,
  },
  {
    etiqueta: 'Consolidación',
    ruta: '/consolidacion',
    icono: 'bar_chart',
    permiso: 'CONSOLIDAR',
    seccion: 'General',
  },
  {
    etiqueta: 'Catálogos',
    ruta: '/catalogos',
    icono: 'description',
    permiso: 'GESTIONAR_CATALOGO',
    seccion: 'Gestión',
  },
  {
    etiqueta: 'Administración',
    ruta: '/administracion',
    icono: 'admin_panel_settings',
    permiso: 'GESTIONAR_USUARIOS',
    seccion: 'Gestión',
  },
];

/** Botón principal del armazón: registrar es la operación más frecuente en planta. */
export const ACCION_PRINCIPAL: ItemNavegacion = {
  etiqueta: 'Registrar ingreso',
  ruta: '/ingresos/registrar',
  icono: 'add_a_photo',
  permiso: 'REGISTRAR_INGRESO',
  seccion: 'General',
};

/** Barra inferior del teléfono, con el registro al centro. */
export const RUTAS_BARRA_INFERIOR: readonly string[] = [
  '/inicio',
  '/consulta/ingresos',
  '/ingresos/registrar',
  '/lotes',
  '/consulta',
];

export function filtrarPorPermiso(
  items: readonly ItemNavegacion[],
  puede: (permiso: Permiso) => boolean,
): ItemNavegacion[] {
  return items.filter((item) => puede(item.permiso));
}

export function agruparPorSeccion(items: readonly ItemNavegacion[]): GrupoNavegacion[] {
  const grupos = new Map<SeccionNavegacion, ItemNavegacion[]>();
  for (const item of items) {
    grupos.set(item.seccion, [...(grupos.get(item.seccion) ?? []), item]);
  }
  return [...grupos].map(([seccion, itemsDelGrupo]) => ({ seccion, items: itemsDelGrupo }));
}

export function itemsDeBarraInferior(items: readonly ItemNavegacion[]): ItemNavegacion[] {
  const todos = [...items, ACCION_PRINCIPAL];
  return RUTAS_BARRA_INFERIOR.map((ruta) => todos.find((item) => item.ruta === ruta)).filter(
    (item): item is ItemNavegacion => item !== undefined,
  );
}
