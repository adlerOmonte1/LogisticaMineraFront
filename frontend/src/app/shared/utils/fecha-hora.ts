/** Lima no tiene horario de verano: su desfase con UTC es siempre −05:00. */
const DESFASE_LIMA = '-05:00';

/**
 * Convierte el valor de un `<input type="datetime-local">` (`2026-11-03T10:30`) en la fecha-hora
 * ISO en la zona de la planta que espera el servidor. Vacío → `null`: el servidor usa «ahora».
 */
export function aIsoLima(valorLocal: string | null | undefined): string | null {
  const texto = (valorLocal ?? '').trim();
  if (!texto) {
    return null;
  }
  const conSegundos = texto.length === 16 ? `${texto}:00` : texto;
  return `${conSegundos}${DESFASE_LIMA}`;
}

const PARTES_LIMA = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Lima',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export interface FechaYHora {
  /** `AAAA-MM-DD`. */
  fecha: string;
  /** `HH:MM`. */
  hora: string;
}

/**
 * Separa una fecha-hora ISO en la fecha y la hora que muestran los campos de un formulario, en
 * la zona de la planta y no en la del teléfono (D-F17).
 */
export function separarFechaYHoraLima(iso: string): FechaYHora {
  const partes = Object.fromEntries(PARTES_LIMA.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return {
    fecha: `${partes['year']}-${partes['month']}-${partes['day']}`,
    hora: `${partes['hour']}:${partes['minute']}`,
  };
}
