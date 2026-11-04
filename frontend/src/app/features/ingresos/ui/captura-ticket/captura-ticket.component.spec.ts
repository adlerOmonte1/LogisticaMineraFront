import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ErrorApi } from '@models/error-api.model';
import { MotivoSinFoto } from '@models/ingreso.model';
import { CapturaTicketComponent } from './captura-ticket.component';

describe('CapturaTicketComponent', () => {
  function montar(entradas: Record<string, unknown> = {}) {
    TestBed.configureTestingModule({ providers: [provideNoopAnimations()] });
    const fixture = TestBed.createComponent(CapturaTicketComponent);
    for (const [nombre, valor] of Object.entries(entradas)) {
      fixture.componentRef.setInput(nombre, valor);
    }
    fixture.detectChanges();
    const archivos: File[] = [];
    const motivos: MotivoSinFoto[] = [];
    let reintentos = 0;
    fixture.componentInstance.imagenElegida.subscribe((a) => archivos.push(a));
    fixture.componentInstance.sinFoto.subscribe((m) => motivos.push(m));
    fixture.componentInstance.reintentar.subscribe(() => reintentos++);
    const raiz: HTMLElement = fixture.nativeElement;
    const campo = (nombre: string) => raiz.querySelector<HTMLInputElement>(`[data-prueba="${nombre}"]`);
    return { fixture, archivos, motivos, raiz, campo, reintentos: () => reintentos };
  }

  function elegir(campo: HTMLInputElement | null, archivo: File): void {
    const lista = new DataTransfer();
    lista.items.add(archivo);
    if (campo) {
      campo.files = lista.files;
      campo.dispatchEvent(new Event('change'));
    }
  }

  it('abre la cámara trasera directamente (RNF-M03-07)', () => {
    const { campo } = montar();
    expect(campo('entrada-camara')?.getAttribute('capture')).toBe('environment');
    expect(campo('entrada-galeria')?.hasAttribute('capture')).toBeFalse();
  });

  it('emite el archivo elegido y deja el campo listo para elegir el mismo otra vez', () => {
    const { campo, archivos } = montar();
    const foto = new File(['x'], 'ticket.jpg', { type: 'image/jpeg' });
    elegir(campo('entrada-galeria'), foto);
    expect(archivos).toEqual([foto]);
    expect(campo('entrada-galeria')?.value).toBe('');
  });

  it('acepta una imagen arrastrada, pero no mientras se procesa otra', () => {
    const { fixture, archivos, raiz } = montar();
    const foto = new File(['x'], 'ticket.png', { type: 'image/png' });
    const soltar = () => {
      const evento = new Event('drop') as DragEvent;
      Object.defineProperty(evento, 'dataTransfer', { value: { files: { item: () => foto } } });
      raiz.querySelector('.zona')?.dispatchEvent(evento);
    };
    soltar();
    fixture.componentRef.setInput('procesando', true);
    fixture.detectChanges();
    soltar();
    expect(archivos).toEqual([foto]);
  });

  it('muestra el progreso mientras el servidor lee el ticket', () => {
    const { raiz } = montar({ procesando: true });
    expect(raiz.textContent).toContain('Leyendo el ticket');
    expect(raiz.querySelector('[data-prueba="fotografiar"]')).toBeNull();
  });

  it('el rechazo del servidor es literal y, con una imagen guardada, ofrece reintentar', () => {
    const { raiz, reintentos } = montar({
      error: new ErrorApi(0, 'SIN_CONEXION', 'No hay conexión con el servidor'),
      hayImagenPendiente: true,
    });
    expect(raiz.querySelector('[role=alert]')?.textContent).toContain('No hay conexión con el servidor');
    raiz.querySelector<HTMLButtonElement>('.reintento button')?.click();
    expect(reintentos()).toBe(1);
  });

  it('sin imagen guardada no ofrece reintentar', () => {
    const { raiz } = montar({
      error: new ErrorApi(400, 'IMAGEN_INVALIDA', 'literal'),
      hayImagenPendiente: false,
    });
    expect(raiz.querySelector('.reintento')).toBeNull();
  });

  it('registrar sin foto exige elegir el motivo de la lista cerrada', () => {
    const { fixture, raiz, campo, motivos } = montar();
    campo('sin-foto')?.click();
    fixture.detectChanges();
    expect(raiz.textContent).toContain('Registrar sin foto');

    campo('continuar-sin-foto')?.click();
    expect(motivos).toEqual([]);

    (fixture.componentInstance as unknown as { motivo: { setValue(v: string): void } }).motivo.setValue(
      'TICKET_EXTRAVIADO',
    );
    campo('continuar-sin-foto')?.click();
    expect(motivos).toEqual(['TICKET_EXTRAVIADO']);
  });
});
