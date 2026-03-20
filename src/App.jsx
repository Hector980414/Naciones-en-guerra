import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase ──────────────────────────────────────────────
const SUPABASE_URL = "https://wdbupgqymgqfpobcbfze.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYnVwZ3F5bWdxZnBvYmNiZnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NjM0NjAsImV4cCI6MjA4OTUzOTQ2MH0.Psq7trqKDSNltKK8bqaLdXgg56FSjK6sfM4EH4TRnBo";
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Telegram ──────────────────────────────────────────────
const tg = window.Telegram?.WebApp;

// ── Constantes ────────────────────────────────────────────
const IDEOLOGIES = {
  socialismo:    { icon: "🔴", label: "Socialismo",    color: "#e53935", bonus: "+Salud +Educación" },
  liberalismo:   { icon: "🔵", label: "Liberalismo",   color: "#1e88e5", bonus: "+PIB +Comercio" },
  autoritarismo: { icon: "⚫", label: "Autoritarismo", color: "#757575", bonus: "+Militar +Control" },
  ecologismo:    { icon: "🟢", label: "Ecologismo",    color: "#43a047", bonus: "+Recursos +Naturaleza" },
  nacionalismo:  { icon: "🟡", label: "Nacionalismo",  color: "#f9a825", bonus: "+Aprobación interna" },
  tecnocracia:   { icon: "⚪", label: "Tecnocracia",   color: "#90a4ae", bonus: "+Educación +IA" },
};

const COUNTRIES = ["Cuba","México","Venezuela","Argentina","Brasil","Colombia","Chile","Perú","Ecuador","Bolivia","España","Francia","Alemania","Rusia","China","USA","India","Japón","Corea del Sur","Nigeria","Egipto","Turquía","Irán","Arabia Saudita","Sudáfrica","Indonesia","Pakistan","Bangladesh","Etiopía","Rep. Dominicana"];

const DECREES = [
  { id: 1, name: "Reforma Fiscal",     icon: "💰", desc: "Aumentar impuestos corporativos",    effect: "+PIB 3%, -Aprobación 5%",  statChanges: { pib: 3, aprobacion: -5 } },
  { id: 2, name: "Reclutamiento",      icon: "⚔️", desc: "Ampliar el ejército nacional",       effect: "+Militar 8%, -PIB 4%",     statChanges: { militar: 8, pib: -4 } },
  { id: 3, name: "Plan Social",        icon: "🏥", desc: "Subsidiar salud y educación",         effect: "+Aprobación 10%, -PIB 6%", statChanges: { aprobacion: 10, salud: 5, pib: -6 } },
  { id: 4, name: "Industrialización",  icon: "🏭", desc: "Inversión en industria pesada",       effect: "+Industria 7%, -PIB 4%",   statChanges: { industria: 7, pib: -4 } },
  { id: 5, name: "Apertura Comercial", icon: "🚢", desc: "Reducir aranceles de importación",   effect: "+PIB 9%, -Industria 4%",   statChanges: { pib: 9, industria: -4 } },
  { id: 6, name: "Operación Espía",    icon: "🕵️", desc: "Infiltrar inteligencia enemiga",     effect: "+Intel 15%, riesgo diplomático", statChanges: { intel: 15 } },
];

