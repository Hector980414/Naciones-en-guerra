import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wdbupgqymgqfpobcbfze.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYnVwZ3F5bWdxZnBvYmNiZnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NjM0NjAsImV4cCI6MjA4OTUzOTQ2MH0.Psq7trqKDSNltKK8bqaLdXgg56FSjK6sfM4EH4TRnBo";
const db = createClient(SUPABASE_URL, SUPABASE_KEY);
const tg = window.Telegram?.WebApp;

const IDEOLOGIES = {
  socialismo:    { icon: "🔴", label: "Socialismo",    color: "#e53935", bonus: "+Salud +Educación" },
  liberalismo:   { icon: "🔵", label: "Liberalismo",   color: "#1e88e5", bonus: "+PIB +Comercio" },
  autoritarismo: { icon: "⚫", label: "Autoritarismo", color: "#757575", bonus: "+Militar +Control" },
  ecologismo:    { icon: "🟢", label: "Ecologismo",    color: "#43a047", bonus: "+Recursos" },
  nacionalismo:  { icon: "🟡", label: "Nacionalismo",  color: "#f9a825", bonus: "+Aprobación" },
  tecnocracia:   { icon: "⚪", label: "Tecnocracia",   color: "#90a4ae", bonus: "+Educación +IA" },
};

const COUNTRIES = ["Cuba","México","Venezuela","Argentina","Brasil","Colombia","Chile","Perú","Ecuador","Bolivia","España","Francia","Alemania","Rusia","China","USA","India","Japón","Corea del Sur","Nigeria","Egipto","Turquía","Irán","Arabia Saudita","Sudáfrica","Indonesia","Pakistán","Bangladesh","Etiopía","Rep. Dominicana"];

const DECREES = [
  { id:1, name:"Reforma Fiscal",     icon:"💰", desc:"Aumentar impuestos corporativos",  effect:"+PIB 3%, -Apr 5%",   statChanges:{pib:3,aprobacion:-5} },
  { id:2, name:"Reclutamiento",      icon:"⚔️", desc:"Ampliar el ejército nacional",     effect:"+Mil 8%, -PIB 4%",   statChanges:{militar:8,pib:-4} },
  { id:3, name:"Plan Social",        icon:"🏥", desc:"Subsidiar salud y educación",       effect:"+Apr 10%, -PIB 6%",  statChanges:{aprobacion:10,salud:5,pib:-6} },
  { id:4, name:"Industrialización",  icon:"🏭", desc:"Inversión en industria pesada",     effect:"+Ind 7%, -PIB 4%",   statChanges:{industria:7,pib:-4} },
  { id:5, name:"Apertura Comercial", icon:"🚢", desc:"Reducir aranceles",                 effect:"+PIB 9%, -Ind 4%",   statChanges:{pib:9,industria:-4} },
  { id:6, name:"Operación Espía",    icon:"🕵️", desc:"Infiltrar inteligencia enemiga",   effect:"+Intel 15%",         statChanges:{intel:15} },
];

