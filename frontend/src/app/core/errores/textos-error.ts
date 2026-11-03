/**
 * Textos de la interfaz para fallas que no traen un mensaje del dominio: la red o el servidor
 * no respondieron con el cuerpo uniforme. Los mensajes del dominio nunca se escriben aquí:
 * llegan del backend y se muestran literales.
 */
export const TEXTO_ERROR = {
  sinConexion: 'No hay conexión con el servidor. Sus datos siguen en pantalla; intente de nuevo.',
  servidor: 'El servidor no pudo completar la operación. Intente de nuevo en unos minutos.',
  inesperado: 'No se pudo completar la operación.',
} as const;
