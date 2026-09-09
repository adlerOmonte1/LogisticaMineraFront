// Desarrollo local. apiUrl relativa: la resuelve proxy.conf.json contra localhost:8000,
// así el navegador ve un solo origen y CORS no interviene.
export const environment = {
  production: false,
  nombreEntorno: 'development',
  apiUrl: '/api/v1',
};