// ── Motor de consecuencias pregeneradas ───────────────────
const C = {
  reforma_fiscal: {
    socialismo: {
      alta_rebeldia: ["La reforma llega demasiado tarde. Los manifestantes queman neumáticos frente al palacio. Tu jefe de seguridad pide estado de emergencia.", "Grupos opositores financiados desde el exterior sabotean la implementación. Tres funcionarios son arrestados por corrupción.", "La tensión social explota. Un general te llama: 'Presidente, la situación es insostenible'. Tienes 24 horas para reaccionar."],
      alto_pib: ["La reforma redistributiva genera protestas en los barrios ricos, pero las clases populares celebran en las calles. El FMI advierte.", "Los empresarios amenazan con fuga de capitales. Tu ministro de economía dimite. Sin embargo, tu aprobación popular sube 12 puntos.", "La medida es aplaudida por sindicatos de 15 países. Venezuela ofrece apoyo diplomático. Los mercados reaccionan con cautela."],
      bajo_pib: ["Con la economía en crisis, subir impuestos provoca una huelga general. Tres regiones amenazan con autonomía.", "El pueblo entiende el sacrificio. La recaudación sube lentamente. China ofrece un préstamo de emergencia con condiciones.", "Tus asesores advierten: esto puede hundirte. Pero no hay otra salida. El congreso aprueba la medida por un solo voto."],
    },
    liberalismo: {
      alta_rebeldia: ["La población no cree en reformas. Las redes sociales explotan. Un video tuyo es viral por las razones equivocadas.", "Tres gobernadores regionales se niegan a implementar la medida. El país se fragmenta políticamente.", "Un escándalo de corrupción vinculado a tu partido sale a la luz hoy. La reforma queda opacada. La prensa pide tu renuncia."],
      alto_pib: ["El mercado reacciona: la bolsa sube 3%. Tu base conservadora murmura descontento silencioso.", "Los inversores extranjeros aplauden. Dos multinacionales anuncian nuevas plantas. Tu popularidad empresarial alcanza máximos.", "El Wall Street Journal publica un editorial elogioso. Tu canciller recibe llamadas de aliados estratégicos."],
      bajo_pib: ["Con el PIB en caída, la reforma es un salvavidas polémico. La oposición exige elecciones anticipadas.", "Los mercados castigan la medida: la moneda cae 4%. El banco central interviene de emergencia.", "Tu vicepresidente filtra su desacuerdo. La coalición tambalea. Necesitas consolidar alianzas esta semana."],
    },
    autoritarismo: {
      alta_rebeldia: ["Declaras estado de excepción. Las calles están militarizadas. El mundo observa con alarma creciente.", "Un intento de golpe es abortado. Cinco generales arrestados. Tu posición se consolida pero el precio es alto.", "La crisis se internacionaliza. La ONU convoca reunión de emergencia. Tu embajador pide instrucciones urgentes."],
      alto_pib: ["El decreto se implementa sin debate. La oposición protesta pero no puede frenarlo. Tu control del Estado crece.", "Los medios oficiales celebran. Dos periodistas independientes son 'invitados a conversar' con el gobierno.", "El ejército apoya públicamente la reforma. Los países vecinos observan con preocupación."],
      bajo_pib: ["Cualquier impuesto genera resentimiento. Aumentas el presupuesto de seguridad como medida preventiva.", "Implementas con mano dura. La resistencia es silenciada. El descontento crece en silencio.", "Tres líderes opositores detenidos 'preventivamente'. La comunidad internacional condena. Sanciones posibles."],
    },
    ecologismo: {
      alto_pib: ["La reforma incluye incentivos verdes. Inversores ESG internacionales miran tu país con interés renovado.", "Tu reforma es pionera en la región. La prensa internacional te llama 'el presidente verde'.", "Silicon Valley verde aplaude. Tres fondos sostenibles anuncian entrada al mercado. Nuevo modelo económico."],
      bajo_pib: ["La crisis hace imposible pensar en verde. Tus aliados ecologistas te presionan. Atrapado entre dos mundos.", "Priorizas empresas sostenibles para contratos. El sector tradicional ruge. Tensión severa en el gabinete.", "La medida llega en mal momento pero es necesaria. El futuro lo agradecerá aunque el presente duela."],
      alta_rebeldia: ["El caos social hace imposible cualquier reforma. Los ecologistas marchan junto a los descontentos.", "Usas la crisis para justificar medidas verdes de emergencia. La oposición lo llama dictadura ambiental.", "Tres regiones rechazan la reforma. Tensión entre capital y provincias en niveles históricos."],
    },
    nacionalismo: {
      alto_pib: ["La reforma es vendida como 'primero los nacionales'. Las empresas extranjeras pagarán más. Tú no cedes.", "El orgullo nacional sube. Tu eslogan 'nuestra riqueza, nuestro futuro' se vuelve viral.", "Tres multinacionales amenazan con irse. Les deseas buen viaje. Tu base te aplaude."],
      bajo_pib: ["La economía sufre pero el discurso nacionalista mantiene a tu base unida.", "Culpas a factores externos. El pueblo te cree por ahora. ¿Cuánto aguantará esa narrativa?", "La reforma es dolorosa pero 'soberana'. Los medios internacionales la llaman proteccionismo puro."],
      alta_rebeldia: ["Tu base nacionalista se fractura. Unos te apoyan, otros te traicionan. La lealtad tiene límites.", "Grupos ultranacionalistas aprovechan el caos. Te están superando por la derecha.", "La crisis amenaza con dividir el país en líneas regionales. Necesitas un discurso unificador urgente."],
    },
    tecnocracia: {
      alto_pib: ["Los algoritmos predicen éxito con 87% de confianza. La prensa lo llama 'gobierno de datos'.", "Silicon Valley aplaude. Tres startups anuncian sede en tu país. La fuga de cerebros se revierte.", "Tu ministra aparece en portada de Wired. Soft power tecnológico al máximo histórico."],
      bajo_pib: ["Los modelos económicos fallaron. Tu equipo pide más tiempo. La realidad supera los algoritmos.", "La tecnocracia tiene límites. El factor humano no cabe en ninguna hoja de cálculo.", "Tus asesores proponen reforma 2.0. La ciudadanía ya no confía en los expertos."],
      alta_rebeldia: ["La gente rechaza ser gobernada por algoritmos. 'No somos datos', gritan. Crisis de legitimidad.", "Hackean el sistema de implementación. Caos administrativo. Tus técnicos trabajan sin dormir.", "La desconfianza en tecnología gubernamental en máximos históricos."],
    },
  },
  reclutamiento: {
    socialismo:    { alto_militar: ["Con ejército poderoso, el reclutamiento es visto como provocación. Colombia rompe relaciones temporalmente.", "Soldados con adoctrinamiento ideológico. Moral alta pero el gasto preocupa a tus aliados.", "Venezuela y Bolivia felicitan. USA emite 'preocupación'. Tu posición geopolítica se endurece."], bajo_militar: ["El ejército estaba en estado crítico. El reclutamiento masivo restaura la confianza nacional.", "Tropas jóvenes e inexpertas. Un incidente fronterizo pone a prueba su entrenamiento antes de tiempo.", "La inversión militar genera debate: ¿por qué no salud? Tus asesores de izquierda amenazan con renunciar."] },
    liberalismo:   { alto_militar: ["El complejo industrial-militar celebra. Tres empresas de defensa suben en bolsa.", "La OTAN valora el refuerzo. Nuevos ejercicios conjuntos se planifican.", "Think tank conservador: 'el ejército más profesional de la región'. El orgullo nacional sube."], bajo_militar: ["Brecha de liderazgo en las fuerzas armadas. Tres generales compiten por el ascenso.", "Los mercados lo ven como señal de inestabilidad. Riesgo país sube dos puntos.", "Empresa privada ofrece complementar el reclutamiento. Tentador pero muy polémico."] },
    autoritarismo: { alto_militar: ["El ejército ya es temido. Más tropas envían mensaje inequívoco: no habrá debilidad.", "Desfile militar en cadena nacional. Cuatro países vecinos refuerzan sus fronteras en respuesta.", "Tensión regional en niveles de Guerra Fría. Tu embajador en la ONU trabaja sin dormir."], bajo_militar: ["Reclutas con urgencia. Soldados leales pero crudos. Un incidente podría descontrolarse.", "El partido te presiona a militarizar más rápido. Los derechos humanos quedan en segundo plano.", "Prisa en el reclutamiento genera problemas de disciplina. Tres incidentes graves en una semana."] },
    ecologismo:    { alto_militar: ["Propones 'ejército verde': soldados que plantan árboles y protegen ecosistemas. El mundo te aplaude.", "Milicia ambiental patrulla zonas de deforestación. Los madereros ilegales huyen.", "ONG ambientales colaboran con el ejército. Alianza inédita estudiada en universidades europeas."], bajo_militar: ["Ejército pequeño pero entrenado en defensa ecológica. Una empresa minera ilegal aprende la lección.", "Priorizas rangers ambientales. La defensa convencional queda en segundo plano. ¿Error?", "Formación ambiental obligatoria en el ejército. Los militares tradicionales lo odian. Los jóvenes, lo aman."] },
    nacionalismo:  { alto_militar: ["'Nuestro ejército, nuestra soberanía.' El servicio militar se vuelve acto de orgullo nacional.", "Desfiles, himnos, banderas. Fervor patriótico en niveles no vistos en décadas.", "País vecino protesta. Tú lo llamas 'defensa legítima soberana'. Tensión diplomática alta."], bajo_militar: ["La debilidad militar era humillación nacional. El reclutamiento masivo restaura el orgullo patrio.", "Jóvenes de todo el país se alistan voluntariamente. Espíritu nacional en punto más alto.", "Servicio militar obligatorio. Algunos protestan. La mayoría lo ve como deber sagrado."] },
    tecnocracia:   { alto_militar: ["Integras IA en el comando. El ejército más tecnológico de la región. Y el más impredecible.", "Drones autónomos patrullan fronteras. Un fallo técnico crea incidente internacional.", "Ejército digital envidiado. Tres países piden comprar la tecnología. Nueva fuente de ingresos."], bajo_militar: ["Simulaciones de IA para entrenar tropas. Innovador. Pero ¿funciona en combate real?", "Presupuesto dividido entre soldados tradicionales y sistemas autónomos. Tensión generacional.", "Reclutas hackers junto a soldados. El ciberejército nace. Rusia y China toman nota."] },
  },
  plan_social: {
    socialismo:    { alta_aprobacion: ["Éxito rotundo. Cuba y Bolivia piden asesoría para replicarlo. Tu imagen internacional mejora.", "Las madres de familia salen a aplaudirte. Un documental te llama 'el presidente de los pobres'.", "Indicadores de salud mejoran en tiempo récord. La OMS felicita al gobierno. Premio internacional posible."], baja_aprobacion: ["El plan llega cuando nadie confía. La prensa lo llama 'populismo desesperado'.", "Fondos insuficientes. Filas interminables. Un video viral muestra el caos en la distribución.", "La oposición acusa corrupción en la licitación. Tu ministro enfrenta investigación parlamentaria."] },
    liberalismo:   { alta_aprobacion: ["Los mercados lo ven como inversión en capital humano. Rating crediticio sube.", "La productividad laboral sube 8% en zonas beneficiadas. Los números hablan más que la ideología.", "El Banco Mundial publica informe positivo. Delegaciones de 5 países estudian tu modelo."], baja_aprobacion: ["Con poca credibilidad, el plan es visto como limosna. Los beneficiarios lo toman pero no te votan.", "Tu partido te presiona: 'esto no es lo que prometimos'. Facción amenaza con romper la coalición.", "El plan cuesta más de lo presupuestado. Tu ministro de hacienda renuncia. Crisis de gabinete."] },
    autoritarismo: { alta_aprobacion: ["El plan social silencia a la oposición temporalmente. La gente agradece pero sabe que hay condiciones.", "Los beneficiarios son registrados como 'ciudadanos leales'. Base de datos política disfrazada de programa.", "La medida es aplaudida en encuesta oficial. Los métodos de la encuesta son ampliamente cuestionados."], baja_aprobacion: ["Muchos rechazan el plan por miedo. La desconfianza institucional está profundamente arraigada.", "Usas los beneficios como control político. Quien protesta pierde el subsidio.", "Un funcionario filtra que los fondos están mal gestionados. Desaparece tres días después."] },
    ecologismo:    { alta_aprobacion: ["El plan incluye huertos comunitarios y energía solar subsidiada. Nuevo modelo de bienestar verde.", "Las comunidades rurales son las más beneficiadas. Turismo sostenible aumenta 30%.", "Tu modelo de 'bienestar verde' presentado en la COP como caso de éxito global."], baja_aprobacion: ["El plan es demasiado verde para gente que necesita dinero ahora. 'No puedo comer un árbol'.", "Las comunidades quieren empleo industrial, no huertos. Tensión entre tus valores y las necesidades reales.", "El plan llega tarde y recortado. Las promesas ambientales quedan en segundo plano."] },
    nacionalismo:  { alta_aprobacion: ["'Para los nuestros primero.' ONG internacionales te critican. Tu base te aplaude.", "El programa lleva nombre de héroe nacional. La gente lo recibe con orgullo profundo.", "Los beneficiarios lucen la escarapela al cobrar. Bienestar y patriotismo fusionados."], baja_aprobacion: ["Tu base esperaba más. Frustración mezclada con orgullo herido. Combinación peligrosa.", "El plan llegó recortado por presiones externas. Lo vendes como imposición extranjera.", "Algunos beneficiarios rechazan el plan por considerarlo insuficiente."] },
    tecnocracia:   { alta_aprobacion: ["App gubernamental distribuye beneficios sin burocracia. Cero corrupción en la cadena.", "Blockchain garantiza transparencia total. Cada centavo rastreable públicamente.", "Tu sistema es copiado por Estonia y Singapur. Pequeño país, gran innovación."], baja_aprobacion: ["El sistema excluye a los más vulnerables que no tienen smartphone. Ironía dolorosa.", "Fallo en el servidor deja sin cobrar a 200,000 familias una semana. Crisis de confianza.", "Datos de beneficiarios hackeados. Escándalo de privacidad masivo. Tu ministro tech renuncia."] },
  },
  industrializacion: {
    socialismo:    { default: ["Fábricas nacionalizadas. Los trabajadores aplauden. Los inversores extranjeros huyen. Balance complicado.", "Creas empleos pero a costa del medio ambiente. Tus aliados verdes te presionan.", "La industrialización soviética como modelo. Funciona en el papel. Los resultados en 10 años."] },
    liberalismo:   { default: ["Las zonas económicas especiales atraen inversión masiva. Pero los salarios siguen bajos.", "Automatización industrial reduce costos y empleos. El sindicato declara huelga general.", "Boom industrial en el papel. En la calle, la gente pregunta dónde están los beneficios."] },
    autoritarismo: { default: ["Megaproyectos construidos a marcha forzada. Productividad récord. Derechos laborales, inexistentes.", "El Estado controla las industrias estratégicas. Eficiente a corto plazo. Corrupto a largo plazo.", "Obreros sin descanso. Los números son buenos. Las condiciones laborales, no."] },
    ecologismo:    { default: ["Industria verde desde cero. Energías renovables como motor económico. Costoso pero transformador.", "Prohibes industrias contaminantes. El desempleo sube. El planeta respira.", "Tu modelo atrae a los mejores ingenieros del mundo. La fuga de cerebros se revierte."] },
    nacionalismo:  { default: ["'Hecho en casa.' Productos nacionales en todos los mercados. El consumidor local responde.", "Proteges la industria con aranceles. La OMC amenaza con sanciones. Tú no cedes.", "Industrialización como acto patriótico. Las fábricas son templos de la soberanía."] },
    tecnocracia:   { default: ["Fábricas 4.0 con IA y robótica. Productividad máxima. Empleos mínimos. Debate sobre ingreso universal.", "Tu plan industrial optimizado por algoritmos funciona. Nadie entiende cómo. Caja negra gubernamental.", "Patentes tecnológicas nacionales generan ingresos sin precedentes."] },
  },
  apertura_comercial: {
    socialismo:    { default: ["Abres el comercio con condiciones sociales. Las multinacionales aceptan a regañadientes.", "El libre comercio contradice tu ideología. Tu base te lo recuerda constantemente.", "Acuerdos con países del Sur Global. Menos rentables pero más alineados con tus valores."] },
    liberalismo:   { default: ["Los aranceles caen. Los supermercados se llenan de importados. La industria local sufre. El consumidor gana.", "Nuevo TLC con potencia económica. Acceso a mercados millonarios. Pero hay letra pequeña preocupante.", "Exportaciones récord este trimestre. La clase media crece por primera vez en años."] },
    autoritarismo: { default: ["Apertura controlada. Solo entra lo que el Estado autoriza. Capitalismo de Estado en su versión más pura.", "Acuerdos usados como herramienta de influencia política. Comercio con condiciones ideológicas.", "Abres a aliados y cierras a adversarios. El comercio como extensión de la política exterior."] },
    ecologismo:    { default: ["Solo aceptas comercio con países que cumplen estándares ambientales. Revolucionario y costoso.", "Aranceles verdes como nueva herramienta. Contaminadores pagan más. Sostenibles, menos.", "El comercio justo y ecológico como bandera. Menos volumen pero más coherencia."] },
    nacionalismo:  { default: ["Apertura selectiva: sí a aliados, no a adversarios. El comercio como extensión de la identidad.", "Reduces dependencia de productos estratégicos extranjeros. 'Nunca más rehenes del exterior.'", "Los consumidores prefieren lo importado por precio. Campaña de 'compra nacional'. Resultados mixtos."] },
    tecnocracia:   { default: ["Algoritmos negocian TLC en tiempo real. Condiciones óptimas garantizadas.", "Plataforma digital lanzada. Pequeños exportadores acceden a mercados globales por primera vez.", "Big data predice tendencias con 94% de precisión. Tu ministro de comercio es un modelo de IA."] },
  },
  operacion_espia: {
    socialismo:    ["Tus agentes infiltran célula financiada por la CIA. Documentos comprometedores. ¿Los publicas?", "Operación exitosa pero un agente es capturado en territorio enemigo. Negociación diplomática discreta.", "Interceptas comunicaciones que revelan un plan de golpe financiado desde el exterior. Tienes los nombres.", "Tus servicios descubren que un ministro de tu gabinete filtra información. Traición desde adentro."],
    liberalismo:   ["La operación revela que tu principal competidor recibe fondos ilegales. Oro político. ¿Lo usas?", "Infiltras la red de narcotráfico que financia a la oposición. El fiscal pide las pruebas.", "Descubres que una potencia extranjera manipula tus elecciones. Las pruebas son contundentes.", "La operación falla y se filtra a la prensa. Escándalo diplomático mayor."],
    autoritarismo: ["Espionaje masivo exitoso. Tienes archivos de todos tus opositores. El poder absoluto tiene un precio.", "Tus agentes van demasiado lejos. Un periodista muere en circunstancias sospechosas.", "Tu red de inteligencia se vuelve autónoma. Tu jefe de espías sabe demasiado.", "Interceptas la comunicación de un líder aliado. Él lo descubre. Tu alianza más importante tambalea."],
    ecologismo:    ["Infiltras empresas mineras ilegales. Evidencia de destrucción ambiental masiva. Victoria verde.", "Tus agentes descubren lobby corporativo que bloquea tus leyes ambientales.", "La operación revela corrupción dentro de tu propio ministerio de medio ambiente.", "Espías una potencia que quiere tus recursos naturales. Intervención corporativa disfrazada de inversión."],
    nacionalismo:  ["Infiltras grupos separatistas financiados desde el exterior. Los nombres sorprenden.", "Descubres plan para fragmentar el país. El enemigo interno existe.", "La operación revela que medios extranjeros manipulan la opinión pública nacional.", "Identificas traidores que venden secretos de Estado. El juicio será público y ejemplar."],
    tecnocracia:   ["Ciberespionaje exitoso. Tus hackers obtienen planos de tecnología militar enemiga sin disparar.", "IA analiza patrones y predice un ataque antes de que ocurra.", "Tu sistema de vigilancia digital es hackeado por un Estado rival. Ironía de la tecnocracia.", "Drones espía fotografían instalaciones secretas. Jugada diplomática arriesgada."],
  },
};

