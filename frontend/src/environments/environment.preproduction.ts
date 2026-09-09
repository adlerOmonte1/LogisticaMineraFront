// Preproducción: servidor donde corren las pruebas de carga con JMeter en la semana 8.
// Existe separado de producción porque JMeter no puede ejecutarse contra el entorno del postest.
export const environment = {
  production: true,
  nombreEntorno: 'preproduction',
  apiUrl: 'https://pre.cambiar-dominio.pe/api/v1',
};
