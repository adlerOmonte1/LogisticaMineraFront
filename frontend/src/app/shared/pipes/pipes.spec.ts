import { FormControl, Validators } from '@angular/forms';

import { ErrorCampoPipe } from './error-campo.pipe';
import { EtiquetaRolPipe } from './etiqueta-rol.pipe';
import { EtiquetaTitularidadPipe } from './etiqueta-titularidad.pipe';
import { FechaLimaPipe } from './fecha-lima.pipe';
import { ToneladasPipe } from './toneladas.pipe';

describe('Pipes de presentación', () => {
  it('toneladas: formatea la cadena decimal del backend', () => {
    const pipe = new ToneladasPipe();
    expect(pipe.transform('32.4')).toBe('32.40 t');
    expect(pipe.transform('1234.5', false)).toBe('1,234.50');
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform('x')).toBe('—');
  });

  it('fechaLima: muestra en la zona de la planta, sin desplazar una fecha sola', () => {
    const pipe = new FechaLimaPipe();
    expect(pipe.transform('2026-11-02T13:15:00Z')).toBe('02/11/2026 08:15');
    expect(pipe.transform('2026-11-02', 'fecha')).toBe('02/11/2026');
    expect(pipe.transform('2026-11-02T13:15:00Z', 'hora')).toBe('08:15');
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform('no-es-fecha')).toBe('—');
  });

  it('etiquetas de rol y de titularidad', () => {
    expect(new EtiquetaRolPipe().transform('SUPERVISOR')).toBe('Supervisor de planta');
    expect(new EtiquetaRolPipe().transform(null)).toBe('—');
    expect(new EtiquetaTitularidadPipe().transform('EXTERNO')).toBe('Externo');
    expect(new EtiquetaTitularidadPipe().transform(undefined)).toBe('—');
  });

  it('errorCampo: texto del error de un control', () => {
    const pipe = new ErrorCampoPipe();
    expect(pipe.transform(new FormControl('', Validators.required))).toBe('Campo obligatorio');
    expect(pipe.transform(new FormControl('x'))).toBeNull();
    expect(pipe.transform(null)).toBeNull();
  });
});