const C = {
  reforma_fiscal:{socialismo:{alta_rebeldia:["La reforma llega demasiado tarde. Los manifestantes queman neumáticos frente al palacio. Tu jefe de seguridad pide estado de emergencia.","Grupos opositores financiados desde el exterior sabotean la implementación. Tres funcionarios son arrestados.","La tensión social explota. Un general te llama: 'Presidente, la situación es insostenible'. Tienes 24 horas."],alto_pib:["La reforma redistributiva genera protestas en los barrios ricos pero las clases populares celebran. El FMI advierte.","Los empresarios amenazan con fuga de capitales. Tu ministro de economía dimite. Tu aprobación sube 12 puntos.","La medida es aplaudida por sindicatos de 15 países. Venezuela ofrece apoyo. Los mercados reaccionan con cautela."],bajo_pib:["Con la economía en crisis, subir impuestos provoca una huelga general. Tres regiones amenazan con autonomía.","El pueblo entiende el sacrificio. La recaudación sube lentamente. China ofrece un préstamo de emergencia.","Tus asesores advierten: esto puede hundirte. No hay otra salida. El congreso aprueba por un solo voto."]},liberalismo:{alta_rebeldia:["La población no cree en reformas. Las redes sociales explotan. Un video tuyo es viral por las razones equivocadas.","Tres gobernadores se niegan a implementar la medida. El país se fragmenta políticamente.","Un escándalo de corrupción sale hoy. La reforma queda opacada. La prensa pide tu renuncia."],alto_pib:["El mercado reacciona: la bolsa sube 3%. Tu base conservadora murmura descontento silencioso.","Los inversores extranjeros aplauden. Dos multinacionales anuncian nuevas plantas. Tu popularidad en máximos.","El Wall Street Journal publica editorial elogioso. Tu canciller recibe llamadas de aliados estratégicos."],bajo_pib:["Con el PIB en caída, la reforma es un salvavidas polémico. La oposición exige elecciones anticipadas.","Los mercados castigan la medida: la moneda cae 4%. El banco central interviene de emergencia.","Tu vicepresidente filtra su desacuerdo. La coalición tambalea. Necesitas consolidar alianzas."]},autoritarismo:{alta_rebeldia:["Declaras estado de excepción. Las calles están militarizadas. El mundo observa con alarma.","Un intento de golpe es abortado. Cinco generales arrestados. Tu posición se consolida.","La crisis se internacionaliza. La ONU convoca reunión de emergencia."],alto_pib:["El decreto se implementa sin debate. La oposición no puede frenarlo. Tu control del Estado crece.","Los medios oficiales celebran. Dos periodistas independientes son 'invitados a conversar'.","El ejército apoya públicamente. Los países vecinos observan con preocupación."],bajo_pib:["Cualquier impuesto genera resentimiento. Aumentas el presupuesto de seguridad.","Implementas con mano dura. La resistencia es silenciada. El descontento crece en silencio.","Tres líderes opositores detenidos. La comunidad internacional condena. Sanciones posibles."]},ecologismo:{alto_pib:["La reforma incluye incentivos verdes. Inversores ESG internacionales miran tu país con interés.","Tu reforma es pionera en la región. La prensa te llama 'el presidente verde'.","Silicon Valley verde aplaude. Tres fondos sostenibles anuncian entrada al mercado."],bajo_pib:["La crisis hace imposible pensar en verde. Tus aliados ecologistas te presionan.","Priorizas empresas sostenibles para contratos. El sector tradicional ruge.","La medida llega en mal momento pero es necesaria."],alta_rebeldia:["El caos social hace imposible cualquier reforma. Los ecologistas marchan junto a los descontentos.","Usas la crisis para justificar medidas verdes de emergencia. La oposición lo llama dictadura ambiental.","Tres regiones rechazan la reforma. Tensión histórica."]},nacionalismo:{alto_pib:["La reforma es vendida como 'primero los nacionales'. Tú no cedes ante las empresas extranjeras.","El orgullo nacional sube. Tu eslogan 'nuestra riqueza, nuestro futuro' se vuelve viral.","Tres multinacionales amenazan con irse. Les deseas buen viaje. Tu base te aplaude."],bajo_pib:["La economía sufre pero el discurso nacionalista mantiene a tu base unida.","Culpas a factores externos. El pueblo te cree por ahora.","La reforma es dolorosa pero 'soberana'. Los medios internacionales la llaman proteccionismo."],alta_rebeldia:["Tu base nacionalista se fractura. Unos te apoyan, otros te traicionan.","Grupos ultranacionalistas aprovechan el caos. Te están superando por la derecha.","La crisis amenaza con dividir el país. Necesitas un discurso unificador urgente."]},tecnocracia:{alto_pib:["Los algoritmos predicen éxito con 87% de confianza. La prensa lo llama 'gobierno de datos'.","Silicon Valley aplaude. Tres startups anuncian sede en tu país. La fuga de cerebros se revierte.","Tu ministra aparece en portada de Wired. Soft power tecnológico al máximo."],bajo_pib:["Los modelos económicos fallaron. La realidad supera los algoritmos.","La tecnocracia tiene límites. El factor humano no cabe en ninguna hoja de cálculo.","Tus asesores proponen reforma 2.0. La ciudadanía ya no confía en los expertos."],alta_rebeldia:["La gente rechaza ser gobernada por algoritmos. 'No somos datos', gritan.","Hackean el sistema de implementación. Caos administrativo total.","La desconfianza en tecnología gubernamental en máximos históricos."]}},
  reclutamiento:{socialismo:{alto_militar:["Con ejército poderoso, el reclutamiento es visto como provocación. Colombia rompe relaciones temporalmente.","Soldados con adoctrinamiento ideológico. Moral alta pero el gasto preocupa a tus aliados.","Venezuela y Bolivia felicitan. USA emite 'preocupación'. Tu posición geopolítica se endurece."],bajo_militar:["El ejército estaba en estado crítico. El reclutamiento masivo restaura la confianza nacional.","Tropas jóvenes e inexpertas. Un incidente fronterizo pone a prueba su entrenamiento.","La inversión militar genera debate: ¿por qué no salud? Tus asesores amenazan con renunciar."]},liberalismo:{alto_militar:["El complejo industrial-militar celebra. Tres empresas de defensa suben en bolsa.","La OTAN valora el refuerzo. Nuevos ejercicios conjuntos se planifican.","Think tank conservador: 'el ejército más profesional de la región'."],bajo_militar:["Brecha de liderazgo en las fuerzas armadas. Tres generales compiten por el ascenso.","Los mercados lo ven como señal de inestabilidad. Riesgo país sube dos puntos.","Empresa privada ofrece complementar el reclutamiento. Tentador pero muy polémico."]},autoritarismo:{alto_militar:["El ejército ya es temido. Más tropas envían mensaje inequívoco.","Desfile militar en cadena nacional. Cuatro países vecinos refuerzan sus fronteras.","Tensión regional en niveles de Guerra Fría."],bajo_militar:["Reclutas con urgencia. Soldados leales pero crudos.","El partido presiona militarizar más rápido. Los derechos humanos, en segundo plano.","Prisa en el reclutamiento genera problemas de disciplina."]},ecologismo:{alto_militar:["Propones 'ejército verde': soldados que plantan árboles. El mundo te aplaude.","Milicia ambiental patrulla zonas de deforestación. Los madereros ilegales huyen.","ONG ambientales colaboran con el ejército. Alianza inédita."],bajo_militar:["Ejército pequeño pero entrenado en defensa ecológica.","Priorizas rangers ambientales. La defensa convencional queda en segundo plano.","Formación ambiental obligatoria. Los militares tradicionales lo odian."]},nacionalismo:{alto_militar:["'Nuestro ejército, nuestra soberanía.' El servicio militar es acto de orgullo nacional.","Desfiles, himnos, banderas. Fervor patriótico en niveles no vistos en décadas.","País vecino protesta. Tú lo llamas 'defensa legítima soberana'."],bajo_militar:["La debilidad militar era humillación nacional. El reclutamiento restaura el orgullo.","Jóvenes de todo el país se alistan voluntariamente.","Servicio militar obligatorio. La mayoría lo ve como deber sagrado."]},tecnocracia:{alto_militar:["Integras IA en el comando. El ejército más tecnológico de la región.","Drones autónomos patrullan fronteras. Un fallo técnico crea incidente internacional.","Ejército digital envidiado. Tres países piden comprar la tecnología."],bajo_militar:["Simulaciones de IA para entrenar tropas. ¿Funciona en combate real?","Presupuesto dividido entre soldados y sistemas autónomos. Tensión generacional.","Reclutas hackers junto a soldados. El ciberejército nace."]}},
  plan_social:{socialismo:{alta_aprobacion:["Éxito rotundo. Cuba y Bolivia piden asesoría para replicarlo. Tu imagen mejora notablemente.","Las madres de familia salen a aplaudirte. Un documental te llama 'el presidente de los pobres'.","Indicadores de salud mejoran en tiempo récord. La OMS felicita al gobierno."],baja_aprobacion:["El plan llega cuando nadie confía. La prensa lo llama 'populismo desesperado'.","Fondos insuficientes. Filas interminables. Un video viral muestra el caos.","La oposición acusa corrupción en la licitación. Tu ministro enfrenta investigación."]},liberalismo:{alta_aprobacion:["Los mercados lo ven como inversión en capital humano. Rating crediticio sube.","La productividad laboral sube 8% en zonas beneficiadas. Los números hablan.","El Banco Mundial publica informe positivo. Delegaciones de 5 países estudian tu modelo."],baja_aprobacion:["Con poca credibilidad, el plan es visto como limosna. Los beneficiarios lo toman pero no te votan.","Tu partido te presiona: 'esto no es lo que prometimos'.","El plan cuesta más de lo presupuestado. Tu ministro de hacienda renuncia."]},autoritarismo:{alta_aprobacion:["El plan social silencia a la oposición temporalmente.","Los beneficiarios son registrados como 'ciudadanos leales'.","La medida es aplaudida en encuesta oficial. Los métodos son cuestionados."],baja_aprobacion:["Muchos rechazan el plan por miedo. La desconfianza institucional está arraigada.","Usas los beneficios como control político. Quien protesta pierde el subsidio.","Un funcionario filtra que los fondos están mal gestionados. Desaparece tres días después."]},ecologismo:{alta_aprobacion:["El plan incluye huertos comunitarios y energía solar. Nuevo modelo de bienestar verde.","Las comunidades rurales son las más beneficiadas. Turismo sostenible aumenta 30%.","Tu modelo presentado en la COP como caso de éxito global."],baja_aprobacion:["El plan es demasiado verde para gente que necesita dinero ahora.","Las comunidades quieren empleo industrial, no huertos.","El plan llega tarde y recortado."]},nacionalismo:{alta_aprobacion:["'Para los nuestros primero.' ONG internacionales te critican. Tu base te aplaude.","El programa lleva nombre de héroe nacional. La gente lo recibe con orgullo.","Los beneficiarios lucen la escarapela al cobrar. Bienestar y patriotismo fusionados."],baja_aprobacion:["Tu base esperaba más. Frustración mezclada con orgullo herido.","El plan llegó recortado por presiones externas. Lo vendes como imposición extranjera.","Algunos beneficiarios rechazan el plan por considerarlo insuficiente."]},tecnocracia:{alta_aprobacion:["App gubernamental distribuye beneficios sin burocracia. Cero corrupción en la cadena.","Blockchain garantiza transparencia total. Cada centavo rastreable públicamente.","Tu sistema es copiado por Estonia y Singapur."],baja_aprobacion:["El sistema excluye a los más vulnerables que no tienen smartphone.","Fallo en el servidor deja sin cobrar a 200,000 familias una semana.","Datos de beneficiarios hackeados. Tu ministro tech renuncia."]}},
  industrializacion:{socialismo:{default:["Fábricas nacionalizadas. Los trabajadores aplauden. Los inversores extranjeros huyen.","Creas empleos pero a costa del medio ambiente. Tus aliados verdes te presionan.","La industrialización soviética como modelo. Los resultados en 10 años."]},liberalismo:{default:["Las zonas económicas especiales atraen inversión masiva. Pero los salarios siguen bajos.","Automatización industrial reduce costos y empleos. El sindicato declara huelga.","Boom industrial en el papel. En la calle, la gente pregunta dónde están los beneficios."]},autoritarismo:{default:["Megaproyectos construidos a marcha forzada. Productividad récord. Derechos laborales, inexistentes.","El Estado controla las industrias estratégicas. Eficiente a corto plazo. Corrupto a largo.","Obreros sin descanso. Los números son buenos. Las condiciones laborales, no."]},ecologismo:{default:["Industria verde desde cero. Energías renovables como motor económico.","Prohibes industrias contaminantes. El desempleo sube. El planeta respira.","Tu modelo atrae a los mejores ingenieros del mundo."]},nacionalismo:{default:["'Hecho en casa.' Productos nacionales en todos los mercados.","Proteges la industria con aranceles. La OMC amenaza. Tú no cedes.","Industrialización como acto patriótico. Las fábricas son templos de la soberanía."]},tecnocracia:{default:["Fábricas 4.0 con IA y robótica. Productividad máxima. Empleos mínimos.","Tu plan industrial optimizado por algoritmos. Nadie entiende cómo. Caja negra.","Patentes tecnológicas nacionales generan ingresos sin precedentes."]}},
  apertura_comercial:{socialismo:{default:["Abres el comercio con condiciones sociales. Las multinacionales aceptan a regañadientes.","El libre comercio contradice tu ideología. Tu base te lo recuerda.","Acuerdos con países del Sur Global. Menos rentables pero más alineados con tus valores."]},liberalismo:{default:["Los aranceles caen. Los supermercados se llenan de importados. La industria sufre. El consumidor gana.","Nuevo TLC con potencia económica. Acceso a mercados millonarios. Hay letra pequeña preocupante.","Exportaciones récord este trimestre. La clase media crece por primera vez en años."]},autoritarismo:{default:["Apertura controlada. Solo entra lo que el Estado autoriza.","Acuerdos usados como herramienta de influencia política.","Abres a aliados y cierras a adversarios. El comercio como extensión de la política exterior."]},ecologismo:{default:["Solo aceptas comercio con países que cumplen estándares ambientales.","Aranceles verdes como nueva herramienta. Contaminadores pagan más.","El comercio justo y ecológico como bandera."]},nacionalismo:{default:["Apertura selectiva: sí a aliados, no a adversarios.","Reduces dependencia de productos estratégicos extranjeros. 'Nunca más rehenes del exterior.'","Los consumidores prefieren lo importado. Campaña de 'compra nacional'. Resultados mixtos."]},tecnocracia:{default:["Algoritmos negocian TLC en tiempo real. Condiciones óptimas garantizadas.","Plataforma digital lanzada. Pequeños exportadores acceden a mercados globales.","Big data predice tendencias con 94% de precisión."]}},
  operacion_espia:{socialismo:["Tus agentes infiltran célula financiada por la CIA. Documentos comprometedores. ¿Los publicas?","Operación exitosa pero un agente es capturado. Negociación diplomática discreta.","Interceptas comunicaciones que revelan un plan de golpe financiado desde el exterior.","Tus servicios descubren que un ministro de tu gabinete filtra información. Traición."],liberalismo:["La operación revela que tu principal competidor recibe fondos ilegales. Oro político. ¿Lo usas?","Infiltras la red de narcotráfico que financia a la oposición. El fiscal pide las pruebas.","Descubres que una potencia extranjera manipula tus elecciones. Las pruebas son contundentes.","La operación falla y se filtra a la prensa. Escándalo diplomático mayor."],autoritarismo:["Espionaje masivo exitoso. Tienes archivos de todos tus opositores. El poder tiene un precio.","Tus agentes van demasiado lejos. Un periodista muere en circunstancias sospechosas.","Tu red de inteligencia se vuelve autónoma. Tu jefe de espías sabe demasiado.","Interceptas la comunicación de un líder aliado. Él lo descubre. Tu alianza tambalea."],ecologismo:["Infiltras empresas mineras ilegales. Evidencia de destrucción ambiental masiva.","Tus agentes descubren lobby corporativo que bloquea tus leyes ambientales.","La operación revela corrupción dentro de tu propio ministerio de medio ambiente.","Espías una potencia que quiere tus recursos naturales."],nacionalismo:["Infiltras grupos separatistas financiados desde el exterior. Los nombres sorprenden.","Descubres plan para fragmentar el país. El enemigo interno existe.","La operación revela que medios extranjeros manipulan la opinión pública nacional.","Identificas traidores que venden secretos de Estado."],tecnocracia:["Ciberespionaje exitoso. Tus hackers obtienen planos de tecnología militar enemiga.","IA analiza patrones y predice un ataque antes de que ocurra.","Tu sistema de vigilancia digital es hackeado por un Estado rival. Ironía.","Drones espía fotografían instalaciones secretas. Jugada diplomática arriesgada."]}
};

