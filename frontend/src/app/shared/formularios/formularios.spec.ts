import { FormControl, FormGroup } from '@angular/forms';
import { Subject, of, throwError } from 'rxjs';

import { ErrorApi } from '@models/error-api.model';
import { EnvioFormulario } from './envio-formulario';
import { ERROR_SERVIDOR, aplicarErrorEnFormulario, textoDeError } from './errores-formulario';
import { decimalPositivo, normalizarDecimal } from './validadores';

describe('aplicarErrorEnFormulario', () => {
  it('marca los campos obligatorios y los errores de campo del servidor', () => {
    const formulario = new FormGroup({ placa: new FormControl(''), capacidad_tn: new FormControl('') });
    aplicarErrorEnFormulario(
      formulario,
      new ErrorApi(
        400,
        'CAMPOS_OBLIGATORIOS',
        'Debe completar los campos obligatorios',
        { capacidad_tn: 'Número no válido' },
        ['placa', 'campo_inexistente'],
      ),
    );

    expect(formulario.controls.placa.errors?.[ERROR_SERVIDOR]).toBe('Campo obligatorio');
    expect(formulario.controls.capacidad_tn.errors?.[ERROR_SERVIDOR]).toBe('Número no válido');
    expect(formulario.controls.placa.touched).toBeTrue();
  });
});

describe('aplicarErrorEnFormulario con un campo culpable', () => {
  it('muestra el mensaje literal del servidor, no «Campo obligatorio» (HU-M03-01 CA04)', () => {
    const formulario = new FormGroup({ placa: new FormControl('QQQ-999') });
    const mensaje = 'La placa QQQ-999 no está registrada. Complete los datos del vehículo para continuar';
    aplicarErrorEnFormulario(formulario, new ErrorApi(400, 'PLACA_NO_REGISTRADA', mensaje, {}, ['placa']));
    expect(formulario.controls.placa.errors?.[ERROR_SERVIDOR]).toBe(mensaje);
  });
});

describe('textoDeError', () => {
  it('prioriza el texto del servidor y traduce los validadores', () => {
    expect(textoDeError(null)).toBeNull();
    expect(textoDeError({ [ERROR_SERVIDOR]: 'La placa ya está registrada', required: true })).toBe(
      'La placa ya está registrada',
    );
    expect(textoDeError({ required: true })).toBe('Campo obligatorio');
    expect(textoDeError({ minlength: { requiredLength: 8 } })).toContain('8');
    expect(textoDeError({ maxlength: { requiredLength: 6 } })).toContain('6');
    expect(textoDeError({ min: { min: 1 } })).toContain('1');
    expect(textoDeError({ pattern: true })).toBe('El formato no es válido');
    expect(textoDeError({ decimal: true })).toContain('decimales');
    expect(textoDeError({ desconocido: true })).toBe('Valor no válido');
  });
});

describe('decimalPositivo', () => {
  const validar = (valor: string) => decimalPositivo()(new FormControl(valor));

  it('acepta números positivos con punto o coma y hasta dos decimales', () => {
    expect(validar('')).toBeNull();
    expect(validar('30')).toBeNull();
    expect(validar('20.5')).toBeNull();
    expect(validar('20,55')).toBeNull();
  });

  it('rechaza cero, negativos, texto y más de dos decimales', () => {
    expect(validar('0')).toEqual({ decimal: true });
    expect(validar('-3')).toEqual({ decimal: true });
    expect(validar('abc')).toEqual({ decimal: true });
    expect(validar('1.234')).toEqual({ decimal: true });
  });

  it('normaliza la coma decimal del teclado en español', () => {
    expect(normalizarDecimal(' 20,5 ')).toBe('20.5');
  });
});

describe('EnvioFormulario', () => {
  it('marca el envío en curso y lo termina', () => {
    const envio = new EnvioFormulario();
    const respuesta = new Subject<number>();
    let resultado = 0;

    envio.ejecutar(respuesta, (valor) => (resultado = valor));
    expect(envio.enviando()).toBeTrue();
    respuesta.next(5);
    respuesta.complete();

    expect(resultado).toBe(5);
    expect(envio.enviando()).toBeFalse();
  });

  it('guarda el ErrorApi y lo pinta en el formulario', () => {
    const envio = new EnvioFormulario();
    const formulario = new FormGroup({ ruc: new FormControl('') });
    const error = new ErrorApi(400, 'X', 'Datos inválidos', { ruc: 'Once dígitos' });

    envio.ejecutar(
      throwError(() => error),
      () => fail('no debía terminar'),
      formulario,
    );

    expect(envio.error()).toBe(error);
    expect(formulario.controls.ruc.errors?.[ERROR_SERVIDOR]).toBe('Once dígitos');
    envio.limpiar();
    expect(envio.error()).toBeNull();
  });

  it('un error que no es de la API se registra y se informa como inesperado', () => {
    const envio = new EnvioFormulario();
    spyOn(console, 'error');
    envio.ejecutar(
      throwError(() => new TypeError('falla')),
      () => undefined,
    );
    expect(console.error).toHaveBeenCalled();
    expect(envio.error()?.codigo).toBe('ERROR_INESPERADO');
    expect(envio.enviando()).toBeFalse();
  });

  it('limpia el error anterior al reenviar', () => {
    const envio = new EnvioFormulario();
    envio.error.set(new ErrorApi(400, 'X', 'antes'));
    envio.ejecutar(of(1), () => undefined);
    expect(envio.error()).toBeNull();
  });
});