function getConsequence(decretoId, ideologia, stats, historialIds) {
  const keyMap = { 1:"reforma_fiscal", 2:"reclutamiento", 3:"plan_social", 4:"industrializacion", 5:"apertura_comercial", 6:"operacion_espia" };
  const key = keyMap[decretoId];
  if (!key || !C[key]) return "Las decisiones presidenciales tienen eco en todo el mundo. El tiempo dirá si fue la correcta.";
  const base = C[key];
  const byIdeo = base[ideologia] || base.liberalismo;
  if (!byIdeo) return "El mundo observa. Tu canciller recibe llamadas de tres capitales.";
  const used = historialIds.filter(h => h === decretoId).length;
  if (Array.isArray(byIdeo)) return byIdeo[used % byIdeo.length];
  if (byIdeo.default) return byIdeo.default[used % byIdeo.default.length];
  let estado = "bajo_pib";
  if (key === "reforma_fiscal") estado = stats.rebeldia > 55 ? "alta_rebeldia" : stats.pib > 60 ? "alto_pib" : "bajo_pib";
  else if (key === "reclutamiento") estado = stats.militar > 55 ? "alto_militar" : "bajo_militar";
  else if (key === "plan_social") estado = stats.aprobacion > 55 ? "alta_aprobacion" : "baja_aprobacion";
  const opts = byIdeo[estado] || byIdeo[Object.keys(byIdeo)[0]];
  if (!Array.isArray(opts)) return "La presión internacional aumenta. Tu equipo trabaja toda la noche.";
  return opts[used % opts.length];
}

