import { HttpHeaders, HttpResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ArchivoDescargado, DescargaService, nombreDeArchivo } from './descarga.service';

describe('DescargaService', () => {
  it('toma el nombre del archivo de Content-Disposition', () => {
    const respuesta = new HttpResponse({
      headers: new HttpHeaders({ 'Content-Disposition': 'attachment; filename="consolidado_2026_11.xlsx"' }),
    });
    expect(nombreDeArchivo(respuesta)).toBe('consolidado_2026_11.xlsx');
    expect(nombreDeArchivo(new HttpResponse())).toBe('descarga');
  });

  it('descarga como Blob y devuelve el nombre del servidor', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const servicio = TestBed.inject(DescargaService);
    const controlador = TestBed.inject(HttpTestingController);
    let archivo: ArchivoDescargado | undefined;

    servicio.obtener('/api/v1/consulta/ingresos/exportar/').subscribe((resultado) => (archivo = resultado));
    const peticion = controlador.expectOne('/api/v1/consulta/ingresos/exportar/');
    expect(peticion.request.responseType).toBe('blob');
    peticion.flush(new Blob(['a;b']), {
      headers: { 'Content-Disposition': 'attachment; filename="ingresos.csv"' },
    });

    expect(archivo?.nombre).toBe('ingresos.csv');
    controlador.verify();
  });
});