function getConsequence(decretoId, ideologia, stats, historialIds) {
  const km={1:"reforma_fiscal",2:"reclutamiento",3:"plan_social",4:"industrializacion",5:"apertura_comercial",6:"operacion_espia"};
  const key=km[decretoId]; if(!key||!C[key]) return "Las decisiones presidenciales tienen eco en todo el mundo.";
  const base=C[key]; const byIdeo=base[ideologia]||base.liberalismo; if(!byIdeo) return "El mundo observa con atención.";
  const used=historialIds.filter(h=>h===decretoId).length;
  if(Array.isArray(byIdeo)) return byIdeo[used%byIdeo.length];
  if(byIdeo.default) return byIdeo.default[used%byIdeo.default.length];
  let estado="bajo_pib";
  if(key==="reforma_fiscal") estado=stats.rebeldia>55?"alta_rebeldia":stats.pib>60?"alto_pib":"bajo_pib";
  else if(key==="reclutamiento") estado=stats.militar>55?"alto_militar":"bajo_militar";
  else if(key==="plan_social") estado=stats.aprobacion>55?"alta_aprobacion":"baja_aprobacion";
  const opts=byIdeo[estado]||byIdeo[Object.keys(byIdeo)[0]];
  if(!Array.isArray(opts)) return "La presión internacional aumenta.";
  return opts[used%opts.length];
}

const clamp=(v,min=0,max=100)=>Math.min(max,Math.max(min,Math.round(v)));

