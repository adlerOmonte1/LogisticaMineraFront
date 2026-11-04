import { aCentesimas, calcularNeto, deCentesimas } from './decimal';
import { aIsoLima, separarFechaYHoraLima } from './fecha-hora';
import { LADO_MAXIMO_PX, PESO_SIN_REDUCIR_BYTES, calcularDimensiones, reducirImagen } from './reducir-imagen';

describe('decimal', () => {
  it('convierte a centésimas enteras, aceptando la coma del teclado', () => {
    expect(aCentesimas('29.80')).toBe(2980);
    expect(aCentesimas('29,8')).toBe(2980);
    expect(aCentesimas('0.05')).toBe(5);
    expect(aCentesimas('12')).toBe(1200);
  });

  it('rechaza lo que no es un decimal de hasta dos cifras', () => {
    for (const valor of ['', 'abc', '1.234', '-3', null, undefined]) {
      expect(aCentesimas(valor)).withContext(String(valor)).toBeNull();
    }
  });

  it('formatea de vuelta con dos decimales y signo', () => {
    expect(deCentesimas(1180)).toBe('11.80');
    expect(deCentesimas(5)).toBe('0.05');
    expect(deCentesimas(-150)).toBe('-1.50');
  });

  it('calcula el neto de referencia sin errores de coma flotante', () => {
    expect(calcularNeto('29.80', '11.80')).toBe('18.00');
    expect(calcularNeto('0.30', '0.10')).toBe('0.20');
    expect(calcularNeto('10.00', '11.80')).toBe('-1.80');
    expect(calcularNeto('', '11.80')).toBeNull();
    expect(calcularNeto('29.80', null)).toBeNull();
  });
});

describe('fecha-hora', () => {
  it('convierte datetime-local a ISO con el desfase de Lima', () => {
    expect(aIsoLima('2026-11-03T10:30')).toBe('2026-11-03T10:30:00-05:00');
    expect(aIsoLima('2026-11-03T10:30:15')).toBe('2026-11-03T10:30:15-05:00');
    expect(aIsoLima('')).toBeNull();
    expect(aIsoLima(null)).toBeNull();
  });

  it('separa fecha y hora en la zona de la planta, no en la del navegador', () => {
    expect(separarFechaYHoraLima('2026-09-14T16:33:00-05:00')).toEqual({
      fecha: '2026-09-14',
      hora: '16:33',
    });
    // 02:15 UTC del día 15 es todavía el 14 a las 21:15 en Lima.
    expect(separarFechaYHoraLima('2026-09-15T02:15:00Z')).toEqual({ fecha: '2026-09-14', hora: '21:15' });
    expect(separarFechaYHoraLima('2026-01-01T00:00:00-05:00')).toEqual({
      fecha: '2026-01-01',
      hora: '00:00',
    });
  });
});

describe('reducir-imagen', () => {
  it('conserva la proporción y no agranda', () => {
    expect(calcularDimensiones(4000, 3000)).toEqual({ ancho: LADO_MAXIMO_PX, alto: 1200 });
    expect(calcularDimensiones(3000, 4000)).toEqual({ ancho: 1200, alto: LADO_MAXIMO_PX });
    expect(calcularDimensiones(800, 600)).toEqual({ ancho: 800, alto: 600 });
  });

  it('no toca una imagen liviana', async () => {
    const pequena = new Blob([new Uint8Array(1000)], { type: 'image/jpeg' });
    expect(await reducirImagen(pequena)).toBe(pequena);
  });

  it('devuelve el original si no se puede decodificar: el servidor lo rechaza con su mensaje', async () => {
    const noEsImagen = new Blob([new Uint8Array(PESO_SIN_REDUCIR_BYTES + 10)], { type: 'application/pdf' });
    expect(await reducirImagen(noEsImagen)).toBe(noEsImagen);
  });

  it('reduce una fotografía grande a un JPEG más liviano y de lado máximo 1600', async () => {
    const lienzo = document.createElement('canvas');
    lienzo.width = 3200;
    lienzo.height = 2400;
    const contexto = lienzo.getContext('2d');
    // Ruido para que el PNG original pese más que el megabyte.
    const datos = contexto?.createImageData(3200, 2400);
    if (datos && contexto) {
      for (let i = 0; i < datos.data.length; i++) {
        datos.data[i] = i % 4 === 3 ? 255 : Math.floor(Math.random() * 256);
      }
      contexto.putImageData(datos, 0, 0);
    }
    const original = await new Promise<Blob>((resolver) =>
      lienzo.toBlob((b) => resolver(b as Blob), 'image/png'),
    );
    expect(original.size).toBeGreaterThan(PESO_SIN_REDUCIR_BYTES);

    const reducida = await reducirImagen(original);

    expect(reducida.size).toBeLessThan(original.size);
    expect(reducida.type).toBe('image/jpeg');
    const mapa = await createImageBitmap(reducida);
    expect(Math.max(mapa.width, mapa.height)).toBe(LADO_MAXIMO_PX);
    mapa.close();
  });
});
