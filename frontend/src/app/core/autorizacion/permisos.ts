import { Rol } from '@models/rol.model';

/**
 * Operaciones autorizables. Cada una es la lectura de una clase de
 * `backend/apps/accounts/permissions.py`, la única definición de la matriz (RN-M01-09).
 * Si el backend cambia, cambia esta tabla y nada más (docs/contrato-api.md §9).
 */
export type Permiso =
  | 'CONSULTAR'
  | 'REGISTRAR_INGRESO'
  | 'DAR_ALTA_VEHICULO'
  | 'REGISTRAR_DESTARE'
  | 'REGISTRAR_ETAPA'
  | 'CORREGIR_INGRESO'
  | 'GESTIONAR_CATALOGO'
  | 'COMPONER_LOTE'
  | 'EXPORTAR_LISTADO'
  | 'CONSOLIDAR'
  | 'ANULAR_INGRESO'
  | 'MODIFICAR_TARA'
  | 'CERRAR_LOTE'
  | 'GESTIONAR_USUARIOS'
  | 'CONSULTAR_AUDITORIA';

export interface DefinicionPermiso {
  permiso: Permiso;
  /** Clase del backend que lo aplica. */
  claseBackend: string;
  /** Texto de la pantalla de permisos (tomado de la maqueta, `FUNCS`). */
  descripcion: string;
  roles: readonly Rol[];
}

const TODOS: readonly Rol[] = ['ADMINISTRADOR', 'ADMINISTRATIVO', 'SUPERVISOR'];
const GESTION: readonly Rol[] = ['ADMINISTRADOR', 'ADMINISTRATIVO'];
const SOLO_ADMINISTRADOR: readonly Rol[] = ['ADMINISTRADOR'];

export const DEFINICION_PERMISOS: readonly DefinicionPermiso[] = [
  {
    permiso: 'CONSULTAR',
    claseBackend: 'PuedeConsultar',
    descripcion: 'Ver la lista y el detalle de ingresos, consultar por placa y fecha, y ver los lotes',
    roles: TODOS,
  },
  {
    permiso: 'REGISTRAR_INGRESO',
    claseBackend: 'PuedeRegistrarIngreso',
    descripcion: 'Registrar un ingreso, con foto del ticket o sin ella',
    roles: TODOS,
  },
  {
    permiso: 'DAR_ALTA_VEHICULO',
    claseBackend: 'PuedeDarAltaVehiculo',
    descripcion: 'Registrar un vehículo nuevo desde el registro de ingreso',
    roles: TODOS,
  },
  {
    permiso: 'REGISTRAR_DESTARE',
    claseBackend: 'PuedeRegistrarDestare',
    descripcion: 'Registrar el destare de un vehículo',
    roles: TODOS,
  },
  {
    permiso: 'REGISTRAR_ETAPA',
    claseBackend: 'PuedeRegistrarEtapa',
    descripcion: 'Registrar el paso de un lote por una etapa',
    roles: TODOS,
  },
  {
    permiso: 'CORREGIR_INGRESO',
    claseBackend: 'PuedeCorregirIngreso',
    descripcion: 'Corregir un ingreso registrado y revertir su última corrección',
    roles: GESTION,
  },
  {
    permiso: 'GESTIONAR_CATALOGO',
    claseBackend: 'PuedeGestionarCatalogo',
    descripcion: 'Gestionar vehículos, minerales y transportistas',
    roles: GESTION,
  },
  {
    permiso: 'COMPONER_LOTE',
    claseBackend: 'PuedeComponerLote',
    descripcion: 'Abrir lotes, agregar minerales, asignar ingresos, iniciar el recorrido y dividir',
    roles: GESTION,
  },
  {
    permiso: 'EXPORTAR_LISTADO',
    claseBackend: 'PuedeExportarListado',
    descripcion: 'Exportar el listado de ingresos',
    roles: GESTION,
  },
  {
    permiso: 'CONSOLIDAR',
    claseBackend: 'PuedeConsolidar',
    descripcion: 'Consolidar la producción mensual y exportar el total',
    roles: GESTION,
  },
  {
    permiso: 'ANULAR_INGRESO',
    claseBackend: 'PuedeAnularIngreso',
    descripcion: 'Anular un ingreso',
    roles: SOLO_ADMINISTRADOR,
  },
  {
    permiso: 'MODIFICAR_TARA',
    claseBackend: 'PuedeModificarTara',
    descripcion: 'Modificar la tara de un vehículo',
    roles: SOLO_ADMINISTRADOR,
  },
  {
    permiso: 'CERRAR_LOTE',
    claseBackend: 'PuedeCerrarLote',
    descripcion: 'Cerrar un lote con su destino: venta o traslado',
    roles: SOLO_ADMINISTRADOR,
  },
  {
    permiso: 'GESTIONAR_USUARIOS',
    claseBackend: 'PuedeGestionarUsuarios',
    descripcion: 'Gestionar usuarios y restablecer sus contraseñas',
    roles: SOLO_ADMINISTRADOR,
  },
  {
    permiso: 'CONSULTAR_AUDITORIA',
    claseBackend: 'PuedeConsultarAuditoria',
    descripcion: 'Consultar la auditoría del sistema',
    roles: SOLO_ADMINISTRADOR,
  },
];

export const MATRIZ_PERMISOS: Readonly<Record<Permiso, readonly Rol[]>> = Object.fromEntries(
  DEFINICION_PERMISOS.map(({ permiso, roles }) => [permiso, roles]),
) as Record<Permiso, readonly Rol[]>;

export function rolTienePermiso(rol: Rol | null, permiso: Permiso): boolean {
  return rol !== null && MATRIZ_PERMISOS[permiso].includes(rol);
}