const clamp = (v, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(v)));

// ── Componentes ───────────────────────────────────────────
const StatBar = ({ label, value, color = "#c9a84c", icon }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11, color: "#a0a0a0", fontFamily: "monospace" }}>
      <span>{icon} {label}</span>
      <span style={{ color: value > 60 ? "#4caf50" : value > 35 ? "#c9a84c" : "#e53935", fontWeight: "bold" }}>{value}%</span>
    </div>
    <div style={{ height: 6, background: "#1a1a2e", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${value}%`, background: `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: 3, transition: "width 0.8s ease" }} />
    </div>
  </div>
);

// ── App principal ─────────────────────────────────────────
export default function NacionesEnGuerra() {
  const [screen, setScreen] = useState("loading");
  const [step, setStep] = useState(0);
  const [tab, setTab] = useState("panel");

  // Onboarding
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedIdeology, setSelectedIdeology] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [partyName, setPartyName] = useState("");

  // Game state
  const [jugador, setJugador] = useState(null);
  const [stats, setStats] = useState({ pib:67, militar:45, aprobacion:58, petroleo:34, comida:71, energia:52, educacion:63, salud:55, rebeldia:28, intel:40, industria:49 });
  const [decreeUsed, setDecreeUsed] = useState([]);
  const [selectedDecree, setSelectedDecree] = useState(null);
  const [decreeResponse, setDecreeResponse] = useState("");
  const [decreeLoading, setDecreeLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [countdown, setCountdown] = useState(6 * 3600);
  const [otrosJugadores, setOtrosJugadores] = useState([]);
  const [allianceAccepted, setAllianceAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Init Telegram & cargar jugador ──────────────────────
  useEffect(() => {
    if (tg) { tg.ready(); tg.expand(); tg.setBackgroundColor("#080b14"); }
    initPlayer();
  }, []);

  const initPlayer = async () => {
    const tgUser = tg?.initDataUnsafe?.user;
    const tgId = tgUser?.id || 99999999;
    const tgName = tgUser?.first_name || "Presidente";

    try {
      const { data: existing } = await db.from("jugadores").select("*").eq("id", tgId).single();
      if (existing) {
        setJugador(existing);
        setLeaderName(existing.nombre);
        setSelectedCountry(existing.pais);
        setSelectedIdeology(existing.ideologia);
        setPartyName(existing.partido);
        const { data: nation } = await db.from("naciones").select("*").eq("jugador_id", tgId).single();
        if (nation) {
          setStats({ pib: nation.pib, militar: nation.militar, aprobacion: nation.aprobacion, petroleo: nation.petroleo, comida: nation.comida, energia: nation.energia, educacion: nation.educacion, salud: nation.salud, rebeldia: nation.rebeldia, intel: nation.intel, industria: nation.industria });
          setDecreeUsed(nation.decretos_usados || []);
        }
        setScreen("game");
      } else {
        setLeaderName(tgName);
        setScreen("onboarding");
      }
    } catch {
      setLeaderName(tgName);
      setScreen("onboarding");
    }
    loadOtherPlayers();
  };

  const loadOtherPlayers = async () => {
    try {
      const { data } = await db.from("jugadores").select("id, nombre, pais, ideologia").limit(20);
      if (data) setOtrosJugadores(data);
    } catch {}
  };

  // ── Countdown tick ──────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          setStats(s => ({ ...s, pib: clamp(s.pib + Math.floor(Math.random()*5)-2), aprobacion: clamp(s.aprobacion + Math.floor(Math.random()*4)-2), rebeldia: clamp(s.rebeldia + Math.floor(Math.random()*3)-1) }));
          setDecreeUsed([]);
          showNotif("⏰ Nuevo tick — decretos renovados", "info");
          return 6 * 3600;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => `${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const showNotif = (msg, type = "info") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // ── Guardar en Supabase ─────────────────────────────────
  const saveProgress = useCallback(async (newStats, newDecrees) => {
    if (!jugador) return;
    setSaving(true);
    try {
      await db.from("naciones").upsert({ jugador_id: jugador.id, ...newStats, decretos_usados: newDecrees, updated_at: new Date().toISOString() });
      await db.from("jugadores").update({ last_active: new Date().toISOString() }).eq("id", jugador.id);
    } catch {}
    setSaving(false);
  }, [jugador]);

  // ── Registro de nuevo jugador ───────────────────────────
  const registerPlayer = async () => {
    const tgUser = tg?.initDataUnsafe?.user;
    const tgId = tgUser?.id || Date.now();
    setSaving(true);
    try {
      const newPlayer = { id: tgId, username: tgUser?.username || "", nombre: leaderName, pais: selectedCountry, ideologia: selectedIdeology, partido: partyName };
      await db.from("jugadores").upsert(newPlayer);
      await db.from("naciones").upsert({ jugador_id: tgId, ...stats, decretos_usados: [] });
      try {
        await db.from("partidos").insert({ nombre: partyName, ideologia: selectedIdeology, fundador_id: tgId });
      } catch {}
      setJugador(newPlayer);
      tg?.HapticFeedback?.notificationOccurred("success");
      setScreen("game");
    } catch (e) {
      showNotif("Error al registrar. Intenta de nuevo.", "error");
    }
    setSaving(false);
  };

  // ── Emitir decreto ──────────────────────────────────────
  const issueDecree = async (decree) => {
    if (decreeUsed.includes(decree.id)) return;
    if (decreeUsed.length >= 3) { showNotif("⛔ Ya usaste tus 3 decretos de hoy", "error"); return; }
    tg?.HapticFeedback?.impactOccurred("medium");
    setSelectedDecree(decree);
    setDecreeLoading(true);
    setDecreeResponse("");
    setTab("decretos");

    const newStats = { ...stats };
    if (decree.statChanges) {
      Object.entries(decree.statChanges).forEach(([k, v]) => { if (newStats[k] !== undefined) newStats[k] = clamp(newStats[k] + v); });
    }
    setStats(newStats);

    await new Promise(r => setTimeout(r, 700));
    const consequence = getConsequence(decree.id, selectedIdeology, newStats, decreeUsed);
    setDecreeResponse(consequence);

    const newDecrees = [...decreeUsed, decree.id];
    setDecreeUsed(newDecrees);

    try {
      await db.from("decretos_log").insert({ jugador_id: jugador?.id, decreto_id: decree.id, decreto_nombre: decree.name, consecuencia: consequence });
    } catch {}

    await saveProgress(newStats, newDecrees);
    setDecreeLoading(false);
  };

  const ideo = IDEOLOGIES[selectedIdeology] || IDEOLOGIES.liberalismo;

  // ── LOADING ─────────────────────────────────────────────
  if (screen === "loading") return (
    <div style={{ minHeight: "100vh", background: "#080b14", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 48 }}>🌍</div>
      <div style={{ color: "#c9a84c", fontFamily: "Georgia", fontSize: 14, letterSpacing: 2 }}>CARGANDO...</div>
    </div>
  );

  // ── ONBOARDING ──────────────────────────────────────────
  if (screen === "onboarding") return (
    <div style={{ minHeight: "100vh", background: "#080b14", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", padding: 20, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(201,168,76,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.04) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}>

        {step === 0 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🌍</div>
            <h1 style={{ fontSize: 28, color: "#c9a84c", letterSpacing: 3, margin: "0 0 4px", textTransform: "uppercase" }}>Naciones</h1>
            <h1 style={{ fontSize: 28, color: "#e8e8e8", letterSpacing: 3, margin: "0 0 20px", textTransform: "uppercase" }}>en Guerra</h1>
            <p style={{ color: "#6a6a8a", fontSize: 13, lineHeight: 1.8, marginBottom: 32 }}>195 naciones compiten por el poder global. Solo una alcanzará la hegemonía.</p>
            <button onClick={() => setStep(1)} style={{ background: "linear-gradient(135deg,#c9a84c,#a07830)", border: "none", color: "#080b14", padding: "14px", borderRadius: 4, fontSize: 14, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", fontWeight: "bold", width: "100%" }}>TOMAR EL PODER</button>
          </div>
        )}

        {step === 1 && (
          <div>
            <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>🗺️</div>
            <h2 style={{ color: "#c9a84c", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase", fontSize: 15, textAlign: "center" }}>Elige tu Nación</h2>
            <p style={{ color: "#6a6a8a", fontSize: 12, marginBottom: 14, textAlign: "center" }}>Serás su Presidente. Para bien o para mal.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7, marginBottom: 18, maxHeight: 260, overflowY: "auto" }}>
              {COUNTRIES.map(c => <button key={c} onClick={() => setSelectedCountry(c)} style={{ background: selectedCountry === c ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${selectedCountry === c ? "#c9a84c" : "rgba(255,255,255,0.08)"}`, color: selectedCountry === c ? "#c9a84c" : "#777", padding: "9px 4px", borderRadius: 4, fontSize: 10, cursor: "pointer", transition: "all 0.2s" }}>{c}</button>)}
            </div>
            <button disabled={!selectedCountry} onClick={() => setStep(2)} style={{ background: selectedCountry ? "linear-gradient(135deg,#c9a84c,#a07830)" : "#2a2a3a", border: "none", color: selectedCountry ? "#080b14" : "#444", padding: "14px", borderRadius: 4, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", cursor: selectedCountry ? "pointer" : "not-allowed", fontWeight: "bold", width: "100%" }}>CONTINUAR →</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>🏛️</div>
            <h2 style={{ color: "#c9a84c", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase", fontSize: 15, textAlign: "center" }}>Tu Ideología</h2>
            <p style={{ color: "#6a6a8a", fontSize: 12, marginBottom: 14, textAlign: "center" }}>Define cómo gobernarás. Afecta todos tus decretos.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {Object.entries(IDEOLOGIES).map(([key, val]) => <button key={key} onClick={() => setSelectedIdeology(key)} style={{ background: selectedIdeology === key ? `${val.color}22` : "rgba(255,255,255,0.03)", border: `1px solid ${selectedIdeology === key ? val.color : "rgba(255,255,255,0.07)"}`, color: selectedIdeology === key ? val.color : "#777", padding: "12px 16px", borderRadius: 4, fontSize: 13, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.2s" }}><span>{val.icon} {val.label}</span><span style={{ fontSize: 11, opacity: 0.7 }}>{val.bonus}</span></button>)}
            </div>
            <button disabled={!selectedIdeology} onClick={() => setStep(3)} style={{ background: selectedIdeology ? "linear-gradient(135deg,#c9a84c,#a07830)" : "#2a2a3a", border: "none", color: selectedIdeology ? "#080b14" : "#444", padding: "14px", borderRadius: 4, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", cursor: selectedIdeology ? "pointer" : "not-allowed", fontWeight: "bold", width: "100%" }}>CONTINUAR →</button>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>✍️</div>
            <h2 style={{ color: "#c9a84c", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase", fontSize: 15, textAlign: "center" }}>Tu Identidad</h2>
            <p style={{ color: "#6a6a8a", fontSize: 12, marginBottom: 20, textAlign: "center" }}>El mundo entero sabrá tu nombre.</p>
            <input placeholder="Tu nombre como líder..." value={leaderName} onChange={e => setLeaderName(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.3)", color: "#e8e8e8", padding: "12px 16px", borderRadius: 4, fontSize: 14, marginBottom: 12, boxSizing: "border-box", outline: "none", fontFamily: "Georgia,serif" }} />
            <input placeholder="Nombre de tu partido político..." value={partyName} onChange={e => setPartyName(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.3)", color: "#e8e8e8", padding: "12px 16px", borderRadius: 4, fontSize: 14, marginBottom: 24, boxSizing: "border-box", outline: "none", fontFamily: "Georgia,serif" }} />
            <button disabled={!leaderName || !partyName || saving} onClick={registerPlayer} style={{ background: leaderName && partyName ? "linear-gradient(135deg,#c9a84c,#a07830)" : "#2a2a3a", border: "none", color: leaderName && partyName ? "#080b14" : "#444", padding: "14px", borderRadius: 4, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", cursor: leaderName && partyName ? "pointer" : "not-allowed", fontWeight: "bold", width: "100%" }}>
              {saving ? "REGISTRANDO..." : "🌍 ASUMIR EL PODER"}
            </button>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          {[0,1,2,3].map(i => <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i === step ? "#c9a84c" : "#2a2a3a", transition: "all 0.3s" }} />)}
        </div>
      </div>
    </div>
  );

  // ── GAME ────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#080b14", fontFamily: "Georgia,serif", color: "#e8e8e8", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(201,168,76,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.03) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />

      {notification && (
        <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: notification.type === "error" ? "#e5393522" : "#c9a84c22", border: `1px solid ${notification.type === "error" ? "#e53935" : "#c9a84c"}`, color: notification.type === "error" ? "#e53935" : "#c9a84c", padding: "10px 20px", borderRadius: 4, fontSize: 13, zIndex: 1000, whiteSpace: "nowrap" }}>
          {notification.msg}
        </div>
      )}

      {/* HEADER */}
      <div style={{ background: "rgba(8,11,20,0.97)", borderBottom: "1px solid rgba(201,168,76,0.2)", padding: "12px 16px", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(10px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: "#c9a84c", letterSpacing: 2, textTransform: "uppercase" }}>🌍 Naciones en Guerra {saving && "· guardando..."}</div>
            <div style={{ fontSize: 13, color: "#e8e8e8", marginTop: 2 }}>{leaderName} · <span style={{ color: ideo.color }}>{ideo.icon} {selectedCountry}</span></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#6a6a8a", letterSpacing: 1 }}>PRÓXIMO TICK</div>
            <div style={{ fontSize: 15, color: "#c9a84c", fontFamily: "monospace", fontWeight: "bold" }}>{formatTime(countdown)}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 10, overflowX: "auto", paddingBottom: 2 }}>
          {[["💰",stats.pib],["⚔️",stats.militar],["👥",stats.aprobacion],["🛢️",stats.petroleo],["🌾",stats.comida]].map(([icon,val],i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.04)", padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
              <span style={{ fontSize: 12 }}>{icon}</span>
              <span style={{ fontSize: 12, color: val > 60 ? "#4caf50" : val > 35 ? "#c9a84c" : "#e53935", fontFamily: "monospace", fontWeight: "bold" }}>{val}%</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 16, paddingBottom: 80 }}>

        {/* PANEL */}
        {tab === "panel" && (
          <div>
            <div style={{ fontSize: 11, color: "#c9a84c", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>📊 Panel Nacional</div>
            {stats.rebeldia > 60 && <div style={{ background: "rgba(229,57,53,0.08)", border: "1px solid rgba(229,57,53,0.3)", borderRadius: 6, padding: "12px 14px", marginBottom: 10 }}><div style={{ fontSize: 13, color: "#e53935", fontWeight: "bold", marginBottom: 4 }}>⚠ Alta Rebeldía — {stats.rebeldia}%</div><div style={{ fontSize: 12, color: "#888" }}>La inestabilidad social amenaza tu gobierno. Considera un Plan Social urgente.</div></div>}
            {stats.aprobacion < 30 && <div style={{ background: "rgba(229,57,53,0.08)", border: "1px solid rgba(229,57,53,0.3)", borderRadius: 6, padding: "12px 14px", marginBottom: 10 }}><div style={{ fontSize: 13, color: "#e53935", fontWeight: "bold", marginBottom: 4 }}>⚠ Aprobación crítica — {stats.aprobacion}%</div><div style={{ fontSize: 12, color: "#888" }}>El pueblo pierde la fe. Riesgo de elecciones anticipadas.</div></div>}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#6a6a8a", letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>Economía</div>
              <StatBar label="PIB Nacional" value={stats.pib} icon="💰" color="#c9a84c" />
              <StatBar label="Petróleo" value={stats.petroleo} icon="🛢️" color="#ff8f00" />
              <StatBar label="Comida" value={stats.comida} icon="🌾" color="#4caf50" />
              <StatBar label="Energía" value={stats.energia} icon="⚡" color="#03a9f4" />
              <StatBar label="Industria" value={stats.industria} icon="🏭" color="#9c27b0" />
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#6a6a8a", letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>Social</div>
              <StatBar label="Aprobación" value={stats.aprobacion} icon="👥" color="#e91e63" />
              <StatBar label="Educación" value={stats.educacion} icon="🎓" color="#3f51b5" />
              <StatBar label="Salud" value={stats.salud} icon="🏥" color="#00bcd4" />
              <StatBar label="Rebeldía" value={stats.rebeldia} icon="😤" color="#e53935" />
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: 16 }}>
              <div style={{ fontSize: 11, color: "#6a6a8a", letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>Militar</div>
              <StatBar label="Ejército" value={stats.militar} icon="⚔️" color="#f44336" />
              <StatBar label="Inteligencia" value={stats.intel} icon="🕵️" color="#795548" />
            </div>
          </div>
        )}

        {/* DECRETOS */}
        {tab === "decretos" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#c9a84c", letterSpacing: 2, textTransform: "uppercase" }}>📜 Decretos</div>
              <div style={{ background: decreeUsed.length >= 3 ? "rgba(229,57,53,0.1)" : "rgba(201,168,76,0.1)", border: `1px solid ${decreeUsed.length >= 3 ? "rgba(229,57,53,0.4)" : "rgba(201,168,76,0.3)"}`, color: decreeUsed.length >= 3 ? "#e53935" : "#c9a84c", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontFamily: "monospace" }}>
                {3 - decreeUsed.length}/3 restantes
              </div>
            </div>

            {selectedDecree && (
              <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 6, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: "#c9a84c", marginBottom: 10, fontWeight: "bold" }}>{selectedDecree.icon} {selectedDecree.name} — Consecuencias</div>
                {decreeLoading
                  ? <div style={{ color: "#6a6a8a", fontSize: 13, fontStyle: "italic" }}>⏳ Evaluando impacto internacional...</div>
                  : <div style={{ color: "#c0c0c0", fontSize: 13, lineHeight: 1.8 }}>{decreeResponse}</div>
                }
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {DECREES.map(d => {
                const used = decreeUsed.includes(d.id);
                const exhausted = decreeUsed.length >= 3 && !used;
                return (
                  <button key={d.id} onClick={() => issueDecree(d)} disabled={used || exhausted} style={{ background: used ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)", border: `1px solid ${used ? "rgba(255,255,255,0.04)" : selectedDecree?.id === d.id ? "#c9a84c44" : "rgba(201,168,76,0.15)"}`, borderRadius: 6, padding: "14px 16px", textAlign: "left", cursor: used || exhausted ? "not-allowed" : "pointer", opacity: used || exhausted ? 0.4 : 1, transition: "all 0.2s", fontFamily: "Georgia,serif" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", gap: 10 }}>
                        <span style={{ fontSize: 22 }}>{d.icon}</span>
                        <div>
                          <div style={{ fontSize: 14, color: used ? "#555" : "#e8e8e8", marginBottom: 4 }}>{d.name}</div>
                          <div style={{ fontSize: 12, color: "#666" }}>{d.desc}</div>
                          <div style={{ fontSize: 11, color: "#c9a84c", marginTop: 6, fontFamily: "monospace" }}>{d.effect}</div>
                        </div>
                      </div>
                      {used && <span style={{ fontSize: 10, color: "#555", border: "1px solid #333", padding: "2px 8px", borderRadius: 10, flexShrink: 0 }}>EMITIDO</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* DIPLOMACIA */}
        {tab === "diplomacia" && (
          <div>
            <div style={{ fontSize: 11, color: "#c9a84c", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>🤝 Diplomacia</div>
            {!allianceAccepted ? (
              <div style={{ background: "rgba(76,175,80,0.06)", border: "1px solid rgba(76,175,80,0.25)", borderRadius: 6, padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#4caf50", marginBottom: 8, fontWeight: "bold" }}>📩 Propuesta Pendiente — Brasil</div>
                <div style={{ fontSize: 13, color: "#aaa", marginBottom: 12, lineHeight: 1.6 }}>Brasil solicita un <strong style={{ color: "#e8e8e8" }}>Pacto de No Agresión</strong> por 30 días. A cambio: +15% comercio bilateral y +5% PIB.</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { tg?.HapticFeedback?.notificationOccurred("success"); setAllianceAccepted(true); setStats(s => ({ ...s, pib: clamp(s.pib+5), aprobacion: clamp(s.aprobacion+3) })); showNotif("✅ Alianza con Brasil confirmada +PIB +Aprobación", "info"); }} style={{ flex: 1, background: "rgba(76,175,80,0.2)", border: "1px solid #4caf50", color: "#4caf50", padding: "10px", borderRadius: 4, fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif" }}>✅ ACEPTAR</button>
                  <button onClick={() => { tg?.HapticFeedback?.notificationOccurred("error"); setStats(s => ({ ...s, aprobacion: clamp(s.aprobacion-2) })); showNotif("❌ Propuesta rechazada — relaciones tensas con Brasil", "error"); }} style={{ flex: 1, background: "rgba(229,57,53,0.1)", border: "1px solid #e53935", color: "#e53935", padding: "10px", borderRadius: 4, fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif" }}>❌ RECHAZAR</button>
                </div>
              </div>
            ) : (
              <div style={{ background: "rgba(76,175,80,0.06)", border: "1px solid rgba(76,175,80,0.25)", borderRadius: 6, padding: 14, marginBottom: 16, textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>🤝</div>
                <div style={{ fontSize: 13, color: "#4caf50" }}>Alianza con Brasil activa — 30 días restantes</div>
              </div>
            )}

            <div style={{ fontSize: 11, color: "#6a6a8a", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>Presidentes en línea ({otrosJugadores.length})</div>
            {otrosJugadores.filter(j => j.id !== jugador?.id).slice(0,5).map((j, i) => {
              const jideo = IDEOLOGIES[j.ideologia] || IDEOLOGIES.liberalismo;
              return (
                <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#e8e8e8", marginBottom: 4 }}>{jideo.icon} {j.nombre}</div>
                    <div style={{ fontSize: 11, color: "#666" }}>{j.pais} · {jideo.label}</div>
                  </div>
                  <button onClick={() => { tg?.HapticFeedback?.impactOccurred("light"); showNotif(`✉ Propuesta enviada a ${j.nombre}`, "info"); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#666", padding: "5px 12px", borderRadius: 4, fontSize: 11, cursor: "pointer", fontFamily: "Georgia,serif" }}>CONTACTAR</button>
                </div>
              );
            })}
            {otrosJugadores.filter(j => j.id !== jugador?.id).length === 0 && (
              <div style={{ color: "#555", fontSize: 13, textAlign: "center", padding: 20 }}>Aún no hay otros presidentes registrados.<br/>Invita jugadores a unirse.</div>
            )}

            <div style={{ fontSize: 11, color: "#6a6a8a", letterSpacing: 1, marginBottom: 10, marginTop: 16, textTransform: "uppercase" }}>Acciones</div>
            {[["🤝","Proponer Alianza","Invitar a otro país",() => showNotif("🤝 Selecciona un presidente para proponer alianza","info")],["📦","Embargo Económico","Bloquear comercio con un rival",() => { setStats(s => ({...s,pib:clamp(s.pib-3)})); showNotif("📦 Embargo declarado — tu PIB baja 3%","error"); }],["🕵️","Operación Espionaje","Infiltrar inteligencia rival",() => { setStats(s => ({...s,intel:clamp(s.intel+10)})); showNotif("🕵️ Operación exitosa +10 Intel","info"); }],["📢","Discurso en ONU","Influir en opinión global",() => { setStats(s => ({...s,aprobacion:clamp(s.aprobacion+5)})); showNotif("📢 Discurso aplaudido +5 Aprobación","info"); }]].map(([icon,name,desc,action],i) => (
              <button key={i} onClick={() => { tg?.HapticFeedback?.impactOccurred("medium"); action(); }} style={{ width:"100%", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:6, padding:"12px 14px", marginBottom:8, textAlign:"left", cursor:"pointer", display:"flex", gap:12, alignItems:"center", fontFamily:"Georgia,serif" }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <div><div style={{ fontSize: 13, color: "#ddd" }}>{name}</div><div style={{ fontSize: 11, color: "#666" }}>{desc}</div></div>
              </button>
            ))}
          </div>
        )}

        {/* PARTIDOS */}
        {tab === "partidos" && (
          <div>
            <div style={{ fontSize: 11, color: "#c9a84c", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>🏛️ Partidos Políticos</div>
            <div style={{ background: `${ideo.color}11`, border: `1px solid ${ideo.color}44`, borderRadius: 6, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: ideo.color, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>MI PARTIDO</div>
              <div style={{ fontSize: 18, color: "#e8e8e8", marginBottom: 4 }}>{ideo.icon} {partyName}</div>
              <div style={{ fontSize: 13, color: ideo.color, marginBottom: 12 }}>{ideo.label} · Fundador: {leaderName}</div>
              <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
                {[["1","MIEMBROS"],["1","PAÍSES"],["#1","RANKING"]].map(([v,l]) => <div key={l} style={{ textAlign:"center" }}><div style={{ fontSize:20, color:"#c9a84c", fontFamily:"monospace", fontWeight:"bold" }}>{v}</div><div style={{ fontSize:10, color:"#666" }}>{l}</div></div>)}
              </div>
              <button onClick={() => { tg?.HapticFeedback?.impactOccurred("light"); showNotif("📤 Link de invitación copiado","info"); }} style={{ width:"100%", background:`${ideo.color}22`, border:`1px solid ${ideo.color}66`, color:ideo.color, padding:"10px", borderRadius:4, fontSize:12, cursor:"pointer", fontFamily:"Georgia,serif", letterSpacing:1 }}>📤 INVITAR MIEMBROS</button>
            </div>

            <div style={{ fontSize: 11, color: "#6a6a8a", letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>Otros Presidentes ({otrosJugadores.length} registrados)</div>
            {otrosJugadores.filter(j => j.id !== jugador?.id).map((j, i) => {
              const jideo = IDEOLOGIES[j.ideologia] || IDEOLOGIES.liberalismo;
              return (
                <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, color: "#e8e8e8", marginBottom: 4 }}>{jideo.icon} {j.nombre}</div>
                      <div style={{ fontSize: 12, color: jideo.color }}>{j.pais} · {jideo.label}</div>
                    </div>
                    <button onClick={() => showNotif(`📨 Invitación enviada a ${j.nombre}`,"info")} style={{ background:"transparent", border:`1px solid ${jideo.color}44`, color:jideo.color, padding:"6px 12px", borderRadius:4, fontSize:11, cursor:"pointer", fontFamily:"Georgia,serif" }}>INVITAR</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* NOTICIAS */}
        {tab === "eventos" && (
          <div>
            <div style={{ fontSize: 11, color: "#c9a84c", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>📡 Noticias Mundiales</div>
            {[
              { icon:"🌋", title:"Terremoto en Región Norte", desc:"Un sismo 7.2 sacude tu región industrial. Pérdidas estimadas en $2.3B.", time:"hace 2h", urgent:true },
              { icon:"🤝", title:"Propuesta de Alianza — Brasil", desc:"Brasil solicita un pacto de no agresión por 30 días de juego.", time:"hace 4h", urgent:false },
              { icon:"📈", title:"Boom Petrolero Mundial", desc:"Los precios del crudo suben 18%. Tus reservas valen más.", time:"hace 6h", urgent:false },
              { icon:"⚠️", title:"Movimiento de Tropas Fronterizo", desc:"Se reporta concentración militar en tu frontera sur. Fuentes no confirmadas.", time:"hace 8h", urgent:true },
            ].map((ev,i) => (
              <div key={i} style={{ background: ev.urgent ? "rgba(229,57,53,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${ev.urgent ? "rgba(229,57,53,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: 6, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 26 }}>{ev.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 13, color: ev.urgent ? "#e53935" : "#e8e8e8", fontWeight: "bold", marginBottom: 6 }}>{ev.title}</div>
                      {ev.urgent && <span style={{ fontSize: 9, color: "#e53935", border: "1px solid #e5393544", padding: "2px 6px", borderRadius: 10, flexShrink: 0 }}>URGENTE</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#888", lineHeight: 1.7 }}>{ev.desc}</div>
                    <div style={{ fontSize: 10, color: "#444", marginTop: 8 }}>{ev.time}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(8,11,20,0.97)", borderTop: "1px solid rgba(201,168,76,0.15)", display: "flex", backdropFilter: "blur(10px)" }}>
        {[["panel","📊","Panel"],["decretos","📜","Decretos"],["diplomacia","🤝","Diplo"],["partidos","🏛️","Partidos"],["eventos","📡","Noticias"]].map(([id,icon,label]) => (
          <button key={id} onClick={() => { tg?.HapticFeedback?.selectionChanged(); setTab(id); }} style={{ flex:1, background:"transparent", border:"none", padding:"10px 4px 14px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 9, color: tab === id ? "#c9a84c" : "#444", letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</span>
            {tab === id && <div style={{ width: 20, height: 2, background: "#c9a84c", borderRadius: 1 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}
