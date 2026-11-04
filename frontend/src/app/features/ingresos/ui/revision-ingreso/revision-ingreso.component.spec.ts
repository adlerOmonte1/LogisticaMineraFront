import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ErrorApi, Inconsistencia } from '@models/error-api.model';
import { BorradorIngreso, CamposRegistro, ConsultaVehiculo } from '@models/registro-ingreso.model';
import { TipoMineral } from '@models/tipo-mineral.model';
import { crearBorrador } from '../../../../testing/fabricas';
import { estabilizar } from '../../../../testing/estabilizar';
import { ConfirmacionDeRevision, RevisionIngresoComponent } from './revision-ingreso.component';
import { crearFormularioRevision } from './formulario-revision';

describe('RevisionIngresoComponent', () => {
  const minerales: TipoMineral[] = [
    { id: 1, codigo: 'MOA', nombre: 'Óxido A', unidad_medida: 'TONELADA', activo: true },
  ];
  const v4: Inconsistencia = {
    regla: 'V4',
    campo: 'peso_bruto_tn',
    mensaje: 'El peso neto está fuera del rango de carga del vehículo V2K-841',
    bloqueante: false,
    exige_justificacion: true,
  };
  const consulta: ConsultaVehiculo = { placa: 'V2K-841', vehiculo: crearBorrador().vehiculo };

  function montar(
    propuesta: BorradorIngreso = crearBorrador(),
    extra: Record<string, unknown> = {},
    valores: Partial<CamposRegistro> = {},
  ) {
    TestBed.configureTestingModule({ providers: [provideNoopAnimations()] });
    const formulario = crearFormularioRevision();
    formulario.patchValue({
      placa: propuesta.propuesta.placa ?? '',
      fecha: propuesta.propuesta.fecha ?? '',
      hora: propuesta.propuesta.hora,
      peso_bruto_tn: propuesta.propuesta.peso_bruto_tn ?? '',
      tipo_mineral: 1,
      ...valores,
    });
    const fixture = TestBed.createComponent(RevisionIngresoComponent);
    fixture.componentRef.setInput('propuesta', propuesta);
    fixture.componentRef.setInput('formulario', formulario);
    fixture.componentRef.setInput('tiposMineral', minerales);
    fixture.componentRef.setInput('consultaVehiculo', consulta);
    for (const [nombre, valor] of Object.entries(extra)) {
      fixture.componentRef.setInput(nombre, valor);
    }
    estabilizar(fixture);
    const raiz: HTMLElement = fixture.nativeElement;
    const confirmaciones: ConfirmacionDeRevision[] = [];
    const eventos = { repetir: 0, vehiculo: [] as string[], mineral: 0 };
    fixture.componentInstance.confirmar.subscribe((c) => confirmaciones.push(c));
    fixture.componentInstance.repetirCaptura.subscribe(() => eventos.repetir++);
    fixture.componentInstance.registrarVehiculo.subscribe((p) => eventos.vehiculo.push(p));
    fixture.componentInstance.agregarTipoMineral.subscribe(() => eventos.mineral++);
    const campo = (nombre: string) => raiz.querySelector<HTMLInputElement>(`[data-prueba="${nombre}"]`);
    const escribir = (nombre: string, valor: string) => {
      const elemento = campo(nombre);
      if (elemento) {
        elemento.value = valor;
        elemento.dispatchEvent(new Event('input'));
      }
      estabilizar(fixture);
    };
    return { fixture, raiz, formulario, confirmaciones, eventos, campo, escribir };
  }

  describe('lo reconocido (HU-M04-01)', () => {
    it('resalta el dato dudoso con su aviso literal y marca el campo', () => {
      const { raiz } = montar();
      expect(raiz.textContent).toContain('Verifique este dato: lectura con baja confianza');
      expect(raiz.querySelectorAll('.campo-dudoso').length).toBe(1);
      expect(raiz.textContent).toContain('Confianza 86 %');
      expect(raiz.textContent).toContain('Confianza 91 %');
    });

    it('un dato que el usuario corrige deja de ser dudoso y se marca corregido', () => {
      const { raiz, escribir } = montar();
      escribir('placa', 'abc-123');
      expect(raiz.textContent).toContain('Corregido por usted');
      expect(raiz.querySelectorAll('.campo-dudoso').length).toBe(0);
      expect(raiz.textContent).not.toContain('lectura con baja confianza');
    });

    it('un campo sin lectura queda vacío y editable (CA03)', () => {
      const sinPeso = crearBorrador();
      sinPeso.reconocimiento!.campos[2] = {
        nombre: 'PESO_BRUTO',
        valor: null,
        confianza: null,
        dudoso: false,
        aviso: null,
      };
      sinPeso.propuesta.peso_bruto_tn = null;
      const { raiz, formulario } = montar(sinPeso);
      expect(formulario.controls.peso_bruto_tn.value).toBe('');
      expect(raiz.textContent).toContain('Sin lectura: complete el dato');
    });

    it('si la imagen fue ilegible muestra el aviso literal y permite continuar a mano (CA04)', () => {
      const ilegible = crearBorrador({
        reconocimiento: {
          exito: false,
          motor: 'tesseract-local',
          version_motor: '5.5.0',
          umbral_confianza: 0.8,
          aviso: 'No fue posible leer el ticket. Tome una nueva fotografía o ingrese los datos manualmente',
          campos: [
            { nombre: 'PLACA', valor: null, confianza: null, dudoso: false, aviso: null },
            { nombre: 'FECHA', valor: null, confianza: null, dudoso: false, aviso: null },
            { nombre: 'PESO_BRUTO', valor: null, confianza: null, dudoso: false, aviso: null },
          ],
        },
        vehiculo: null,
      });
      const { raiz } = montar(ilegible);
      expect(raiz.querySelector('[data-prueba="aviso-lectura"]')?.textContent).toContain(
        'No fue posible leer el ticket',
      );
    });

    it('en el registro sin foto muestra el motivo y no hay confianza (CA08)', () => {
      const sinFoto = crearBorrador({
        sin_respaldo_fotografico: true,
        motivo_sin_respaldo: 'BALANZA_SIN_TICKET',
        reconocimiento: null,
        vehiculo: null,
      });
      const { raiz } = montar(sinFoto);
      expect(raiz.querySelector('[data-prueba="sin-foto"]')?.textContent).toContain(
        'La balanza no emitió ticket',
      );
      expect(raiz.textContent).not.toContain('Confianza');
    });
  });

  describe('la hora del pesaje (HU-M03-01 CA10)', () => {
    it('se señala como propuesta mientras no se modifique', () => {
      const { raiz, escribir } = montar();
      expect(raiz.querySelector('[data-prueba="hora-propuesta"]')?.textContent).toContain('Hora propuesta');
      escribir('hora', '08:15');
      expect(raiz.querySelector('[data-prueba="hora-propuesta"]')).toBeNull();
    });
  });

  describe('el tipo de mineral (CA14, CA15)', () => {
    it('quien puede agregarlo ve el botón', () => {
      const { raiz, eventos } = montar(
        crearBorrador({ puede_agregar_tipo_mineral: true, aviso_tipo_mineral: null }),
      );
      raiz.querySelector<HTMLButtonElement>('[data-prueba="agregar-tipo-mineral"]')?.click();
      expect(eventos.mineral).toBe(1);
      expect(raiz.querySelector('[data-prueba="aviso-tipo-mineral"]')).toBeNull();
    });

    it('al Supervisor se le dice a quién pedirlo, con el texto del servidor', () => {
      const { raiz } = montar();
      expect(raiz.querySelector('[data-prueba="agregar-tipo-mineral"]')).toBeNull();
      expect(raiz.querySelector('[data-prueba="aviso-tipo-mineral"]')?.textContent).toBe(
        'Si no está en la lista, pida a un administrativo que lo registre',
      );
    });
  });

  describe('el vehículo y la placa', () => {
    it('una placa no registrada ofrece el alta con la placa escrita', () => {
      const nueva = crearBorrador({
        vehiculo: null,
        aviso_placa: 'La placa QQQ-999 no está registrada. Complete los datos del vehículo para continuar',
      });
      nueva.propuesta.placa = 'QQQ-999';
      const { fixture, raiz, eventos } = montar(nueva, {
        consultaVehiculo: { placa: 'QQQ-999', vehiculo: null },
      });
      estabilizar(fixture);
      expect(raiz.querySelector('[data-prueba="placa-nueva"]')?.textContent).toContain(
        'La placa QQQ-999 no está registrada',
      );
      raiz.querySelector<HTMLButtonElement>('[data-prueba="registrar-vehiculo"]')?.click();
      expect(eventos.vehiculo).toEqual(['QQQ-999']);
    });

    it('al cambiar la placa, el aviso del servidor sobre la placa reconocida ya no vale', () => {
      const nueva = crearBorrador({ vehiculo: null, aviso_placa: 'La placa V2K-841 no está registrada' });
      const { raiz, escribir } = montar(nueva, { consultaVehiculo: { placa: 'V2K-841', vehiculo: null } });
      expect(raiz.querySelector('[data-prueba="placa-nueva"]')?.textContent).toContain(
        'La placa V2K-841 no está registrada',
      );
      escribir('placa', 'otra-111');
      expect(raiz.querySelector('[data-prueba="placa-nueva"]')).toBeNull();
    });

    it('normaliza la placa a mayúsculas mientras se escribe', () => {
      const { formulario, escribir } = montar();
      escribir('placa', 'abc 123');
      expect(formulario.controls.placa.value).toBe('ABC123');
    });
  });

  describe('las inconsistencias (HU-M05-01)', () => {
    it('las de la propuesta aparecen junto al campo afectado, con su caja de justificación', () => {
      const { raiz } = montar(crearBorrador({ inconsistencias: [v4] }));
      const delPeso = raiz.querySelector('app-lista-inconsistencias li[data-regla="V4"]');
      expect(delPeso?.textContent).toContain(
        'El peso neto está fuera del rango de carga del vehículo V2K-841',
      );
      expect(raiz.querySelector('[data-prueba="justificacion-V4"]')).not.toBeNull();
    });

    it('tras un rechazo, el detalle del servidor reemplaza al de la propuesta', () => {
      const bloqueante: Inconsistencia = {
        regla: 'V2',
        campo: 'peso_bruto_tn',
        mensaje: 'La tara no puede ser mayor o igual que el peso bruto',
        bloqueante: true,
        exige_justificacion: false,
      };
      const { raiz } = montar(crearBorrador({ inconsistencias: [v4] }), {
        error: new ErrorApi(
          400,
          'INCONSISTENCIAS',
          'Debe corregir o justificar las inconsistencias señaladas',
          {},
          [],
          [bloqueante],
        ),
      });
      expect(raiz.querySelector('li[data-regla="V2"]')).not.toBeNull();
      expect(raiz.querySelector('li[data-regla="V4"]')).toBeNull();
      expect(raiz.querySelector('app-aviso-error [role=alert]')?.textContent).toContain(
        'Debe corregir o justificar las inconsistencias señaladas',
      );
    });

    it('una inconsistencia cuyo dato cambió se marca por revalidar (D-F19)', () => {
      const { raiz, escribir } = montar(crearBorrador({ inconsistencias: [v4] }));
      expect(raiz.textContent).not.toContain('se revalidará');
      escribir('peso', '12,00');
      expect(raiz.textContent).toContain('se revalidará al confirmar');
    });

    it('pinta el rechazo de campos ausentes en cada campo, sin inventar mensajes (CA03)', () => {
      const { formulario } = montar(crearBorrador(), {
        error: new ErrorApi(400, 'CAMPOS_OBLIGATORIOS', 'Debe completar los campos obligatorios', {}, [
          'hora',
        ]),
      });
      expect(formulario.controls.hora.errors).toEqual(
        jasmine.objectContaining({ servidor: 'Campo obligatorio' }),
      );
    });

    it('una inconsistencia sin control propio (otro campo) se lista aparte', () => {
      const { raiz } = montar(crearBorrador(), {
        error: new ErrorApi(
          400,
          'INCONSISTENCIAS',
          'x',
          {},
          [],
          [
            {
              regla: 'V9',
              campo: 'otro',
              mensaje: 'Regla futura',
              bloqueante: true,
              exige_justificacion: false,
            },
          ],
        ),
      });
      expect(raiz.textContent).toContain('Regla futura');
    });
  });

  describe('confirmar', () => {
    it('emite lo editado y las justificaciones escritas', () => {
      const { raiz, confirmaciones, escribir } = montar(crearBorrador({ inconsistencias: [v4] }));
      escribir('justificacion-V4', 'Carga autorizada');
      raiz.querySelector('form')?.dispatchEvent(new Event('submit'));
      expect(confirmaciones).toEqual([
        {
          campos: {
            placa: 'V2K-841',
            fecha: '2026-10-30',
            hora: '16:33',
            peso_bruto_tn: '29.80',
            tipo_mineral: 1,
          },
          justificaciones: { V4: 'Carga autorizada' },
        },
      ]);
    });

    it('no adelanta los campos obligatorios: confirma aunque falten, y responde el servidor', () => {
      const { raiz, confirmaciones } = montar(crearBorrador(), {}, { fecha: '', tipo_mineral: null });
      raiz.querySelector('form')?.dispatchEvent(new Event('submit'));
      expect(confirmaciones.length).toBe(1);
      expect(confirmaciones[0].campos.fecha).toBe('');
    });

    it('un peso con formato imposible no se envía', () => {
      const { raiz, confirmaciones, escribir } = montar();
      escribir('peso', '12.345');
      raiz.querySelector('form')?.dispatchEvent(new Event('submit'));
      expect(confirmaciones).toEqual([]);
    });

    it('«volver a capturar» descarta lo capturado', () => {
      const { campo, eventos } = montar();
      campo('repetir')?.click();
      expect(eventos.repetir).toBe(1);
    });

    it('mientras se envía no deja confirmar dos veces', () => {
      const { campo } = montar(crearBorrador(), { enviando: true });
      expect(campo('confirmar')?.hasAttribute('disabled')).toBeTrue();
    });
  });
});
