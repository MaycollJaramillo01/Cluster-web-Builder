// Iconos de trazo para los sitios generados. Se emiten como SVG en linea (no
// como data URL ni fuente de iconos) para que hereden currentColor, se vean
// nitidos a cualquier tamaño y no agreguen ninguna peticion al sitio.
//
// El contenido del negocio no trae un campo de icono: lo escribe la IA o el
// propio usuario como texto libre. Por eso el icono se deduce del significado
// del punto, con un check neutro como ultimo recurso.

export const V2_ICON_NAMES = [
  "camera", "gauge", "shield", "document", "user", "phone", "clock", "pin", "wrench", "check",
] as const;

export type V2IconName = (typeof V2_ICON_NAMES)[number];

const ICON_PATHS: Record<V2IconName, string> = {
  camera: '<path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.5"/>',
  gauge: '<path d="M4 17a8 8 0 1 1 16 0"/><path d="m12 17 3.6-6.4"/><circle cx="12" cy="17" r="1.2"/>',
  shield: '<path d="m12 3-7 3v5c0 4 3 7.4 7 8.5 4-1.1 7-4.5 7-8.5V6l-7-3Z"/>',
  document: '<path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7l-4-4Z"/><path d="M14 3v4h4"/><path d="M9 12.5h6M9 16h4"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.2l3.2 1.9"/>',
  pin: '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  wrench: '<path d="M15.6 3.6a5 5 0 0 0-6.3 6.5l-5.7 5.7a2 2 0 1 0 2.8 2.8l5.7-5.7a5 5 0 0 0 6.5-6.3l-2.9 2.9-2.5-.7-.7-2.5 2.9-2.7Z"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
};

// El orden decide: la primera regla que coincide gana, asi que van de lo mas
// especifico a lo mas general. "Expediente fotografico" debe dar camara y no
// documento; "Equipo de medicion" debe dar medidor y no persona.
const ICON_RULES: ReadonlyArray<readonly [V2IconName, RegExp]> = [
  ["camera", /fotograf|foto|imagen|camara|photo|image/],
  ["gauge", /medicion|medida|medir|humedad|dato|nivel|calibr|measur|monitor|precis/],
  ["shield", /licenc|asegur|garant|seguro|poliza|certific|protec|respald|avala|licens|insur|warrant|bond/],
  ["document", /escrito|alcance|reporte|informe|expediente|contrato|presupuesto|cotiza|factura|document|estimat|written|report/],
  ["user", /supervis|equipo|personal|cuadrilla|tecnico|responsable|especialista|staff|crew|team|owner/],
  // El oficio manda sobre el plazo: "reparacion el mismo dia" es una llave, no
  // un reloj. Y el plazo manda sobre el canal: "atencion 24/7" es un reloj,
  // aunque "atencion" tambien suene a telefono.
  ["wrench", /repar|instal|obra|servicio|trabajo|mantenim|montaje|repair|install|service|work/],
  ["clock", /24|hora|horario|tiempo|minuto|rapid|inmediat|urgen|disponib|respuesta|puntual|plazo|time|hour|fast/],
  ["phone", /despacho|llamad|telefono|contacto|linea|atencion|comunica|call|phone|dispatch|contact/],
  ["pin", /zona|area|local|cobertura|condado|ciudad|region|barrio|vecind|coverage|county|city/],
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function resolveIconName(text: string): V2IconName {
  const normalized = normalize(text);
  return ICON_RULES.find(([, pattern]) => pattern.test(normalized))?.[0] ?? "check";
}

export function iconSvg(name: V2IconName, size = 18): string {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name]}</svg>`;
}