// ── MA-3 Style Components ──────────────────────────────────
const ResourceBar = ({ icon, label, value, color }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
    <div style={{ width:28, height:28, background:`${color}22`, border:`1px solid ${color}44`, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>{icon}</div>
    <div style={{ flex:1 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
        <span style={{ fontSize:11, color:"#aaa", fontFamily:"monospace" }}>{label}</span>
        <span style={{ fontSize:11, color:value>60?"#4caf50":value>35?"#c9a84c":"#e53935", fontFamily:"monospace", fontWeight:"bold" }}>{value}%</span>
      </div>
      <div style={{ height:5, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${value}%`, background:`linear-gradient(90deg,${color},${color}88)`, borderRadius:3, transition:"width 0.8s ease" }} />
      </div>
    </div>
  </div>
);

const TopStat = ({ icon, value, label, color }) => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", background:"rgba(0,0,0,0.3)", border:`1px solid ${color}33`, borderRadius:8, padding:"6px 10px", minWidth:60 }}>
    <span style={{ fontSize:16 }}>{icon}</span>
    <span style={{ fontSize:14, color, fontFamily:"monospace", fontWeight:"bold", lineHeight:1.2 }}>{value}</span>
    <span style={{ fontSize:9, color:"#666", textTransform:"uppercase", letterSpacing:0.5 }}>{label}</span>
  </div>
);

export default function NacionesEnGuerra() {
  const [screen, setScreen] = useState("loading");
  const [step, setStep] = useState(0);
  const [tab, setTab] = useState("panel");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedIdeology, setSelectedIdeology] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [partyName, setPartyName] = useState("");
  const [jugador, setJugador] = useState(null);
  const [stats, setStats] = useState({ pib:67,militar:45,aprobacion:58,petroleo:34,comida:71,energia:52,educacion:63,salud:55,rebeldia:28,intel:40,industria:49 });
  const [decreeUsed, setDecreeUsed] = useState([]);
  const [selectedDecree, setSelectedDecree] = useState(null);
  const [decreeResponse, setDecreeResponse] = useState("");
  const [decreeLoading, setDecreeLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [countdown, setCountdown] = useState(3600);
  const [otrosJugadores, setOtrosJugadores] = useState([]);
  const [saving, setSaving] = useState(false);
  const [allianceAccepted, setAllianceAccepted] = useState(false);
  const tickRef = useRef(null);

  useEffect(() => {
    if (tg) { tg.ready(); tg.expand(); tg.setBackgroundColor("#0a0e1a"); }
    initPlayer();
  }, []);

  // Sync global tick from Supabase
  const syncTick = useCallback(async () => {
    try {
      const { data } = await db.from("tick_global").select("proximo_tick").eq("id", 1).single();
      if (data?.proximo_tick) {
        const diff = Math.max(0, Math.floor((new Date(data.proximo_tick) - new Date()) / 1000));
        setCountdown(diff);
      }
    } catch {}
  }, []);

  useEffect(() => {
    syncTick();
    // Re-sync every 5 minutes
    const syncInterval = setInterval(syncTick, 300000);
    // Local countdown
    tickRef.current = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => { clearInterval(syncInterval); clearInterval(tickRef.current); };
  }, [syncTick]);

  const initPlayer = async () => {
    const tgUser = tg?.initDataUnsafe?.user;
    const tgId = tgUser?.id || 99999999;
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
          setStats({ pib:nation.pib,militar:nation.militar,aprobacion:nation.aprobacion,petroleo:nation.petroleo,comida:nation.comida,energia:nation.energia,educacion:nation.educacion,salud:nation.salud,rebeldia:nation.rebeldia,intel:nation.intel,industria:nation.industria });
          setDecreeUsed(nation.decretos_usados || []);
        }
        setScreen("game");
      } else {
        setLeaderName(tgUser?.first_name || "Presidente");
        setScreen("onboarding");
      }
    } catch { setScreen("onboarding"); }
    loadOtherPlayers();
  };

  const loadOtherPlayers = async () => {
    try {
      const { data } = await db.from("jugadores").select("id,nombre,pais,ideologia").limit(20);
      if (data) setOtrosJugadores(data);
    } catch {}
  };

  const showNotif = (msg, type="info") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const saveProgress = useCallback(async (newStats, newDecrees) => {
    if (!jugador) return;
    setSaving(true);
    try {
      await db.from("naciones").upsert({ jugador_id:jugador.id, ...newStats, decretos_usados:newDecrees, updated_at:new Date().toISOString() });
    } catch {}
    setSaving(false);
  }, [jugador]);

  const registerPlayer = async () => {
    const tgUser = tg?.initDataUnsafe?.user;
    const tgId = tgUser?.id || Date.now();
    setSaving(true);
    try {
      const newPlayer = { id:tgId, username:tgUser?.username||"", nombre:leaderName, pais:selectedCountry, ideologia:selectedIdeology, partido:partyName };
      await db.from("jugadores").upsert(newPlayer);
      await db.from("naciones").upsert({ jugador_id:tgId, ...stats, decretos_usados:[] });
      try { await db.from("partidos").insert({ nombre:partyName, ideologia:selectedIdeology, fundador_id:tgId }); } catch {}
      setJugador(newPlayer);
      tg?.HapticFeedback?.notificationOccurred("success");
      setScreen("game");
    } catch { showNotif("Error al registrar. Intenta de nuevo.", "error"); }
    setSaving(false);
  };

  const issueDecree = async (decree) => {
    if (decreeUsed.includes(decree.id)) return;
    if (decreeUsed.length >= 3) { showNotif("⛔ Ya usaste tus 3 decretos de hoy", "error"); return; }
    tg?.HapticFeedback?.impactOccurred("medium");
    setSelectedDecree(decree);
    setDecreeLoading(true);
    setDecreeResponse("");
    const newStats = { ...stats };
    if (decree.statChanges) Object.entries(decree.statChanges).forEach(([k,v]) => { if(newStats[k]!==undefined) newStats[k]=clamp(newStats[k]+v); });
    setStats(newStats);
    await new Promise(r => setTimeout(r, 600));
    const consequence = getConsequence(decree.id, selectedIdeology, newStats, decreeUsed);
    setDecreeResponse(consequence);
    const newDecrees = [...decreeUsed, decree.id];
    setDecreeUsed(newDecrees);
    try { await db.from("decretos_log").insert({ jugador_id:jugador?.id, decreto_id:decree.id, decreto_nombre:decree.name, consecuencia:consequence }); } catch {}
    await saveProgress(newStats, newDecrees);
    setDecreeLoading(false);
  };

  const formatTime = (s) => {
    const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  };

  const ideo = IDEOLOGIES[selectedIdeology] || IDEOLOGIES.liberalismo;

  // ── LOADING ─────────────────────────────────────────────
  if (screen === "loading") return (
    <div style={{ minHeight:"100vh", background:"#0a0e1a", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, fontFamily:"Georgia,serif" }}>
      <div style={{ fontSize:52 }}>🌍</div>
      <div style={{ color:"#c9a84c", fontSize:13, letterSpacing:3, textTransform:"uppercase" }}>Cargando...</div>
    </div>
  );

  // ── ONBOARDING ──────────────────────────────────────────
  if (screen === "onboarding") return (
    <div style={{ minHeight:"100vh", background:"#0a0e1a", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"Georgia,serif", padding:20, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(201,168,76,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.04) 1px,transparent 1px)", backgroundSize:"40px 40px" }} />
      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:420 }}>
        {step === 0 && (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:64, marginBottom:16 }}>🌍</div>
            <div style={{ fontSize:11, color:"#c9a84c", letterSpacing:4, textTransform:"uppercase", marginBottom:8 }}>Bienvenido al</div>
            <h1 style={{ fontSize:30, color:"#e8e8e8", letterSpacing:3, margin:"0 0 4px", textTransform:"uppercase", fontWeight:"normal" }}>NACIONES</h1>
            <h1 style={{ fontSize:30, color:"#c9a84c", letterSpacing:3, margin:"0 0 24px", textTransform:"uppercase" }}>EN GUERRA</h1>
            <p style={{ color:"#6a6a8a", fontSize:13, lineHeight:1.8, marginBottom:32 }}>195 naciones compiten por el poder global.<br/>Solo una alcanzará la hegemonía.</p>
            <button onClick={() => setStep(1)} style={{ background:"linear-gradient(135deg,#c9a84c,#a07830)", border:"none", color:"#0a0e1a", padding:"16px", borderRadius:6, fontSize:14, letterSpacing:3, textTransform:"uppercase", cursor:"pointer", fontWeight:"bold", width:"100%", boxShadow:"0 4px 20px rgba(201,168,76,0.3)" }}>TOMAR EL PODER</button>
          </div>
        )}
        {step === 1 && (
          <div>
            <div style={{ fontSize:32, textAlign:"center", marginBottom:12 }}>🗺️</div>
            <h2 style={{ color:"#c9a84c", letterSpacing:2, marginBottom:6, textTransform:"uppercase", fontSize:15, textAlign:"center" }}>Elige tu Nación</h2>
            <p style={{ color:"#6a6a8a", fontSize:12, marginBottom:14, textAlign:"center" }}>Serás su Presidente. Para bien o para mal.</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7, marginBottom:18, maxHeight:260, overflowY:"auto" }}>
              {COUNTRIES.map(c => <button key={c} onClick={() => setSelectedCountry(c)} style={{ background:selectedCountry===c?"rgba(201,168,76,0.2)":"rgba(255,255,255,0.04)", border:`1px solid ${selectedCountry===c?"#c9a84c":"rgba(255,255,255,0.08)"}`, color:selectedCountry===c?"#c9a84c":"#777", padding:"9px 4px", borderRadius:4, fontSize:10, cursor:"pointer", transition:"all 0.2s" }}>{c}</button>)}
            </div>
            <button disabled={!selectedCountry} onClick={() => setStep(2)} style={{ background:selectedCountry?"linear-gradient(135deg,#c9a84c,#a07830)":"#2a2a3a", border:"none", color:selectedCountry?"#0a0e1a":"#444", padding:"14px", borderRadius:6, fontSize:13, letterSpacing:2, textTransform:"uppercase", cursor:selectedCountry?"pointer":"not-allowed", fontWeight:"bold", width:"100%" }}>CONTINUAR →</button>
          </div>
        )}
        {step === 2 && (
          <div>
            <div style={{ fontSize:32, textAlign:"center", marginBottom:12 }}>🏛️</div>
            <h2 style={{ color:"#c9a84c", letterSpacing:2, marginBottom:6, textTransform:"uppercase", fontSize:15, textAlign:"center" }}>Tu Ideología</h2>
            <p style={{ color:"#6a6a8a", fontSize:12, marginBottom:14, textAlign:"center" }}>Define cómo gobernarás. Afecta todos tus decretos.</p>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:18 }}>
              {Object.entries(IDEOLOGIES).map(([key,val]) => <button key={key} onClick={() => setSelectedIdeology(key)} style={{ background:selectedIdeology===key?`${val.color}22`:"rgba(255,255,255,0.03)", border:`1px solid ${selectedIdeology===key?val.color:"rgba(255,255,255,0.07)"}`, color:selectedIdeology===key?val.color:"#777", padding:"12px 16px", borderRadius:6, fontSize:13, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", transition:"all 0.2s" }}><span>{val.icon} {val.label}</span><span style={{ fontSize:11, opacity:0.7 }}>{val.bonus}</span></button>)}
            </div>
            <button disabled={!selectedIdeology} onClick={() => setStep(3)} style={{ background:selectedIdeology?"linear-gradient(135deg,#c9a84c,#a07830)":"#2a2a3a", border:"none", color:selectedIdeology?"#0a0e1a":"#444", padding:"14px", borderRadius:6, fontSize:13, letterSpacing:2, textTransform:"uppercase", cursor:selectedIdeology?"pointer":"not-allowed", fontWeight:"bold", width:"100%" }}>CONTINUAR →</button>
          </div>
        )}
        {step === 3 && (
          <div>
            <div style={{ fontSize:32, textAlign:"center", marginBottom:12 }}>✍️</div>
            <h2 style={{ color:"#c9a84c", letterSpacing:2, marginBottom:6, textTransform:"uppercase", fontSize:15, textAlign:"center" }}>Tu Identidad</h2>
            <p style={{ color:"#6a6a8a", fontSize:12, marginBottom:20, textAlign:"center" }}>El mundo entero sabrá tu nombre.</p>
            <input placeholder="Tu nombre como líder..." value={leaderName} onChange={e => setLeaderName(e.target.value)} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(201,168,76,0.3)", color:"#e8e8e8", padding:"12px 16px", borderRadius:6, fontSize:14, marginBottom:12, boxSizing:"border-box", outline:"none", fontFamily:"Georgia,serif" }} />
            <input placeholder="Nombre de tu partido político..." value={partyName} onChange={e => setPartyName(e.target.value)} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(201,168,76,0.3)", color:"#e8e8e8", padding:"12px 16px", borderRadius:6, fontSize:14, marginBottom:24, boxSizing:"border-box", outline:"none", fontFamily:"Georgia,serif" }} />
            <button disabled={!leaderName||!partyName||saving} onClick={registerPlayer} style={{ background:leaderName&&partyName?"linear-gradient(135deg,#c9a84c,#a07830)":"#2a2a3a", border:"none", color:leaderName&&partyName?"#0a0e1a":"#444", padding:"16px", borderRadius:6, fontSize:13, letterSpacing:2, textTransform:"uppercase", cursor:leaderName&&partyName?"pointer":"not-allowed", fontWeight:"bold", width:"100%", boxShadow:leaderName&&partyName?"0 4px 20px rgba(201,168,76,0.3)":"none" }}>
              {saving ? "⏳ REGISTRANDO..." : "🌍 ASUMIR EL PODER"}
            </button>
          </div>
        )}
        <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:20 }}>
          {[0,1,2,3].map(i => <div key={i} style={{ width:i===step?20:6, height:6, borderRadius:3, background:i===step?"#c9a84c":"#2a2a3a", transition:"all 0.3s" }} />)}
        </div>
      </div>
    </div>
  );

  // ── GAME — MA-3 Style ───────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#0a0e1a", fontFamily:"Georgia,serif", color:"#e8e8e8", position:"relative" }}>
      <div style={{ position:"fixed", inset:0, backgroundImage:"linear-gradient(rgba(201,168,76,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.025) 1px,transparent 1px)", backgroundSize:"50px 50px", pointerEvents:"none" }} />

      {/* Notification */}
      {notification && (
        <div style={{ position:"fixed", top:12, left:"50%", transform:"translateX(-50%)", background:notification.type==="error"?"rgba(229,57,53,0.15)":"rgba(201,168,76,0.15)", border:`1px solid ${notification.type==="error"?"#e53935":"#c9a84c"}`, color:notification.type==="error"?"#e53935":"#c9a84c", padding:"10px 20px", borderRadius:6, fontSize:13, zIndex:1000, whiteSpace:"nowrap", backdropFilter:"blur(10px)" }}>
          {notification.msg}
        </div>
      )}

      {/* MA-3 Style Header */}
      <div style={{ background:"linear-gradient(180deg,rgba(10,14,26,0.98) 0%,rgba(10,14,26,0.95) 100%)", borderBottom:"1px solid rgba(201,168,76,0.25)", position:"sticky", top:0, zIndex:100, backdropFilter:"blur(20px)" }}>
        {/* Top bar - MA3 style */}
        <div style={{ background:"rgba(0,0,0,0.4)", padding:"6px 12px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:`linear-gradient(135deg,${ideo.color},${ideo.color}88)`, border:`2px solid ${ideo.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>{ideo.icon}</div>
            <div>
              <div style={{ fontSize:12, color:"#e8e8e8", fontWeight:"bold" }}>{leaderName}</div>
              <div style={{ fontSize:10, color:ideo.color }}>{selectedCountry} · {ideo.label}</div>
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:9, color:"#555", letterSpacing:1, textTransform:"uppercase" }}>TICK GLOBAL</div>
            <div style={{ fontSize:14, color:countdown < 300 ? "#e53935" : "#c9a84c", fontFamily:"monospace", fontWeight:"bold" }}>{formatTime(countdown)}</div>
          </div>
        </div>

        {/* Resource bar - MA-3 style */}
        <div style={{ padding:"8px 12px", display:"flex", gap:8, overflowX:"auto" }}>
          {[
            { icon:"💰", val:stats.pib, label:"PIB", color:"#c9a84c" },
            { icon:"⚔️", val:stats.militar, label:"MIL", color:"#e53935" },
            { icon:"👥", val:stats.aprobacion, label:"APR", color:"#e91e63" },
            { icon:"🛢️", val:stats.petroleo, label:"OIL", color:"#ff8f00" },
            { icon:"🌾", val:stats.comida, label:"COM", color:"#4caf50" },
            { icon:"⚡", val:stats.energia, label:"ENE", color:"#03a9f4" },
          ].map((s,i) => <TopStat key={i} icon={s.icon} value={`${s.val}%`} label={s.label} color={s.color} />)}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding:12, paddingBottom:80 }}>

        {/* PANEL */}
        {tab === "panel" && (
          <div>
            {/* Status cards MA-3 style */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              <div style={{ background:"linear-gradient(135deg,rgba(201,168,76,0.1),rgba(201,168,76,0.05))", border:"1px solid rgba(201,168,76,0.25)", borderRadius:8, padding:12 }}>
                <div style={{ fontSize:10, color:"#c9a84c", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>ECONOMÍA</div>
                <div style={{ fontSize:28, color:"#c9a84c", fontFamily:"monospace", fontWeight:"bold" }}>{stats.pib}%</div>
                <div style={{ fontSize:11, color:stats.pib>50?"#4caf50":"#e53935" }}>{stats.pib>50?"▲ Estable":"▼ En riesgo"}</div>
              </div>
              <div style={{ background:"linear-gradient(135deg,rgba(233,30,99,0.1),rgba(233,30,99,0.05))", border:"1px solid rgba(233,30,99,0.25)", borderRadius:8, padding:12 }}>
                <div style={{ fontSize:10, color:"#e91e63", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>APROBACIÓN</div>
                <div style={{ fontSize:28, color:"#e91e63", fontFamily:"monospace", fontWeight:"bold" }}>{stats.aprobacion}%</div>
                <div style={{ fontSize:11, color:stats.aprobacion>50?"#4caf50":"#e53935" }}>{stats.aprobacion>50?"▲ Popular":"▼ Impopular"}</div>
              </div>
            </div>

            {/* Alerts */}
            {stats.rebeldia > 60 && <div style={{ background:"rgba(229,57,53,0.08)", border:"1px solid rgba(229,57,53,0.3)", borderRadius:8, padding:"10px 14px", marginBottom:10, display:"flex", gap:10, alignItems:"center" }}><span style={{ fontSize:20 }}>⚠️</span><div><div style={{ fontSize:12, color:"#e53935", fontWeight:"bold" }}>Alta Rebeldía — {stats.rebeldia}%</div><div style={{ fontSize:11, color:"#888", marginTop:2 }}>La inestabilidad social amenaza tu gobierno.</div></div></div>}
            {stats.aprobacion < 30 && <div style={{ background:"rgba(229,57,53,0.08)", border:"1px solid rgba(229,57,53,0.3)", borderRadius:8, padding:"10px 14px", marginBottom:10, display:"flex", gap:10, alignItems:"center" }}><span style={{ fontSize:20 }}>🗳️</span><div><div style={{ fontSize:12, color:"#e53935", fontWeight:"bold" }}>Aprobación Crítica — {stats.aprobacion}%</div><div style={{ fontSize:11, color:"#888", marginTop:2 }}>Riesgo de elecciones anticipadas.</div></div></div>}

            {/* Stats */}
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:14, marginBottom:10 }}>
              <div style={{ fontSize:10, color:"#6a6a8a", letterSpacing:1, marginBottom:12, textTransform:"uppercase", display:"flex", alignItems:"center", gap:6 }}>📊 Indicadores Nacionales</div>
              <ResourceBar icon="💰" label="PIB Nacional" value={stats.pib} color="#c9a84c" />
              <ResourceBar icon="🛢️" label="Petróleo" value={stats.petroleo} color="#ff8f00" />
              <ResourceBar icon="🌾" label="Comida" value={stats.comida} color="#4caf50" />
              <ResourceBar icon="⚡" label="Energía" value={stats.energia} color="#03a9f4" />
              <ResourceBar icon="🏭" label="Industria" value={stats.industria} color="#9c27b0" />
              <ResourceBar icon="👥" label="Aprobación" value={stats.aprobacion} color="#e91e63" />
              <ResourceBar icon="🎓" label="Educación" value={stats.educacion} color="#3f51b5" />
              <ResourceBar icon="🏥" label="Salud" value={stats.salud} color="#00bcd4" />
              <ResourceBar icon="😤" label="Rebeldía" value={stats.rebeldia} color="#e53935" />
              <ResourceBar icon="⚔️" label="Ejército" value={stats.militar} color="#f44336" />
              <ResourceBar icon="🕵️" label="Inteligencia" value={stats.intel} color="#795548" />
            </div>

            {/* Saving indicator */}
            {saving && <div style={{ textAlign:"center", color:"#555", fontSize:11, marginTop:8 }}>💾 Sincronizando con servidor...</div>}
          </div>
        )}

        {/* DECRETOS */}
        {tab === "decretos" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize:11, color:"#c9a84c", letterSpacing:2, textTransform:"uppercase" }}>📜 Decretos Presidenciales</div>
              <div style={{ background:decreeUsed.length>=3?"rgba(229,57,53,0.15)":"rgba(201,168,76,0.1)", border:`1px solid ${decreeUsed.length>=3?"rgba(229,57,53,0.5)":"rgba(201,168,76,0.4)"}`, color:decreeUsed.length>=3?"#e53935":"#c9a84c", padding:"4px 14px", borderRadius:20, fontSize:12, fontFamily:"monospace" }}>
                {3-decreeUsed.length}/3 hoy
              </div>
            </div>

            {selectedDecree && (
              <div style={{ background:"linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.04))", border:"1px solid rgba(201,168,76,0.3)", borderRadius:8, padding:16, marginBottom:14 }}>
                <div style={{ fontSize:13, color:"#c9a84c", marginBottom:10, fontWeight:"bold", display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:20 }}>{selectedDecree.icon}</span>
                  {selectedDecree.name} — Consecuencias
                </div>
                {decreeLoading
                  ? <div style={{ color:"#6a6a8a", fontSize:13, display:"flex", alignItems:"center", gap:8 }}><span>⏳</span> Evaluando impacto internacional...</div>
                  : <div style={{ color:"#d0d0d0", fontSize:13, lineHeight:1.9 }}>{decreeResponse}</div>
                }
              </div>
            )}

            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {DECREES.map(d => {
                const used = decreeUsed.includes(d.id);
                const exhausted = decreeUsed.length >= 3 && !used;
                return (
                  <button key={d.id} onClick={() => issueDecree(d)} disabled={used||exhausted} style={{ background:used?"rgba(255,255,255,0.02)":selectedDecree?.id===d.id?"rgba(201,168,76,0.08)":"rgba(255,255,255,0.04)", border:`1px solid ${used?"rgba(255,255,255,0.05)":selectedDecree?.id===d.id?"rgba(201,168,76,0.4)":"rgba(201,168,76,0.15)"}`, borderRadius:8, padding:"14px 16px", textAlign:"left", cursor:used||exhausted?"not-allowed":"pointer", opacity:used||exhausted?0.35:1, transition:"all 0.2s", fontFamily:"Georgia,serif" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div style={{ display:"flex", gap:12 }}>
                        <span style={{ fontSize:24 }}>{d.icon}</span>
                        <div>
                          <div style={{ fontSize:14, color:used?"#555":"#e8e8e8", marginBottom:4, fontWeight:"bold" }}>{d.name}</div>
                          <div style={{ fontSize:12, color:"#666", marginBottom:6 }}>{d.desc}</div>
                          <div style={{ fontSize:11, color:"#c9a84c", fontFamily:"monospace" }}>{d.effect}</div>
                        </div>
                      </div>
                      {used && <span style={{ fontSize:10, color:"#4caf50", border:"1px solid #4caf5044", padding:"3px 10px", borderRadius:10, flexShrink:0 }}>✓ EMITIDO</span>}
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
            <div style={{ fontSize:11, color:"#c9a84c", letterSpacing:2, textTransform:"uppercase", marginBottom:14 }}>🤝 Diplomacia Internacional</div>

            {!allianceAccepted ? (
              <div style={{ background:"rgba(76,175,80,0.06)", border:"1px solid rgba(76,175,80,0.3)", borderRadius:8, padding:14, marginBottom:14 }}>
                <div style={{ fontSize:12, color:"#4caf50", marginBottom:8, fontWeight:"bold", display:"flex", alignItems:"center", gap:6 }}>📩 Propuesta Pendiente</div>
                <div style={{ fontSize:13, color:"#bbb", marginBottom:12, lineHeight:1.7 }}><strong style={{ color:"#fff" }}>Brasil</strong> solicita un Pacto de No Agresión (30 días). A cambio: <span style={{ color:"#4caf50" }}>+15% comercio, +5% PIB</span></div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => { tg?.HapticFeedback?.notificationOccurred("success"); setAllianceAccepted(true); setStats(s=>({...s,pib:clamp(s.pib+5),aprobacion:clamp(s.aprobacion+3)})); showNotif("✅ Alianza con Brasil confirmada","info"); }} style={{ flex:1, background:"rgba(76,175,80,0.2)", border:"1px solid #4caf50", color:"#4caf50", padding:"11px", borderRadius:6, fontSize:12, cursor:"pointer", fontFamily:"Georgia,serif", fontWeight:"bold" }}>✅ ACEPTAR</button>
                  <button onClick={() => { tg?.HapticFeedback?.notificationOccurred("error"); setStats(s=>({...s,aprobacion:clamp(s.aprobacion-2)})); showNotif("❌ Propuesta rechazada","error"); }} style={{ flex:1, background:"rgba(229,57,53,0.1)", border:"1px solid #e53935", color:"#e53935", padding:"11px", borderRadius:6, fontSize:12, cursor:"pointer", fontFamily:"Georgia,serif" }}>❌ RECHAZAR</button>
                </div>
              </div>
            ) : (
              <div style={{ background:"rgba(76,175,80,0.06)", border:"1px solid rgba(76,175,80,0.3)", borderRadius:8, padding:14, marginBottom:14, display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:28 }}>🤝</span>
                <div><div style={{ fontSize:13, color:"#4caf50", fontWeight:"bold" }}>Alianza con Brasil activa</div><div style={{ fontSize:11, color:"#666" }}>30 días restantes · +5% PIB</div></div>
              </div>
            )}

            <div style={{ fontSize:11, color:"#6a6a8a", letterSpacing:1, marginBottom:10, textTransform:"uppercase" }}>Presidentes Registrados ({otrosJugadores.length})</div>
            {otrosJugadores.filter(j=>j.id!==jugador?.id).slice(0,8).map((j,i) => {
              const jideo = IDEOLOGIES[j.ideologia] || IDEOLOGIES.liberalismo;
              return (
                <div key={i} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:"12px 14px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <div style={{ width:34, height:34, borderRadius:"50%", background:`${jideo.color}22`, border:`1px solid ${jideo.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{jideo.icon}</div>
                    <div>
                      <div style={{ fontSize:13, color:"#e8e8e8", fontWeight:"bold" }}>{j.nombre}</div>
                      <div style={{ fontSize:11, color:"#666" }}>{j.pais} · {jideo.label}</div>
                    </div>
                  </div>
                  <button onClick={() => { tg?.HapticFeedback?.impactOccurred("light"); showNotif(`✉ Propuesta enviada a ${j.nombre}`,"info"); }} style={{ background:"transparent", border:`1px solid ${jideo.color}44`, color:jideo.color, padding:"6px 12px", borderRadius:6, fontSize:11, cursor:"pointer", fontFamily:"Georgia,serif" }}>CONTACTAR</button>
                </div>
              );
            })}
            {otrosJugadores.filter(j=>j.id!==jugador?.id).length===0 && <div style={{ color:"#555", fontSize:13, textAlign:"center", padding:24 }}>Aún no hay otros presidentes.<br/>Invita amigos a unirse.</div>}

            <div style={{ fontSize:11, color:"#6a6a8a", letterSpacing:1, marginBottom:10, marginTop:16, textTransform:"uppercase" }}>Acciones</div>
            {[["🤝","Proponer Alianza","Invitar a otro país a aliarse",()=>showNotif("🤝 Selecciona un presidente","info")],["📦","Embargo Económico","Bloquear comercio con un rival",()=>{setStats(s=>({...s,pib:clamp(s.pib-3)}));showNotif("📦 Embargo declarado — PIB -3%","error");}],["🕵️","Operación Espionaje","Infiltrar inteligencia rival",()=>{setStats(s=>({...s,intel:clamp(s.intel+10)}));showNotif("🕵️ Operación exitosa +10 Intel","info");}],["📢","Discurso en ONU","Influir en opinión global",()=>{setStats(s=>({...s,aprobacion:clamp(s.aprobacion+5)}));showNotif("📢 Discurso aplaudido +5 Aprobación","info");}]].map(([icon,name,desc,action],i) => (
              <button key={i} onClick={()=>{tg?.HapticFeedback?.impactOccurred("medium");action();}} style={{ width:"100%", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, padding:"13px 14px", marginBottom:8, textAlign:"left", cursor:"pointer", display:"flex", gap:12, alignItems:"center", fontFamily:"Georgia,serif" }}>
                <div style={{ width:38, height:38, borderRadius:8, background:"rgba(201,168,76,0.1)", border:"1px solid rgba(201,168,76,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{icon}</div>
                <div><div style={{ fontSize:13, color:"#ddd", fontWeight:"bold" }}>{name}</div><div style={{ fontSize:11, color:"#666", marginTop:2 }}>{desc}</div></div>
                <div style={{ marginLeft:"auto", color:"#444", fontSize:18 }}>›</div>
              </button>
            ))}
          </div>
        )}

        {/* PARTIDOS */}
        {tab === "partidos" && (
          <div>
            <div style={{ fontSize:11, color:"#c9a84c", letterSpacing:2, textTransform:"uppercase", marginBottom:14 }}>🏛️ Partidos Políticos</div>
            <div style={{ background:`linear-gradient(135deg,${ideo.color}15,${ideo.color}08)`, border:`1px solid ${ideo.color}44`, borderRadius:8, padding:16, marginBottom:20 }}>
              <div style={{ fontSize:10, color:ideo.color, letterSpacing:2, textTransform:"uppercase", marginBottom:10 }}>MI PARTIDO</div>
              <div style={{ fontSize:20, color:"#e8e8e8", marginBottom:4, fontWeight:"bold" }}>{ideo.icon} {partyName}</div>
              <div style={{ fontSize:12, color:ideo.color, marginBottom:14 }}>{ideo.label} · Fundador: {leaderName}</div>
              <div style={{ display:"flex", gap:0, marginBottom:16, background:"rgba(0,0,0,0.2)", borderRadius:8, overflow:"hidden", border:"1px solid rgba(255,255,255,0.06)" }}>
                {[["1","Miembros"],["1","Países"],["#1","Ranking"]].map(([v,l],i) => <div key={l} style={{ flex:1, textAlign:"center", padding:"10px 0", borderRight:i<2?"1px solid rgba(255,255,255,0.06)":"none" }}><div style={{ fontSize:22, color:"#c9a84c", fontFamily:"monospace", fontWeight:"bold" }}>{v}</div><div style={{ fontSize:10, color:"#666", textTransform:"uppercase", letterSpacing:0.5 }}>{l}</div></div>)}
              </div>
              <button onClick={()=>{tg?.HapticFeedback?.impactOccurred("light");showNotif("📤 Link de invitación copiado","info");}} style={{ width:"100%", background:`${ideo.color}22`, border:`1px solid ${ideo.color}55`, color:ideo.color, padding:"11px", borderRadius:6, fontSize:12, cursor:"pointer", fontFamily:"Georgia,serif", letterSpacing:1, fontWeight:"bold" }}>📤 INVITAR MIEMBROS AL PARTIDO</button>
            </div>

            <div style={{ fontSize:11, color:"#6a6a8a", letterSpacing:1, marginBottom:12, textTransform:"uppercase" }}>Otros Presidentes ({otrosJugadores.length})</div>
            {otrosJugadores.filter(j=>j.id!==jugador?.id).map((j,i) => {
              const jideo = IDEOLOGIES[j.ideologia]||IDEOLOGIES.liberalismo;
              return (
                <div key={i} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:14, marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                      <div style={{ width:36, height:36, borderRadius:"50%", background:`${jideo.color}22`, border:`1px solid ${jideo.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{jideo.icon}</div>
                      <div>
                        <div style={{ fontSize:14, color:"#e8e8e8", fontWeight:"bold" }}>{j.nombre}</div>
                        <div style={{ fontSize:11, color:jideo.color }}>{j.pais} · {jideo.label}</div>
                      </div>
                    </div>
                    <button onClick={()=>showNotif(`📨 Invitación enviada a ${j.nombre}`,"info")} style={{ background:"transparent", border:`1px solid ${jideo.color}44`, color:jideo.color, padding:"6px 14px", borderRadius:6, fontSize:11, cursor:"pointer", fontFamily:"Georgia,serif" }}>INVITAR</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* NOTICIAS */}
        {tab === "eventos" && (
          <div>
            <div style={{ fontSize:11, color:"#c9a84c", letterSpacing:2, textTransform:"uppercase", marginBottom:14 }}>📡 Noticias Mundiales</div>
            {[
              {icon:"🌋",title:"Terremoto en Región Norte",desc:"Un sismo 7.2 sacude tu región industrial. Pérdidas estimadas en $2.3B.",time:"hace 2h",urgent:true},
              {icon:"🤝",title:"Propuesta de Alianza — Brasil",desc:"Brasil solicita un pacto de no agresión por 30 días de juego.",time:"hace 4h",urgent:false},
              {icon:"📈",title:"Boom Petrolero Mundial",desc:"Los precios del crudo suben 18%. Tus reservas valen más en el mercado.",time:"hace 6h",urgent:false},
              {icon:"⚠️",title:"Movimiento de Tropas Fronterizo",desc:"Se reporta concentración militar en tu frontera sur. Fuentes no confirmadas.",time:"hace 8h",urgent:true},
              {icon:"💰",title:"Inversores Extranjeros Interesados",desc:"Un fondo soberano ha solicitado información sobre oportunidades de inversión.",time:"hace 10h",urgent:false},
            ].map((ev,i) => (
              <div key={i} style={{ background:ev.urgent?"rgba(229,57,53,0.05)":"rgba(255,255,255,0.02)", border:`1px solid ${ev.urgent?"rgba(229,57,53,0.25)":"rgba(255,255,255,0.06)"}`, borderRadius:8, padding:14, marginBottom:10 }}>
                <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                  <div style={{ width:42, height:42, borderRadius:8, background:ev.urgent?"rgba(229,57,53,0.1)":"rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{ev.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                      <div style={{ fontSize:13, color:ev.urgent?"#e53935":"#e8e8e8", fontWeight:"bold", flex:1 }}>{ev.title}</div>
                      {ev.urgent && <span style={{ fontSize:9, color:"#e53935", border:"1px solid #e5393544", padding:"2px 8px", borderRadius:10, marginLeft:8, flexShrink:0, background:"rgba(229,57,53,0.1)" }}>URGENTE</span>}
                    </div>
                    <div style={{ fontSize:12, color:"#888", lineHeight:1.7 }}>{ev.desc}</div>
                    <div style={{ fontSize:10, color:"#444", marginTop:8 }}>{ev.time}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MA-3 Style Bottom Nav */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(10,14,26,0.97)", borderTop:"1px solid rgba(201,168,76,0.2)", display:"flex", backdropFilter:"blur(20px)", paddingBottom:"env(safe-area-inset-bottom)" }}>
        {[["panel","📊","Panel"],["decretos","📜","Decretos"],["diplomacia","🤝","Diplo"],["partidos","🏛️","Partidos"],["eventos","📡","Noticias"]].map(([id,icon,label]) => (
          <button key={id} onClick={()=>{tg?.HapticFeedback?.selectionChanged();setTab(id);}} style={{ flex:1, background:"transparent", border:"none", padding:"10px 4px 12px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, position:"relative" }}>
            {tab===id && <div style={{ position:"absolute", top:0, left:"20%", right:"20%", height:2, background:"linear-gradient(90deg,transparent,#c9a84c,transparent)", borderRadius:1 }} />}
            <span style={{ fontSize:20 }}>{icon}</span>
            <span style={{ fontSize:9, color:tab===id?"#c9a84c":"#444", letterSpacing:0.5, textTransform:"uppercase" }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
