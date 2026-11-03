import { HttpErrorResponse } from '@angular/common/http';

import { CODIGO_ERROR, ErrorApi } from '@models/error-api.model';
import { TEXTO_ERROR } from './textos-error';
import { traducirErrorHttp } from './traductor-error';

function errorHttp(status: number, cuerpo: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: cuerpo });
}

describe('traducirErrorHttp', () => {
  it('conserva el mensaje literal y lee detalles.campos', async () => {
    const error = await traducirErrorHttp(
      errorHttp(400, {
        codigo: 'CAMPOS_OBLIGATORIOS',
        mensaje: 'Debe completar los campos obligatorios',
        detalles: { campos: ['placa', 'hora'] },
      }),
    );

    expect(error).toEqual(jasmine.any(ErrorApi));
    expect(error.mensaje).toBe('Debe completar los campos obligatorios');
    expect(error.camposObligatorios).toEqual(['placa', 'hora']);
    expect(error.camposConError).toEqual({});
  });

  it('lee las inconsistencias y las justificaciones faltantes', async () => {
    const inconsistencia = {
      regla: 'V4',
      campo: 'peso_bruto_tn',
      mensaje: 'Fuera de rango',
      bloqueante: false,
      exige_justificacion: true,
    };
    const error = await traducirErrorHttp(
      errorHttp(400, {
        codigo: 'INCONSISTENCIAS',
        mensaje: 'Debe corregir o justificar las inconsistencias señaladas',
        detalles: {
          inconsistencias: [inconsistencia],
          justificaciones_faltantes: [{ regla: 'V4', mensaje: 'Justifique' }],
        },
      }),
    );

    expect(error.inconsistencias).toEqual([inconsistencia]);
    expect(error.justificacionesFaltantes).toEqual([{ regla: 'V4', mensaje: 'Justifique' }]);
  });

  it('une los textos de los campos con la forma de DRF', async () => {
    const error = await traducirErrorHttp(
      errorHttp(400, {
        codigo: 'ERROR_DE_VALIDACION',
        mensaje: 'Datos inválidos',
        detalles: { capacidad_tn: ['Requerido.', 'Número.'] },
      }),
    );
    expect(error.camposConError).toEqual({ capacidad_tn: 'Requerido. Número.' });
  });

  it('lee un error que llega dentro de un Blob (descargas)', async () => {
    const cuerpo = new Blob([
      JSON.stringify({ codigo: 'SIN_EXPORTAR', mensaje: 'No hay ingresos para exportar', detalles: {} }),
    ]);
    const error = await traducirErrorHttp(errorHttp(400, cuerpo));
    expect(error.codigo).toBe('SIN_EXPORTAR');
    expect(error.mensaje).toBe('No hay ingresos para exportar');
  });

  it('distingue la falta de red y la falla del servidor sin cuerpo uniforme', async () => {
    const sinRed = await traducirErrorHttp(errorHttp(0, null));
    const servidor = await traducirErrorHttp(errorHttp(502, '<html>Bad gateway</html>'));
    const otro = await traducirErrorHttp(errorHttp(404, { detail: 'No encontrado' }));

    expect(sinRed.codigo).toBe(CODIGO_ERROR.sinConexion);
    expect(sinRed.esDeRed).toBeTrue();
    expect(servidor.codigo).toBe(CODIGO_ERROR.errorDelServidor);
    expect(servidor.mensaje).toBe(TEXTO_ERROR.servidor);
    expect(otro.mensaje).toBe(TEXTO_ERROR.inesperado);
  });
});
