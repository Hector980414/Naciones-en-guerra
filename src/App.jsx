import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wdbupgqymgqfpobcbfze.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYnVwZ3F5bWdxZnBvYmNiZnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NjM0NjAsImV4cCI6MjA4OTUzOTQ2MH0.Psq7trqKDSNltKK8bqaLdXgg56FSjK6sfM4EH4TRnBo";
const db = createClient(SUPABASE_URL, SUPABASE_KEY);
const tg = window.Telegram?.WebApp;

// ── Ideologías estilo Rival Regions ──────────────────────
const IDEOLOGIES = {
  comunismo:    { icon: "☭", label: "Comunismo",    color: "#e53935", bonus: "+Salud +Educación -PIB privado" },
  democracia:   { icon: "🗳️", label: "Democracia",   color: "#1e88e5", bonus: "+Aprobación +Comercio" },
  fascismo:     { icon: "⚡", label: "Fascismo",     color: "#757575", bonus: "+Militar +Control -Libertades" },
  ecologismo:   { icon: "🌿", label: "Ecologismo",   color: "#43a047", bonus: "+Recursos -Industria" },
  monarquia:    { icon: "👑", label: "Monarquía",    color: "#f9a825", bonus: "+Estabilidad +Tradición" },
  anarquia:     { icon: "Ⓐ",  label: "Anarquía",    color: "#9c27b0", bonus: "Sin gobierno central, máxima libertad" },
  teocracia:    { icon: "✝️", label: "Teocracia",    color: "#795548", bonus: "+Aprobación religiosa +Control social" },
  capitalismo:  { icon: "💲", label: "Capitalismo",  color: "#00bcd4", bonus: "+PIB +Industria -Igualdad" },
};

const COUNTRIES = ["Afganistán","Albania","Alemania","Andorra","Angola","Antigua y Barbuda","Arabia Saudita","Argelia","Argentina","Armenia","Australia","Austria","Azerbaiyán","Bahamas","Bangladés","Barbados","Baréin","Bélgica","Belice","Benín","Bielorrusia","Bolivia","Bosnia y Herzegovina","Botsuana","Brasil","Brunéi","Bulgaria","Burkina Faso","Burundi","Bután","Cabo Verde","Camboya","Camerún","Canadá","Catar","Chad","Chile","China","Chipre","Colombia","Comoras","Congo","Corea del Norte","Corea del Sur","Costa de Marfil","Costa Rica","Croacia","Cuba","Dinamarca","Dominica","Ecuador","Egipto","El Salvador","Emiratos Árabes Unidos","Eritrea","Eslovaquia","Eslovenia","España","Estados Unidos","Estonia","Etiopía","Filipinas","Finlandia","Fiyi","Francia","Gabón","Gambia","Georgia","Ghana","Granada","Grecia","Guatemala","Guinea","Guinea-Bisáu","Guinea Ecuatorial","Guyana","Haití","Honduras","Hungría","India","Indonesia","Irak","Irán","Irlanda","Islandia","Islas Marshall","Islas Salomón","Israel","Italia","Jamaica","Japón","Jordania","Kazajistán","Kenia","Kirguistán","Kiribati","Kuwait","Laos","Lesoto","Letonia","Líbano","Liberia","Libia","Liechtenstein","Lituania","Luxemburgo","Madagascar","Malasia","Malaui","Maldivas","Malí","Malta","Marruecos","Mauricio","Mauritania","México","Micronesia","Moldavia","Mónaco","Mongolia","Montenegro","Mozambique","Namibia","Nauru","Nepal","Nicaragua","Níger","Nigeria","Noruega","Nueva Zelanda","Omán","Países Bajos","Pakistán","Palaos","Panamá","Papúa Nueva Guinea","Paraguay","Perú","Polonia","Portugal","Reino Unido","República Centroafricana","República Checa","República del Congo","República Dominicana","República Sudafricana","Ruanda","Rumania","Rusia","Samoa","San Cristóbal y Nieves","San Marino","San Vicente y las Granadinas","Santa Lucía","Santo Tomé y Príncipe","Senegal","Serbia","Seychelles","Sierra Leona","Singapur","Siria","Somalia","Sri Lanka","Suazilandia","Sudán","Sudán del Sur","Suecia","Suiza","Surinam","Tailandia","Tanzania","Tayikistán","Timor Oriental","Togo","Tonga","Trinidad y Tobago","Túnez","Turkmenistán","Turquía","Tuvalu","Ucrania","Uganda","Uruguay","Uzbekistán","Vanuatu","Venezuela","Vietnam","Yemen","Yibuti","Zambia","Zimbabue","USA"];

const DECREES = [
  { id:1, name:"Reforma Fiscal",     icon:"💰", desc:"Aumentar impuestos corporativos",  effect:"+PIB 3%, -Apr 5%",   statChanges:{pib:3,aprobacion:-5} },
  { id:2, name:"Reclutamiento",      icon:"⚔️", desc:"Ampliar el ejército nacional",     effect:"+Mil 8%, -PIB 4%",   statChanges:{militar:8,pib:-4} },
  { id:3, name:"Plan Social",        icon:"🏥", desc:"Subsidiar salud y educación",       effect:"+Apr 10%, -PIB 6%",  statChanges:{aprobacion:10,salud:5,pib:-6} },
  { id:4, name:"Industrialización",  icon:"🏭", desc:"Inversión en industria pesada",     effect:"+Ind 7%, -PIB 4%",   statChanges:{industria:7,pib:-4} },
  { id:5, name:"Apertura Comercial", icon:"🚢", desc:"Reducir aranceles de importación", effect:"+PIB 9%, -Ind 4%",   statChanges:{pib:9,industria:-4} },
  { id:6, name:"Operación Espía",    icon:"🕵️", desc:"Infiltrar inteligencia enemiga",   effect:"+Intel 15%",         statChanges:{intel:15} },
];

// ── Motor de consecuencias ────────────────────────────────
const CONS = {
  reforma_fiscal: {
    comunismo:   { alta_rebeldia:["La reforma redistributiva llega en el peor momento. Los manifestantes queman neumáticos frente al palacio. Estado de emergencia inminente.","Grupos financiados desde el exterior sabotean la implementación. Tres funcionarios arrestados por corrupción.","Un general te llama: 'Presidente, la situación es insostenible'. Tienes 24 horas para reaccionar."], alto_pib:["La reforma redistributiva genera protestas en los barrios ricos pero las clases populares celebran. El FMI advierte.","Los empresarios amenazan con fuga de capitales. Tu ministro de economía dimite. Tu aprobación sube 12 puntos.","Venezuela y Cuba felicitan la medida. Los mercados reaccionan con cautela internacional."], bajo_pib:["Con la economía en crisis, subir impuestos provoca una huelga general. Tres regiones amenazan con autonomía.","El pueblo entiende el sacrificio. China ofrece un préstamo de emergencia con condiciones.","El congreso aprueba por un solo voto. Tus aliados más cercanos dudan de la estrategia."] },
    democracia:  { alta_rebeldia:["La población no cree en reformas. Un video tuyo es viral por las razones equivocadas. Crisis de imagen.","Tres gobernadores se niegan a implementar la medida. El país se fragmenta políticamente.","Un escándalo de corrupción sale hoy. La reforma queda opacada. La prensa pide tu renuncia."], alto_pib:["El mercado reacciona: la bolsa sube 3%. Tu base moderada apoya la medida con cautela.","Los inversores extranjeros aplauden. Dos multinacionales anuncian nuevas plantas. Popularidad en máximos.","The Economist publica editorial positivo. Tu canciller recibe llamadas de aliados estratégicos."], bajo_pib:["Con el PIB en caída, la reforma es un salvavidas polémico. La oposición exige elecciones anticipadas.","Los mercados castigan la medida: la moneda cae 4%. El banco central interviene de emergencia.","Tu partido interno se divide. La coalición de gobierno tambalea."] },
    fascismo:    { alta_rebeldia:["Declaras estado de excepción. Las calles están militarizadas. El mundo observa con alarma.","Un intento de golpe es abortado. Cinco generales arrestados. Tu posición se consolida.","La crisis se internacionaliza. La ONU convoca reunión de emergencia urgente."], alto_pib:["El decreto se implementa sin debate. La oposición no puede frenarlo. Tu control crece.","Los medios oficiales celebran. Dos periodistas independientes son 'invitados a conversar'.","El ejército apoya públicamente. Los países vecinos observan con preocupación creciente."], bajo_pib:["Cualquier impuesto genera resentimiento. Aumentas el presupuesto de seguridad preventivamente.","Implementas con mano dura. La resistencia es silenciada. El descontento crece en silencio.","Tres líderes opositores detenidos. La comunidad internacional condena. Sanciones posibles."] },
    capitalismo: { alta_rebeldia:["Los mercados no perdonan la inestabilidad. El riesgo país sube 5 puntos de golpe.","Inversores huyen del país. El dólar sube 8%. Tu ministro de hacienda trabaja sin dormir.","Wall Street rebaja tu calificación crediticia. Financiamiento externo bloqueado."], alto_pib:["Los mercados celebran: bolsa sube 4%. Récord histórico de inversión extranjera directa.","Tres fondos de inversión globales anuncian entrada al mercado. Boom económico en ciernes.","Forbes menciona tu país como 'mercado emergente del año'. Orgullo nacional en alza."], bajo_pib:["La crisis hace difícil cualquier reforma. Los mercados necesitan señales claras de estabilidad.","El FMI ofrece un préstamo condicionado. Las condiciones son políticamente complicadas.","Tu vicepresidente filtra su desacuerdo. La coalición empresarial presiona por cambios."] },
    ecologismo:  { alto_pib:["La reforma incluye incentivos verdes. Inversores ESG internacionales miran tu país.","Tu reforma es pionera. La prensa te llama 'el presidente verde del siglo XXI'.","Silicon Valley verde aplaude. Tres fondos sostenibles anuncian entrada al mercado."], bajo_pib:["La crisis hace imposible pensar en verde. Tus aliados ecologistas te presionan duramente.","Priorizas empresas sostenibles para contratos. El sector tradicional protesta con fuerza.","La medida llega en mal momento pero es necesaria para el futuro del planeta."], alta_rebeldia:["El caos social hace imposible cualquier reforma sostenible. Los ecologistas marchan con los descontentos.","Usas la crisis para justificar medidas verdes de emergencia. La oposición lo llama dictadura ambiental.","Tres regiones rechazan la reforma. Tensión histórica entre capital y provincias."] },
    monarquia:   { alto_pib:["La reforma es presentada como decreto real. La tradición y el poder se fusionan en una decisión histórica.","Los nobles apoyan la medida. El pueblo la acepta con respeto a la institución monárquica.","Los medios internacionales se sorprenden: 'la monarquía más innovadora del siglo'."], bajo_pib:["La economía débil erosiona la legitimidad monárquica. El pueblo cuestiona el sistema.","Implementas con autoridad real. Los que dudan recuerdan que la corona tiene poder absoluto.","Nobles conservadores se oponen. Tensión dentro de la corte. Consejo de estado convocado."], alta_rebeldia:["La rebelión contra la corona alcanza niveles históricos. El trono tambalea peligrosamente.","Movilizas la guardia real. Los rebeldes son reprimidos. La historia no olvidará este día.","Sectores del ejército expresan 'preocupación' discretamente. ¿Lealtad o traición?"] },
    anarquia:    { alto_pib:["Sin Estado que intervenga, los mercados fluyen libremente. Caos productivo o productivo caos.","Las comunidades autogestionadas celebran. Los capitalistas no saben si alegrarse o preocuparse.","El experimento anarquista atrae titulares mundiales. ¿Utopía o desastre inminente?"], bajo_pib:["La ausencia de control estatal acelera la caída económica. ¿Orden espontáneo o colapso?","Sin recaudación central, los servicios públicos colapsan. Las comunidades improvisan.","El mundo observa el experimento con mezcla de fascinación y horror."], alta_rebeldia:["En un Estado anarquista, la rebelión es redundante. ¿Contra quién se rebela el pueblo?","Los grupos de poder local llenan el vacío estatal. Feudalismo del siglo XXI emergiendo.","La situación es caótica pero auténtica. Al menos nadie puede culpar al gobierno."] },
    teocracia:   { alto_pib:["La reforma es bendecida por la autoridad religiosa. El pueblo la acepta como mandato divino.","Los líderes religiosos apoyan desde los púlpitos. La recaudación llega con fervor espiritual.","Países con misma fe felicitan la medida. Lazos religiosos-económicos se fortalecen."], bajo_pib:["La crisis económica es interpretada como prueba divina. El pueblo sufre con fe.","Implementas la reforma como deber sagrado. Quienes se oponen desafían a la autoridad religiosa.","La comunidad internacional critica la mezcla de religión y economía. Tú ignoras las críticas."], alta_rebeldia:["Grupos seculares aprovechan la crisis para atacar el sistema teocrático. Guerra ideológica.","Declaras que la rebelión es herejía. Los líderes religiosos predican calma desde los templos.","Tensión entre facciones religiosas internas. La unidad del Estado teocrático en riesgo."] },
  },
  reclutamiento: {
    comunismo:   { alto_militar:["Con ejército poderoso, el reclutamiento es visto como provocación. Colombia rompe relaciones.","Adoctrinamiento ideológico en las tropas. Moral alta pero el gasto preocupa a tus aliados.","Venezuela y Cuba felicitan. USA emite 'profunda preocupación'. Tu posición se endurece."], bajo_militar:["El ejército estaba en estado crítico. El reclutamiento masivo restaura la confianza nacional.","Tropas jóvenes e inexpertas. Un incidente fronterizo pondrá a prueba su entrenamiento.","La inversión militar genera debate: ¿por qué no salud? Tus asesores amenazan con renunciar."] },
    democracia:  { alto_militar:["El complejo industrial-militar celebra. Tres empresas de defensa suben en bolsa.","La OTAN valora el refuerzo positivamente. Nuevos ejercicios conjuntos se planifican.","Think tank conservador: 'el ejército más profesional de la región'. Orgullo nacional."], bajo_militar:["Brecha de liderazgo en las fuerzas armadas. Tres generales compiten por el ascenso.","Los mercados lo ven como señal de inestabilidad. Riesgo país sube dos puntos.","Empresa privada ofrece complementar el reclutamiento. Tentador pero polémico."] },
    fascismo:    { alto_militar:["El ejército ya es temido. Más tropas envían mensaje inequívoco: no habrá debilidad.","Desfile militar en cadena nacional. Cuatro países vecinos refuerzan sus fronteras.","Tensión regional en niveles de Guerra Fría. Tu embajador en la ONU sin dormir."], bajo_militar:["Reclutas con urgencia. Soldados leales pero crudos. Un incidente podría descontrolarse.","El partido presiona militarizar más rápido. Los derechos humanos, en segundo plano.","Prisa en el reclutamiento genera problemas de disciplina. Tres incidentes en una semana."] },
    capitalismo: { alto_militar:["Contratos de defensa millonarios firmados. El sector privado celebra. Empleo en alza.","Empresas de seguridad privada complementan el ejército estatal. Nuevo modelo híbrido.","Exportaciones de armamento aumentan. Tu país se convierte en proveedor regional."], bajo_militar:["El mercado ve el ejército débil como riesgo de inversión. Seguros de riesgo político suben.","Inversores extranjeros piden garantías de seguridad. El ejército es un activo económico.","Empresas privadas ofrecen infraestructura de seguridad. ¿Privatizar la defensa nacional?"] },
    ecologismo:  { alto_militar:["Propones 'ejército verde': soldados que plantan árboles. El mundo te aplaude.","Milicia ambiental patrulla zonas de deforestación. Los madereros ilegales huyen.","ONG ambientales colaboran con el ejército. Alianza inédita estudiada en universidades."], bajo_militar:["Ejército pequeño pero entrenado en defensa ecológica. Una empresa minera aprende la lección.","Priorizas rangers ambientales sobre soldados convencionales. ¿Error estratégico?","Formación ambiental obligatoria en el ejército. Los militares tradicionales lo odian."] },
    monarquia:   { alto_militar:["La guardia real se expande. La corona muestra músculo ante amenazas internas y externas.","Los caballeros de la corona juran lealtad. Ceremonia transmitida en cadena nacional.","Países vecinos reconocen la fuerza monárquica. Respeto ganado con acero y tradición."], bajo_militar:["La debilidad militar amenaza la estabilidad del trono. Reclutamiento como acto de soberanía.","Nobles financian parte del reclutamiento. La corona les debe un favor peligroso.","El ejército jura lealtad a la corona, no al pueblo. Distinción que importará después."] },
    anarquia:    { alto_militar:["Milicias voluntarias se forman espontáneamente. Sin orden central, el caos es la estrategia.","Cada comunidad arma sus propios defensores. Descentralización total del poder militar.","Los países vecinos no saben contra quién declarar guerra. Confusión estratégica total."], bajo_militar:["Sin ejército central, las comunidades son vulnerables. La autodefensa es la única opción.","Grupos armados autónomos emergen. ¿Protectores o señores de la guerra en ciernes?","La ausencia de fuerza militar centralizada atrae miradas codiciosas desde el exterior."] },
    teocracia:   { alto_militar:["El ejército es presentado como guardianes de la fe. La moral religiosa eleva el combate.","Yihad defensiva declarada por las autoridades religiosas. Reclutamiento masivo voluntario.","Países con misma fe envían voluntarios. El ejército crece con fervor espiritual."], bajo_militar:["La fe debe protegerse con espadas. El reclutamiento es presentado como deber sagrado.","Los líderes religiosos predican en los cuarteles. La fe reemplaza al entrenamiento técnico.","El ejército religioso es temido por su fanatismo. La razón estratégica, cuestionable."] },
  },
  plan_social: {
    comunismo:   { alta_aprobacion:["Éxito rotundo. Cuba y Corea del Norte piden asesoría. Tu imagen internacional mejora notablemente.","Las madres de familia salen a aplaudirte. Un documental te llama 'el presidente del pueblo'.","Indicadores de salud mejoran en tiempo récord. La OMS felicita al gobierno. Premio internacional."], baja_aprobacion:["El plan llega cuando nadie confía. La prensa lo llama 'populismo desesperado de último momento'.","Fondos insuficientes. Filas interminables. Un video viral muestra el caos en la distribución.","La oposición acusa corrupción en la licitación. Investigación parlamentaria inevitable."] },
    democracia:  { alta_aprobacion:["Los mercados lo ven como inversión en capital humano. Rating crediticio sube un escalón.","La productividad laboral sube 8% en zonas beneficiadas. Los números hablan más que la ideología.","El Banco Mundial publica informe positivo. Delegaciones de 5 países estudian tu modelo."], baja_aprobacion:["Con poca credibilidad, el plan es visto como limosna electoral. Cinismo ciudadano en alza.","Tu partido te presiona: 'esto no es lo que prometimos en campaña'. Facción amenaza ruptura.","El plan cuesta más de lo presupuestado. Tu ministro de hacienda presenta la renuncia formal."] },
    fascismo:    { alta_aprobacion:["El plan social del Estado fuerte silencia a los críticos. Eficiencia sin democracia.","Los beneficiarios son registrados como 'ciudadanos leales al régimen'. Base de datos política.","La medida es aplaudida en encuesta oficial. Los métodos de la encuesta son cuestionados."], baja_aprobacion:["Muchos rechazan el plan por miedo a las condiciones implícitas. Desconfianza institucional.","Usas los beneficios como control político. Quien protesta pierde el subsidio. Miedo como herramienta.","Un funcionario filtra irregularidades. Desaparece misteriosamente tres días después."] },
    capitalismo: { alta_aprobacion:["El plan social bien ejecutado aumenta la productividad laboral. El mercado lo celebra.","Capital humano = capital económico. Los empresarios entienden finalmente la lógica.","Rating ESG del país mejora. Inversores éticos aumentan posiciones. Victoria ideológica."], baja_aprobacion:["El mercado penaliza el gasto social excesivo. Déficit fiscal en alerta roja.","Tu partido fiscal-conservador te presiona: 'el Estado no puede ser niñera'. Crisis interna.","Los bonos del Estado caen. El costo de financiamiento sube. Presión internacional."] },
    ecologismo:  { alta_aprobacion:["Plan incluye huertos comunitarios y energía solar subsidiada. Nuevo modelo de bienestar verde.","Las comunidades rurales son las más beneficiadas. Turismo sostenible aumenta 30% en un mes.","Tu modelo de 'bienestar verde' presentado en la COP como caso de éxito global histórico."], baja_aprobacion:["El plan es demasiado verde para gente que necesita dinero ahora. 'No puedo comer un árbol'.","Las comunidades quieren empleo industrial, no huertos. Tensión entre valores y necesidades.","El plan llega tarde y recortado. Las promesas ambientales quedan en segundo plano urgente."] },
    monarquia:   { alta_aprobacion:["La corona cuida a sus súbditos. El plan social refuerza la lealtad monárquica tradicional.","El pueblo agradece la generosidad real. 'Dios salve al rey' resuena con renovado fervor.","La imagen de la familia real distribuyendo beneficios se vuelve icónica e histórica."], baja_aprobacion:["El pueblo espera más de la corona. La gratitud real tiene fecha de vencimiento.","Los nobles critican el gasto en el 'pueblo llano'. Tensión dentro de la corte real.","La insatisfacción popular amenaza la estabilidad del trono por primera vez en décadas."] },
    anarquia:    { alta_aprobacion:["Las comunidades autogestionadas distribuyen los recursos sin burocracia estatal. Eficiencia real.","Sin intermediarios estatales, el plan llega directo. La horizontalidad funciona esta vez.","Experimento de bienestar descentralizado aplaudido por académicos internacionales."], baja_aprobacion:["Sin coordinación central, el plan es caótico. Algunas comunidades reciben, otras nada.","La desigualdad entre comunidades crece. El anarquismo enfrenta su contradicción más profunda.","La falta de estructura formal sabotea la distribución. El mercado negro florece."] },
    teocracia:   { alta_aprobacion:["El plan social es presentado como mandato divino de cuidar al prójimo. Aceptación total.","Los líderes religiosos distribuyen los beneficios desde los templos. Eficiencia espiritual.","La mezcla de caridad religiosa y política social crea un modelo único en el mundo."], baja_aprobacion:["El pueblo cuestiona por qué Dios permite que el plan fracase. Crisis de fe y política.","Fondos destinados a templos en lugar de beneficiarios directos. Corrupción religiosa expuesta.","Los seculares aprovechan el fracaso para atacar el sistema teocrático desde adentro."] },
  },
  industrializacion: { default: { comunismo:["Fábricas nacionalizadas. Los trabajadores aplauden. Los inversores extranjeros huyen.","Industrialización estatal a marcha forzada. Los números mejoran. Las condiciones laborales, no.","El modelo soviético aplicado. Funcionará en 10 años. El pueblo espera con paciencia forzada."], democracia:["Zonas económicas especiales atraen inversión masiva. Los salarios suben pero las horas también.","Automatización industrial reduce costos y empleos. El sindicato declara huelga general.","Boom industrial en el papel. En la calle, la gente pregunta dónde están los beneficios."], fascismo:["Megaproyectos construidos a marcha forzada. Productividad récord. Derechos laborales, inexistentes.","El Estado controla las industrias estratégicas. Eficiente a corto plazo. Corrupto a largo.","Obreros sin descanso. Los números son buenos. Las condiciones laborales, deplorables."], capitalismo:["Las zonas francas explotan de actividad. Empleo masivo creado. ¿A qué costo social?","IPO histórica de tres empresas industriales. El mercado de valores alcanza récord histórico.","Inversión extranjera directa en máximos de 10 años. El capitalismo industrial funciona aquí."], ecologismo:["Industria verde desde cero. Energías renovables como motor. Costoso al inicio pero transformador.","Prohibes industrias contaminantes. El desempleo sube temporalmente. El planeta respira.","Tu modelo atrae a los mejores ingenieros del mundo. La fuga de cerebros se revierte dramáticamente."], monarquia:["La corona invierte en industrias estratégicas. El patrimonio real crece con el país.","Empresas reales fundadas bajo el escudo de la corona. Capitalismo monárquico en acción.","Los nobles financian proyectos industriales a cambio de concesiones. Pacto histórico."], anarquia:["Cooperativas industriales autogestionadas emergen. Sin patrones, sin jerarquías. ¿Funciona?","La producción descentralizada es ineficiente pero equitativa. Trade-off filosófico en acción.","Empresas sin dueño funcionan bajo consenso colectivo. El mundo observa fascinado."], teocracia:["La industria al servicio de Dios. Las fábricas tienen capillas. Los obreros rezan y producen.","Empresas religiosas controlan sectores clave. La fe y el capital se fusionan.","Trabajadores motivados por deber sagrado. Productividad alta. Sindicalismo, inexistente."] } },
  apertura_comercial: { default: { comunismo:["Abres el comercio con condiciones sociales estrictas. Las multinacionales aceptan a regañadientes.","El libre comercio contradice tu ideología pero la necesitas. Tu base te lo recuerda.","Acuerdos con países del Sur Global. Menos rentables pero más alineados con tus principios."], democracia:["Los aranceles caen. Los supermercados se llenan. La industria local sufre. El consumidor gana.","Nuevo TLC firmado con potencia económica. Acceso a mercados millonarios. Letra pequeña preocupante.","Exportaciones récord este trimestre. La clase media crece por primera vez en años."], fascismo:["Apertura controlada. Solo entra lo que el Estado autoriza. Capitalismo de Estado puro.","Acuerdos usados como herramienta de influencia política. Comercio con condiciones ideológicas.","Abres a aliados y cierras a adversarios. El comercio como extensión de la política exterior."], capitalismo:["Aranceles a cero. El libre mercado en su forma más pura. Los ineficientes desaparecen.","Boom de importaciones y exportaciones. GDP crece 4% en un trimestre. Victoria del mercado.","Nuevos TLC firmados con 5 países simultáneamente. Récord diplomático-comercial."], ecologismo:["Solo aceptas comercio con países que cumplen estándares ambientales. Revolucionario.","Aranceles verdes como nueva herramienta. Contaminadores pagan más. Sostenibles, menos.","El comercio justo y ecológico como bandera. Menos volumen pero coherencia total."], monarquia:["El comercio exterior controlado por casas reales. Monopolios comerciales como en el siglo XVII.","Tratados firmados de rey a rey. Diplomacia comercial con protocolo y pompa medieval.","Los nobles controlan las rutas comerciales. La corona recibe tributo de cada transacción."], anarquia:["Comercio libre de verdad: sin aranceles, sin regulaciones, sin Estado. El mercado es rey.","Intercambio directo entre comunidades. Barter economy resurge junto al comercio moderno.","Las fronteras comerciales desaparecen. Los productos fluyen sin documentos ni permisos."], teocracia:["Solo comercias con naciones que respetan tus valores religiosos. Boicot a los impíos.","El diezmo comercial va al fondo religioso nacional. Fe y comercio fusionados.","Peregrinación comercial: el turismo religioso como motor económico inesperado."] } },
  operacion_espia: { comunismo:["Tus agentes infiltran célula financiada por la CIA. Documentos comprometedores. ¿Los publicas?","Operación exitosa pero un agente es capturado. Negociación diplomática discreta en curso.","Interceptas comunicaciones que revelan plan de golpe financiado desde el exterior. Tienes los nombres.","Tus servicios descubren que un ministro filtra información al enemigo. Traición desde adentro."], democracia:["La operación revela que tu principal competidor recibe fondos ilegales. Oro político. ¿Lo usas?","Infiltras la red de narcotráfico que financia a la oposición. El fiscal pide las pruebas formalmente.","Descubres que una potencia extranjera manipula tus elecciones. Las pruebas son contundentes.","La operación falla y se filtra. Escándalo diplomático mayor. El país espiado convoca embajador."], fascismo:["Espionaje masivo exitoso. Tienes archivos de todos tus opositores. El poder tiene un precio.","Tus agentes van demasiado lejos. Un periodista muere. El mundo pide explicaciones.","Tu red de inteligencia se vuelve autónoma. Tu jefe de espías sabe demasiado. ¿Confías en él?","Interceptas comunicación de líder aliado. Él lo descubre. Tu alianza más importante tambalea."], capitalismo:["Espionaje industrial exitoso. Tecnología rival obtenida. Ventaja competitiva nacional enorme.","Tus agentes infiltran competidores comerciales. Secretos de negocios valen más que secretos militares.","Descubres manipulación de mercados por potencia extranjera. Las pruebas son explosivas.","Operación de contra-espionaje revelan espías industriales en tus empresas estratégicas."], ecologismo:["Infiltras empresas mineras ilegales. Evidencia de destrucción ambiental masiva. Victoria verde.","Tus agentes descubren lobby corporativo que bloquea tus leyes ambientales. Los nombres son poderosos.","La operación revela corrupción dentro de tu propio ministerio de medio ambiente. Escándalo interno.","Espías potencia que quiere tus recursos naturales. Intervención corporativa disfrazada de inversión."], monarquia:["La inteligencia real ha operado en las sombras por siglos. Hoy es un día de cosecha.","Descubres conspiración de nobles para limitar el poder real. Los traidores serán juzgados.","El servicio secreto de la corona infiltra cortes extranjeras. Información vale más que ejércitos.","Un espía doble en el palacio real es descubierto. La traición llegó hasta las alcobas."], anarquia:["En un Estado anarquista, el espionaje es una contradicción filosófica. Pero necesaria.","Grupos de vigilancia comunitaria descubren infiltración estatal extranjera. Reacción furiosa.","Sin agencia central de inteligencia, la información viaja libremente. Ventaja o vulnerabilidad.","El espionaje descentralizado resulta sorprendentemente efectivo. El caos tiene sus métodos."], teocracia:["La inteligencia divina se complementa con inteligencia humana. Dios y espías juntos.","Imanes y sacerdotes como agentes de información. Red de espionaje basada en confianza religiosa.","Descubres herejía política organizada con apoyo extranjero. Amenaza al Estado y a la fe.","El espionaje revela corrupción en las altas esferas religiosas. Crisis de fe institucional."] }
};

function getConsequence(decretoId, ideologia, stats, historialIds) {
  const km={1:"reforma_fiscal",2:"reclutamiento",3:"plan_social",4:"industrializacion",5:"apertura_comercial",6:"operacion_espia"};
  const key=km[decretoId]; if(!key||!CONS[key]) return "Las decisiones presidenciales tienen eco en todo el mundo. El tiempo dirá si fue la correcta.";
  const base=CONS[key]; const byIdeo=base[ideologia]||base.democracia; if(!byIdeo) return "El mundo observa con atención tus decisiones.";
  const used=historialIds.filter(h=>h===decretoId).length;
  if(Array.isArray(byIdeo)) return byIdeo[used%byIdeo.length];
  if(byIdeo.default){const arr=byIdeo.default[ideologia]||byIdeo.default.democracia; if(Array.isArray(arr)) return arr[used%arr.length];}
  let estado="bajo_pib";
  if(key==="reforma_fiscal") estado=stats.rebeldia>55?"alta_rebeldia":stats.pib>60?"alto_pib":"bajo_pib";
  else if(key==="reclutamiento") estado=stats.militar>55?"alto_militar":"bajo_militar";
  else if(key==="plan_social") estado=stats.aprobacion>55?"alta_aprobacion":"baja_aprobacion";
  const opts=byIdeo[estado]||byIdeo[Object.keys(byIdeo)[0]];
  if(!Array.isArray(opts)) return "La presión internacional aumenta. Tu equipo trabaja toda la noche.";
  return opts[used%opts.length];
}

function formatDinero(n){if(!n&&n!==0)return "$0";return "$"+Math.floor(n).toLocaleString("es-ES");}

const clamp=(v,mn=0,mx=100)=>Math.min(mx,Math.max(mn,Math.round(v)));

// ── Reloj del Juego ───────────────────────────────────────
const JUEGO_INICIO = new Date("2026-03-21T00:00:00Z"); // Inicio: hoy 21 marzo 2026
const MESES_JUEGO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function calcularFechaJuego() {
  const msTranscurridos = Date.now() - JUEGO_INICIO.getTime();
  const diasJuego = Math.floor(msTranscurridos / 3600000);
  const msEnHora = msTranscurridos % 3600000;
  const horasJuego = Math.floor(msEnHora / 150000);
  const minsJuego = Math.floor((msEnHora % 150000) / 2500);
  const fechaBase = new Date(JUEGO_INICIO);
  fechaBase.setDate(fechaBase.getDate() + diasJuego);
  const dia = fechaBase.getDate();
  const mes = MESES_JUEGO[fechaBase.getMonth()];
  const anio = fechaBase.getFullYear();
  const hora = String(horasJuego).padStart(2,"0");
  const min = String(minsJuego).padStart(2,"0");
  return { dia, mes, anio, hora, min };
}

function iconoHora(hora) {
  const h = parseInt(hora);
  if (h >= 6 && h < 12) return "🌅";
  if (h >= 12 && h < 18) return "☀️";
  if (h >= 18 && h < 22) return "🌆";
  return "🌙";
}


// ── Sistema de Guerras ────────────────────────────────────
const TIPOS_GUERRA = {
  golpe_estado: {
    icon: "⚔️", label: "Golpe de Estado",
    desc: "Derroca al presidente de tu propio país",
    requiere: { rol: "ciudadano", poder_politico: 10 },
    dificultad: "Media",
    color: "#e53935",
    calcular: (atacante, nacion_atacante, defensor, nacion_defensor) => {
      let prob = 0;
      prob += Math.min(40, (atacante.poder_politico||0) * 0.4);
      prob += Math.min(25, (atacante.apoyo_militar||0) * 0.25);
      const apr = nacion_defensor?.aprobacion || 50;
      prob += apr < 20 ? 25 : apr < 35 ? 15 : apr < 50 ? 8 : -10;
      const mil = nacion_defensor?.militar || 50;
      prob += mil > 70 ? -20 : mil > 50 ? -10 : mil < 30 ? 15 : 0;
      prob += (nacion_defensor?.rebeldia||30) > 60 ? 15 : (nacion_defensor?.rebeldia||30) > 40 ? 8 : 0;
      return Math.min(90, Math.max(5, Math.round(prob)));
    }
  },
  conquista: {
    icon: "🏴", label: "Guerra de Conquista",
    desc: "Ataca otro país para colonizar su territorio",
    requiere: { rol: "presidente", militar: 50 },
    dificultad: "Alta",
    color: "#ff6f00",
    calcular: (atacante, nacion_atacante, defensor, nacion_defensor) => {
      let prob = 0;
      const milAtk = nacion_atacante?.militar || 45;
      const milDef = nacion_defensor?.militar || 45;
      prob += Math.min(50, milAtk * 0.5);
      prob -= Math.min(40, milDef * 0.4);
      prob += (atacante.nivel||1) > (defensor?.nivel||1) ? 10 : -5;
      if (atacante.ideologia === "fascismo") prob += 10;
      if (atacante.ideologia === "autoritarismo") prob += 8;
      prob += Math.random() * 20 - 10;
      return Math.min(85, Math.max(5, Math.round(prob)));
    }
  },
  revolucion: {
    icon: "🔥", label: "Revolución Popular",
    desc: "Cambia la ideología del país con apoyo popular",
    requiere: { rol: "ciudadano", poder_politico: 50, rebeldia_pais: 50 },
    dificultad: "Muy Alta",
    color: "#9c27b0",
    calcular: (atacante, nacion_atacante, defensor, nacion_defensor) => {
      let prob = 0;
      prob += Math.min(30, (atacante.poder_politico||0) * 0.3);
      prob += (nacion_defensor?.rebeldia||30) > 70 ? 30 : (nacion_defensor?.rebeldia||30) > 50 ? 15 : 0;
      prob -= (nacion_defensor?.aprobacion||50) > 60 ? 20 : 0;
      prob -= (nacion_defensor?.militar||45) > 60 ? 15 : 0;
      if (atacante.ideologia === "comunismo" || atacante.ideologia === "anarquia") prob += 10;
      return Math.min(75, Math.max(3, Math.round(prob)));
    }
  },
  liberacion: {
    icon: "🗽", label: "Guerra de Liberación",
    desc: "Libérate de un país colonizador",
    requiere: { colonizado: true, rebeldia_pais: 70 },
    dificultad: "Alta",
    color: "#4caf50",
    calcular: (atacante, nacion_atacante, defensor, nacion_defensor) => {
      let prob = 0;
      prob += (nacion_atacante?.rebeldia||30) > 70 ? 35 : 20;
      prob += (atacante.poder_politico||0) > 30 ? 20 : 10;
      prob -= (nacion_defensor?.militar||45) * 0.3;
      return Math.min(80, Math.max(10, Math.round(prob)));
    }
  },
  economica: {
    icon: "💸", label: "Guerra Económica",
    desc: "Embargo y sabotaje industrial sin combate",
    requiere: { rol: "presidente", pib: 40 },
    dificultad: "Baja",
    color: "#ff9800",
    calcular: (atacante, nacion_atacante, defensor, nacion_defensor) => {
      let prob = 0;
      prob += Math.min(40, (nacion_atacante?.pib||67) * 0.4);
      prob -= Math.min(30, (nacion_defensor?.pib||67) * 0.3);
      prob += (nacion_atacante?.intel||40) > 50 ? 15 : 5;
      if (atacante.ideologia === "capitalismo") prob += 10;
      return Math.min(85, Math.max(10, Math.round(prob)));
    }
  }
};

const RESULTADOS_GUERRA = {
  golpe_estado: {
    exito: "Has tomado el poder. El anterior presidente ha sido exiliado por 3 días.",
    fracaso: "El golpe falló. Las fuerzas leales al presidente te reprimieron. Perdiste poder político.",
  },
  conquista: {
    exito: "¡Victoria! Has conquistado una región del país enemigo. Tu ejército ondeó tu bandera.",
    fracaso: "Tu ejército fue repelido. Sufriste bajas importantes. El enemigo reforzó sus defensas.",
  },
  revolucion: {
    exito: "¡La revolución triunfó! El pueblo tomó el poder. La ideología del país ha cambiado.",
    fracaso: "La revolución fue aplastada. El ejército dispersó a los manifestantes. Perdiste poder.",
  },
  liberacion: {
    exito: "¡Libertad! Tu país se ha liberado del yugo colonizador. Nueva era de soberanía.",
    fracaso: "El colonizador aplastó el movimiento de liberación. La represión aumentó.",
  },
  economica: {
    exito: "El embargo devastó la economía enemiga. Su PIB cayó 15%. Tu industria creció.",
    fracaso: "El sabotaje económico fue detectado y neutralizado. Relaciones diplomáticas rotas.",
  }
};


// ── Sistema XP sin límite de niveles ─────────────────────
function xpParaNivel(nivel) { return Math.round(100 * nivel * nivel); }
function nivelDesdeXP(xp) {
  let n = 1;
  while (xpParaNivel(n + 1) <= xp) n++;
  return n;
}
function tituloNivel(nivel) {
  if (nivel <= 5)  return "Ciudadano Común";
  if (nivel <= 10) return "Activista Político";
  if (nivel <= 20) return "Líder Regional";
  if (nivel <= 35) return "Político Experimentado";
  if (nivel <= 50) return "Estadista Nacional";
  if (nivel <= 75) return "Figura Internacional";
  if (nivel <= 99) return "Leyenda Política";
  return "Inmortal del Poder";
}
function colorNivel(nivel) {
  if (nivel <= 5)  return "#9e9e9e";
  if (nivel <= 10) return "#4caf50";
  if (nivel <= 20) return "#2196f3";
  if (nivel <= 35) return "#9c27b0";
  if (nivel <= 50) return "#ff9800";
  if (nivel <= 75) return "#e53935";
  if (nivel <= 99) return "#c9a84c";
  return "#fff176";
}


// ── Golpe de Estado — Cálculo de probabilidad ─────────────
function calcularProbabilidadGolpe(golpista, nacion_golpista, presidente, nacion_presidente) {
  let prob = 0;
  // Factor poder político del golpista (0-40 puntos)
  prob += Math.min(40, (golpista.poder_politico || 0) * 0.4);
  // Factor apoyo militar del golpista (0-25 puntos)
  prob += Math.min(25, (golpista.apoyo_militar || 0) * 0.25);
  // Factor aprobación del presidente (baja aprobación = más fácil el golpe)
  const apr = nacion_presidente?.aprobacion || 50;
  if (apr < 20) prob += 25;
  else if (apr < 35) prob += 15;
  else if (apr < 50) prob += 8;
  else prob -= 10;
  // Factor militar del presidente (alto militar = más difícil el golpe)
  const mil = nacion_presidente?.militar || 50;
  if (mil > 70) prob -= 20;
  else if (mil > 50) prob -= 10;
  else if (mil < 30) prob += 15;
  // Factor rebeldía del país (alta rebeldía ayuda al golpista)
  const reb = nacion_presidente?.rebeldia || 30;
  if (reb > 60) prob += 15;
  else if (reb > 40) prob += 8;
  return Math.min(95, Math.max(5, Math.round(prob)));
}

// ── Ranking ───────────────────────────────────────────────
function calcularPuntuacion(stats, jugador) {
  return Math.round(
    (stats?.pib || 0) * 0.25 +
    (stats?.militar || 0) * 0.20 +
    (stats?.aprobacion || 0) * 0.20 +
    (stats?.industria || 0) * 0.15 +
    (stats?.educacion || 0) * 0.10 +
    (jugador?.poder_politico || 0) * 0.10
  );
}

// ── SVG Icons militares personalizados ───────────────────
const Icon = ({ type, size=22, color="#c9a84c", glow=false }) => {
  const s = { width:size, height:size, flexShrink:0, filter:glow?`drop-shadow(0 0 6px ${color})`:"none", display:"block" };
  const icons = {
    coin:    <svg style={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill={`${color}22`} stroke={color} strokeWidth="1.5"/><ellipse cx="12" cy="10" rx="6" ry="2.5" fill={`${color}44`}/><text x="12" y="15" textAnchor="middle" fill={color} fontSize="7" fontWeight="bold" fontFamily="Orbitron">$</text></svg>,
    sword:   <svg style={s} viewBox="0 0 24 24" fill="none"><path d="M4 20L20 4M20 4H14M20 4V10" stroke={color} strokeWidth="2" strokeLinecap="round"/><path d="M7 13L5 15L6 17L8 18L10 16L8 14Z" fill={`${color}66`} stroke={color} strokeWidth="1"/></svg>,
    shield:  <svg style={s} viewBox="0 0 24 24" fill="none"><path d="M12 3L4 7V13C4 17 8 20.5 12 21C16 20.5 20 17 20 13V7L12 3Z" fill={`${color}22`} stroke={color} strokeWidth="1.5"/><path d="M9 12L11 14L15 10" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>,
    flag:    <svg style={s} viewBox="0 0 24 24" fill="none"><line x1="5" y1="3" x2="5" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round"/><path d="M5 5H18L14 9L18 13H5" fill={`${color}44`} stroke={color} strokeWidth="1.5"/></svg>,
    oil:     <svg style={s} viewBox="0 0 24 24" fill="none"><rect x="8" y="10" width="8" height="10" rx="2" fill={`${color}33`} stroke={color} strokeWidth="1.5"/><path d="M8 12H16M10 8V10M14 8V10M10 7C10 5.5 12 4 12 4C12 4 14 5.5 14 7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>,
    wheat:   <svg style={s} viewBox="0 0 24 24" fill="none"><path d="M12 20V8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="7" r="2.5" fill={`${color}44`} stroke={color} strokeWidth="1.2"/><circle cx="8" cy="10" r="2" fill={`${color}33`} stroke={color} strokeWidth="1.2"/><circle cx="16" cy="10" r="2" fill={`${color}33`} stroke={color} strokeWidth="1.2"/><circle cx="9" cy="14" r="1.8" fill={`${color}22`} stroke={color} strokeWidth="1"/><circle cx="15" cy="14" r="1.8" fill={`${color}22`} stroke={color} strokeWidth="1"/></svg>,
    bolt:    <svg style={s} viewBox="0 0 24 24" fill="none"><path d="M13 3L5 14H12L11 21L19 10H12L13 3Z" fill={`${color}44`} stroke={color} strokeWidth="1.5" strokeLinejoin="round"/></svg>,
    factory: <svg style={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="14" width="20" height="7" rx="1" fill={`${color}22`} stroke={color} strokeWidth="1.3"/><path d="M2 14L8 10V14M8 14L14 10V14M14 14L20 10V14" stroke={color} strokeWidth="1.3"/><rect x="6" y="7" width="4" height="7" fill={`${color}33`} stroke={color} strokeWidth="1"/><rect x="14" y="7" width="4" height="7" fill={`${color}33`} stroke={color} strokeWidth="1"/><line x1="8" y1="4" x2="8" y2="7" stroke={color} strokeWidth="1.5"/><line x1="16" y1="4" x2="16" y2="7" stroke={color} strokeWidth="1.5"/></svg>,
    users:   <svg style={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="3" fill={`${color}33`} stroke={color} strokeWidth="1.3"/><path d="M3 20C3 16.686 5.686 14 9 14C12.314 14 15 16.686 15 20" stroke={color} strokeWidth="1.3" strokeLinecap="round"/><circle cx="17" cy="8" r="2.5" fill={`${color}22`} stroke={color} strokeWidth="1"/><path d="M19 20C19 17.5 17.5 15.5 15.5 15" stroke={color} strokeWidth="1.3" strokeLinecap="round"/></svg>,
    grad:    <svg style={s} viewBox="0 0 24 24" fill="none"><path d="M12 4L2 9L12 14L22 9L12 4Z" fill={`${color}33`} stroke={color} strokeWidth="1.3"/><path d="M6 11.5V16C6 16 8 18 12 18C16 18 18 16 18 16V11.5" stroke={color} strokeWidth="1.3" strokeLinecap="round"/><line x1="22" y1="9" x2="22" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>,
    heart:   <svg style={s} viewBox="0 0 24 24" fill="none"><path d="M12 20S4 14 4 8.5C4 6 6 4 8.5 4C10 4 11.5 4.8 12 6C12.5 4.8 14 4 15.5 4C18 4 20 6 20 8.5C20 14 12 20 12 20Z" fill={`${color}33`} stroke={color} strokeWidth="1.5"/></svg>,
    fire:    <svg style={s} viewBox="0 0 24 24" fill="none"><path d="M12 21C8 21 5 18 5 14C5 11 7 9 8 8C8 10 9 11 10 11C10 9 11 6 12 4C13 7 15 8 15 11C16 10 16 8 15 7C18 9 19 12 19 14C19 18 16 21 12 21Z" fill={`${color}44`} stroke={color} strokeWidth="1.5" strokeLinejoin="round"/><path d="M12 17C10.5 17 9.5 16 9.5 14.5C9.5 13 10.5 12 12 11C13.5 12 14.5 13 14.5 14.5C14.5 16 13.5 17 12 17Z" fill={`${color}88`} stroke={color} strokeWidth="1"/></svg>,
    spy:     <svg style={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill={`${color}33`} stroke={color} strokeWidth="1.3"/><path d="M4 21C4 17 7.6 14 12 14C16.4 14 20 17 20 21" stroke={color} strokeWidth="1.3" strokeLinecap="round"/><path d="M3 10C3 10 5 8 8 10M16 10C16 10 19 8 21 10" stroke={color} strokeWidth="1.3" strokeLinecap="round"/></svg>,
    panel:   <svg style={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="2" fill={`${color}33`} stroke={color} strokeWidth="1.3"/><rect x="13" y="3" width="8" height="8" rx="2" fill={`${color}22`} stroke={color} strokeWidth="1.3"/><rect x="3" y="13" width="8" height="8" rx="2" fill={`${color}22`} stroke={color} strokeWidth="1.3"/><rect x="13" y="13" width="8" height="8" rx="2" fill={`${color}33`} stroke={color} strokeWidth="1.3"/></svg>,
    scroll:  <svg style={s} viewBox="0 0 24 24" fill="none"><path d="M6 3H18C19.1 3 20 3.9 20 5V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V5C4 3.9 4.9 3 6 3Z" fill={`${color}22`} stroke={color} strokeWidth="1.3"/><line x1="8" y1="9" x2="16" y2="9" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.7"/><line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.7"/><line x1="8" y1="15" x2="13" y2="15" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.7"/></svg>,
    war:     <svg style={s} viewBox="0 0 24 24" fill="none"><path d="M3 20L21 4M21 4H15M21 4V10" stroke={color} strokeWidth="2" strokeLinecap="round"/><circle cx="7" cy="16" r="3" fill={`${color}33`} stroke={color} strokeWidth="1.3"/><path d="M4 19L10 13" stroke={color} strokeWidth="1" opacity="0.5" strokeLinecap="round"/></svg>,
    work:    <svg style={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="8" width="20" height="12" rx="2" fill={`${color}22`} stroke={color} strokeWidth="1.3"/><path d="M8 8V6C8 4.9 8.9 4 10 4H14C15.1 4 16 4.9 16 6V8" stroke={color} strokeWidth="1.3"/><rect x="10" y="11" width="4" height="4" rx="1" fill={`${color}55`} stroke={color} strokeWidth="1"/></svg>,
    shop:    <svg style={s} viewBox="0 0 24 24" fill="none"><path d="M3 9H21L19 19H5L3 9Z" fill={`${color}22`} stroke={color} strokeWidth="1.3"/><path d="M3 9L5 4H19L21 9" stroke={color} strokeWidth="1.3"/><circle cx="9" cy="21" r="1.5" fill={color}/><circle cx="17" cy="21" r="1.5" fill={color}/></svg>,
    target:  <svg style={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.3" fill="none"/><circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.3" fill={`${color}22`}/><circle cx="12" cy="12" r="2" fill={color}/><line x1="12" y1="3" x2="12" y2="7" stroke={color} strokeWidth="1.3"/><line x1="12" y1="17" x2="12" y2="21" stroke={color} strokeWidth="1.3"/><line x1="3" y1="12" x2="7" y2="12" stroke={color} strokeWidth="1.3"/><line x1="17" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1.3"/></svg>,
    crown:   <svg style={s} viewBox="0 0 24 24" fill="none"><path d="M3 17L5 9L9 13L12 7L15 13L19 9L21 17H3Z" fill={`${color}44`} stroke={color} strokeWidth="1.5" strokeLinejoin="round"/><rect x="3" y="17" width="18" height="2.5" rx="1" fill={`${color}66`} stroke={color} strokeWidth="1"/><circle cx="12" cy="7" r="1.5" fill={color}/><circle cx="5" cy="9" r="1.2" fill={color}/><circle cx="19" cy="9" r="1.2" fill={color}/></svg>,
    citizen: <svg style={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="7" r="4" fill={`${color}33`} stroke={color} strokeWidth="1.3"/><path d="M4 21C4 17 7.6 14 12 14C16.4 14 20 17 20 21" stroke={color} strokeWidth="1.3" strokeLinecap="round"/></svg>,
    star:    <svg style={s} viewBox="0 0 24 24" fill="none"><path d="M12 2L14.5 9H22L16 13.5L18.5 20.5L12 16L5.5 20.5L8 13.5L2 9H9.5L12 2Z" fill={`${color}44`} stroke={color} strokeWidth="1.3" strokeLinejoin="round"/></svg>,
    bomb:    <svg style={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="14" r="7" fill={`${color}33`} stroke={color} strokeWidth="1.5"/><path d="M16 8L18 6M18 6L20 4M18 6L20 8M18 6L16 4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="12" r="1.5" fill={color} opacity="0.6"/></svg>,
    radar:   <svg style={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1" fill="none" opacity="0.5"/><circle cx="12" cy="12" r="5.5" stroke={color} strokeWidth="1" fill="none" opacity="0.5"/><circle cx="12" cy="12" r="2" stroke={color} strokeWidth="1" fill="none" opacity="0.5"/><path d="M12 12L12 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" style={{transformOrigin:"12px 12px",animationName:"spin",animationDuration:"3s",animationTimingFunction:"linear",animationIterationCount:"infinite"}}/><circle cx="7" cy="8" r="1.2" fill={color} opacity="0.8"><animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite"/></circle></svg>,
  };
  return icons[type] || icons.star;
};

// ── RADAR Background animado ──────────────────────────────
const RadarBG = () => (
  <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
    {/* ── Base: madera oscura táctica ── */}
    <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg,#2a1c08 0%,#221408 30%,#1c1408 60%,#161008 100%)"}}/>
    {/* Veta de madera */}
    <div style={{position:"absolute",inset:0,backgroundImage:`repeating-linear-gradient(8deg,transparent 0px,transparent 18px,rgba(80,40,10,0.07) 19px,rgba(80,40,10,0.07) 20px),repeating-linear-gradient(-5deg,transparent 0px,transparent 32px,rgba(60,30,5,0.05) 33px,rgba(60,30,5,0.05) 34px)`}}/>
    {/* ── Mapa de fondo sutil ── */}
    <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.12}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
      {/* Continentes simplificados */}
      <path d="M60 200 Q80 180 120 190 Q160 180 180 200 Q200 220 190 250 Q180 270 160 280 Q130 290 100 280 Q70 270 60 250 Z" fill="#4a7a3a" stroke="#6a9a4a" strokeWidth="1"/>
      <path d="M200 150 Q240 130 280 140 Q320 145 340 170 Q360 200 350 230 Q335 260 300 270 Q260 280 230 265 Q200 250 195 220 Q190 190 200 150 Z" fill="#4a7a3a" stroke="#6a9a4a" strokeWidth="1"/>
      <path d="M50 350 Q90 330 130 340 Q160 345 170 370 Q175 400 155 420 Q130 440 95 435 Q60 425 50 395 Z" fill="#3a6a2a" stroke="#5a8a3a" strokeWidth="1"/>
      <path d="M280 300 Q320 285 360 295 Q390 305 395 335 Q398 360 375 375 Q345 388 310 380 Q275 370 272 340 Z" fill="#3a6a2a" stroke="#5a8a3a" strokeWidth="1"/>
      <path d="M100 500 Q150 480 200 490 Q240 498 250 530 Q255 560 230 580 Q200 598 160 590 Q120 578 105 550 Z" fill="#4a7a3a" stroke="#6a9a4a" strokeWidth="1"/>
      {/* Grid de mapa */}
      {Array.from({length:10},(_,i)=><line key={`h${i}`} x1="0" y1={i*80} x2="400" y2={i*80} stroke="#5a7a4a" strokeWidth="0.4" opacity="0.4"/>)}
      {Array.from({length:6},(_,i)=><line key={`v${i}`} x1={i*80} y1="0" x2={i*80} y2="800" stroke="#5a7a4a" strokeWidth="0.4" opacity="0.4"/>)}
      {/* Coordenadas */}
      {["A1","B2","C3","D1","A4","C5"].map((t,i)=><text key={i} x={30+i%3*130} y={120+Math.floor(i/3)*350} fill="#7a9a5a" fontSize="10" opacity="0.35" fontFamily="monospace">{t}</text>)}
    </svg>
    {/* ── Radar SVG animado (overlay táctico) ── */}
    <svg style={{position:"absolute",top:"42%",left:"50%",transform:"translate(-50%,-50%)",width:"min(110vw,85vh)",height:"min(110vw,85vh)",opacity:0.22}} viewBox="0 0 500 500">
      <defs>
        <radialGradient id="sweepGrad" cx="250" cy="250" r="240" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c8a020" stopOpacity="0"/>
          <stop offset="55%" stopColor="#c8a020" stopOpacity="0.12"/>
          <stop offset="100%" stopColor="#c8a020" stopOpacity="0.35"/>
        </radialGradient>
        <filter id="greenGlow"><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="softGlow"><feGaussianBlur stdDeviation="1.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {[50,100,150,200,240].map((r,i)=>(
        <circle key={i} cx="250" cy="250" r={r} fill="none" stroke="#c8a020" strokeWidth={i===0?1.4:0.8} strokeDasharray={i%2===0?"":"6 4"} opacity={0.6-i*0.09}/>
      ))}
      <line x1="250" y1="10" x2="250" y2="490" stroke="#c8a020" strokeWidth="0.7" opacity="0.4"/>
      <line x1="10" y1="250" x2="490" y2="250" stroke="#c8a020" strokeWidth="0.7" opacity="0.4"/>
      <line x1="80" y1="80" x2="420" y2="420" stroke="#c8a020" strokeWidth="0.4" opacity="0.2"/>
      <line x1="420" y1="80" x2="80" y2="420" stroke="#c8a020" strokeWidth="0.4" opacity="0.2"/>
      {Array.from({length:36},(_,i)=>{
        const a=(i/36)*Math.PI*2;
        return <line key={i} x1={250+238*Math.sin(a)} y1={250-238*Math.cos(a)} x2={250+(i%3===0?226:232)*Math.sin(a)} y2={250-(i%3===0?226:232)*Math.cos(a)} stroke="#c8a020" strokeWidth={i%3===0?"1.6":"0.8"} opacity="0.55"/>;
      })}
      <g style={{transformOrigin:"250px 250px",animationName:"radar-sweep",animationDuration:"4s",animationTimingFunction:"linear",animationIterationCount:"infinite"}}>
        <path d="M250 250 L250 10 A240 240 0 0 1 490 250 Z" fill="url(#sweepGrad)"/>
        <line x1="250" y1="250" x2="250" y2="10" stroke="#c8a020" strokeWidth="2" opacity="1" filter="url(#greenGlow)"/>
      </g>
      {[[160,130,1.8],[330,175,1.3],[195,310,2.0],[370,345,1.5],[125,220,1.2],[405,145,1.7],[275,75,1.1],[88,330,1.9],[420,270,1.4],[230,390,1.6]].map(([bx,by,spd],i)=>(
        <g key={i}>
          <circle cx={bx} cy={by} r="4" fill="#c8a020" filter="url(#softGlow)"><animate attributeName="opacity" values="0.1;1;0.1" dur={`${spd+0.5}s`} begin={`${i*0.5}s`} repeatCount="indefinite"/></circle>
          <circle cx={bx} cy={by} r="8" fill="none" stroke="#c8a020" strokeWidth="0.9"><animate attributeName="r" values="5;18;5" dur={`${spd+1}s`} begin={`${i*0.5}s`} repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;0;0.7" dur={`${spd+1}s`} begin={`${i*0.5}s`} repeatCount="indefinite"/></circle>
        </g>
      ))}
      <circle cx="250" cy="250" r="5" fill="#c8a020" opacity="0.9" filter="url(#greenGlow)"/>
      <circle cx="250" cy="250" r="2" fill="#fff" opacity="1"/>
    </svg>
    {/* Scanlines */}
    <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.08) 4px)"}}/>
    {/* Viñeta */}
    <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 80% 80% at 50% 50%,transparent 30%,rgba(4,3,2,0.82) 100%)"}}/>
    {/* Overlay táctico verde muy sutil */}
    <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 100% 60% at 50% 50%,rgba(0,60,20,0.06) 0%,transparent 65%)"}}/>
  </div>
);

// ── Partículas flotantes ──────────────────────────────────
const Particles = ({ count=14, color="#c9a84c", size=3 }) => {
  const pts = Array.from({length:count},(_,i)=>({
    id:i, left:5+Math.random()*90, delay:Math.random()*3,
    dur:1.8+Math.random()*2, dx:(Math.random()-.5)*60, sz:size*(.5+Math.random())
  }));
  return (
    <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>
      {pts.map(p=>(
        <div key={p.id} style={{position:"absolute",bottom:"8%",left:`${p.left}%`,
          width:p.sz,height:p.sz,borderRadius:"50%",background:color,
          boxShadow:`0 0 ${p.sz*2}px ${color}`,opacity:0,
          animationName:"particle-up",animationDuration:`${p.dur}s`,
          animationDelay:`${p.delay}s`,animationTimingFunction:"ease-out",
          animationIterationCount:"infinite","--dx":`${p.dx}px`}}/>
      ))}
    </div>
  );
};

// ── Anillos pulsantes ─────────────────────────────────────
const RingPulse = ({ color="#c9a84c", size=120 }) => (
  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none"}}>
    {[0,.9,1.8].map((d,i)=>(
      <div key={i} style={{position:"absolute",width:size,height:size,borderRadius:"50%",
        border:`1.5px solid ${color}`,top:"50%",left:"50%",
        transform:"translate(-50%,-50%)",opacity:0,
        animationName:"ring-expand",animationDuration:"2.6s",
        animationDelay:`${d}s`,animationTimingFunction:"ease-out",animationIterationCount:"infinite"}}/>
    ))}
  </div>
);

// ── Botón con partículas al presionar ─────────────────────
const GlowBtn = ({ onClick, disabled, color="#c9a84c", darkColor="#0a0810", children, style={}, className="" }) => {
  const [burst, setBurst] = useState(false);
  const handleClick = () => { if(disabled) return; setBurst(true); setTimeout(()=>setBurst(false),600); onClick?.(); };
  return (
    <div style={{position:"relative",display:"inline-block",width:"100%"}}>
      {burst && <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"visible"}}>
        {Array.from({length:8},(_,i)=>(
          <div key={i} style={{position:"absolute",top:"50%",left:"50%",
            width:4,height:4,borderRadius:"50%",background:color,
            boxShadow:`0 0 6px ${color}`,opacity:0,
            animationName:"particle-up",animationDuration:".7s",animationFillMode:"forwards",
            animationTimingFunction:"ease-out",
            "--dx":`${Math.cos(i/8*Math.PI*2)*40}px`,
            marginLeft:-2,marginTop:-2,
            transform:`translateX(${Math.cos(i/8*Math.PI*2)*20}px) translateY(${Math.sin(i/8*Math.PI*2)*20}px)`
          }}/>
        ))}
      </div>}
      <button onClick={handleClick} disabled={disabled}
        className={className}
        style={{width:"100%",position:"relative",overflow:"hidden",cursor:disabled?"not-allowed":"pointer",...style}}>
        {children}
      </button>
    </div>
  );
};

// ── Barra de recurso 3D épica ─────────────────────────────
const ResourceBar = ({ icon, label, value, color }) => (
  <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:10,padding:"12px 14px",
    background:`linear-gradient(135deg,rgba(15,10,4,0.97),rgba(8,6,2,0.99))`,
    borderRadius:12,
    border:`1px solid ${color}55`,
    borderLeft:`3px solid ${color}`,
    boxShadow:`inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -2px 0 rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.8)`,
    position:"relative",overflow:"hidden"}}>
    {/* Top sheen */}
    <div style={{position:"absolute",top:0,left:0,right:0,height:"35%",background:"linear-gradient(to bottom,rgba(255,255,255,0.05),transparent)",pointerEvents:"none"}}/>
    {/* Color tint bg */}
    <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 20% 50%, ${color}0a 0%, transparent 60%)`,pointerEvents:"none"}}/>
    {/* 3D ICON — torre apilada */}
    <div style={{width:56,height:56,flexShrink:0,position:"relative",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      {/* Sombra base */}
      <div style={{position:"absolute",bottom:-2,left:"50%",transform:"translateX(-50%)",width:44,height:6,background:"rgba(0,0,0,0.7)",borderRadius:"50%",filter:"blur(3px)"}}/>
      {/* Capa 1 - base */}
      <div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",width:46,height:7,background:`linear-gradient(180deg,${color}55,${color}22)`,borderRadius:"4px 4px 2px 2px",border:`1px solid ${color}44`,boxShadow:`0 3px 0 rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)`}}/>
      {/* Capa 2 - medio */}
      <div style={{position:"absolute",bottom:5,left:"50%",transform:"translateX(-50%)",width:44,height:20,background:`linear-gradient(180deg,${color}33,${color}18)`,borderRadius:"5px 5px 2px 2px",border:`1px solid ${color}44`}}/>
      {/* Capa 3 - frente (cara principal) */}
      <div style={{position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",width:46,height:38,
        background:`linear-gradient(160deg,${color}66 0%,${color}33 40%,${color}44 100%)`,
        borderRadius:9,border:`1.5px solid ${color}88`,
        boxShadow:`0 0 16px ${color}55, 0 0 32px ${color}22, inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.4)`,
        display:"flex",alignItems:"center",justifyContent:"center",zIndex:1,overflow:"hidden"}}>
        {/* Brillo superior */}
        <div style={{position:"absolute",top:0,left:0,right:0,height:"45%",background:"linear-gradient(to bottom,rgba(255,255,255,0.18),transparent)",borderRadius:"9px 9px 0 0"}}/>
        {/* Brillo lateral */}
        <div style={{position:"absolute",top:0,left:0,bottom:0,width:"30%",background:"linear-gradient(to right,rgba(255,255,255,0.08),transparent)"}}/>
        <div style={{position:"relative",zIndex:2}}>
          {typeof icon === "string" ? <span style={{fontSize:20}}>{icon}</span> : icon}
        </div>
      </div>
    </div>
    {/* Info */}
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,alignItems:"center"}}>
        <span style={{fontSize:12,color:"#b0a080",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase"}}>{label}</span>
        <span style={{fontSize:16,fontFamily:"'Orbitron',monospace",fontWeight:900,
          color:value>60?"#00ff88":value>35?color:"#ff3333",
          textShadow:`0 0 12px currentColor, 0 0 24px currentColor`}}>{value}<span style={{fontSize:10,opacity:.6}}>%</span></span>
      </div>
      {/* Barra neón gruesa */}
      <div style={{height:14,background:"rgba(0,0,0,0.8)",borderRadius:7,overflow:"hidden",
        border:"1px solid rgba(255,255,255,0.08)",
        boxShadow:"inset 0 3px 6px rgba(0,0,0,0.8),inset 0 1px 0 rgba(255,255,255,0.05)"}}>
        <div style={{height:"100%",width:`${value}%`,borderRadius:7,
          background:`linear-gradient(90deg,${color}77,${color}ff,${color}cc)`,
          transition:"width 1.5s cubic-bezier(0.4,0,0.2,1)",
          boxShadow:`0 0 16px ${color}, 0 0 32px ${color}88`,
          position:"relative"}}>
          {/* Brillo superior de la barra */}
          <div style={{position:"absolute",top:0,left:0,right:0,height:"55%",background:"rgba(255,255,255,0.3)",borderRadius:"7px 7px 0 0"}}/>
          {/* Shimmer */}
          <div style={{position:"absolute",top:0,bottom:0,left:"-80%",width:"60%",background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)",animationName:"shimmer",animationDuration:"2.5s",animationTimingFunction:"linear",animationIterationCount:"infinite"}}/>
        </div>
      </div>
    </div>
  </div>
);

// ── Main App ──────────────────────────────────────────────
export default function App() {
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
  const [fechaJuego, setFechaJuego] = useState(calcularFechaJuego());
  const [otrosJugadores, setOtrosJugadores] = useState([]);
  const [rankingData, setRankingData] = useState([]);
  const [saving, setSaving] = useState(false);
  const [xp, setXp] = useState(0);
  // ── Estados de Guerra ──
  const [guerraActiva, setGuerraActiva] = useState(null);
  const [participantesGuerra, setParticipantesGuerra] = useState([]);
  const [yaParticipo, setYaParticipo] = useState(false);
  const [guerrasHistorial, setGuerrasHistorial] = useState([]);
  const [misionesGuerra, setMisionesGuerra] = useState([]);
  const [miPartMisiones, setMiPartMisiones] = useState(0);
  const [vistaGuerra, setVistaGuerra] = useState("lista"); // "lista" | "elegir_tipo" | "elegir_pais" | "combate"
  const [tipoGuerraSeleccionado, setTipoGuerraSeleccionado] = useState(null);
  const [guerraViendoId, setGuerraViendoId] = useState(null);
  const [todasGuerrasActivas, setTodasGuerrasActivas] = useState([]);
  const [nivel, setNivel] = useState(1);
  const [dinero, setDinero] = useState(1000);
  const [showXpModal, setShowXpModal] = useState(false);
  const [xpGanado, setXpGanado] = useState(0);
  const [xpMotivo, setXpMotivo] = useState("");
  const [showGolpeModal, setShowGolpeModal] = useState(false);
  const [golpeTarget, setGolpeTarget] = useState(null);
  const [golpeResult, setGolpeResult] = useState(null);
  const [showCreateParty, setShowCreateParty] = useState(false);
  const [newPartyName, setNewPartyName] = useState("");
  const [allianceAccepted, setAllianceAccepted] = useState(false);
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState("");
  const [showEliminarConfirm, setShowEliminarConfirm] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [showGuerraModal, setShowGuerraModal] = useState(false);
  const [guerraTarget, setGuerraTarget] = useState(null);
  const [guerraTipo, setGuerraTipo] = useState(null);
  const [guerraResult, setGuerraResult] = useState(null);
  const [guerraProb, setGuerraProb] = useState(0);
  const [historialGuerras, setHistorialGuerras] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [misTrabajosMap, setMisTrabajosMap] = useState({});
  const [showCrearEmpresa, setShowCrearEmpresa] = useState(false);
  const [nuevaEmpresa, setNuevaEmpresa] = useState({nombre:"",sector:"alimentario",tipo:"granja",pais:""});
  const [trabajandoEn, setTrabajandoEn] = useState(null);
  const [energia, setEnergia] = useState(100);
  const [fabricas, setFabricas] = useState([]);
  const [misVisas, setMisVisas] = useState([]);
  const [showVisaModal, setShowVisaModal] = useState(false);
  const [visaTarget, setVisaTarget] = useState(null);
  const [visaSeleccionada, setVisaSeleccionada] = useState(null);
  const [catActiva, setCatActiva] = useState("estatal");
  const [vistaOtroPais, setVistaOtroPais] = useState(false);
  const [paisActivoFabricas, setPaisActivoFabricas] = useState(null);
  const [showCrearFabrica, setShowCrearFabrica] = useState(false);
  const [nuevaFabrica, setNuevaFabrica] = useState({nombre:"",tipo_recurso:"Comida",tasa_salarial:70});
  const tickRef = useRef(null);

  useEffect(() => {
    if(tg){tg.ready();tg.expand();tg.setBackgroundColor("#1a1008");tg.setHeaderColor("#1a1008");if(tg.requestFullscreen)tg.requestFullscreen();}
    initPlayer();
    // Recargar visas cuando la app recibe foco
    const onFocus = () => loadVisas();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const syncTick = useCallback(async () => {
    try {
      // Pedir al servidor cuántos segundos faltan — inmune a manipulación de hora
      const { data } = await db.rpc('segundos_para_tick');
      if (data !== null && data !== undefined) {
        setCountdown(Math.max(0, Math.round(data)));
      }
    } catch {
      // Fallback: calcular localmente si RPC falla
      try {
        const { data: tick } = await db.from("tick_global").select("proximo_tick").eq("id",1).single();
        if (tick?.proximo_tick) {
          setCountdown(Math.max(0, Math.floor((new Date(tick.proximo_tick) - new Date()) / 1000)));
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    syncTick();
    // Re-sincronizar con servidor cada 10 segundos — cualquier trampa se corrige rápido
    const si = setInterval(syncTick, 10000);
    tickRef.current = setInterval(() => {
      setCountdown(c => Math.max(0, c - 1));
      setFechaJuego(calcularFechaJuego());
    }, 1000);

    // ── Energía: 100 puntos en 10 min = 1 punto cada 6 segundos ──
    // El timer local solo actualiza la UI cada segundo para que se vea fluido
    // La fuente de verdad es Supabase (energia + energia_update_at)
    const energyTick = setInterval(() => {
      setEnergia(prev => {
        if (prev >= 100) return 100;
        return prev; // el cálculo real lo hace sincEnergy
      });
    }, 1000);

    // Sincronizar energía con Supabase cada 6 segundos
    const energySync = setInterval(async () => {
      setEnergia(prev => {
        if (prev >= 100) return 100;
        const nueva = Math.min(100, prev + 1);
        // Guardar en Supabase con timestamp — esto es la fuente de verdad
        if (jugador?.id) {
          db.from("jugadores")
            .update({ energia: nueva, energia_update_at: new Date().toISOString() })
            .eq("id", jugador.id)
            .then(() => {});
        }
        return nueva;
      });
    }, 6000);

    return () => {
      clearInterval(si);
      clearInterval(tickRef.current);
      clearInterval(energyTick);
      clearInterval(energySync);
    };
  }, [syncTick, jugador?.id]);

  // Realtime jugador — dinero, energía, visas en tiempo real
  useEffect(() => {
    if (!jugador?.id) return;
    const ch = db.channel(`jugador-${jugador.id}`)
      .on("postgres_changes", {event:"UPDATE", schema:"public", table:"jugadores", filter:`id=eq.${jugador.id}`},
        (payload) => {
          const j = payload.new;
          if (j.dinero !== undefined) setDinero(j.dinero);
          if (j.energia !== undefined) setEnergia(j.energia);
          if (j.xp !== undefined) { setXp(j.xp); setNivel(nivelDesdeXP(j.xp)); }
          setJugador(prev => ({...prev, ...j}));
        })
      .on("postgres_changes", {event:"UPDATE", schema:"public", table:"visas", filter:`solicitante_id=eq.${jugador.id}`},
        (payload) => {
          if (payload.new.estado === "aprobada") {
            setMisVisas(prev => {
              const existe = prev.find(v => v.id === payload.new.id);
              return existe ? prev.map(v => v.id===payload.new.id?payload.new:v) : [...prev, payload.new];
            });
            showNotif("🎉 ¡Visa aprobada! Ya puedes trabajar en ese país.", "info");
          }
        })
      // ── Realtime guerra — actualizar fuerzas en tiempo real ──
      .on("postgres_changes", {event:"UPDATE", schema:"public", table:"guerras_activas"},
        (payload) => {
          setGuerraActiva(prev => prev?.id===payload.new.id ? payload.new : prev);
          if (payload.new.fase==="resuelta") {
            const gano=(payload.new.resultado==="atacante"&&payload.new.atacante_pais===selectedCountry)||(payload.new.resultado==="defensor"&&payload.new.defensor_pais===selectedCountry);
            showNotif(gano?"🏆 ¡VICTORIA! +50 XP":"💀 Derrota en batalla","info");
            loadGuerraActiva();
          }
        })
      .on("postgres_changes", {event:"INSERT", schema:"public", table:"guerra_participantes"},
        (payload) => {
          setParticipantesGuerra(prev => [...prev, payload.new]);
          if (payload.new.jugador_id !== jugador.id) {
            showNotif(`⚔️ ${payload.new.jugador_nombre} se unió al bando ${payload.new.bando}`,"info");
          }
          // Actualizar fuerza en la guerra activa
          setGuerraActiva(prev => {
            if (!prev) return prev;
            if (payload.new.bando==="atacante") return {...prev, fuerza_atacante:(prev.fuerza_atacante||0)+payload.new.fuerza_aportada};
            return {...prev, fuerza_defensor:(prev.fuerza_defensor||0)+(payload.new.es_traidor?-payload.new.fuerza_aportada*0.5:payload.new.fuerza_aportada)};
          });
        })
      .on("postgres_changes", {event:"INSERT", schema:"public", table:"guerras_activas"},
        (payload) => {
          if (payload.new.atacante_pais===selectedCountry||payload.new.defensor_pais===selectedCountry) {
            setGuerraActiva(payload.new);
            showNotif(`⚠️ ¡${payload.new.atacante_pais} declaró guerra a ${payload.new.defensor_pais}!`,"error");
          }
        })
      .subscribe();
    return () => { db.removeChannel(ch); };
  }, [jugador?.id]);

  // ── Calcular energía actual basada en timestamps (sobrevive reinicios) ──
  const calcularEnergiaConTimestamp = (energiaGuardada, timestampGuardado) => {
    if (!timestampGuardado) return energiaGuardada ?? 100;
    const ahora = Date.now();
    const guardadoEn = new Date(timestampGuardado).getTime();
    const segundosPasados = Math.max(0, Math.floor((ahora - guardadoEn) / 1000));
    // 1 punto cada 6 segundos = 10 pts/min = 100 pts en 10 min
    const regenerada = Math.floor(segundosPasados / 6);
    return Math.min(100, (energiaGuardada ?? 0) + regenerada);
  };

  const initPlayer = async () => {
    const tgUser = tg?.initDataUnsafe?.user;
    const tgId = tgUser?.id || 99999999;
    try {
      const { data: existing } = await db.from("jugadores").select("*").eq("id",tgId).single();
      if(existing) {
        setJugador(existing);
        setLeaderName(existing.nombre);
        setSelectedCountry(existing.pais);
        setSelectedIdeology(existing.ideologia);
        setPartyName(existing.partido||"");
        const xpVal = existing.xp || 0;
        setXp(xpVal);
        setNivel(nivelDesdeXP(xpVal));
        setDinero(existing.dinero ?? 1000);

        // ── Energía: calcular cuánto regeneró mientras la app estaba cerrada ──
        // Usa energia_update_at como fuente de verdad. Si no existe, usa ultimo_trabajo.
        const timestamp = existing.energia_update_at || existing.ultimo_trabajo || null;
        const energiaCalculada = calcularEnergiaConTimestamp(existing.energia ?? 0, timestamp);
        setEnergia(energiaCalculada);

        // Guardar inmediatamente en Supabase con timestamp actual
        await db.from("jugadores").update({
          energia: energiaCalculada,
          energia_update_at: new Date().toISOString()
        }).eq("id", tgId).then(() => {});

        const { data: nation } = await db.from("naciones").select("*").eq("jugador_id",tgId).single();
        if(nation) { setStats({pib:nation.pib,militar:nation.militar,aprobacion:nation.aprobacion,petroleo:nation.petroleo,comida:nation.comida,energia:nation.energia,educacion:nation.educacion,salud:nation.salud,rebeldia:nation.rebeldia,intel:nation.intel,industria:nation.industria}); setDecreeUsed(nation.decretos_usados||[]); }
        setScreen("game");
      } else { setLeaderName(tgUser?.first_name||"Presidente"); setScreen("onboarding"); }
    } catch { setScreen("onboarding"); }
    loadWorld();
  };

  const loadWorld = async () => {
    try {
      const { data: jugadores } = await db.from("jugadores").select("id,nombre,pais,ideologia,rol,poder_politico,partido").limit(30);
      if(jugadores) setOtrosJugadores(jugadores);
      const { data: nations } = await db.from("naciones").select("jugador_id,pib,militar,aprobacion,industria,educacion").limit(30);
      if(jugadores && nations) {
        const ranked = jugadores.map(j => {
          const n = nations.find(n=>n.jugador_id===j.id)||{};
          return { ...j, puntuacion: calcularPuntuacion(n,j) };
        }).sort((a,b)=>b.puntuacion-a.puntuacion);
        setRankingData(ranked);
      }
    } catch {}
  };

  // ── Cargar guerra activa ──
  const loadGuerraActiva = async () => {
    if (!selectedCountry) return;
    try {
      const { data: guerras } = await db.from("guerras_activas")
        .select("*")
        .in("fase", ["movilizacion","batalla"])
        .or(`atacante_pais.eq.${selectedCountry},defensor_pais.eq.${selectedCountry}`)
        .order("created_at", { ascending: false })
        .limit(1);
      if (guerras && guerras.length > 0) {
        setGuerraActiva(guerras[0]);
        const { data: parts } = await db.from("guerra_participantes")
          .select("*").eq("guerra_id", guerras[0].id);
        if (parts) {
          setParticipantesGuerra(parts);
          const miPart = parts.find(p => p.jugador_id === jugador?.id);
          setYaParticipo(!!miPart);
          if (miPart) {
            setMiPartMisiones(miPart.misiones_completadas||0);
            // Cargar misiones
            const { data: ms } = await db.rpc("obtener_misiones_guerra", {
              p_guerra_id: guerras[0].id, p_jugador_id: jugador?.id
            });
            if (ms?.misiones) setMisionesGuerra(ms.misiones);
          }
        }
      } else {
        setGuerraActiva(null); setParticipantesGuerra([]); setYaParticipo(false); setMisionesGuerra([]);
      }
      const { data: hist } = await db.from("guerras_activas")
        .select("*").eq("fase","resuelta")
        .or(`atacante_pais.eq.${selectedCountry},defensor_pais.eq.${selectedCountry}`)
        .order("created_at", { ascending: false }).limit(5);
      if (hist) setGuerrasHistorial(hist);
    } catch(e) { console.error(e); }
  };

  // ── Cargar TODAS las guerras activas (para la lista) ──
  const loadTodasGuerras = async () => {
    try {
      const { data } = await db.from("guerras_activas")
        .select("*")
        .in("fase", ["movilizacion","batalla"])
        .order("created_at", { ascending: false });
      if (data) setTodasGuerrasActivas(data);
    } catch(e) {}
  };

  // ── Atacar en guerra ──
  const atacarEnGuerra = async () => {
    if (!guerraActiva || !jugador) return;
    if (energia < 10) return showNotif("⚡ Necesitas al menos 10 de energía","error");
    tg?.HapticFeedback?.impactOccurred("heavy");
    const { data, error } = await db.rpc("atacar_en_guerra", {
      p_guerra_id: guerraActiva.id, p_jugador_id: jugador.id
    });
    if (error || data?.error) return showNotif(data?.error || "Error al atacar","error");
    setEnergia(data.energia_restante);
    showNotif(`⚔️ +${Math.round(data.fuerza_ganada)} fuerza · +${data.xp_ganado} XP`,"info");
    // Recargar misiones y participantes
    const { data: ms } = await db.rpc("obtener_misiones_guerra", {
      p_guerra_id: guerraActiva.id, p_jugador_id: jugador.id
    });
    if (ms?.misiones) setMisionesGuerra(ms.misiones);
    loadGuerraActiva();
  };

  // ── Enviar recursos ──
  const enviarRecursosGuerra = async (oro) => {
    if (!guerraActiva || !jugador) return;
    if (dinero < oro) return showNotif("No tienes suficiente dinero","error");
    tg?.HapticFeedback?.impactOccurred("medium");
    const { data, error } = await db.rpc("enviar_recursos_guerra", {
      p_guerra_id: guerraActiva.id, p_jugador_id: jugador.id, p_oro: oro
    });
    if (error || data?.error) return showNotif(data?.error || "Error al enviar recursos","error");
    setDinero(d => d - oro);
    showNotif(`💰 $${oro.toLocaleString()} → +${Math.round(data.fuerza_ganada)} fuerza`,"info");
    loadGuerraActiva();
  };

  // ── Reclamar misión ──
  const reclamarMision = async (mision) => {
    if (!guerraActiva || !jugador) return;
    tg?.HapticFeedback?.notificationOccurred("success");
    const { data, error } = await db.rpc("reclamar_mision_guerra", {
      p_guerra_id: guerraActiva.id,
      p_jugador_id: jugador.id,
      p_mision_id: mision.id,
      p_mision_tipo: mision.tipo,
      p_mision_meta: mision.meta,
      p_mision_recompensa: mision.recompensa
    });
    if (error || data?.error) return showNotif(data?.error || "Error al reclamar","error");
    showNotif(`🎯 ${mision.titulo} completada! +${mision.recompensa} XP · +${Math.round(mision.recompensa*0.5)} fuerza`,"info");
    setXp(x => x + mision.recompensa);
    setMiPartMisiones(prev => prev|(mision.id==="m1"?1:mision.id==="m2"?2:4));
    loadGuerraActiva();
  };

  // ── Declarar guerra ──
  const declararGuerra = async (objetivo, tipoKey) => {
    if (!esPresidente) return showNotif("Solo presidentes pueden declarar guerra","error");
    if (dinero < 5000) return showNotif("Necesitas $5,000 para declarar guerra","error");
    if (stats.militar < 30) return showNotif("Necesitas 30% de ejército","error");
    tg?.HapticFeedback?.notificationOccurred("warning");
    const { data, error } = await db.rpc("declarar_guerra", {
      p_atacante_id: jugador.id,
      p_atacante_pais: selectedCountry,
      p_defensor_pais: objetivo.pais,
      p_tipo: tipoKey
    });
    if (error || data?.error) return showNotif(data?.error || "Error al declarar guerra","error");
    showNotif(`⚔️ ¡Guerra declarada contra ${objetivo.pais}!`,"info");
    setDinero(d => d - 5000);
    loadGuerraActiva();
  };

  // ── Unirse a guerra ──
  const unirseGuerra = async (guerraId, bando, esTraidor) => {
    if (!jugador) return;
    tg?.HapticFeedback?.impactOccurred("heavy");
    const { data, error } = await db.rpc("participar_guerra", {
      p_guerra_id: guerraId, p_jugador_id: jugador.id,
      p_bando: bando, p_es_traidor: esTraidor
    });
    if (error || data?.error) return showNotif(data?.error || "Error al unirte","error");
    showNotif(esTraidor?"🕵️ Te has infiltrado como quinta columna":`✅ Te uniste con fuerza ${Math.round(data.fuerza_aportada)}`,"info");
    setYaParticipo(true);
    loadGuerraActiva();
  };

  const showNotif = (msg, type="info") => { setNotification({msg,type}); setTimeout(()=>setNotification(null),3500); };

  const saveProgress = useCallback(async (newStats, newDecrees) => {
    if(!jugador) return;
    setSaving(true);
    try { await db.from("naciones").upsert({jugador_id:jugador.id,...newStats,decretos_usados:newDecrees,updated_at:new Date().toISOString()}); } catch {}
    setSaving(false);
  }, [jugador]);

  const registerPlayer = async () => {
    const tgUser = tg?.initDataUnsafe?.user;
    const tgId = tgUser?.id || Date.now();
    setSaving(true);
    try {
      // Check if country already has president
      const { data: existingPres } = await db.from("jugadores").select("id").eq("pais",selectedCountry).eq("rol","presidente").single();
      const rol = existingPres ? "ciudadano" : "presidente";
      const newPlayer = { id:tgId, username:tgUser?.username||"", nombre:leaderName, pais:selectedCountry, ideologia:selectedIdeology, partido:null, rol, poder_politico:0, apoyo_militar:0 };
      await db.from("jugadores").upsert(newPlayer);
      await db.from("naciones").upsert({jugador_id:tgId,...stats,decretos_usados:[]});
      setJugador(newPlayer);
      tg?.HapticFeedback?.notificationOccurred("success");
      setScreen("game");
      if(rol==="ciudadano") {
        showNotif(`⚠️ ${selectedCountry} ya tiene presidente. Eres ciudadano.`,"error");
      } else {
        showNotif(`✅ Eres el Presidente de ${selectedCountry}`,"info");
        // Crear empresas estatales automáticamente
        // Crear 3 fábricas estatales en tabla fabricas
        const fabricasEstatales = [
          {nombre:`Granja Estatal de ${selectedCountry}`,  tipo_recurso:"Comida",   tasa_salarial:70, produccion_base:80},
          {nombre:`Comercio Estatal de ${selectedCountry}`,tipo_recurso:"Oro",      tasa_salarial:70, produccion_base:80},
          {nombre:`Fábrica Estatal de ${selectedCountry}`, tipo_recurso:"Mineral",  tasa_salarial:70, produccion_base:80},
        ];
        for (const fab of fabricasEstatales) {
          try {
            await db.from("fabricas").insert({
              ...fab,
              owner_id: tgId,
              partido: partyName || null,
              pais: selectedCountry,
              nivel: 1,
              max_trabajadores: 200,
              capital: 0,
              activa: true
            });
          } catch {}
        }
      }
    } catch { showNotif("Error al registrar. Intenta de nuevo.","error"); }
    setSaving(false);
  };


  const iniciarPago = async (productoKey, precio, nombre) => {
    tg?.HapticFeedback?.impactOccurred("medium");
    showNotif(`⏳ Generando factura para ${nombre}...`, "info");
    try {
      const uid = jugador?.id || tg?.initDataUnsafe?.user?.id;
      const orderId = `naciones_${uid}_${productoKey}_${Date.now()}`;
      const res = await fetch("https://api.nowpayments.io/v1/invoice", {
        method: "POST",
        headers: { "x-api-key": "AY2MCK9-TNXMW8V-JYTMHVW-0TF26PP", "Content-Type": "application/json" },
        body: JSON.stringify({
          price_amount: precio,
          price_currency: "usd",
          pay_currency: "usdttrc20",
          order_id: orderId,
          order_description: `Naciones en Guerra — ${nombre}`,
          ipn_callback_url: "https://wdbupgqymgqfpobcbfze.supabase.co/functions/v1/Pago",
          success_url: "https://t.me/NacionesEnGuerra_Bot",
          cancel_url: "https://t.me/NacionesEnGuerra_Bot"
        })
      });
      const data = await res.json();
      if (data.invoice_url) {
        tg?.openLink(data.invoice_url);
        showNotif("✅ Factura generada. Abriendo pago...", "info");
      } else {
        showNotif(`❌ Error: ${data.message || "Intenta de nuevo"}`, "error");
      }
    } catch(e) {
      showNotif("❌ Error de conexión. Intenta de nuevo.", "error");
    }
  };


  // ── Catálogo de empresas ────────────────────────────────
  const TIPOS_EMPRESA = {
    granja:       {label:"🌾 Granja",        sector:"alimentario", costo:5000,  salario:200, xp:8,  produccion:"comida",  desc:"Produce comida para el país"},
    pesquera:     {label:"🐟 Pesquera",       sector:"alimentario", costo:8000,  salario:250, xp:10, produccion:"comida",  desc:"Pesca y comercio costero"},
    agroindustria:{label:"🏭 Agroindustria",  sector:"alimentario", costo:12000, salario:350, xp:15, produccion:"comida",  desc:"Industria alimentaria avanzada"},
    petrolera:    {label:"🛢️ Petrolera",      sector:"energia",     costo:10000, salario:400, xp:15, produccion:"petroleo",desc:"Extracción de petróleo"},
    electrica:    {label:"⚡ Eléctrica",      sector:"energia",     costo:8000,  salario:300, xp:12, produccion:"energia", desc:"Generación de energía"},
    solar:        {label:"☀️ Solar",          sector:"energia",     costo:15000, salario:350, xp:14, produccion:"energia", desc:"Energía renovable sostenible"},
    fabrica_armas:{label:"⚔️ Fábrica Armas",  sector:"militar",     costo:12000, salario:450, xp:18, produccion:"militar", desc:"Armamento para el ejército"},
    base_militar: {label:"🏰 Base Militar",   sector:"militar",     costo:18000, salario:500, xp:20, produccion:"militar", desc:"Entrenamiento e inteligencia"},
    banco:        {label:"🏦 Banco",          sector:"economico",   costo:15000, salario:500, xp:18, produccion:"pib",     desc:"Impulsa el PIB nacional"},
    comercio:     {label:"🚢 Comercio",       sector:"economico",   costo:8000,  salario:300, xp:12, produccion:"pib",     desc:"Comercio interno y externo"},
    tecnologica:  {label:"💻 Tecnológica",    sector:"economico",   costo:20000, salario:600, xp:22, produccion:"educacion",desc:"Tecnología e innovación"},
    hospital:     {label:"🏥 Hospital",       sector:"social",      costo:10000, salario:350, xp:14, produccion:"salud",   desc:"Mejora la salud pública"},
    universidad:  {label:"🎓 Universidad",    sector:"social",      costo:12000, salario:400, xp:16, produccion:"educacion",desc:"Educación y capital humano"},
  };

  const SECTOR_ICONS = {alimentario:"🌾",energia:"⚡",militar:"⚔️",economico:"💰",social:"🏛️"};

  const loadEmpresas = async () => {
    try {
      // Load country empresas first, then others
      const { data: paisEmpresas } = await db.from("empresas").select("*").eq("activa", true).eq("pais", selectedCountry || "").limit(30);
      const { data: otrasEmpresas } = await db.from("empresas").select("*").eq("activa", true).neq("pais", selectedCountry || "").limit(20);
      const todas = [...(paisEmpresas||[]), ...(otrasEmpresas||[])];
      if (todas.length > 0) setEmpresas(todas);
      else {
        const { data } = await db.from("empresas").select("*").eq("activa", true).limit(50);
        if (data) setEmpresas(data);
      }
      // Load my work records
      const tgId = tg?.initDataUnsafe?.user?.id;
      if (tgId) {
        const { data: trabajos } = await db.from("trabajos").select("*").eq("jugador_id", tgId);
        if (trabajos) {
          const map = {};
          trabajos.forEach(t => { map[t.empresa_id] = t; });
          setMisTrabajosMap(map);
        }
      }
    } catch(e) { console.error("loadEmpresas error:", e); }
  };

  const trabajarEn = async (empresa) => {
    const tgId = jugador?.id || tg?.initDataUnsafe?.user?.id;
    if (!tgId) { showNotif("❌ Inicia sesión primero", "error"); return; }
    tg?.HapticFeedback?.impactOccurred("medium");

    // Check cooldown
    const miTrabajo = misTrabajosMap[empresa.id];
    if (miTrabajo?.ultimo_trabajo) {
      const intervalo = jugador?.trabajo_intervalo || 10;
      const mins = (new Date() - new Date(miTrabajo.ultimo_trabajo)) / 60000;
      if (mins < intervalo) {
        const resta = Math.ceil(intervalo - mins);
        showNotif(`⏳ Puedes trabajar aquí en ${resta} min`, "error");
        return;
      }
    }

    setTrabajandoEn(empresa.id);
    try {
      const tipo = TIPOS_EMPRESA[empresa.tipo] || {};
      const bonusSalario = jugador?.bonus_salario || 0;
      const bonusXp = jugador?.bonus_xp || 0;
      const salario = Math.round(empresa.salario * (1 + bonusSalario/100));
      const xpGanada = Math.round((tipo.xp || 8) * (1 + bonusXp/100));

      // Update trabajo record
      await db.from("trabajos").upsert({
        jugador_id: tgId,
        empresa_id: empresa.id,
        ultimo_trabajo: new Date().toISOString(),
        total_trabajos: (miTrabajo?.total_trabajos || 0) + 1
      });

      // Update empresa produccion
      await db.from("empresas").update({
        produccion_acumulada: (empresa.produccion_acumulada || 0) + 1,
        trabajadores_actuales: Math.min(empresa.max_trabajadores, (empresa.trabajadores_actuales || 0) + 1)
      }).eq("id", empresa.id);

      // Pay worker
      const nuevoDinero = (dinero || 0) + salario;
      setDinero(nuevoDinero);
      await db.from("jugadores").update({
        dinero: nuevoDinero,
        ultimo_trabajo: new Date().toISOString()
      }).eq("id", tgId);

      // Update local state
      setMisTrabajosMap(prev => ({...prev, [empresa.id]: {...(prev[empresa.id]||{}), ultimo_trabajo: new Date().toISOString(), total_trabajos: (prev[empresa.id]?.total_trabajos||0)+1}}));
      setEmpresas(prev => prev.map(e => e.id === empresa.id ? {...e, produccion_acumulada:(e.produccion_acumulada||0)+1} : e));

      await gainXP(xpGanada, `Trabajo en ${empresa.nombre}`);
      showNotif(`💼 +$${salario} · +${xpGanada} XP`, "info");
    } catch(e) {
      showNotif("❌ Error al trabajar", "error");
    }
    setTrabajandoEn(null);
  };

  const crearEmpresa = async () => {
    if (!nuevaEmpresa.nombre.trim()) { showNotif("Escribe el nombre de la empresa", "error"); return; }
    if (!jugador?.partido) { showNotif("Necesitas un partido político para crear empresas", "error"); return; }
    const tipo = TIPOS_EMPRESA[nuevaEmpresa.tipo];
    if (!tipo) return;
    if ((dinero || 0) < tipo.costo) { showNotif(`❌ Necesitas $${tipo.costo.toLocaleString()} para esta empresa`, "error"); return; }

    try {
      const pais = nuevaEmpresa.pais || selectedCountry;
      await db.from("empresas").insert({
        nombre: nuevaEmpresa.nombre,
        sector: tipo.sector,
        tipo: nuevaEmpresa.tipo,
        dueno_id: jugador.id,
        partido: jugador.partido,
        pais,
        salario: tipo.salario,
        xp_por_trabajo: tipo.xp,
        capital: tipo.costo
      });
      // Deduct cost
      const nuevoDinero = (dinero || 0) - tipo.costo;
      setDinero(nuevoDinero);
      await db.from("jugadores").update({ dinero: nuevoDinero }).eq("id", jugador.id);
      setShowCrearEmpresa(false);
      setNuevaEmpresa({nombre:"",sector:"alimentario",tipo:"granja",pais:""});
      await loadEmpresas();
      tg?.HapticFeedback?.notificationOccurred("success");
      showNotif(`🏭 ${nuevaEmpresa.nombre} fundada exitosamente`, "info");
    } catch(e) {
      showNotif("Error al crear empresa", "error");
    }
  };


  const loadGuerras = async () => {
    if (!jugador?.id) return;
    try {
      const { data } = await db.from("guerras").select("*").or(`atacante_id.eq.${jugador.id},defensor_id.eq.${jugador.id}`).order("created_at", {ascending:false}).limit(10);
      if (data) setHistorialGuerras(data);
    } catch {}
  };

  const iniciarGuerra = async (tipo, target, nacionTarget) => {
    const tipoData = TIPOS_GUERRA[tipo];
    if (!tipoData) return;
    const nacionPropia = stats;
    const prob = tipoData.calcular(jugador, nacionPropia, target, nacionTarget);
    setGuerraTipo(tipo);
    setGuerraTarget({...target, nacion: nacionTarget});
    setGuerraProb(prob);
    setGuerraResult(null);
    setShowGuerraModal(true);
  };

  const ejecutarGuerra = async () => {
    if (!guerraTarget || !guerraTipo) return;
    tg?.HapticFeedback?.impactOccurred("heavy");
    const roll = Math.random() * 100;
    const exito = roll < guerraProb;
    const tipoData = TIPOS_GUERRA[guerraTipo];
    
    try {
      await db.from("guerras").insert({
        tipo: guerraTipo,
        atacante_id: jugador.id,
        defensor_id: guerraTarget.id,
        pais_atacante: selectedCountry,
        pais_defensor: guerraTarget.pais,
        estado: "resuelta",
        resultado: exito ? "victoria" : "derrota",
        fuerza_atacante: stats.militar || 45,
        fuerza_defensor: guerraTarget.nacion?.militar || 45,
        probabilidad: guerraProb,
        resolved_at: new Date().toISOString()
      });

      if (exito) {
        if (guerraTipo === "golpe_estado") {
          await db.from("jugadores").update({rol:"presidente", poder_politico:0}).eq("id", jugador.id);
          await db.from("jugadores").update({rol:"ciudadano", exiliado:true, exilio_hasta:new Date(Date.now()+86400000*3).toISOString()}).eq("id", guerraTarget.id);
          setJugador(j=>({...j, rol:"presidente", poder_politico:0}));
        } else if (guerraTipo === "conquista") {
          const territorios = [...(jugador.territorios_conquistados||[]), guerraTarget.pais];
          await db.from("jugadores").update({territorios_conquistados: territorios}).eq("id", jugador.id);
          await db.from("jugadores").update({colonizado_por: jugador.id}).eq("id", guerraTarget.id);
          setJugador(j=>({...j, territorios_conquistados: territorios}));
          setStats(s=>({...s, militar: clamp(s.militar-10), pib: clamp(s.pib+5)}));
        } else if (guerraTipo === "revolucion") {
          await db.from("jugadores").update({ideologia: jugador.ideologia}).eq("id", guerraTarget.id);
          setStats(s=>({...s, rebeldia: clamp(s.rebeldia-20), aprobacion: clamp(s.aprobacion+15)}));
        } else if (guerraTipo === "liberacion") {
          await db.from("jugadores").update({colonizado_por: null}).eq("id", jugador.id);
          setJugador(j=>({...j, colonizado_por: null}));
        } else if (guerraTipo === "economica") {
          setStats(s=>({...s, pib: clamp(s.pib+5), industria: clamp(s.industria+3)}));
          const defStats = guerraTarget.nacion || {};
          await db.from("naciones").update({pib: clamp((defStats.pib||67)-15), industria: clamp((defStats.industria||49)-10)}).eq("jugador_id", guerraTarget.id);
        }
        await gainXP(150, `Victoria en ${tipoData.label}`);
      } else {
        if (guerraTipo === "golpe_estado") {
          const nuevoPoder = Math.max(0,(jugador.poder_politico||0)-20);
          await db.from("jugadores").update({poder_politico:nuevoPoder}).eq("id",jugador.id);
          setJugador(j=>({...j, poder_politico:nuevoPoder}));
        } else if (guerraTipo === "conquista") {
          setStats(s=>({...s, militar: clamp(s.militar-15), pib: clamp(s.pib-5)}));
        } else if (guerraTipo === "revolucion") {
          const nuevoPoder = Math.max(0,(jugador.poder_politico||0)-30);
          await db.from("jugadores").update({poder_politico:nuevoPoder}).eq("id",jugador.id);
          setJugador(j=>({...j, poder_politico:nuevoPoder}));
        }
      }
      setGuerraResult({exito, roll:Math.round(roll), prob:guerraProb});
      await loadGuerras();
    } catch(e) {
      showNotif("Error al ejecutar la guerra","error");
      setShowGuerraModal(false);
    }
  };

  const cambiarNombre = async () => {
    if (!nuevoNombre.trim() || !jugador) return;
    try {
      await db.from("jugadores").update({nombre:nuevoNombre}).eq("id",jugador.id);
      setJugador(j=>({...j,nombre:nuevoNombre}));
      setLeaderName(nuevoNombre);
      setShowPerfilModal(false);
      showNotif("✅ Nombre actualizado","info");
    } catch { showNotif("Error al actualizar nombre","error"); }
  };

  const eliminarCuenta = async () => {
    if (confirmarEliminar !== "ELIMINAR") {
      showNotif("⛔ Escribe ELIMINAR para confirmar", "error");
      return;
    }
    if (!jugador?.id) return;
    try {
      tg?.HapticFeedback?.notificationOccurred("error");
      // Borrar todo en orden correcto
      await db.from("trabajos").delete().eq("jugador_id", jugador.id);
      await db.from("decretos_log").delete().eq("jugador_id", jugador.id);
      await db.from("golpes").delete().eq("golpista_id", jugador.id);
      await db.from("guerras").delete().or(`atacante_id.eq.${jugador.id},defensor_id.eq.${jugador.id}`);
      await db.from("partido_miembros").delete().eq("jugador_id", jugador.id);
      await db.from("pagos").delete().eq("jugador_id", jugador.id);
      await db.from("empresas").update({activa:false}).eq("dueno_id", jugador.id);
      await db.from("naciones").delete().eq("jugador_id", jugador.id);
      await db.from("jugadores").delete().eq("id", jugador.id);
      // Limpiar estado local
      setJugador(null);
      setScreen("onboarding");
      setStep(0);
      setSelectedCountry("");
      setSelectedIdeology("");
      setLeaderName("");
      setPartyName("");
      setShowPerfilModal(false);
      setShowEliminarConfirm(false);
      setConfirmarEliminar("");
    } catch(e) {
      showNotif("❌ Error al eliminar cuenta. Intenta de nuevo.", "error");
    }
  };

  const cerrarSesion = () => {
    setJugador(null);
    setScreen("onboarding");
    setStep(0);
    setSelectedCountry("");
    setSelectedIdeology("");
    setLeaderName("");
    setPartyName("");
    setStats({pib:67,militar:45,aprobacion:58,petroleo:34,comida:71,energia:52,educacion:63,salud:55,rebeldia:28,intel:40,industria:49});
    showNotif("👋 Sesión cerrada","info");
  };


  // ── Tipos de recurso ─────────────────────────────────────
  const TIPOS_RECURSO = {
    Comida:   {icon:"🌾", color:"#4caf50", stat:"comida"},
    Petróleo: {icon:"🛢️", color:"#ff8f00", stat:"petroleo"},
    Mineral:  {icon:"⛏️", color:"#795548", stat:"industria"},
    Energía:  {icon:"⚡", color:"#03a9f4", stat:"energia"},
    Armas:    {icon:"⚔️", color:"#e53935", stat:"militar"},
    Oro:      {icon:"🪙", color:"#c9a84c", stat:"pib"},
  };


  // ── Visas de trabajo ─────────────────────────────────────
  const VISAS = [
    {tipo:"3_anios",   label:"3 años",     dias:3*365,   precio:300,  desc:"Válida por 3 años de juego"},
    {tipo:"5_anios",   label:"5 años",     dias:5*365,   precio:450,  desc:"Válida por 5 años de juego"},
    {tipo:"10_anios",  label:"10 años",    dias:10*365,  precio:700,  desc:"Válida por 10 años de juego"},
    {tipo:"20_anios",  label:"20 años",    dias:20*365,  precio:1200, desc:"Válida por 20 años de juego"},
    {tipo:"permanente",label:"Permanente", dias:99*365,  precio:2500, desc:"Nunca expira"},
  ];

  const calcularEnergiaActual = (energiaGuardada, ultimaEnergia) => {
    const minsPasados = (Date.now() - new Date(ultimaEnergia||Date.now()).getTime()) / 60000;
    const regenerada = Math.min(Math.floor(minsPasados), 100 - (energiaGuardada||100));
    return Math.min(100, (energiaGuardada||100) + regenerada);
  };

  const loadFabricas = async () => {
    try {
      const { data: fab } = await db.from("fabricas").select("*").eq("activa", true).limit(60);
      if (fab) setFabricas(fab);
    } catch(e) { console.error("loadFabricas:", e); }
  };

  const realizarTrabajo = async (fabrica) => {
    const tgId = jugador?.id || tg?.initDataUnsafe?.user?.id;
    if (!tgId) return;
    if (trabajandoEn === fabrica.id) return;
    setTrabajandoEn(fabrica.id);
    tg?.HapticFeedback?.impactOccurred("medium");
    try {
      // Llamar función server-side (anti-trampa, calcula en Supabase)
      const { data, error } = await db.rpc("realizar_trabajo", {
        p_user_id: tgId,
        p_fabrica_id: fabrica.id
      });
      if (error || !data?.exito) {
        const msg = data?.error || error?.message || "Error desconocido";
        if (msg.includes("Energía")) {
          const mins = data?.mins_para_energia || 1;
          showNotif(`⚡ Sin energía — recarga en ${mins} min`, "error");
        } else {
          showNotif(`❌ ${msg}`, "error");
        }
        setTrabajandoEn(null);
        return;
      }
      // Actualizar estado local
      setEnergia(data.energia_restante);
      setDinero(d => (d||0) + data.salario);
      await gainXP(data.xp_ganado, `Trabajo en ${fabrica.nombre}`);
      setJugador(j => ({...j, energia: data.energia_restante}));
      const { data: jugadorFresh } = await db.from("jugadores").select("dinero,energia,xp,nivel").eq("id", tgId).single();
      if (jugadorFresh) {
        setDinero(jugadorFresh.dinero ?? dinero);
        setEnergia(jugadorFresh.energia ?? data.energia_restante);
        setXp(jugadorFresh.xp ?? xp);
        setNivel(nivelDesdeXP(jugadorFresh.xp ?? xp));
      }
      showNotif(`💼 +$${data.salario} · +${data.xp_ganado}XP · ⚡${data.energia_restante}/100`, "info");
      // Refresh fábricas
      setFabricas(prev => prev.map(f => f.id === fabrica.id
        ? {...f, trabajadores_actuales: Math.min(f.max_trabajadores, (f.trabajadores_actuales||0)+1)}
        : f
      ));
    } catch(e) {
      showNotif("❌ Error al trabajar", "error");
    }
    setTrabajandoEn(null);
  };

  const crearFabrica = async () => {
    if (!nuevaFabrica.nombre.trim()) { showNotif("Escribe el nombre", "error"); return; }
    if (!jugador?.partido) { showNotif("Necesitas un partido político", "error"); return; }
    const tasa = parseInt(nuevaFabrica.tasa_salarial);
    if (tasa < 10 || tasa > 95) { showNotif("Tasa salarial debe ser entre 10% y 95%", "error"); return; }
    const costo = 5000;
    if ((dinero||0) < costo) { showNotif(`❌ Necesitas $${costo.toLocaleString()}`, "error"); return; }
    try {
      await db.from("fabricas").insert({
        nombre: nuevaFabrica.nombre,
        owner_id: jugador.id,
        pais: selectedCountry,
        tipo_recurso: nuevaFabrica.tipo_recurso,
        nivel: 1,
        tasa_salarial: tasa,
        produccion_base: 100,
        max_trabajadores: 50,
        activa: true
      });
      const nuevoDinero = (dinero||0) - costo;
      setDinero(nuevoDinero);
      await db.from("jugadores").update({dinero: nuevoDinero}).eq("id", jugador.id);
      setShowCrearFabrica(false);
      setNuevaFabrica({nombre:"",tipo_recurso:"Comida",tasa_salarial:70});
      await loadFabricas();
      tg?.HapticFeedback?.notificationOccurred("success");
      showNotif(`🏭 ${nuevaFabrica.nombre} fundada`, "info");
    } catch(e) {
      showNotif("Error al crear fábrica", "error");
    }
  };


  const loadVisas = async () => {
    if (!jugador?.id) return;
    try {
      const { data } = await db.from("visas")
        .select("*")
        .eq("solicitante_id", jugador.id)
        .eq("estado", "aprobada");
      if (data) setMisVisas(data);
    } catch {}
  };

  const tengoVisa = (pais) => {
    if (pais === selectedCountry) return true;
    return misVisas.some(v => v.pais_destino === pais && new Date(v.expira_at) > new Date());
  };

  const solicitarVisa = async () => {
    if (!visaTarget || !visaSeleccionada) return;
    const visa = VISAS.find(v => v.tipo === visaSeleccionada);
    if (!visa) return;
    if ((dinero||0) < visa.precio) {
      showNotif(`❌ Necesitas $${visa.precio.toLocaleString()} para esta visa`, "error");
      return;
    }
    try {
      // Buscar presidente del país destino
      const { data: pres } = await db.from("jugadores")
        .select("id,nombre")
        .eq("pais", visaTarget)
        .eq("rol", "presidente")
        .single();

      if (!pres) {
        showNotif("⚠️ Ese país no tiene presidente — puedes trabajar libremente", "info");
        setShowVisaModal(false);
        return;
      }

      // Descontar dinero al solicitante
      const nuevoDinero = (dinero||0) - visa.precio;
      setDinero(nuevoDinero);
      await db.from("jugadores").update({dinero: nuevoDinero}).eq("id", jugador.id);

      // Crear solicitud de visa
      const expira = new Date();
      expira.setDate(expira.getDate() + visa.dias);

      await db.from("visas").insert({
        solicitante_id: jugador.id,
        pais_destino: visaTarget,
        presidente_id: pres.id,
        tipo: visa.tipo,
        duracion_dias: visa.dias,
        precio: visa.precio,
        estado: "pendiente",
        expira_at: expira.toISOString()
      });

      setShowVisaModal(false);
      setVisaTarget(null);
      setVisaSeleccionada(null);
      showNotif(`📋 Visa solicitada a ${pres.nombre}. Esperando aprobación.`, "info");
    } catch(e) {
      showNotif("Error al solicitar visa", "error");
    }
  };

  const responderVisa = async (visaId, aprobar, solicitanteId, precio) => {
    try {
      if (aprobar) {
        await db.from("visas").update({estado:"aprobada"}).eq("id", visaId);
        // 30% al presidente
        const ganancia = Math.floor(precio * 0.3);
        const nuevoDinero = (dinero||0) + ganancia;
        setDinero(nuevoDinero);
        await db.from("jugadores").update({dinero: nuevoDinero}).eq("id", jugador.id);
        showNotif(`✅ Visa aprobada · +$${ganancia} (30%)`, "info");
      } else {
        await db.from("visas").update({estado:"rechazada"}).eq("id", visaId);
        // Devolver dinero al solicitante
        const { data: sol } = await db.from("jugadores").select("dinero").eq("id", solicitanteId).single();
        await db.from("jugadores").update({dinero: (sol?.dinero||0) + precio}).eq("id", solicitanteId);
        showNotif("❌ Visa rechazada — dinero devuelto al solicitante", "info");
      }
    } catch { showNotif("Error al responder visa", "error"); }
  };

  const issueDecree = async (decree) => {
    if(decreeUsed.includes(decree.id)) return;
    if(decreeUsed.length>=3){showNotif("⛔ Ya usaste tus 3 decretos de hoy","error");return;}
    if(jugador?.rol!=="presidente"){showNotif("⛔ Solo los presidentes pueden emitir decretos","error");return;}
    tg?.HapticFeedback?.impactOccurred("medium");
    setSelectedDecree(decree); setDecreeLoading(true); setDecreeResponse("");
    const newStats={...stats};
    if(decree.statChanges) Object.entries(decree.statChanges).forEach(([k,v])=>{if(newStats[k]!==undefined)newStats[k]=clamp(newStats[k]+v);});
    setStats(newStats);
    await new Promise(r=>setTimeout(r,600));
    const consequence=getConsequence(decree.id,selectedIdeology,newStats,decreeUsed);
    setDecreeResponse(consequence);
    const newDecrees=[...decreeUsed,decree.id];
    setDecreeUsed(newDecrees);
    await gainXP(15, `Decreto: ${decree.name}`);
    try{await db.from("decretos_log").insert({jugador_id:jugador?.id,decreto_id:decree.id,decreto_nombre:decree.name,consecuencia:consequence});}catch{}
    await saveProgress(newStats,newDecrees);
    setDecreeLoading(false);
  };

  const createParty = async () => {
    if(!newPartyName.trim()){showNotif("Escribe el nombre del partido","error");return;}
    try {
      const { data: existing } = await db.from("partidos").select("id").eq("nombre",newPartyName).single();
      if(existing){showNotif("⛔ Ese nombre de partido ya existe globalmente","error");return;}
      await db.from("partidos").insert({nombre:newPartyName,ideologia:selectedIdeology,fundador_id:jugador?.id});
      await db.from("jugadores").update({partido:newPartyName}).eq("id",jugador?.id);
      setJugador(j=>({...j,partido:newPartyName}));
      setPartyName(newPartyName);
      setShowCreateParty(false);
      setNewPartyName("");
      showNotif(`🏛️ Partido "${newPartyName}" creado exitosamente`,"info");
    } catch { showNotif("Error al crear partido","error"); }
  };

  const iniciarGolpe = async (presidente) => {
    if(!jugador||jugador.rol!=="ciudadano"){showNotif("⛔ Solo los ciudadanos pueden hacer golpes de estado","error");return;}
    if(jugador.exiliado){showNotif("⛔ Estás exiliado. No puedes iniciar un golpe.","error");return;}
    if(jugador.poder_politico<10){showNotif("⛔ Necesitas más poder político. Recluta miembros para tu partido.","error");return;}
    try {
      const { data: nacionPres } = await db.from("naciones").select("*").eq("jugador_id",presidente.id).single();
      const prob = calcularProbabilidadGolpe(jugador,stats,presidente,nacionPres);
      setGolpeTarget({...presidente, nacion:nacionPres, probabilidad:prob});
      setShowGolpeModal(true);
    } catch { showNotif("Error al analizar el golpe","error"); }
  };

  const ejecutarGolpe = async () => {
    if(!golpeTarget) return;
    tg?.HapticFeedback?.impactOccurred("heavy");
    const roll = Math.random() * 100;
    const exito = roll < golpeTarget.probabilidad;
    try {
      await db.from("golpes").insert({
        golpista_id: jugador.id,
        presidente_id: golpeTarget.id,
        pais: golpeTarget.pais,
        poder_golpista: jugador.poder_politico,
        apoyo_militar_golpista: jugador.apoyo_militar,
        aprobacion_presidente: golpeTarget.nacion?.aprobacion||50,
        militar_presidente: golpeTarget.nacion?.militar||50,
        probabilidad: golpeTarget.probabilidad,
        resultado: exito ? "exito" : "fracaso"
      });
      if(exito) {
        // Golpista se convierte en presidente
        await db.from("jugadores").update({rol:"presidente",poder_politico:0}).eq("id",jugador.id);
        // Expresidente se convierte en ciudadano exiliado
        await db.from("jugadores").update({rol:"ciudadano",exiliado:true,exilio_hasta:new Date(Date.now()+86400000*3).toISOString()}).eq("id",golpeTarget.id);
        setJugador(j=>({...j,rol:"presidente",poder_politico:0}));
        setGolpeResult({exito:true,probabilidad:golpeTarget.probabilidad,roll:Math.round(roll)});
        await gainXP(200, 'Golpe de Estado Exitoso');
      } else {
        // Golpista pierde poder político
        const nuevoPoder = Math.max(0,(jugador.poder_politico||0)-20);
        await db.from("jugadores").update({poder_politico:nuevoPoder}).eq("id",jugador.id);
        setJugador(j=>({...j,poder_politico:nuevoPoder}));
        setGolpeResult({exito:false,probabilidad:golpeTarget.probabilidad,roll:Math.round(roll)});
      }
    } catch { showNotif("Error al ejecutar el golpe","error"); }
  };

  const gainXP = async (cantidad, motivo) => {
    const nuevoXp = (xp || 0) + cantidad;
    const nuevoNivel = nivelDesdeXP(nuevoXp);
    const subioNivel = nuevoNivel > nivel;
    setXp(nuevoXp);
    setNivel(nuevoNivel);
    setXpGanado(cantidad);
    setXpMotivo(motivo);
    setShowXpModal(true);
    setTimeout(() => setShowXpModal(false), 2500);
    try {
      await db.from("jugadores").update({
        xp: nuevoXp,
        nivel: nuevoNivel
      }).eq("id", jugador?.id);
    } catch {}
    if (subioNivel) showNotif(`🎉 ¡Subiste al Nivel ${nuevoNivel}! ${tituloNivel(nuevoNivel)}`, "info");
  };

  const trabajar = async () => {
    if(jugador?.ultimo_trabajo) {
      const horas = (new Date() - new Date(jugador.ultimo_trabajo)) / 3600000;
      if(horas < 24) {
        const restantes = Math.ceil(24 - horas);
        showNotif(`⏳ Puedes trabajar en ${restantes}h`, "error");
        return;
      }
    }
    const salario = 500 + (nivel * 50);
    const nuevoDinero = (dinero || 0) + salario;
    setDinero(nuevoDinero);
    try {
      await db.from("jugadores").update({
        dinero: nuevoDinero,
        ultimo_trabajo: new Date().toISOString()
      }).eq("id", jugador?.id);
      setJugador(j=>({...j, ultimo_trabajo: new Date().toISOString()}));
    } catch {}
    await gainXP(10, `Trabajo completado +$${salario}`);
    showNotif(`💼 Trabajaste — +$${salario} · +10 XP`, "info");
  };

  const acumularPoder = async () => {
    if(jugador?.rol!=="ciudadano"){showNotif("⚠️ Solo los ciudadanos acumulan poder político","error");return;}
    if(!jugador?.partido){showNotif("⚠️ Crea un partido político primero","error");return;}
    if(jugador?.ultimo_acumulo) {
      const horas = (new Date() - new Date(jugador.ultimo_acumulo)) / 3600000;
      if(horas < 24) {
        const restantes = Math.ceil(24 - horas);
        showNotif(`⏳ Puedes acumular poder en ${restantes}h`, "error");
        return;
      }
    }
    const nuevo = Math.min(100,(jugador.poder_politico||0)+3);
    await db.from("jugadores").update({
      poder_politico: nuevo,
      ultimo_acumulo: new Date().toISOString()
    }).eq("id", jugador.id);
    setJugador(j=>({...j, poder_politico:nuevo, ultimo_acumulo:new Date().toISOString()}));
    showNotif(`⚡ +3 Poder Político. Total: ${nuevo}/100 · Próximo en 24h`, "info");
  };

  const formatTime=(s)=>`${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const ideo=IDEOLOGIES[selectedIdeology]||IDEOLOGIES.democracia;
  const esPresidente=jugador?.rol==="presidente";
  const esCiudadano=jugador?.rol==="ciudadano";

  // ── LOADING ─────────────────────────────────────────────
  if(screen==="loading") return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at center,#0d1830 0%,#030508 100%)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:24,overflow:"hidden",position:"relative"}}>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 50% 50%,rgba(201,168,76,0.1) 0%,transparent 55%)",animationName:"pulse-glow",animationDuration:"2.5s",animationTimingFunction:"ease-in-out",animationIterationCount:"infinite"}}/>
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(201,168,76,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.025) 1px,transparent 1px)",backgroundSize:"44px 44px"}}/>
      <Particles count={22} color="#c9a84c" size={3}/>
      <Particles count={10} color="#6080ff" size={1.5}/>
      <div style={{position:"relative",zIndex:2,display:"flex",flexDirection:"column",alignItems:"center",gap:22}}>
        <div style={{position:"relative",width:150,height:150,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <RingPulse color="#c9a84c" size={120}/>
          <RingPulse color="rgba(201,168,76,0.35)" size={85}/>
          <div style={{position:"absolute",width:"100%",height:"100%",animationName:"orbit",animationDuration:"4s",animationTimingFunction:"linear",animationIterationCount:"infinite"}}>
            <div style={{width:9,height:9,background:"#f0c040",borderRadius:"50%",boxShadow:"0 0 14px #f0c040, 0 0 28px rgba(240,192,64,0.5)",marginLeft:-4,marginTop:0}}/>
          </div>
          <div style={{fontSize:76,animationName:"float",animationDuration:"4s",animationTimingFunction:"ease-in-out",animationIterationCount:"infinite",filter:"drop-shadow(0 0 32px rgba(201,168,76,0.8))",zIndex:2}}>🌍</div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:11,color:"rgba(201,168,76,0.55)",letterSpacing:8,textTransform:"uppercase",marginBottom:6,animationName:"fadeIn",animationDuration:"1s",animationDelay:"0.3s",animationFillMode:"both",opacity:0}}>— BIENVENIDO A —</div>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:31,fontWeight:900,color:"#f0c040",letterSpacing:5,textTransform:"uppercase",textShadow:"0 0 40px rgba(240,192,64,0.7), 0 0 80px rgba(201,168,76,0.3)",animationName:"flicker",animationDuration:"8s",animationTimingFunction:"linear",animationIterationCount:"infinite"}}>NACIONES</div>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:31,fontWeight:900,color:"#fff",letterSpacing:5,textTransform:"uppercase",textShadow:"0 2px 24px rgba(0,0,0,0.8)"}}>EN GUERRA</div>
          <div style={{height:1,background:"linear-gradient(90deg,transparent,#f0c040,rgba(255,240,160,0.8),#f0c040,transparent)",margin:"10px auto",width:200,animationName:"glow-line",animationDuration:"2s",animationTimingFunction:"ease-in-out",animationIterationCount:"infinite"}}/>
        </div>
        <div style={{width:230,position:"relative"}}>
          <div style={{height:3,background:"rgba(255,255,255,0.06)",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",background:"linear-gradient(90deg,transparent,#c9a84c,#fff8a0,#c9a84c)",borderRadius:2,backgroundSize:"300% auto",animationName:"shimmer",animationDuration:"1.4s",animationTimingFunction:"linear",animationIterationCount:"infinite",width:"85%"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:7}}>
            <span style={{fontSize:9,color:"rgba(201,168,76,0.45)",fontFamily:"'Orbitron',monospace",letterSpacing:"0.1em"}}>INICIALIZANDO</span>
            <span style={{fontSize:9,color:"rgba(201,168,76,0.6)",fontFamily:"'Orbitron',monospace",animationName:"pulse-glow",animationDuration:"1s",animationTimingFunction:"ease-in-out",animationIterationCount:"infinite"}}>● ● ●</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ── ONBOARDING ──────────────────────────────────────────
  if(screen==="onboarding") return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 50% 20%,#0e1a32 0%,#030508 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Rajdhani',sans-serif",padding:"20px 16px",position:"relative",overflow:"hidden"}}>
      <Particles count={20} color="#c9a84c" size={2.5}/>
      <Particles count={8} color="#5080ff" size={1.5}/>
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(201,168,76,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.03) 1px,transparent 1px)",backgroundSize:"44px 44px",pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:0,left:0,right:0,height:220,background:"radial-gradient(ellipse at 50% 0%,rgba(201,168,76,0.07),transparent 70%)",pointerEvents:"none"}}/>
      {/* Corner decos */}
      {[[{top:16,left:16},{borderTop:"2px solid",borderLeft:"2px solid"}],[{top:16,right:16},{borderTop:"2px solid",borderRight:"2px solid"}],[{bottom:70,left:16},{borderBottom:"2px solid",borderLeft:"2px solid"}],[{bottom:70,right:16},{borderBottom:"2px solid",borderRight:"2px solid"}]].map(([pos,bdr],i)=>(
        <div key={i} style={{position:"absolute",...pos,width:34,height:34,...bdr,borderColor:"rgba(201,168,76,0.45)",animationName:"fadeIn",animationDuration:"0.6s",animationDelay:`${0.2+i*.1}s`,animationFillMode:"both",opacity:0}}/>
      ))}
      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:420}}>

        {/* ── Paso 0 ── */}
        {step===0&&(<div style={{textAlign:"center",animationName:"slideInUp",animationDuration:"0.45s",animationTimingFunction:"cubic-bezier(0.34,1.2,0.64,1)",animationFillMode:"both"}}>
          <div style={{position:"relative",display:"inline-flex",alignItems:"center",justifyContent:"center",width:165,height:165,marginBottom:14}}>
            <RingPulse color="#c9a84c" size={135}/>
            <RingPulse color="rgba(201,168,76,0.3)" size={95}/>
            <div style={{position:"absolute",width:"100%",height:"100%",animationName:"orbit",animationDuration:"4.5s",animationTimingFunction:"linear",animationIterationCount:"infinite"}}>
              <div style={{width:9,height:9,background:"#f0c040",borderRadius:"50%",boxShadow:"0 0 14px #f0c040",marginLeft:-4}}/>
            </div>
            <div style={{fontSize:88,animationName:"float",animationDuration:"4s",animationTimingFunction:"ease-in-out",animationIterationCount:"infinite",filter:"drop-shadow(0 0 38px rgba(201,168,76,0.85))",zIndex:2}}>🌍</div>
          </div>
          <div style={{fontSize:11,color:"rgba(201,168,76,0.6)",letterSpacing:7,textTransform:"uppercase",marginBottom:4,fontFamily:"'Rajdhani',sans-serif",animationName:"fadeIn",animationDuration:"0.8s",animationDelay:"0.2s",animationFillMode:"both",opacity:0}}>Bienvenido a</div>
          <h1 style={{fontFamily:"'Cinzel',serif",fontSize:33,fontWeight:900,color:"#f0c040",letterSpacing:5,margin:"0 0 0",textShadow:"0 0 40px rgba(240,192,64,0.75)",animationName:"flicker",animationDuration:"8s",animationTimingFunction:"linear",animationIterationCount:"infinite"}}>NACIONES</h1>
          <h1 style={{fontFamily:"'Cinzel',serif",fontSize:33,fontWeight:900,color:"#fff",letterSpacing:5,margin:"0 0 4px",textShadow:"0 2px 24px rgba(0,0,0,0.8)"}}>EN GUERRA</h1>
          <div style={{height:2,background:"linear-gradient(90deg,transparent,#f0c040,rgba(255,240,100,0.9),#f0c040,transparent)",margin:"0 auto 18px",width:210,animationName:"pulse-glow",animationDuration:"2s",animationTimingFunction:"ease-in-out",animationIterationCount:"infinite"}}/>
          <p style={{color:"#3a5070",fontSize:14,lineHeight:2,marginBottom:34,fontFamily:"'Rajdhani',sans-serif",fontWeight:500}}>195 naciones compiten por el poder global.<br/>Sé presidente o ciudadano. Forma partidos.<br/>Haz golpes de estado. Conquista el mundo.</p>
          <GlowBtn onClick={()=>setStep(1)} style={{padding:"18px",borderRadius:10,fontSize:16,letterSpacing:5,background:"linear-gradient(180deg,#eecb4e 0%,#c9a84c 45%,#9a7228 100%)",color:"#0a0810",fontWeight:700,fontFamily:"'Cinzel',serif",boxShadow:"0 5px 0 #5a3a08,0 7px 24px rgba(201,168,76,0.55),inset 0 1px 0 rgba(255,255,255,0.3)",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:"-110%",width:"55%",height:"100%",background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)",animationName:"streak",animationDuration:"3s",animationTimingFunction:"ease-in-out",animationIterationCount:"infinite",animationDelay:"0.5s"}}/>
            ⚔️ TOMAR EL PODER
          </GlowBtn>
        </div>)}

        {/* ── Paso 1 ── */}
        {step===1&&(<div style={{animationName:"slideInUp",animationDuration:"0.4s",animationTimingFunction:"cubic-bezier(0.34,1.2,0.64,1)",animationFillMode:"both"}}>
          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:52,marginBottom:6,animationName:"bounce-in",animationDuration:"0.5s",animationFillMode:"both",filter:"drop-shadow(0 0 18px rgba(201,168,76,0.5))"}}>🗺️</div>
            <h2 style={{fontFamily:"'Cinzel',serif",color:"#f0c040",letterSpacing:3,marginBottom:4,textTransform:"uppercase",fontSize:16,textShadow:"0 0 20px rgba(240,192,64,0.4)"}}>Elige tu Nación</h2>
            <p style={{color:"#3a5070",fontSize:12,fontFamily:"'Rajdhani',sans-serif"}}>Si el país ya tiene presidente, serás ciudadano.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:16,maxHeight:295,overflowY:"auto",padding:"2px"}}>
            {COUNTRIES.map(c=>(
              <button key={c} onClick={()=>setSelectedCountry(c)} style={{
                background:selectedCountry===c?"linear-gradient(135deg,rgba(201,168,76,0.28),rgba(201,168,76,0.1))":"rgba(255,255,255,0.03)",
                border:`1px solid ${selectedCountry===c?"#c9a84c":"rgba(255,255,255,0.07)"}`,
                color:selectedCountry===c?"#f0c040":"#4a5060",
                padding:"9px 4px",borderRadius:6,fontSize:10,cursor:"pointer",
                transition:"all 0.15s",fontFamily:"'Rajdhani',sans-serif",fontWeight:600,
                boxShadow:selectedCountry===c?"0 0 12px rgba(201,168,76,0.35),0 3px 0 rgba(201,168,76,0.3)":"none",
                transform:selectedCountry===c?"scale(1.05)":"scale(1)"
              }}>{c}</button>
            ))}
          </div>
          <GlowBtn onClick={()=>setStep(2)} disabled={!selectedCountry} style={{padding:"15px",borderRadius:10,fontSize:14,letterSpacing:4,fontWeight:700,fontFamily:"'Cinzel',serif",...(selectedCountry?{background:"linear-gradient(180deg,#eecb4e 0%,#c9a84c 45%,#9a7228 100%)",color:"#0a0810",boxShadow:"0 5px 0 #5a3a08,0 7px 20px rgba(201,168,76,0.45),inset 0 1px 0 rgba(255,255,255,0.25)"}:{background:"rgba(255,255,255,0.04)",color:"#2a3040",cursor:"not-allowed",border:"1px solid rgba(255,255,255,0.05)"})}}>CONTINUAR →</GlowBtn>
        </div>)}

        {/* ── Paso 2 ── */}
        {step===2&&(<div style={{animationName:"slideInUp",animationDuration:"0.4s",animationTimingFunction:"cubic-bezier(0.34,1.2,0.64,1)",animationFillMode:"both"}}>
          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:52,marginBottom:6,animationName:"bounce-in",animationDuration:"0.5s",animationFillMode:"both",filter:"drop-shadow(0 0 18px rgba(201,168,76,0.5))"}}>🏛️</div>
            <h2 style={{fontFamily:"'Cinzel',serif",color:"#f0c040",letterSpacing:3,marginBottom:4,textTransform:"uppercase",fontSize:16}}>Tu Ideología</h2>
            <p style={{color:"#3a5070",fontSize:12,fontFamily:"'Rajdhani',sans-serif"}}>Define cómo gobernarás o lucharás.</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:16,maxHeight:310,overflowY:"auto"}}>
            {Object.entries(IDEOLOGIES).map(([key,val])=>(
              <button key={key} onClick={()=>setSelectedIdeology(key)} style={{
                background:selectedIdeology===key?`linear-gradient(135deg,${val.color}28,${val.color}10)`:"rgba(255,255,255,0.025)",
                border:`1px solid ${selectedIdeology===key?val.color:"rgba(255,255,255,0.07)"}`,
                color:selectedIdeology===key?val.color:"#4a5060",
                padding:"12px 16px",borderRadius:9,fontSize:13,cursor:"pointer",
                display:"flex",justifyContent:"space-between",alignItems:"center",
                transition:"all 0.18s",fontFamily:"'Rajdhani',sans-serif",fontWeight:600,
                boxShadow:selectedIdeology===key?`0 0 18px ${val.color}33,0 4px 0 ${val.color}44`:"none",
                transform:selectedIdeology===key?"translateX(5px)":"none",
                position:"relative",overflow:"hidden"
              }}>
                {selectedIdeology===key&&<div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${val.color},transparent)`}}/>}
                <span style={{fontSize:16}}>{val.icon} {val.label}</span>
                <span style={{fontSize:10,opacity:0.6,maxWidth:140,textAlign:"right"}}>{val.bonus}</span>
              </button>
            ))}
          </div>
          <GlowBtn onClick={()=>setStep(3)} disabled={!selectedIdeology} style={{padding:"15px",borderRadius:10,fontSize:14,letterSpacing:4,fontWeight:700,fontFamily:"'Cinzel',serif",...(selectedIdeology?{background:"linear-gradient(180deg,#eecb4e 0%,#c9a84c 45%,#9a7228 100%)",color:"#0a0810",boxShadow:"0 5px 0 #5a3a08,0 7px 20px rgba(201,168,76,0.45),inset 0 1px 0 rgba(255,255,255,0.25)"}:{background:"rgba(255,255,255,0.04)",color:"#2a3040",cursor:"not-allowed",border:"1px solid rgba(255,255,255,0.05)"})}}>CONTINUAR →</GlowBtn>
        </div>)}

        {/* ── Paso 3 ── */}
        {step===3&&(<div style={{animationName:"slideInUp",animationDuration:"0.4s",animationTimingFunction:"cubic-bezier(0.34,1.2,0.64,1)",animationFillMode:"both"}}>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:58,marginBottom:10,animationName:"heartbeat",animationDuration:"2.5s",animationTimingFunction:"ease-in-out",animationIterationCount:"infinite",filter:"drop-shadow(0 0 24px rgba(201,168,76,0.6))"}}>✍️</div>
            <h2 style={{fontFamily:"'Cinzel',serif",color:"#f0c040",letterSpacing:3,marginBottom:6,textTransform:"uppercase",fontSize:17}}>Tu Identidad</h2>
            <p style={{color:"#3a5070",fontSize:12,fontFamily:"'Rajdhani',sans-serif"}}>El partido es opcional — puedes crearlo después.</p>
          </div>
          <div style={{position:"relative",marginBottom:20}}>
            <input placeholder="Tu nombre como líder..." value={leaderName} onChange={e=>setLeaderName(e.target.value)}
              style={{width:"100%",padding:"16px 18px",borderRadius:10,fontSize:16,boxSizing:"border-box",fontWeight:600,letterSpacing:"0.03em",background:"rgba(0,0,0,0.45)",border:"1px solid rgba(201,168,76,0.35)",color:"#f0ece0",outline:"none",fontFamily:"'Rajdhani',sans-serif",transition:"border-color 0.2s,box-shadow 0.2s"}}/>
            {leaderName&&<div style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:18,animationName:"pop-in",animationDuration:"0.3s",animationFillMode:"both"}}>⚔️</div>}
          </div>
          <GlowBtn onClick={registerPlayer} disabled={!leaderName||saving} style={{padding:"18px",borderRadius:10,fontSize:15,letterSpacing:4,fontWeight:700,fontFamily:"'Cinzel',serif",...(leaderName&&!saving?{background:"linear-gradient(180deg,#eecb4e 0%,#c9a84c 45%,#9a7228 100%)",color:"#0a0810",boxShadow:"0 5px 0 #5a3a08,0 7px 28px rgba(201,168,76,0.6),inset 0 1px 0 rgba(255,255,255,0.3)"}:{background:"rgba(255,255,255,0.04)",color:"#2a3040",cursor:"not-allowed",border:"1px solid rgba(255,255,255,0.05)"})}}>
            {saving?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
              <div style={{width:16,height:16,border:"2px solid rgba(10,8,16,0.3)",borderTop:"2px solid #0a0810",borderRadius:"50%",animationName:"spin",animationDuration:"0.9s",animationTimingFunction:"linear",animationIterationCount:"infinite"}}/>REGISTRANDO...
            </span>:"🌍 ASUMIR MI DESTINO"}
          </GlowBtn>
        </div>)}

        {/* Progress dots */}
        <div style={{display:"flex",justifyContent:"center",gap:10,marginTop:26}}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{height:4,borderRadius:2,transition:"all 0.4s cubic-bezier(0.34,1.4,0.64,1)",
              width:i===step?34:i<step?12:8,
              background:i===step?"#f0c040":i<step?"rgba(201,168,76,0.5)":"rgba(255,255,255,0.08)",
              boxShadow:i===step?"0 0 12px rgba(240,192,64,0.7)":"none"}}/>
          ))}
        </div>
      </div>
    </div>
  );

// ── GAME ────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:"#1a1208",fontFamily:"'Rajdhani',sans-serif",color:"#f0ece0",position:"relative"}}>
      {/* RADAR BACKGROUND ÉPICO */}
      <RadarBG/>

      {/* XP Popup épico */}
      {showXpModal&&(
        <div style={{position:"fixed",top:66,right:12,zIndex:3000}}>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
            width:90,height:90,borderRadius:"50%",border:"2px solid rgba(240,192,64,0.65)",
            animationName:"ring-expand",animationDuration:"0.65s",animationTimingFunction:"ease-out",animationFillMode:"forwards"}}/>
          <div style={{background:"linear-gradient(180deg,#f0c040 0%,#c9a84c 50%,#9a7228 100%)",borderRadius:12,
            padding:"12px 18px",animationName:"pop-in",animationDuration:"0.4s",animationTimingFunction:"cubic-bezier(0.34,1.56,0.64,1)",animationFillMode:"both",
            boxShadow:"0 0 32px rgba(240,192,64,0.75),0 5px 0 rgba(80,50,0,0.8),inset 0 1px 0 rgba(255,255,255,0.3)",
            border:"1px solid rgba(255,255,255,0.2)",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:"50%",background:"rgba(255,255,255,0.14)",borderRadius:"12px 12px 0 0"}}/>
            <div style={{position:"absolute",top:0,left:"-110%",width:"55%",height:"100%",
              background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)",
              animationName:"streak",animationDuration:"0.8s",animationFillMode:"forwards"}}/>
            <div style={{fontSize:15,color:"#0a0810",fontWeight:800,fontFamily:"'Rajdhani',sans-serif",letterSpacing:"0.07em",position:"relative"}}>✦ +{xpGanado} XP</div>
            <div style={{fontSize:10,color:"rgba(10,8,16,0.65)",fontFamily:"'Rajdhani',sans-serif",fontWeight:600,position:"relative"}}>{xpMotivo}</div>
          </div>
        </div>
      )}

      {/* Notificación */}
      {notification&&(
        <div style={{position:"fixed",top:10,left:"50%",transform:"translateX(-50%)",
          background:notification.type==="error"?"linear-gradient(135deg,rgba(229,57,53,0.22),rgba(120,0,0,0.45))":"linear-gradient(135deg,rgba(201,168,76,0.22),rgba(100,70,0,0.45))",
          border:`1px solid ${notification.type==="error"?"rgba(255,82,82,0.75)":"rgba(240,192,64,0.75)"}`,
          color:notification.type==="error"?"#ff5252":"#f0c040",
          padding:"10px 22px",borderRadius:9,fontSize:13,zIndex:3001,whiteSpace:"nowrap",
          backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
          boxShadow:`0 4px 22px ${notification.type==="error"?"rgba(229,57,53,0.45)":"rgba(201,168,76,0.45)"}`,
          fontFamily:"'Rajdhani',sans-serif",fontWeight:700,letterSpacing:"0.04em",
          animationName:"slideInDown",animationDuration:"0.35s",animationTimingFunction:"cubic-bezier(0.34,1.4,0.64,1)",animationFillMode:"both"
        }}>{notification.msg}</div>
      )}


      {/* Modal Perfil */}
      {showPerfilModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#0f1420",border:`1px solid ${ideo.color}44`,borderRadius:12,padding:24,width:"100%",maxWidth:380}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{width:70,height:70,borderRadius:"50%",background:`linear-gradient(135deg,${ideo.color},${ideo.color}88)`,border:`3px solid ${ideo.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 12px"}}>{ideo.icon}</div>
              <div style={{fontSize:16,color:"#e8e8e8",fontWeight:"bold"}}>{leaderName}</div>
              <div style={{fontSize:12,color:ideo.color}}>{selectedCountry} · {ideo.label}</div>
              <div style={{fontSize:11,color:colorNivel(nivel),marginTop:4}}>Nv.{nivel} — {tituloNivel(nivel)}</div>
            </div>
            <div style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:14,marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:12,color:"#888"}}>XP Total</span>
                <span style={{fontSize:12,color:"#c9a84c",fontFamily:"monospace"}}>{xp} XP</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:12,color:"#888"}}>Dinero</span>
                <span style={{fontSize:12,color:"#4caf50",fontFamily:"monospace"}}>${(dinero||0).toLocaleString()}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:12,color:"#888"}}>Rol</span>
                <span style={{fontSize:12,color:esPresidente?"#c9a84c":"#4caf50"}}>{esPresidente?"👑 Presidente":"🏴 Ciudadano"}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:12,color:"#888"}}>Partido</span>
                <span style={{fontSize:12,color:"#e8e8e8"}}>{jugador?.partido||"Sin partido"}</span>
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,color:"#6a6a8a",marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Cambiar Nombre</div>
              <div style={{display:"flex",gap:8}}>
                <input placeholder="Nuevo nombre..." value={nuevoNombre} onChange={e=>setNuevoNombre(e.target.value)} style={{flex:1,background:"rgba(255,255,255,0.04)",border:`1px solid ${ideo.color}44`,color:"#e8e8e8",padding:"10px 12px",borderRadius:6,fontSize:13,outline:"none",fontFamily:"Georgia,serif"}} />
                <button onClick={cambiarNombre} disabled={!nuevoNombre.trim()} style={{background:`${ideo.color}22`,border:`1px solid ${ideo.color}55`,color:ideo.color,padding:"10px 14px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:"bold"}}>OK</button>
              </div>
            </div>
            {!showEliminarConfirm ? (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <button onClick={()=>setShowPerfilModal(false)} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",color:"#888",padding:"11px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif"}}>CERRAR</button>
                <button onClick={()=>setShowEliminarConfirm(true)} style={{width:"100%",background:"rgba(100,0,0,0.3)",border:"1px solid rgba(229,57,53,0.2)",color:"#c62828",padding:"10px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif",fontSize:12}}>🗑️ Eliminar cuenta permanentemente</button>
              </div>
            ) : (
              <div style={{background:"rgba(229,57,53,0.08)",border:"1px solid rgba(229,57,53,0.4)",borderRadius:8,padding:14}}>
                <div style={{fontSize:13,color:"#e53935",fontWeight:"bold",marginBottom:8,textAlign:"center"}}>⚠️ ACCIÓN IRREVERSIBLE</div>
                <div style={{fontSize:12,color:"#aaa",marginBottom:12,lineHeight:1.7,textAlign:"center"}}>
                  Perderás TODO tu progreso:<br/>
                  partido, empresas, dinero, XP y nivel.<br/>
                  <strong style={{color:"#e53935"}}>Esta acción NO se puede deshacer.</strong>
                </div>
                <div style={{fontSize:12,color:"#888",marginBottom:8}}>Escribe <strong style={{color:"#e53935"}}>ELIMINAR</strong> para confirmar:</div>
                <input
                  placeholder="ELIMINAR"
                  value={confirmarEliminar}
                  onChange={e=>setConfirmarEliminar(e.target.value.toUpperCase())}
                  style={{width:"100%",background:"rgba(0,0,0,0.3)",border:`1px solid ${confirmarEliminar==="ELIMINAR"?"#e53935":"rgba(255,255,255,0.1)"}`,color:"#e53935",padding:"10px 12px",borderRadius:6,fontSize:14,marginBottom:12,boxSizing:"border-box",outline:"none",fontFamily:"monospace",textAlign:"center",letterSpacing:3}}
                />
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{setShowEliminarConfirm(false);setConfirmarEliminar("");}} style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",color:"#888",padding:"11px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif"}}>CANCELAR</button>
                  <button onClick={eliminarCuenta} disabled={confirmarEliminar!=="ELIMINAR"} style={{flex:1,background:confirmarEliminar==="ELIMINAR"?"rgba(229,57,53,0.3)":"rgba(255,255,255,0.03)",border:`1px solid ${confirmarEliminar==="ELIMINAR"?"#e53935":"rgba(255,255,255,0.06)"}`,color:confirmarEliminar==="ELIMINAR"?"#e53935":"#444",padding:"11px",borderRadius:6,cursor:confirmarEliminar==="ELIMINAR"?"pointer":"not-allowed",fontFamily:"Georgia,serif",fontWeight:"bold"}}>🗑️ ELIMINAR</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Guerra */}
      {showGuerraModal && guerraTarget && guerraTipo && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"#0f1420",border:`1px solid ${TIPOS_GUERRA[guerraTipo]?.color}55`,borderRadius:12,padding:22,width:"100%",maxWidth:380}}>
            {!guerraResult ? (
              <>
                <div style={{fontSize:28,textAlign:"center",marginBottom:8}}>{TIPOS_GUERRA[guerraTipo]?.icon}</div>
                <h3 style={{color:TIPOS_GUERRA[guerraTipo]?.color,textAlign:"center",marginBottom:4,fontSize:16}}>{TIPOS_GUERRA[guerraTipo]?.label?.toUpperCase()}</h3>
                <p style={{color:"#666",fontSize:12,textAlign:"center",marginBottom:16}}>{TIPOS_GUERRA[guerraTipo]?.desc}</p>
                <div style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:14,marginBottom:16}}>
                  <div style={{fontSize:13,color:"#e8e8e8",marginBottom:10}}>Objetivo: <strong style={{color:TIPOS_GUERRA[guerraTipo]?.color}}>{guerraTarget.nombre} — {guerraTarget.pais}</strong></div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,fontSize:12,color:"#888"}}>
                    {guerraTarget.nacion && <>
                      <div>⚔️ Fuerza militar enemiga: <span style={{color:"#e53935"}}>{guerraTarget.nacion.militar||45}%</span></div>
                      <div>👥 Aprobación del objetivo: <span style={{color:guerraTarget.nacion.aprobacion>50?"#e53935":"#4caf50"}}>{guerraTarget.nacion.aprobacion||50}%</span></div>
                      {guerraTarget.nacion.rebeldia && <div>😤 Rebeldía: <span style={{color:"#c9a84c"}}>{guerraTarget.nacion.rebeldia}%</span></div>}
                    </>}
                    <div>Tu fuerza: <span style={{color:"#4caf50"}}>{guerraTipo==="golpe_estado"||guerraTipo==="revolucion"?`${jugador?.poder_politico||0} poder político`:`${stats.militar||45}% militar`}</span></div>
                  </div>
                  <div style={{textAlign:"center",marginTop:14}}>
                    <div style={{fontSize:11,color:"#666",marginBottom:4}}>PROBABILIDAD DE ÉXITO</div>
                    <div style={{fontSize:38,color:guerraProb>60?"#4caf50":guerraProb>35?"#c9a84c":"#e53935",fontFamily:"monospace",fontWeight:"bold"}}>{guerraProb}%</div>
                    <div style={{fontSize:11,color:"#555",marginTop:4}}>Dificultad: {TIPOS_GUERRA[guerraTipo]?.dificultad}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{setShowGuerraModal(false);setGuerraTarget(null);setGuerraTipo(null);}} style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",color:"#888",padding:"12px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif"}}>CANCELAR</button>
                  <button onClick={ejecutarGuerra} style={{flex:2,background:`linear-gradient(135deg,${TIPOS_GUERRA[guerraTipo]?.color},${TIPOS_GUERRA[guerraTipo]?.color}88)`,border:"none",color:"#fff",padding:"12px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:"bold",letterSpacing:1}}>{TIPOS_GUERRA[guerraTipo]?.icon} ATACAR</button>
                </div>
              </>
            ) : (
              <>
                <div style={{fontSize:52,textAlign:"center",marginBottom:12}}>{guerraResult.exito?"🏆":"💀"}</div>
                <h3 style={{color:guerraResult.exito?"#4caf50":"#e53935",textAlign:"center",marginBottom:16,fontSize:18}}>{guerraResult.exito?"¡VICTORIA!":"DERROTA"}</h3>
                <div style={{color:"#aaa",fontSize:13,lineHeight:1.8,marginBottom:20,textAlign:"center"}}>
                  {guerraResult.exito ? RESULTADOS_GUERRA[guerraTipo]?.exito : RESULTADOS_GUERRA[guerraTipo]?.fracaso}
                  <br/><br/>
                  <span style={{fontSize:11,color:"#555"}}>Probabilidad {guerraResult.prob}% · Roll: {guerraResult.roll}</span>
                </div>
                <button onClick={()=>{setShowGuerraModal(false);setGuerraTarget(null);setGuerraTipo(null);setGuerraResult(null);loadWorld();}} style={{width:"100%",background:"linear-gradient(135deg,#c9a84c,#a07830)",border:"none",color:"#0a0e1a",padding:"14px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:"bold"}}>CONTINUAR</button>
              </>
            )}
          </div>
        </div>
      )}
      {/* Golpe Modal */}
      {showGolpeModal && golpeTarget && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#0f1420",border:"1px solid rgba(229,57,53,0.4)",borderRadius:12,padding:24,maxWidth:360,width:"100%"}}>
            {!golpeResult ? (
              <>
                <div style={{fontSize:32,textAlign:"center",marginBottom:12}}>⚔️</div>
                <h3 style={{color:"#e53935",textAlign:"center",marginBottom:16,fontSize:16,letterSpacing:1}}>GOLPE DE ESTADO</h3>
                <div style={{background:"rgba(229,57,53,0.08)",border:"1px solid rgba(229,57,53,0.2)",borderRadius:8,padding:14,marginBottom:16}}>
                  <div style={{fontSize:13,color:"#e8e8e8",marginBottom:8}}>Objetivo: <strong style={{color:"#e53935"}}>{golpeTarget.nombre} ({golpeTarget.pais})</strong></div>
                  <div style={{fontSize:12,color:"#888",marginBottom:12,lineHeight:1.7}}>
                    Aprobación del presidente: <span style={{color:golpeTarget.nacion?.aprobacion<40?"#4caf50":"#e53935"}}>{golpeTarget.nacion?.aprobacion||50}%</span><br/>
                    Fuerza militar: <span style={{color:"#e53935"}}>{golpeTarget.nacion?.militar||50}%</span><br/>
                    Tu poder político: <span style={{color:"#c9a84c"}}>{jugador?.poder_politico||0}/100</span>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:11,color:"#666",marginBottom:4}}>PROBABILIDAD DE ÉXITO</div>
                    <div style={{fontSize:36,color:golpeTarget.probabilidad>50?"#4caf50":golpeTarget.probabilidad>30?"#c9a84c":"#e53935",fontFamily:"monospace",fontWeight:"bold"}}>{golpeTarget.probabilidad}%</div>
                  </div>
                </div>
                <div style={{fontSize:11,color:"#666",marginBottom:16,textAlign:"center"}}>Si fallas, perderás 20 puntos de poder político.</div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>{setShowGolpeModal(false);setGolpeTarget(null);}} style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",color:"#888",padding:"12px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif"}}>CANCELAR</button>
                  <button onClick={ejecutarGolpe} style={{flex:2,background:"linear-gradient(135deg,#e53935,#b71c1c)",border:"none",color:"#fff",padding:"12px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:"bold",letterSpacing:1}}>⚔️ EJECUTAR GOLPE</button>
                </div>
              </>
            ) : (
              <>
                <div style={{fontSize:48,textAlign:"center",marginBottom:12}}>{golpeResult.exito?"🎉":"💀"}</div>
                <h3 style={{color:golpeResult.exito?"#4caf50":"#e53935",textAlign:"center",marginBottom:16,fontSize:18}}>
                  {golpeResult.exito?"¡GOLPE EXITOSO!":"GOLPE FALLIDO"}
                </h3>
                <div style={{color:"#aaa",fontSize:13,lineHeight:1.8,marginBottom:20,textAlign:"center"}}>
                  {golpeResult.exito
                    ? `Has tomado el poder en ${golpeTarget.pais}. El anterior presidente ha sido exiliado por 3 días.`
                    : `El golpe falló. Perdiste 20 puntos de poder político. El presidente reforzó su posición.`
                  }<br/><br/>
                  <span style={{fontSize:11,color:"#555"}}>Probabilidad era {golpeResult.probabilidad}% · Resultado: {golpeResult.roll}</span>
                </div>
                <button onClick={()=>{setShowGolpeModal(false);setGolpeTarget(null);setGolpeResult(null);loadWorld();}} style={{width:"100%",background:"linear-gradient(135deg,#c9a84c,#a07830)",border:"none",color:"#0a0e1a",padding:"14px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:"bold"}}>CONTINUAR</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create Party Modal */}
      {showCreateParty && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#0f1420",border:`1px solid ${ideo.color}44`,borderRadius:12,padding:24,maxWidth:360,width:"100%"}}>
            <div style={{fontSize:32,textAlign:"center",marginBottom:12}}>🏛️</div>
            <h3 style={{color:ideo.color,textAlign:"center",marginBottom:16,fontSize:16}}>CREAR PARTIDO POLÍTICO</h3>
            <p style={{color:"#666",fontSize:12,marginBottom:16,textAlign:"center"}}>El nombre debe ser único globalmente. Se identificará como partido de {selectedCountry}.</p>
            <input placeholder="Nombre del partido..." value={newPartyName} onChange={e=>setNewPartyName(e.target.value)} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:`1px solid ${ideo.color}44`,color:"#e8e8e8",padding:"12px 16px",borderRadius:6,fontSize:14,marginBottom:20,boxSizing:"border-box",outline:"none",fontFamily:"Georgia,serif"}} />
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowCreateParty(false)} style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",color:"#888",padding:"12px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif"}}>CANCELAR</button>
              <button onClick={createParty} disabled={!newPartyName.trim()} style={{flex:2,background:newPartyName.trim()?`linear-gradient(135deg,${ideo.color},${ideo.color}88)`:"#2a2a3a",border:"none",color:newPartyName.trim()?"#fff":"#444",padding:"12px",borderRadius:6,cursor:newPartyName.trim()?"pointer":"not-allowed",fontFamily:"Georgia,serif",fontWeight:"bold"}}>FUNDAR PARTIDO</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ HEADER — Mesa táctica ═══ */}
      <div style={{position:"sticky",top:0,zIndex:100,background:"linear-gradient(180deg,#1c1208 0%,#160e06 60%,#120c05 100%)",borderBottom:"2px solid #3a2a0a",boxShadow:"0 4px 20px rgba(0,0,0,0.7)",paddingTop:`calc(${(tg?.safeAreaInset?.top||0)}px + 36px)`}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,#2a1a04,#c9a84c,#f0c040,#c9a84c,#2a1a04)",animationName:"pulse-glow",animationDuration:"3s",animationTimingFunction:"ease-in-out",animationIterationCount:"infinite"}}/>
        <div style={{padding:"8px 10px 6px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>{setNuevoNombre(leaderName);setShowPerfilModal(true);}}
              style={{width:44,height:44,borderRadius:10,background:`linear-gradient(145deg,${ideo.color}cc,${ideo.color}55,${ideo.color}88)`,border:`2px solid ${ideo.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,cursor:"pointer",flexShrink:0,boxShadow:`0 0 16px ${ideo.color}66,0 4px 0 rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.2)`,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:"50%",background:"rgba(255,255,255,0.15)",borderRadius:"8px 8px 0 0"}}/>
              {ideo.icon}
            </button>
            <div>
              <div style={{fontSize:14,color:"#f0e8c8",fontWeight:700,display:"flex",alignItems:"center",gap:8,fontFamily:"'Rajdhani',sans-serif",letterSpacing:"0.04em"}}>
                {leaderName}
                <span style={{fontSize:13,color:"#44ff88",fontFamily:"'Orbitron',monospace",fontWeight:700,textShadow:"0 0 12px rgba(68,255,136,0.7)",animationName:"hud-glow",animationDuration:"3s",animationTimingFunction:"ease-in-out",animationIterationCount:"infinite"}}>{formatDinero(dinero)}</span>
              </div>
              <div style={{fontSize:11,display:"flex",alignItems:"center",gap:6,marginTop:2}}>
                <span style={{color:"#a08040",fontFamily:"'Rajdhani',sans-serif",fontWeight:600,letterSpacing:"0.05em"}}>{selectedCountry}</span>
                <span style={{background:esPresidente?"linear-gradient(135deg,rgba(201,168,76,0.25),rgba(100,70,0,0.3))":"linear-gradient(135deg,rgba(68,255,136,0.15),rgba(0,60,20,0.3))",color:esPresidente?"#f0c040":"#44ff88",padding:"2px 8px",borderRadius:4,fontSize:9,letterSpacing:"0.1em",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,border:`1px solid ${esPresidente?"rgba(240,192,64,0.5)":"rgba(68,255,136,0.4)"}`,boxShadow:esPresidente?"0 0 8px rgba(240,192,64,0.25)":"0 0 8px rgba(68,255,136,0.2)"}}>
                  {esPresidente?"👑 PRESIDENTE":"⚡ CIUDADANO"}
                </span>
              </div>
            </div>
          </div>
          <div style={{textAlign:"right",background:"linear-gradient(135deg,rgba(0,0,0,0.5),rgba(10,6,0,0.8))",border:"1px solid rgba(201,168,76,0.25)",borderRadius:8,padding:"5px 10px",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05),0 2px 0 rgba(0,0,0,0.4)"}}>
            {countdown===0?<div style={{fontSize:10,color:"#ff4444",fontWeight:700}}>⚠️ ERR</div>:<>
              <div style={{fontSize:15,color:"#f0c040",fontFamily:"'Orbitron',monospace",fontWeight:700,textShadow:"0 0 14px rgba(240,192,64,0.7)",letterSpacing:"0.04em",animationName:"hud-glow",animationDuration:"4s",animationTimingFunction:"ease-in-out",animationIterationCount:"infinite"}}>{iconoHora(fechaJuego.hora)} {fechaJuego.hora}:{fechaJuego.min}</div>
              <div style={{fontSize:9,color:"#6a5020",letterSpacing:"0.08em",fontFamily:"'Rajdhani',sans-serif",fontWeight:600}}>{fechaJuego.dia} {fechaJuego.mes} {fechaJuego.anio}</div>
            </>}
          </div>
        </div>
        <div style={{padding:"0 8px 8px",display:"flex",gap:5,overflowX:"auto"}}>
          {esPresidente
            ?[{ico:"coin",val:stats.pib,color:"#c9a84c"},{ico:"sword",val:stats.militar,color:"#ff4444"},{ico:"users",val:stats.aprobacion,color:"#ff44aa"},{ico:"oil",val:stats.petroleo,color:"#ff8800"},{ico:"wheat",val:stats.comida,color:"#44cc44"},{ico:"bolt",val:stats.energia,color:"#44aaff"}].map((s,i)=>(
              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",background:"linear-gradient(180deg,rgba(30,20,5,0.95),rgba(10,6,2,0.98))",border:`1px solid ${s.color}44`,borderRadius:8,padding:"6px 8px",minWidth:48,position:"relative",overflow:"hidden",flexShrink:0,boxShadow:`0 0 10px ${s.color}22,0 3px 0 rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.07)`}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${s.color}88,transparent)`}}/>
                <div style={{position:"absolute",bottom:0,left:0,right:0,height:`${s.val*0.4}%`,background:`${s.color}0a`,transition:"height 1.5s ease"}}/>
                <Icon type={s.ico} size={15} color={s.color} glow/>
                <span style={{fontSize:12,color:s.val>60?"#44ff88":s.val>35?s.color:"#ff4444",fontFamily:"'Orbitron',monospace",fontWeight:700,textShadow:"0 0 8px currentColor",marginTop:2}}>{s.val}<span style={{fontSize:7,opacity:.6}}>%</span></span>
              </div>
            ))
            :<div style={{display:"flex",gap:6,alignItems:"center",width:"100%"}}>
              {[{label:"Poder",val:`${jugador?.poder_politico||0}/100`,color:"#f0c040"},{label:"Partido",val:jugador?.partido||"—",color:"#44ff88",small:true},{label:"Energía",val:`⚡${energia}/100`,color:energia>30?"#44aaff":"#ff4444"}].map((d,i)=>(
                <div key={i} style={{flex:1,background:"linear-gradient(180deg,rgba(30,20,5,0.95),rgba(10,6,2,0.98))",border:`1px solid ${d.color}33`,borderRadius:8,padding:"5px 8px",textAlign:"center",boxShadow:`0 0 8px ${d.color}15,0 3px 0 rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06)`}}>
                  <div style={{fontSize:9,color:"rgba(160,128,64,0.6)",textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:"'Rajdhani',sans-serif",fontWeight:600}}>{d.label}</div>
                  <div style={{fontSize:d.small?10:14,color:d.color,fontFamily:"'Orbitron',monospace",fontWeight:700,textShadow:`0 0 8px ${d.color}88`,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{d.val}</div>
                </div>
              ))}
            </div>
          }
        </div>
      </div>

      <div style={{padding:"10px 12px",paddingBottom:92,position:"relative",zIndex:1}}>

        {/* PANEL */}
        {tab==="panel" && (
          <div style={{animationName:"slideInUp",animationDuration:"0.35s",animationTimingFunction:"cubic-bezier(0.34,1.2,0.64,1)",animationFillMode:"both"}}>

            {/* ── CIUDADANO PANEL ── */}
            {esCiudadano && (
              <div style={{background:"linear-gradient(135deg,rgba(10,20,8,0.96),rgba(6,12,4,0.98))",border:"1px solid rgba(68,255,136,0.22)",borderRadius:12,padding:14,marginBottom:12,position:"relative",overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.6),inset 0 1px 0 rgba(68,255,136,0.08)"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#44ff88,transparent)",animationName:"pulse-glow",animationDuration:"2s",animationTimingFunction:"ease-in-out",animationIterationCount:"infinite"}}/>
                <div style={{fontSize:10,color:"#44cc88",letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:10,fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>⚡ PANEL CIUDADANO</div>
                <p style={{fontSize:13,color:"#5a6a5a",lineHeight:1.8,marginBottom:12,fontFamily:"'Rajdhani',sans-serif"}}>Crea un partido, acumula poder político y haz un golpe de estado para convertirte en Presidente.</p>
                <div style={{background:"rgba(0,0,0,0.5)",borderRadius:8,padding:10,marginBottom:10,border:"1px solid rgba(255,255,255,0.04)",boxShadow:"inset 0 2px 4px rgba(0,0,0,0.4)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:11,color:"#7a6040",fontFamily:"'Rajdhani',sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em"}}>Poder Político</span>
                    <span style={{fontSize:14,color:"#f0c040",fontFamily:"'Orbitron',monospace",fontWeight:700,textShadow:"0 0 10px rgba(240,192,64,0.6)"}}>{jugador?.poder_politico||0}<span style={{fontSize:9,opacity:.5}}>/100</span></span>
                  </div>
                  <div style={{height:10,background:"rgba(0,0,0,0.6)",borderRadius:5,overflow:"hidden",border:"1px solid rgba(255,255,255,0.04)"}}>
                    <div style={{height:"100%",width:`${jugador?.poder_politico||0}%`,background:"linear-gradient(90deg,#c9a84c,#f0c040,#ffe080)",borderRadius:5,transition:"width 1s ease",boxShadow:"0 0 14px rgba(240,192,64,0.8),0 0 28px rgba(240,192,64,0.3)",position:"relative"}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:"50%",background:"rgba(255,255,255,0.25)",borderRadius:"5px 5px 0 0"}}/>
                    </div>
                  </div>
                  <div style={{fontSize:10,color:"#3a3020",marginTop:4,fontFamily:"'Rajdhani',sans-serif"}}>Necesitas ≥10 para intentar golpe de estado</div>
                </div>
                <div style={{background:"rgba(0,0,0,0.5)",borderRadius:8,padding:10,marginBottom:12,border:"1px solid rgba(255,255,255,0.04)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:12,color:colorNivel(nivel),fontWeight:700,fontFamily:"'Rajdhani',sans-serif"}}>{tituloNivel(nivel)} Nv.{nivel}</span>
                    <span style={{fontSize:10,color:"#4a4030",fontFamily:"'Orbitron',monospace"}}>{xp} XP · ${dinero?.toLocaleString()}</span>
                  </div>
                  <div style={{height:7,background:"rgba(0,0,0,0.6)",borderRadius:4,overflow:"hidden",border:"1px solid rgba(255,255,255,0.04)"}}>
                    <div style={{height:"100%",width:`${Math.min(100,Math.max(0,((xp-xpParaNivel(nivel))/(xpParaNivel(nivel+1)-xpParaNivel(nivel)))*100))}%`,background:`linear-gradient(90deg,${colorNivel(nivel)}88,${colorNivel(nivel)})`,borderRadius:4,boxShadow:`0 0 10px ${colorNivel(nivel)}`,transition:"width 0.8s ease"}}/>
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  {[{fn:trabajar,c:"#4488ff",label:"💼 TRABAJAR"},{fn:()=>!jugador?.partido&&setShowCreateParty(true),c:"#f0c040",label:"🏛️ PARTIDO",hide:!!jugador?.partido},{fn:acumularPoder,c:"#44ff88",label:"⚡ PODER"}].filter(b=>!b.hide).map((b,i)=>(
                    <GlowBtn key={i} onClick={b.fn} style={{padding:"11px 4px",borderRadius:8,fontSize:12,fontWeight:700,letterSpacing:"0.05em",background:`linear-gradient(180deg,rgba(30,20,5,0.95),rgba(10,6,2,0.98))`,color:b.c,border:`1px solid ${b.c}44`,boxShadow:`0 0 12px ${b.c}22,0 3px 0 rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.08)`}}>{b.label}</GlowBtn>
                  ))}
                </div>
              </div>
            )}

            {esPresidente && (
              <>
                {/* XP + Money + Energy row */}
                <div style={{background:"linear-gradient(135deg,rgba(201,168,76,0.07),rgba(0,0,0,0.4))",border:"1px solid rgba(201,168,76,0.2)",borderRadius:12,padding:12,marginBottom:12,display:"flex",gap:10,alignItems:"center",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(201,168,76,0.6),transparent)"}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,color:colorNivel(nivel),fontWeight:700,fontFamily:"'Rajdhani',sans-serif",letterSpacing:"0.05em"}}>Nv.{nivel} — {tituloNivel(nivel)}</div>
                    <div style={{height:4,background:"rgba(255,255,255,0.05)",borderRadius:2,overflow:"hidden",marginTop:4,width:110}}>
                      <div style={{height:"100%",width:`${Math.min(100,Math.max(0,((xp-xpParaNivel(nivel))/(xpParaNivel(nivel+1)-xpParaNivel(nivel)))*100))}%`,background:colorNivel(nivel),borderRadius:2,boxShadow:`0 0 4px ${colorNivel(nivel)}`}}/>
                    </div>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:12,color:"#f0c040",fontFamily:"'Orbitron',monospace",fontWeight:700,textShadow:"0 0 6px rgba(240,192,64,0.4)"}}>{xp} <span style={{fontSize:9,opacity:0.6}}>XP</span></div>
                    <div style={{fontSize:11,color:"#66bb6a",fontFamily:"'Orbitron',monospace",fontWeight:600}}>${dinero?.toLocaleString()}</div>
                  </div>
                  <div style={{textAlign:"center",minWidth:64}}>
                    <div style={{fontSize:11,color:energia>30?"#4fc3f7":"#ff5252",fontFamily:"'Orbitron',monospace",fontWeight:700}}>⚡{energia}<span style={{fontSize:9,opacity:0.5}}>/100</span></div>
                    <div style={{height:4,background:"rgba(255,255,255,0.05)",borderRadius:2,marginTop:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${energia}%`,background:energia>30?"#03a9f4":"#e53935",borderRadius:2,boxShadow:`0 0 4px currentColor`,transition:"width 1s"}}/>
                    </div>
                  </div>
                </div>

                {/* Big stats cards */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                  {[
                    {label:"ECONOMÍA", val:stats.pib, color:"#c9a84c", icon:"💰", pos:"▲ Estable", neg:"▼ En riesgo"},
                    {label:"APROBACIÓN", val:stats.aprobacion, color:"#e91e63", icon:"👥", pos:"▲ Popular", neg:"▼ Impopular"},
                  ].map((s,i)=>(
                    <div key={i} style={{background:`linear-gradient(135deg,${s.color}12,rgba(0,0,0,0.5))`,border:`1px solid ${s.color}33`,borderRadius:12,padding:14,position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${s.color}88,transparent)`}}/>
                      {/* bg fill level */}
                      <div style={{position:"absolute",bottom:0,left:0,right:0,height:`${s.val}%`,background:`${s.color}06`,transition:"height 1.5s ease"}}/>
                      <div style={{fontSize:9,color:`${s.color}88`,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:4,fontFamily:"'Rajdhani',sans-serif",fontWeight:700,position:"relative"}}>{s.icon} {s.label}</div>
                      <div style={{fontSize:32,color:s.color,fontFamily:"'Orbitron',monospace",fontWeight:900,textShadow:`0 0 16px ${s.color}66`,lineHeight:1,position:"relative"}}>{s.val}<span style={{fontSize:14}}>%</span></div>
                      <div style={{fontSize:11,color:s.val>50?"#66bb6a":"#ff5252",marginTop:4,fontFamily:"'Rajdhani',sans-serif",fontWeight:600,position:"relative"}}>{s.val>50?s.pos:s.neg}</div>
                    </div>
                  ))}
                </div>

                {/* Alerts */}
                {stats.rebeldia>60 && (
                  <div style={{background:"linear-gradient(135deg,rgba(229,57,53,0.1),rgba(0,0,0,0.4))",border:"1px solid rgba(229,57,53,0.4)",borderRadius:10,padding:"10px 14px",marginBottom:10,display:"flex",gap:10,alignItems:"center",animation:"pulse-glow 2s ease-in-out infinite"}}>
                    <span style={{fontSize:22}}>⚠️</span>
                    <div>
                      <div style={{fontSize:12,color:"#ff5252",fontWeight:700,fontFamily:"'Rajdhani',sans-serif",letterSpacing:"0.05em"}}>ALTA REBELDÍA — {stats.rebeldia}%</div>
                      <div style={{fontSize:11,color:"#6a4040",marginTop:1,fontFamily:"'Rajdhani',sans-serif"}}>Ciudadanos podrían intentar un golpe de estado.</div>
                    </div>
                  </div>
                )}
                {stats.aprobacion<30 && (
                  <div style={{background:"linear-gradient(135deg,rgba(229,57,53,0.1),rgba(0,0,0,0.4))",border:"1px solid rgba(229,57,53,0.4)",borderRadius:10,padding:"10px 14px",marginBottom:10,display:"flex",gap:10,alignItems:"center",animation:"pulse-glow 2s ease-in-out infinite"}}>
                    <span style={{fontSize:22}}>🗳️</span>
                    <div>
                      <div style={{fontSize:12,color:"#ff5252",fontWeight:700,fontFamily:"'Rajdhani',sans-serif",letterSpacing:"0.05em"}}>APROBACIÓN CRÍTICA — {stats.aprobacion}%</div>
                      <div style={{fontSize:11,color:"#6a4040",marginTop:1,fontFamily:"'Rajdhani',sans-serif"}}>Eres vulnerable a golpes de estado. Actúa.</div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── INDICADORES NACIONALES ── */}
            <div style={{background:"linear-gradient(160deg,#181006 0%,#100c04 50%,#080600 100%)",border:"1px solid rgba(201,168,76,0.3)",borderRadius:14,padding:"14px 12px",position:"relative",overflow:"hidden",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.08),inset 0 -2px 0 rgba(0,0,0,0.6),0 8px 32px rgba(0,0,0,0.8)"}}>
              {/* Top gold line */}
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,rgba(201,168,76,0.4) 20%,rgba(255,220,100,0.9) 50%,rgba(201,168,76,0.4) 80%,transparent)"}}/>
              {/* Top sheen */}
              <div style={{position:"absolute",top:0,left:0,right:0,height:"30%",background:"linear-gradient(to bottom,rgba(255,255,255,0.04),transparent)",pointerEvents:"none"}}/>
              {/* Corner decorations */}
              <div style={{position:"absolute",top:8,left:8,width:16,height:16,borderTop:"2px solid rgba(201,168,76,0.6)",borderLeft:"2px solid rgba(201,168,76,0.6)",borderRadius:"3px 0 0 0"}}/>
              <div style={{position:"absolute",top:8,right:8,width:16,height:16,borderTop:"2px solid rgba(201,168,76,0.6)",borderRight:"2px solid rgba(201,168,76,0.6)",borderRadius:"0 3px 0 0"}}/>
              <div style={{position:"absolute",bottom:8,left:8,width:16,height:16,borderBottom:"2px solid rgba(201,168,76,0.6)",borderLeft:"2px solid rgba(201,168,76,0.6)",borderRadius:"0 0 0 3px"}}/>
              <div style={{position:"absolute",bottom:8,right:8,width:16,height:16,borderBottom:"2px solid rgba(201,168,76,0.6)",borderRight:"2px solid rgba(201,168,76,0.6)",borderRadius:"0 0 3px 0"}}/>
              {/* Title */}
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,paddingBottom:10,borderBottom:"1px solid rgba(201,168,76,0.15)"}}>
                <Icon type="panel" size={16} color="#c9a84c" glow/>
                <span style={{fontSize:11,color:"#c9a84c",letterSpacing:"0.2em",textTransform:"uppercase",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,textShadow:"0 0 8px rgba(201,168,76,0.5)"}}>Indicadores Nacionales</span>
              </div>
              <ResourceBar icon={<Icon type="coin" size={20} color="#c9a84c" glow/>} label="PIB Nacional" value={stats.pib} color="#c9a84c" />
              <ResourceBar icon={<Icon type="oil" size={20} color="#ff8800" glow/>} label="Petróleo" value={stats.petroleo} color="#ff8800" />
              <ResourceBar icon={<Icon type="wheat" size={20} color="#44cc44" glow/>} label="Comida" value={stats.comida} color="#44cc44" />
              <ResourceBar icon={<Icon type="bolt" size={20} color="#44aaff" glow/>} label="Energía" value={stats.energia} color="#44aaff" />
              <ResourceBar icon={<Icon type="factory" size={20} color="#aa44ff" glow/>} label="Industria" value={stats.industria} color="#aa44ff" />
              <ResourceBar icon={<Icon type="users" size={20} color="#ff44aa" glow/>} label="Aprobación" value={stats.aprobacion} color="#ff44aa" />
              <ResourceBar icon={<Icon type="grad" size={20} color="#4466ff" glow/>} label="Educación" value={stats.educacion} color="#4466ff" />
              <ResourceBar icon={<Icon type="heart" size={20} color="#00ddff" glow/>} label="Salud" value={stats.salud} color="#00ddff" />
              <ResourceBar icon={<Icon type="fire" size={20} color="#ff4444" glow/>} label="Rebeldía" value={stats.rebeldia} color="#ff4444" />
              <ResourceBar icon={<Icon type="sword" size={20} color="#ff6644" glow/>} label="Ejército" value={stats.militar} color="#ff6644" />
              <ResourceBar icon={<Icon type="spy" size={20} color="#aa8855" glow/>} label="Inteligencia" value={stats.intel} color="#aa8855" />
            </div>
          </div>
        )}

        {/* DECRETOS */}
        {tab==="decretos" && (
          <div style={{animationName:"slideInUp",animationDuration:"0.35s",animationTimingFunction:"cubic-bezier(0.34,1.2,0.64,1)",animationFillMode:"both"}}>
            {/* ── Header ── */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,padding:"10px 14px",background:"linear-gradient(135deg,#1e1408,#120e04)",border:"1px solid rgba(201,168,76,0.3)",borderRadius:10,boxShadow:"inset 0 1px 0 rgba(255,255,255,0.08),0 3px 0 rgba(0,0,0,0.5)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <Icon type="scroll" size={18} color="#c9a84c" glow/>
                <span style={{fontSize:11,color:"#c9a84c",letterSpacing:"0.18em",textTransform:"uppercase",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,textShadow:"0 0 8px rgba(201,168,76,0.5)"}}>Decretos Presidenciales</span>
              </div>
              {esPresidente && (
                <div style={{background:decreeUsed.length>=3?"linear-gradient(135deg,#3a0808,#200404)":"linear-gradient(135deg,#2a1e04,#1a1202)",border:`1px solid ${decreeUsed.length>=3?"rgba(255,80,80,0.6)":"rgba(240,192,64,0.6)"}`,color:decreeUsed.length>=3?"#ff5555":"#f0c040",padding:"5px 14px",borderRadius:20,fontSize:13,fontFamily:"'Orbitron',monospace",fontWeight:700,boxShadow:decreeUsed.length>=3?"0 0 12px rgba(255,80,80,0.4)":"0 0 12px rgba(240,192,64,0.4)"}}>
                  {3-decreeUsed.length}/3 HOY
                </div>
              )}
            </div>

            {esCiudadano && (
              <div style={{background:"linear-gradient(135deg,#141e10,#0c1008)",border:"1px solid rgba(68,200,100,0.3)",borderRadius:12,padding:20,marginBottom:14,textAlign:"center",position:"relative",overflow:"hidden",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06),0 4px 0 rgba(0,0,0,0.5)"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#44cc66,transparent)"}}/>
                <Icon type="shield" size={40} color="#44cc66"/>
                <div style={{fontSize:15,color:"#44cc66",fontWeight:700,margin:"12px 0 8px",fontFamily:"'Rajdhani',sans-serif",letterSpacing:"0.08em"}}>SOLO PRESIDENTES</div>
                <div style={{fontSize:13,color:"#4a6040",lineHeight:1.8,marginBottom:16,fontFamily:"'Rajdhani',sans-serif"}}>Para emitir decretos necesitas convertirte en presidente.</div>
                <GlowBtn onClick={()=>setTab("guerra")} style={{padding:"12px 20px",borderRadius:8,fontSize:13,fontWeight:700,letterSpacing:"0.06em",background:"linear-gradient(180deg,#2a1e04,#1a1202)",color:"#f0c040",border:"1px solid rgba(201,168,76,0.5)",boxShadow:"0 0 14px rgba(201,168,76,0.2),0 3px 0 rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.08)"}}>
                  <Icon type="war" size={14} color="#f0c040"/> VER PRESIDENTES
                </GlowBtn>
              </div>
            )}

            {esPresidente && (<>
              {/* Consecuencias panel */}
              {selectedDecree && (
                <div style={{background:"linear-gradient(135deg,#201a06,#140e04)",border:"1px solid rgba(201,168,76,0.4)",borderRadius:12,padding:16,marginBottom:14,position:"relative",overflow:"hidden",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.08),0 4px 0 rgba(0,0,0,0.5)"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,rgba(201,168,76,0.9),rgba(255,220,100,1),rgba(201,168,76,0.9),transparent)"}}/>
                  <div style={{fontSize:12,color:"#f0c040",marginBottom:10,fontWeight:700,display:"flex",alignItems:"center",gap:8,fontFamily:"'Rajdhani',sans-serif",letterSpacing:"0.08em",textShadow:"0 0 8px rgba(240,192,64,0.5)"}}>
                    <span style={{fontSize:22}}>{selectedDecree.icon}</span>
                    {selectedDecree.name.toUpperCase()} — CONSECUENCIAS
                  </div>
                  {decreeLoading
                    ? <div style={{color:"#7a6030",fontSize:13,display:"flex",alignItems:"center",gap:10,fontFamily:"'Rajdhani',sans-serif"}}>
                        <div style={{width:16,height:16,border:"2px solid rgba(201,168,76,0.3)",borderTop:"2px solid #c9a84c",borderRadius:"50%",animationName:"spin",animationDuration:"0.9s",animationTimingFunction:"linear",animationIterationCount:"infinite"}}/>
                        Evaluando impacto internacional...
                      </div>
                    : <div style={{color:"#d0c090",fontSize:13,lineHeight:2,fontFamily:"'Rajdhani',sans-serif",fontWeight:500}}>{decreeResponse}</div>
                  }
                </div>
              )}
              {/* Decreto cards */}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {DECREES.map(d=>{
                  const used=decreeUsed.includes(d.id);
                  const exhausted=decreeUsed.length>=3&&!used;
                  const active=selectedDecree?.id===d.id;
                  return (
                    <button key={d.id} onClick={()=>issueDecree(d)} disabled={used||exhausted}
                      style={{background:used?"linear-gradient(135deg,#100c04,#0a0802)":active?"linear-gradient(135deg,#281e06,#1a1404)":"linear-gradient(135deg,#1e1608,#140e04)",
                        border:`2px solid ${used?"rgba(255,255,255,0.06)":active?"rgba(240,192,64,0.7)":"rgba(201,168,76,0.25)"}`,
                        borderLeft:`4px solid ${used?"rgba(255,255,255,0.06)":active?"#f0c040":"rgba(201,168,76,0.4)"}`,
                        borderRadius:12,padding:"14px 16px",textAlign:"left",
                        cursor:used||exhausted?"not-allowed":"pointer",
                        opacity:used||exhausted?0.45:1,
                        boxShadow:active?"0 0 20px rgba(201,168,76,0.2),inset 0 1px 0 rgba(255,255,255,0.08),0 4px 0 rgba(0,0,0,0.5)":"inset 0 1px 0 rgba(255,255,255,0.05),0 3px 0 rgba(0,0,0,0.4)",
                        position:"relative",overflow:"hidden",fontFamily:"'Rajdhani',sans-serif"}}>
                      {active&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#f0c040,transparent)"}}/>}
                      {/* Top sheen */}
                      <div style={{position:"absolute",top:0,left:0,right:0,height:"40%",background:"linear-gradient(to bottom,rgba(255,255,255,0.05),transparent)",pointerEvents:"none"}}/>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",position:"relative"}}>
                        <div style={{display:"flex",gap:14,flex:1}}>
                          {/* Icon 3D box */}
                          <div style={{width:48,height:48,flexShrink:0,background:active?"linear-gradient(145deg,rgba(201,168,76,0.35),rgba(201,168,76,0.15))":"linear-gradient(145deg,rgba(255,255,255,0.08),rgba(0,0,0,0.3))",border:`1px solid ${active?"rgba(201,168,76,0.6)":"rgba(255,255,255,0.1)"}`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:"inset 0 1px 0 rgba(255,255,255,0.15),0 3px 0 rgba(0,0,0,0.5)",position:"relative",overflow:"hidden"}}>
                            <div style={{position:"absolute",top:0,left:0,right:0,height:"50%",background:"rgba(255,255,255,0.08)",borderRadius:"10px 10px 0 0"}}/>
                            <span style={{position:"relative"}}>{d.icon}</span>
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:15,color:used?"#4a4030":"#f0e8c8",marginBottom:3,fontWeight:700,letterSpacing:"0.04em",fontFamily:"'Rajdhani',sans-serif"}}>{d.name}</div>
                            <div style={{fontSize:12,color:"#6a5830",marginBottom:6,fontFamily:"'Rajdhani',sans-serif"}}>{d.desc}</div>
                            <div style={{fontSize:11,color:active?"#f0c040":"#c9a84c",fontFamily:"'Orbitron',monospace",fontWeight:700,textShadow:active?"0 0 8px rgba(240,192,64,0.6)":"none"}}>{d.effect}</div>
                          </div>
                        </div>
                        {used&&<span style={{fontSize:9,color:"#44cc66",border:"1px solid rgba(68,204,102,0.4)",padding:"4px 10px",borderRadius:6,flexShrink:0,fontFamily:"'Rajdhani',sans-serif",fontWeight:700,letterSpacing:"0.08em",background:"rgba(68,204,102,0.1)",boxShadow:"0 0 8px rgba(68,204,102,0.2)"}}>✓ EMITIDO</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>)}
          </div>
        )}

        {/* DIPLOMACIA / GOLPES */}
        {tab==="diplomacia" && (
          <div>
            <div style={{fontSize:11,color:"#c9a84c",letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>
              {esPresidente?"🤝 Diplomacia Internacional":"⚔️ Presidentes — Objetivos de Golpe"}
            </div>

            {esPresidente && !allianceAccepted && (
              <div style={{background:"rgba(76,175,80,0.06)",border:"1px solid rgba(76,175,80,0.3)",borderRadius:8,padding:14,marginBottom:14}}>
                <div style={{fontSize:12,color:"#4caf50",marginBottom:8,fontWeight:"bold"}}>📩 Propuesta Pendiente — Brasil</div>
                <div style={{fontSize:13,color:"#bbb",marginBottom:12,lineHeight:1.7}}><strong style={{color:"#fff"}}>Brasil</strong> solicita un Pacto de No Agresión (30 días). A cambio: <span style={{color:"#4caf50"}}>+15% comercio, +5% PIB</span></div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{tg?.HapticFeedback?.notificationOccurred("success");setAllianceAccepted(true);setStats(s=>({...s,pib:clamp(s.pib+5),aprobacion:clamp(s.aprobacion+3)}));showNotif("✅ Alianza con Brasil confirmada","info");}} style={{flex:1,background:"rgba(76,175,80,0.2)",border:"1px solid #4caf50",color:"#4caf50",padding:"11px",borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:"bold"}}>✅ ACEPTAR</button>
                  <button onClick={()=>{tg?.HapticFeedback?.notificationOccurred("error");setStats(s=>({...s,aprobacion:clamp(s.aprobacion-2)}));showNotif("❌ Propuesta rechazada","error");}} style={{flex:1,background:"rgba(229,57,53,0.1)",border:"1px solid #e53935",color:"#e53935",padding:"11px",borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>❌ RECHAZAR</button>
                </div>
              </div>
            )}

            {esCiudadano && (
              <div style={{background:"rgba(229,57,53,0.06)",border:"1px solid rgba(229,57,53,0.2)",borderRadius:8,padding:12,marginBottom:14}}>
                <div style={{fontSize:12,color:"#e53935",marginBottom:4,fontWeight:"bold"}}>⚔️ Modo Golpista</div>
                <div style={{fontSize:12,color:"#888"}}>Tu poder político: <strong style={{color:"#c9a84c"}}>{jugador?.poder_politico||0}/100</strong> · Necesitas ≥10 para intentar un golpe.</div>
              </div>
            )}

            <div style={{fontSize:11,color:"#6a6a8a",letterSpacing:1,marginBottom:10,textTransform:"uppercase"}}>
              {esPresidente?"Presidentes Activos":"Presidentes (Objetivos Potenciales)"}
            </div>

            {otrosJugadores.filter(j=>j.id!==jugador?.id&&j.rol==="presidente").slice(0,10).map((j,i)=>{
              const jideo=IDEOLOGIES[j.ideologia]||IDEOLOGIES.democracia;
              return (
                <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:8,padding:"12px 14px",marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",gap:10,alignItems:"center"}}>
                      <div style={{width:36,height:36,borderRadius:"50%",background:`${jideo.color}22`,border:`1px solid ${jideo.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{jideo.icon}</div>
                      <div>
                        <div style={{fontSize:13,color:"#e8e8e8",fontWeight:"bold"}}>{j.nombre}</div>
                        <div style={{fontSize:11,color:jideo.color}}>{j.pais} · {jideo.label}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      {esPresidente && <button onClick={()=>{tg?.HapticFeedback?.impactOccurred("light");showNotif(`✉ Propuesta enviada a ${j.nombre}`,"info");}} style={{background:"transparent",border:`1px solid ${jideo.color}44`,color:jideo.color,padding:"6px 10px",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>CONTACTAR</button>}
                      {esCiudadano && <button onClick={()=>iniciarGolpe(j)} style={{background:"rgba(229,57,53,0.15)",border:"1px solid rgba(229,57,53,0.4)",color:"#e53935",padding:"6px 10px",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:"bold"}}>⚔️ GOLPE</button>}
                    </div>
                  </div>
                </div>
              );
            })}

            {esPresidente && (
              <>
                <div style={{fontSize:11,color:"#6a6a8a",letterSpacing:1,marginBottom:10,marginTop:16,textTransform:"uppercase"}}>Acciones Diplomáticas</div>
                {[["🤝","Proponer Alianza","Invitar a otro país a aliarse",()=>showNotif("🤝 Selecciona un presidente para proponer alianza","info")],["📦","Embargo Económico","Bloquear comercio con un rival",()=>{setStats(s=>({...s,pib:clamp(s.pib-3)}));showNotif("📦 Embargo declarado — PIB -3%","error");}],["🕵️","Operación Espionaje","Infiltrar inteligencia rival",()=>{setStats(s=>({...s,intel:clamp(s.intel+10)}));showNotif("🕵️ Operación exitosa +10 Intel","info");}],["📢","Discurso en ONU","Influir en opinión global",()=>{setStats(s=>({...s,aprobacion:clamp(s.aprobacion+5)}));showNotif("📢 Discurso aplaudido +5 Aprobación","info");}]].map(([icon,name,desc,action],i)=>(
                  <button key={i} onClick={()=>{tg?.HapticFeedback?.impactOccurred("medium");action();}} style={{width:"100%",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:8,padding:"13px 14px",marginBottom:8,textAlign:"left",cursor:"pointer",display:"flex",gap:12,alignItems:"center",fontFamily:"Georgia,serif"}}>
                    <div style={{width:38,height:38,borderRadius:8,background:"rgba(201,168,76,0.1)",border:"1px solid rgba(201,168,76,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{icon}</div>
                    <div><div style={{fontSize:13,color:"#ddd",fontWeight:"bold"}}>{name}</div><div style={{fontSize:11,color:"#666",marginTop:2}}>{desc}</div></div>
                    <div style={{marginLeft:"auto",color:"#444",fontSize:18}}>›</div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}

        {/* PARTIDOS */}
        {tab==="partidos" && (
          <div>
            <div style={{fontSize:11,color:"#c9a84c",letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>🏛️ Partidos Políticos</div>

            {!jugador?.partido ? (
              <div style={{background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.25)",borderRadius:8,padding:20,marginBottom:20,textAlign:"center"}}>
                <div style={{fontSize:32,marginBottom:8}}>🏴</div>
                <div style={{fontSize:14,color:"#c9a84c",fontWeight:"bold",marginBottom:8}}>Sin partido político</div>
                <div style={{fontSize:13,color:"#888",marginBottom:16,lineHeight:1.7}}>Crea tu partido para reclutar miembros, acumular poder político y competir por el control de naciones.</div>
                <button onClick={()=>setShowCreateParty(true)} style={{background:"linear-gradient(135deg,#c9a84c,#a07830)",border:"none",color:"#0a0e1a",padding:"12px 24px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:"bold",letterSpacing:1}}>🏛️ FUNDAR PARTIDO</button>
              </div>
            ) : (
              <div style={{background:`linear-gradient(135deg,${ideo.color}15,${ideo.color}08)`,border:`1px solid ${ideo.color}44`,borderRadius:8,padding:16,marginBottom:20}}>
                <div style={{fontSize:10,color:ideo.color,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>MI PARTIDO</div>
                <div style={{fontSize:20,color:"#e8e8e8",marginBottom:4,fontWeight:"bold"}}>{ideo.icon} {partyName}</div>
                <div style={{fontSize:12,color:ideo.color,marginBottom:14}}>{ideo.label} · Fundador: {leaderName} · {selectedCountry}</div>
                <div style={{display:"flex",gap:0,marginBottom:16,background:"rgba(0,0,0,0.2)",borderRadius:8,overflow:"hidden",border:"1px solid rgba(255,255,255,0.06)"}}>
                  {[["1","Miembros"],["1","Países"],["#1","Ranking"]].map(([v,l],i)=><div key={l} style={{flex:1,textAlign:"center",padding:"10px 0",borderRight:i<2?"1px solid rgba(255,255,255,0.06)":"none"}}><div style={{fontSize:22,color:"#c9a84c",fontFamily:"monospace",fontWeight:"bold"}}>{v}</div><div style={{fontSize:10,color:"#666",textTransform:"uppercase",letterSpacing:0.5}}>{l}</div></div>)}
                </div>
                <button onClick={()=>showNotif("📤 Link de invitación copiado","info")} style={{width:"100%",background:`${ideo.color}22`,border:`1px solid ${ideo.color}55`,color:ideo.color,padding:"11px",borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif",letterSpacing:1,fontWeight:"bold"}}>📤 INVITAR MIEMBROS</button>
              </div>
            )}

            <div style={{fontSize:11,color:"#6a6a8a",letterSpacing:1,marginBottom:12,textTransform:"uppercase"}}>Todos los jugadores ({otrosJugadores.length})</div>
            {otrosJugadores.filter(j=>j.id!==jugador?.id).slice(0,15).map((j,i)=>{
              const jideo=IDEOLOGIES[j.ideologia]||IDEOLOGIES.democracia;
              return (
                <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:8,padding:14,marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",gap:10,alignItems:"center"}}>
                      <div style={{width:36,height:36,borderRadius:"50%",background:`${jideo.color}22`,border:`1px solid ${jideo.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{jideo.icon}</div>
                      <div>
                        <div style={{fontSize:13,color:"#e8e8e8",fontWeight:"bold"}}>{j.nombre}</div>
                        <div style={{fontSize:11,display:"flex",alignItems:"center",gap:6}}>
                          <span style={{color:jideo.color}}>{j.pais}</span>
                          <span style={{background:j.rol==="presidente"?"rgba(201,168,76,0.15)":"rgba(76,175,80,0.15)",color:j.rol==="presidente"?"#c9a84c":"#4caf50",padding:"1px 6px",borderRadius:10,fontSize:9}}>{j.rol==="presidente"?"PRES":"CIU"}</span>
                        </div>
                        {j.partido && <div style={{fontSize:10,color:"#555",marginTop:2}}>🏛️ {j.partido}</div>}
                      </div>
                    </div>
                    <button onClick={()=>showNotif(`📨 Invitación enviada a ${j.nombre}`,"info")} style={{background:"transparent",border:`1px solid ${jideo.color}44`,color:jideo.color,padding:"6px 12px",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>INVITAR</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* RANKING */}
        {tab==="ranking" && (
          <div style={{animationName:"slideInUp",animationDuration:"0.35s",animationTimingFunction:"cubic-bezier(0.34,1.2,0.64,1)",animationFillMode:"both"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,padding:"10px 14px",background:"linear-gradient(135deg,#201a06,#140e04)",border:"1px solid rgba(240,192,64,0.35)",borderRadius:10,boxShadow:"inset 0 1px 0 rgba(255,255,255,0.08),0 3px 0 rgba(0,0,0,0.5)"}}>
              <Icon type="star" size={18} color="#f0c040" glow/>
              <span style={{fontSize:11,color:"#f0c040",letterSpacing:"0.18em",textTransform:"uppercase",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,textShadow:"0 0 8px rgba(240,192,64,0.5)"}}>Ranking Mundial</span>
            </div>
            {rankingData.length===0?(
              <div style={{textAlign:"center",padding:40,fontFamily:"'Rajdhani',sans-serif",fontSize:14,color:"#4a3820"}}>Cargando ranking...</div>
            ):rankingData.map((j,i)=>{
              const jideo=IDEOLOGIES[j.ideologia]||IDEOLOGIES.democracia;
              const medalColor=i===0?"#FFD700":i===1?"#C0C0C0":i===2?"#CD7F32":"#5a4020";
              const tuPosicion=j.id===jugador?.id;
              return (
                <div key={i} style={{background:tuPosicion?"linear-gradient(135deg,#281e06,#1a1404)":"linear-gradient(135deg,#1a1408,#100c04)",border:`1px solid ${tuPosicion?"rgba(240,192,64,0.5)":"rgba(201,168,76,0.15)"}`,borderLeft:`3px solid ${i===0?"#FFD700":i===1?"#C0C0C0":i===2?"#CD7F32":"rgba(201,168,76,0.2)"}`,borderRadius:10,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12,position:"relative",overflow:"hidden",boxShadow:tuPosicion?"inset 0 1px 0 rgba(255,255,255,0.1),0 4px 0 rgba(0,0,0,0.5),0 0 20px rgba(240,192,64,0.1)":"inset 0 1px 0 rgba(255,255,255,0.05),0 3px 0 rgba(0,0,0,0.4)"}}>
                  {tuPosicion&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,rgba(240,192,64,0.9),transparent)"}}/>}
                  <div style={{position:"absolute",top:0,left:0,right:0,height:"40%",background:"linear-gradient(to bottom,rgba(255,255,255,0.04),transparent)",pointerEvents:"none"}}/>
                  <div style={{width:40,height:40,borderRadius:9,background:`linear-gradient(145deg,${medalColor}33,${medalColor}11)`,border:`2px solid ${medalColor}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:i<3?22:13,fontFamily:"'Orbitron',monospace",fontWeight:700,color:medalColor,flexShrink:0,boxShadow:i<3?`0 0 14px ${medalColor}55,0 3px 0 rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.15)`:"0 2px 0 rgba(0,0,0,0.4)",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:"50%",background:"rgba(255,255,255,0.1)",borderRadius:"9px 9px 0 0"}}/>
                    <span style={{position:"relative"}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:15,color:tuPosicion?"#f0c040":"#d0b880",fontWeight:700,fontFamily:"'Rajdhani',sans-serif",textShadow:tuPosicion?"0 0 8px rgba(240,192,64,0.4)":"none"}}>{j.nombre}</span>
                        {tuPosicion&&<span style={{fontSize:9,color:"#f0c040",background:"linear-gradient(135deg,rgba(240,192,64,0.2),rgba(160,120,0,0.2))",padding:"2px 7px",borderRadius:4,fontFamily:"'Rajdhani',sans-serif",fontWeight:700,border:"1px solid rgba(240,192,64,0.4)",boxShadow:"0 0 6px rgba(240,192,64,0.3)"}}>TÚ</span>}
                      </div>
                      <span style={{fontSize:15,color:"#f0c040",fontFamily:"'Orbitron',monospace",fontWeight:700,textShadow:"0 0 10px rgba(240,192,64,0.6)"}}>{j.puntuacion}</span>
                    </div>
                    <div style={{fontSize:11,display:"flex",gap:8,marginTop:4,alignItems:"center",fontFamily:"'Rajdhani',sans-serif"}}>
                      <span style={{color:jideo.color,fontWeight:600}}>{jideo.icon} {j.pais}</span>
                      <span style={{background:j.rol==="presidente"?"linear-gradient(135deg,rgba(240,192,64,0.12),rgba(160,120,0,0.1))":"linear-gradient(135deg,rgba(68,204,102,0.1),rgba(0,80,30,0.1))",color:j.rol==="presidente"?"#f0c040":"#44cc66",padding:"2px 8px",borderRadius:4,fontSize:9,fontWeight:700,letterSpacing:"0.08em",border:`1px solid ${j.rol==="presidente"?"rgba(240,192,64,0.3)":"rgba(68,204,102,0.3)"}`}}>{j.rol==="presidente"?"👑 PRES":"⚡ CIU"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}



        {/* GUERRA */}
        {tab==="guerra" && (
          <div style={{animationName:"slideInUp",animationDuration:"0.35s",animationTimingFunction:"cubic-bezier(0.34,1.2,0.64,1)",animationFillMode:"both"}}>

            {/* ══ VISTA: LISTA PRINCIPAL ══ */}
            {vistaGuerra==="lista" && (<>

              {/* Header */}
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,padding:"10px 14px",background:"linear-gradient(135deg,#1e0c08,#140804)",border:"1px solid rgba(255,80,80,0.35)",borderRadius:10,boxShadow:"inset 0 1px 0 rgba(255,255,255,0.08),0 3px 0 rgba(0,0,0,0.5)"}}>
                <Icon type="war" size={18} color="#ff5555" glow/>
                <span style={{fontSize:11,color:"#ff7777",letterSpacing:"0.18em",textTransform:"uppercase",fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>Centro de Guerra</span>
                <div style={{marginLeft:"auto",fontSize:10,fontFamily:"'Orbitron',monospace"}}>
                  {todasGuerrasActivas.length>0?<span style={{color:"#ff4444",animationName:"pulse-glow",animationDuration:"1s",animationIterationCount:"infinite"}}>● {todasGuerrasActivas.length} EN GUERRA</span>:<span style={{color:"#3a5030"}}>● PAZ MUNDIAL</span>}
                </div>
              </div>

              {/* BOTÓN DECLARAR GUERRA */}
              <GlowBtn onClick={()=>setVistaGuerra("elegir_tipo")} color="#ff4444"
                style={{padding:"15px",borderRadius:10,fontSize:14,fontWeight:700,letterSpacing:"0.08em",background:"linear-gradient(180deg,#2a0808,#1a0404)",color:"#ff6644",border:"2px solid rgba(255,80,80,0.55)",boxShadow:"0 0 20px rgba(255,60,60,0.2),0 4px 0 rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.08)",marginBottom:16,display:"block",textAlign:"center"}}>
                ⚔️ DECLARAR GUERRA
              </GlowBtn>

              {/* LISTA DE GUERRAS ACTIVAS */}
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                <Icon type="target" size={14} color="#ff5555" glow/>
                <span style={{fontSize:10,color:"#aa4444",letterSpacing:"0.15em",textTransform:"uppercase",fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>Guerras Activas</span>
              </div>

              {todasGuerrasActivas.length===0?(
                <div style={{textAlign:"center",padding:"30px 20px",background:"linear-gradient(135deg,#1a1008,#100c04)",borderRadius:12,border:"1px solid rgba(255,80,80,0.1)"}}>
                  <div style={{fontSize:32,marginBottom:10}}>🕊️</div>
                  <div style={{fontSize:14,color:"#4a3820",fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>Paz Mundial</div>
                  <div style={{fontSize:12,color:"#3a2810",fontFamily:"'Rajdhani',sans-serif",marginTop:4}}>No hay guerras activas. Sé el primero en declararla.</div>
                </div>
              ):todasGuerrasActivas.map((g,i)=>{
                const total=(g.fuerza_atacante||0)+(g.fuerza_defensor||0)||1;
                const pctA=Math.round((g.fuerza_atacante||0)/total*100);
                const pctD=100-pctA;
                const esMiGuerra=g.atacante_pais===selectedCountry||g.defensor_pais===selectedCountry;
                const msRestantes=new Date(g.fin_movilizacion_at)-Date.now();
                const horas=Math.max(0,Math.floor(msRestantes/3600000));
                const mins=Math.max(0,Math.floor((msRestantes%3600000)/60000));
                return(
                  <div key={i} onClick={()=>{setGuerraViendoId(g.id);setVistaGuerra("combate");loadGuerraActiva();}}
                    style={{background:esMiGuerra?"linear-gradient(135deg,#220808,#160404)":"linear-gradient(135deg,#1a1008,#100804)",border:`2px solid ${esMiGuerra?"rgba(255,60,60,0.45)":"rgba(255,80,80,0.2)"}`,borderRadius:12,padding:"14px",marginBottom:10,cursor:"pointer",position:"relative",overflow:"hidden",boxShadow:esMiGuerra?"0 0 20px rgba(255,0,0,0.1),inset 0 1px 0 rgba(255,255,255,0.07)":"inset 0 1px 0 rgba(255,255,255,0.04),0 3px 0 rgba(0,0,0,0.4)"}}>
                    {esMiGuerra&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#ff4444,transparent)",animationName:"pulse-glow",animationDuration:"1.5s",animationIterationCount:"infinite"}}/>}
                    <div style={{position:"absolute",top:0,left:0,right:0,height:"40%",background:"linear-gradient(to bottom,rgba(255,255,255,0.04),transparent)",pointerEvents:"none"}}/>

                    {/* Top row */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{fontSize:18}}>{TIPOS_GUERRA[g.tipo]?.icon||"⚔️"}</div>
                        <div>
                          <div style={{fontSize:13,color:"#f0e0b0",fontWeight:700,fontFamily:"'Rajdhani',sans-serif"}}>{g.atacante_pais} <span style={{color:"#ff4444"}}>vs</span> {g.defensor_pais}</div>
                          <div style={{fontSize:10,color:"#6a4828",fontFamily:"'Rajdhani',sans-serif"}}>{TIPOS_GUERRA[g.tipo]?.label||g.tipo}</div>
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:9,color:g.fase==="movilizacion"?"#ff8844":"#ff4444",background:g.fase==="movilizacion"?"rgba(255,136,68,0.12)":"rgba(255,60,60,0.12)",padding:"3px 8px",borderRadius:4,border:`1px solid ${g.fase==="movilizacion"?"rgba(255,136,68,0.3)":"rgba(255,60,60,0.3)"}`,fontFamily:"'Rajdhani',sans-serif",fontWeight:700,marginBottom:4}}>{g.fase==="movilizacion"?"📢 MOVILIZACIÓN":"⚔️ BATALLA"}</div>
                        {g.fase==="movilizacion"&&<div style={{fontSize:11,color:"#ff6644",fontFamily:"'Orbitron',monospace",fontWeight:700}}>{horas}h {mins}m</div>}
                      </div>
                    </div>

                    {/* Barra de fuerzas */}
                    <div style={{height:16,background:"rgba(0,0,0,0.6)",borderRadius:8,overflow:"hidden",border:"1px solid rgba(255,255,255,0.06)",display:"flex",marginBottom:8,boxShadow:"inset 0 2px 3px rgba(0,0,0,0.4)"}}>
                      <div style={{width:`${pctA}%`,background:"linear-gradient(90deg,#881111,#ff4444)",position:"relative",minWidth:pctA>0?16:0,transition:"width 0.8s ease"}}>
                        <div style={{position:"absolute",top:0,left:0,right:0,height:"50%",background:"rgba(255,255,255,0.15)"}}/>
                        {pctA>15&&<span style={{position:"absolute",right:4,top:"50%",transform:"translateY(-50%)",fontSize:9,color:"#fff",fontFamily:"'Orbitron',monospace",fontWeight:700}}>{Math.round(g.fuerza_atacante||0)}</span>}
                      </div>
                      <div style={{width:`${pctD}%`,background:"linear-gradient(90deg,#4488ff,#2244cc)",position:"relative",minWidth:pctD>0?16:0,transition:"width 0.8s ease"}}>
                        <div style={{position:"absolute",top:0,left:0,right:0,height:"50%",background:"rgba(255,255,255,0.1)"}}/>
                        {pctD>15&&<span style={{position:"absolute",left:4,top:"50%",transform:"translateY(-50%)",fontSize:9,color:"#fff",fontFamily:"'Orbitron',monospace",fontWeight:700}}>{Math.round(g.fuerza_defensor||0)}</span>}
                      </div>
                    </div>

                    {/* Bottom */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:10,color:"#ff5555",fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>⚔️ {g.atacante_pais}</span>
                      {esMiGuerra&&<span style={{fontSize:9,color:"#f0c040",background:"rgba(240,192,64,0.12)",padding:"2px 8px",borderRadius:4,border:"1px solid rgba(240,192,64,0.3)",fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>TU GUERRA → ENTRAR</span>}
                      <span style={{fontSize:10,color:"#4488ff",fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>{g.defensor_pais} 🛡️</span>
                    </div>
                  </div>
                );
              })}

              {/* Historial */}
              {guerrasHistorial.length>0&&(
                <div style={{marginTop:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                    <Icon type="scroll" size={14} color="#c9a84c"/>
                    <span style={{fontSize:10,color:"#a08040",letterSpacing:"0.15em",textTransform:"uppercase",fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>Historial</span>
                  </div>
                  {guerrasHistorial.map((g,i)=>{
                    const gano=(g.resultado==="atacante"&&g.atacante_pais===selectedCountry)||(g.resultado==="defensor"&&g.defensor_pais===selectedCountry);
                    return(
                      <div key={i} style={{background:gano?"linear-gradient(135deg,#0c1a08,#081004)":"linear-gradient(135deg,#1a0808,#100404)",border:`1px solid ${gano?"rgba(68,204,68,0.2)":"rgba(255,60,60,0.2)"}`,borderLeft:`3px solid ${gano?"#44cc44":"#ff4444"}`,borderRadius:8,padding:"10px 14px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontSize:12,color:"#d0c090",fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>{TIPOS_GUERRA[g.tipo]?.icon||"⚔️"} {g.atacante_pais} vs {g.defensor_pais}</div>
                          <div style={{fontSize:10,color:"#5a4828",fontFamily:"'Rajdhani',sans-serif"}}>{new Date(g.created_at).toLocaleDateString()}</div>
                        </div>
                        <span style={{fontSize:13,color:gano?"#44cc66":"#ff5555",fontWeight:700,fontFamily:"'Rajdhani',sans-serif"}}>{gano?"✓ Victoria":"✗ Derrota"}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>)}

            {/* ══ VISTA: ELEGIR TIPO DE GUERRA ══ */}
            {vistaGuerra==="elegir_tipo" && (<>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <button onClick={()=>setVistaGuerra("lista")} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#a09070",padding:"6px 12px",borderRadius:6,cursor:"pointer",fontSize:12,fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>← VOLVER</button>
                <span style={{fontSize:12,color:"#f0c040",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,letterSpacing:"0.08em"}}>SELECCIONA TIPO DE GUERRA</span>
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {Object.entries(TIPOS_GUERRA).map(([key,tipo])=>{
                  const req=tipo.requiere;
                  let disponible=true, razon="";
                  if(req.rol==="presidente"&&!esPresidente){disponible=false;razon="Solo presidentes";}
                  if(req.rol==="ciudadano"&&esPresidente){disponible=false;razon="Solo ciudadanos";}
                  if(req.poder_politico&&(jugador?.poder_politico||0)<req.poder_politico){disponible=false;razon=`Necesitas ${req.poder_politico} poder político`;}
                  if(req.militar&&stats.militar<req.militar){disponible=false;razon=`Necesitas ${req.militar}% ejército`;}
                  if(req.rebeldia_pais&&stats.rebeldia<req.rebeldia_pais){disponible=false;razon=`Necesitas ${req.rebeldia_pais}% rebeldía`;}
                  if(req.colonizado&&!jugador?.colonizado_por){disponible=false;razon="Solo si estás colonizado";}
                  if(req.pib&&stats.pib<req.pib){disponible=false;razon=`Necesitas ${req.pib}% PIB`;}
                  return(
                    <div key={key} onClick={()=>{if(!disponible)return;setTipoGuerraSeleccionado(key);setVistaGuerra("elegir_pais");}}
                      style={{background:disponible?`linear-gradient(135deg,${tipo.color}18,#0e0a04)`:"linear-gradient(135deg,#120e06,#0a0804)",border:`2px solid ${disponible?tipo.color+"55":"rgba(255,255,255,0.05)"}`,borderLeft:`4px solid ${disponible?tipo.color:"rgba(255,255,255,0.05)"}`,borderRadius:12,padding:"16px",cursor:disponible?"pointer":"not-allowed",opacity:disponible?1:0.4,position:"relative",overflow:"hidden",boxShadow:disponible?`inset 0 1px 0 rgba(255,255,255,0.07),0 3px 0 rgba(0,0,0,0.5),0 0 18px ${tipo.color}0a`:"0 2px 0 rgba(0,0,0,0.4)"}}>
                      {disponible&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${tipo.color}88,transparent)`}}/>}
                      <div style={{position:"absolute",top:0,left:0,right:0,height:"40%",background:"linear-gradient(to bottom,rgba(255,255,255,0.04),transparent)",pointerEvents:"none"}}/>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{display:"flex",gap:14,alignItems:"center"}}>
                          <div style={{width:50,height:50,background:`linear-gradient(145deg,${tipo.color}44,${tipo.color}11)`,border:`1px solid ${tipo.color}55`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:`inset 0 1px 0 rgba(255,255,255,0.15),0 3px 0 rgba(0,0,0,0.5)`,flexShrink:0,position:"relative",overflow:"hidden"}}>
                            <div style={{position:"absolute",top:0,left:0,right:0,height:"50%",background:"rgba(255,255,255,0.1)",borderRadius:"10px 10px 0 0"}}/>
                            <span style={{position:"relative"}}>{tipo.icon}</span>
                          </div>
                          <div>
                            <div style={{fontSize:15,color:disponible?tipo.color:"#4a4030",fontWeight:700,fontFamily:"'Rajdhani',sans-serif",letterSpacing:"0.04em"}}>{tipo.label}</div>
                            <div style={{fontSize:12,color:"#5a4828",fontFamily:"'Rajdhani',sans-serif",marginTop:2}}>{tipo.desc}</div>
                            {!disponible&&<div style={{fontSize:11,color:"#aa3333",marginTop:4,fontFamily:"'Rajdhani',sans-serif"}}>⛔ {razon}</div>}
                            {disponible&&<div style={{fontSize:10,color:"#6a5020",marginTop:4,fontFamily:"'Rajdhani',sans-serif"}}>Requiere: {req.rol?`Rol ${req.rol}`:"Cualquiera"}{req.militar?` · ${req.militar}% ejército`:""}{req.poder_politico?` · ${req.poder_politico} poder`:""}</div>}
                          </div>
                        </div>
                        <span style={{fontSize:9,color:tipo.color,background:`${tipo.color}18`,padding:"4px 10px",borderRadius:6,flexShrink:0,fontFamily:"'Rajdhani',sans-serif",fontWeight:700,border:`1px solid ${tipo.color}33`,marginLeft:8}}>{tipo.dificultad}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>)}

            {/* ══ VISTA: ELEGIR PAÍS OBJETIVO ══ */}
            {vistaGuerra==="elegir_pais" && tipoGuerraSeleccionado && (<>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <button onClick={()=>setVistaGuerra("elegir_tipo")} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#a09070",padding:"6px 12px",borderRadius:6,cursor:"pointer",fontSize:12,fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>← VOLVER</button>
                <div>
                  <span style={{fontSize:12,color:"#f0c040",fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>{TIPOS_GUERRA[tipoGuerraSeleccionado]?.icon} {TIPOS_GUERRA[tipoGuerraSeleccionado]?.label}</span>
                  <div style={{fontSize:10,color:"#6a5020",fontFamily:"'Rajdhani',sans-serif"}}>Selecciona el país objetivo</div>
                </div>
              </div>

              {/* Costo de declarar guerra */}
              <div style={{display:"flex",gap:10,marginBottom:14,padding:"10px 14px",background:"rgba(0,0,0,0.4)",borderRadius:8,border:"1px solid rgba(255,255,255,0.06)"}}>
                {[{ico:"coin",label:"Costo",val:"$5,000",c:"#f0c040"},{ico:"sword",label:"Ejército mín.",val:"30%",c:"#ff5555"},{ico:"bolt",label:"Duración",val:"12h",c:"#44aaff"}].map((d,i)=>(
                  <div key={i} style={{flex:1,textAlign:"center"}}>
                    <Icon type={d.ico} size={14} color={d.c}/>
                    <div style={{fontSize:12,color:d.c,fontFamily:"'Orbitron',monospace",fontWeight:700,marginTop:2}}>{d.val}</div>
                    <div style={{fontSize:9,color:"#4a3820",fontFamily:"'Rajdhani',sans-serif"}}>{d.label}</div>
                  </div>
                ))}
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {/* Para golpe de estado: solo países donde hay presidente */}
                {/* Para conquista/económica: cualquier país con presidente diferente */}
                {(() => {
                  const tipo=TIPOS_GUERRA[tipoGuerraSeleccionado];
                  let paises = [];
                  if(tipoGuerraSeleccionado==="golpe_estado"){
                    // Golpe: solo presidentes del mismo país
                    paises = otrosJugadores.filter(j=>j.pais===selectedCountry&&j.rol==="presidente");
                  } else if(tipoGuerraSeleccionado==="liberacion"){
                    // Liberación: el colonizador
                    paises = jugador?.colonizado_por?otrosJugadores.filter(j=>j.pais===jugador.colonizado_por&&j.rol==="presidente"):[];
                  } else {
                    // Conquista, revolución, económica: otros países
                    const paisesUnicos = [...new Set(otrosJugadores.filter(j=>j.pais!==selectedCountry&&j.id!==jugador?.id).map(j=>j.pais))];
                    paises = paisesUnicos.map(p=>{
                      const pres = otrosJugadores.find(j=>j.pais===p&&j.rol==="presidente");
                      const ciudadanos = otrosJugadores.filter(j=>j.pais===p);
                      return {pais:p, presidente:pres, ciudadanos:ciudadanos.length, ideologia:pres?.ideologia||"democracia"};
                    });
                  }
                  if(paises.length===0) return <div style={{textAlign:"center",padding:30,color:"#4a3820",fontFamily:"'Rajdhani',sans-serif",fontSize:13}}>No hay objetivos disponibles para este tipo de guerra</div>;
                  return paises.map((obj,i)=>{
                    const jideo=IDEOLOGIES[obj.ideologia||obj.ideologia]||IDEOLOGIES.democracia;
                    const nombre=obj.pais||obj.nombre;
                    const presidente=obj.presidente||obj;
                    return(
                      <div key={i} style={{background:"linear-gradient(135deg,#1e1008,#140804)",border:"1px solid rgba(255,80,80,0.25)",borderLeft:"3px solid #ff4444",borderRadius:10,padding:"14px",position:"relative",overflow:"hidden",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05),0 3px 0 rgba(0,0,0,0.5)"}}>
                        <div style={{position:"absolute",top:0,left:0,right:0,height:"40%",background:"linear-gradient(to bottom,rgba(255,255,255,0.04),transparent)",pointerEvents:"none"}}/>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                          <div style={{display:"flex",gap:10,alignItems:"center"}}>
                            <div style={{width:44,height:44,borderRadius:9,background:`linear-gradient(145deg,${jideo.color}44,${jideo.color}11)`,border:`1px solid ${jideo.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:`inset 0 1px 0 rgba(255,255,255,0.15),0 3px 0 rgba(0,0,0,0.5)`,position:"relative",overflow:"hidden",flexShrink:0}}>
                              <div style={{position:"absolute",top:0,left:0,right:0,height:"50%",background:"rgba(255,255,255,0.1)",borderRadius:"9px 9px 0 0"}}/>
                              <span style={{position:"relative"}}>{jideo.icon}</span>
                            </div>
                            <div>
                              <div style={{fontSize:16,color:"#f0e8c8",fontWeight:700,fontFamily:"'Rajdhani',sans-serif",letterSpacing:"0.04em"}}>{nombre}</div>
                              <div style={{fontSize:11,color:jideo.color,fontFamily:"'Rajdhani',sans-serif"}}>{jideo.label}</div>
                              {presidente?.nombre&&<div style={{fontSize:10,color:"#6a5020",fontFamily:"'Rajdhani',sans-serif",marginTop:2}}>👑 Presidente: {presidente.nombre}</div>}
                            </div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:9,color:"#f0c040",background:"rgba(240,192,64,0.1)",padding:"3px 8px",borderRadius:4,border:"1px solid rgba(240,192,64,0.25)",fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>{obj.ciudadanos||1} jugadores</div>
                          </div>
                        </div>
                        <GlowBtn onClick={()=>declararGuerra(presidente||obj, tipoGuerraSeleccionado)} color="#ff4444"
                          style={{padding:"12px",borderRadius:8,fontSize:13,fontWeight:700,letterSpacing:"0.06em",background:"linear-gradient(180deg,#2a0808,#1a0404)",color:"#ff6644",border:"1px solid rgba(255,80,80,0.5)",boxShadow:"0 0 14px rgba(255,60,60,0.2),0 3px 0 rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.08)",display:"block",textAlign:"center"}}>
                          ⚔️ DECLARAR GUERRA CONTRA {nombre.toUpperCase()}
                        </GlowBtn>
                      </div>
                    );
                  });
                })()}
              </div>
            </>)}

            {/* ══ VISTA: COMBATE ACTIVO ══ */}
            {vistaGuerra==="combate" && (<>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                <button onClick={()=>{setVistaGuerra("lista");loadTodasGuerras();}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#a09070",padding:"6px 12px",borderRadius:6,cursor:"pointer",fontSize:12,fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>← GUERRAS</button>
                {guerraActiva&&<span style={{fontSize:12,color:"#ff7777",fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>{guerraActiva.atacante_pais} vs {guerraActiva.defensor_pais}</span>}
              </div>

              {guerraActiva?(
                <div style={{background:"linear-gradient(135deg,#200808,#140404)",border:"2px solid rgba(255,60,60,0.5)",borderRadius:14,padding:16,position:"relative",overflow:"hidden",boxShadow:"0 0 30px rgba(255,0,0,0.15),inset 0 1px 0 rgba(255,255,255,0.08)"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,transparent,#ff4444,#ff0000,#ff4444,transparent)",animationName:"pulse-glow",animationDuration:"1s",animationTimingFunction:"ease-in-out",animationIterationCount:"infinite"}}/>

                  {/* Título y fase */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div style={{fontSize:13,color:"#ff4444",fontWeight:700,fontFamily:"'Rajdhani',sans-serif",letterSpacing:"0.08em",textShadow:"0 0 10px rgba(255,0,0,0.5)"}}>
                      {TIPOS_GUERRA[guerraActiva.tipo]?.icon||"⚔️"} {guerraActiva.atacante_pais} vs {guerraActiva.defensor_pais}
                    </div>
                    <div style={{fontSize:10,color:"#ff6644",background:"rgba(255,60,60,0.15)",padding:"4px 10px",borderRadius:6,border:"1px solid rgba(255,60,60,0.3)",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,textTransform:"uppercase"}}>
                      {guerraActiva.fase==="movilizacion"?"📢 MOVILIZACIÓN":guerraActiva.fase==="batalla"?"⚔️ BATALLA":"✅ RESUELTA"}
                    </div>
                  </div>

                  {/* Countdown */}
                  {guerraActiva.fase==="movilizacion"&&(
                    <div style={{textAlign:"center",marginBottom:14,padding:"10px",background:"rgba(0,0,0,0.3)",borderRadius:8,border:"1px solid rgba(255,60,60,0.15)"}}>
                      <div style={{fontSize:10,color:"#6a3020",fontFamily:"'Rajdhani',sans-serif",letterSpacing:"0.12em",marginBottom:4}}>BATALLA COMIENZA EN</div>
                      <div style={{fontSize:26,color:"#ff6644",fontFamily:"'Orbitron',monospace",fontWeight:700,textShadow:"0 0 14px rgba(255,100,68,0.7)"}}>
                        {Math.max(0,Math.floor((new Date(guerraActiva.fin_movilizacion_at)-Date.now())/3600000))}h {Math.max(0,Math.floor(((new Date(guerraActiva.fin_movilizacion_at)-Date.now())%3600000)/60000))}m
                      </div>
                    </div>
                  )}

                  {/* Barras de fuerza */}
                  <div style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,alignItems:"center"}}>
                      <span style={{fontSize:12,color:"#ff5555",fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>⚔️ {guerraActiva.atacante_pais} <span style={{fontFamily:"'Orbitron',monospace",fontSize:13}}>{Math.round(guerraActiva.fuerza_atacante||0)}</span></span>
                      <span style={{fontSize:10,color:"#6a3020",fontFamily:"'Rajdhani',sans-serif"}}>vs</span>
                      <span style={{fontSize:12,color:"#4488ff",fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}><span style={{fontFamily:"'Orbitron',monospace",fontSize:13}}>{Math.round(guerraActiva.fuerza_defensor||0)}</span> {guerraActiva.defensor_pais} 🛡️</span>
                    </div>
                    <div style={{height:22,background:"rgba(0,0,0,0.7)",borderRadius:11,overflow:"hidden",border:"1px solid rgba(255,255,255,0.08)",position:"relative",display:"flex",boxShadow:"inset 0 2px 4px rgba(0,0,0,0.5)"}}>
                      {(()=>{
                        const total=(guerraActiva.fuerza_atacante||0)+(guerraActiva.fuerza_defensor||0)||1;
                        const pctA=Math.round((guerraActiva.fuerza_atacante||0)/total*100);
                        const pctD=100-pctA;
                        return(<>
                          <div style={{width:`${pctA}%`,background:"linear-gradient(90deg,#881111,#ff4444,#ff6644)",transition:"width 0.8s ease",position:"relative",minWidth:pctA>0?20:0}}>
                            <div style={{position:"absolute",top:0,left:0,right:0,height:"50%",background:"rgba(255,255,255,0.18)",borderRadius:"11px 0 0 0"}}/>
                            {pctA>12&&<span style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",fontSize:10,color:"#fff",fontFamily:"'Orbitron',monospace",fontWeight:700}}>{pctA}%</span>}
                          </div>
                          <div style={{width:`${pctD}%`,background:"linear-gradient(90deg,#4488ff,#2244cc,#112288)",transition:"width 0.8s ease",position:"relative",minWidth:pctD>0?20:0}}>
                            <div style={{position:"absolute",top:0,left:0,right:0,height:"50%",background:"rgba(255,255,255,0.12)"}}/>
                            {pctD>12&&<span style={{position:"absolute",left:6,top:"50%",transform:"translateY(-50%)",fontSize:10,color:"#fff",fontFamily:"'Orbitron',monospace",fontWeight:700}}>{pctD}%</span>}
                          </div>
                        </>);
                      })()}
                    </div>
                  </div>

                  {/* Unirse si no participa */}
                  {guerraActiva.fase!=="resuelta"&&!yaParticipo&&(
                    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
                      <div style={{fontSize:10,color:"#6a3020",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,marginBottom:4}}>Elige tu bando</div>
                      {(guerraActiva.atacante_pais===selectedCountry||guerraActiva.defensor_pais!==selectedCountry)&&(
                        <GlowBtn onClick={()=>unirseGuerra(guerraActiva.id,"atacante",false)} color="#ff4444"
                          style={{padding:"13px",borderRadius:8,fontSize:13,fontWeight:700,background:"linear-gradient(180deg,#2a0808,#1a0404)",color:"#ff6644",border:"1px solid rgba(255,80,80,0.5)",boxShadow:"0 0 14px rgba(255,60,60,0.25),0 3px 0 rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.08)"}}>
                          ⚔️ ATACAR — BANDO {guerraActiva.atacante_pais.toUpperCase()}
                        </GlowBtn>
                      )}
                      {guerraActiva.defensor_pais===selectedCountry&&(
                        <GlowBtn onClick={()=>unirseGuerra(guerraActiva.id,"defensor",false)} color="#4488ff"
                          style={{padding:"13px",borderRadius:8,fontSize:13,fontWeight:700,background:"linear-gradient(180deg,#081828,#041018)",color:"#4488ff",border:"1px solid rgba(68,136,255,0.5)",boxShadow:"0 0 14px rgba(68,136,255,0.25),0 3px 0 rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.08)"}}>
                          🛡️ DEFENDER — {guerraActiva.defensor_pais.toUpperCase()}
                        </GlowBtn>
                      )}
                      {/* Terceros países pueden participar */}
                      {guerraActiva.atacante_pais!==selectedCountry&&guerraActiva.defensor_pais!==selectedCountry&&(
                        <div style={{display:"flex",gap:8}}>
                          <GlowBtn onClick={()=>unirseGuerra(guerraActiva.id,"atacante",false)} color="#ff4444"
                            style={{padding:"11px 8px",borderRadius:8,fontSize:11,fontWeight:700,background:"linear-gradient(180deg,#2a0808,#1a0404)",color:"#ff6644",border:"1px solid rgba(255,80,80,0.4)",flex:1,textAlign:"center"}}>
                            ⚔️ APOYAR {guerraActiva.atacante_pais}
                          </GlowBtn>
                          <GlowBtn onClick={()=>unirseGuerra(guerraActiva.id,"defensor",false)} color="#4488ff"
                            style={{padding:"11px 8px",borderRadius:8,fontSize:11,fontWeight:700,background:"linear-gradient(180deg,#081828,#041018)",color:"#4488ff",border:"1px solid rgba(68,136,255,0.4)",flex:1,textAlign:"center"}}>
                            🛡️ APOYAR {guerraActiva.defensor_pais}
                          </GlowBtn>
                        </div>
                      )}
                      {guerraActiva.defensor_pais===selectedCountry&&(
                        <GlowBtn onClick={()=>unirseGuerra(guerraActiva.id,"defensor",true)} color="#aa44ff"
                          style={{padding:"10px",borderRadius:8,fontSize:11,fontWeight:700,background:"linear-gradient(180deg,#180828,#100418)",color:"#aa44ff",border:"1px solid rgba(170,68,255,0.35)",boxShadow:"0 0 10px rgba(170,68,255,0.15),0 3px 0 rgba(0,0,0,0.6)"}}>
                          🕵️ INFILTRARME — QUINTA COLUMNA (secreto)
                        </GlowBtn>
                      )}
                    </div>
                  )}

                  {/* Panel combate activo */}
                  {yaParticipo&&guerraActiva.fase!=="resuelta"&&(
                    <div style={{marginBottom:14}}>
                      {(()=>{
                        const miPart=participantesGuerra.find(p=>p.jugador_id===jugador?.id);
                        return miPart?(
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"rgba(0,0,0,0.4)",borderRadius:8,border:`1px solid ${miPart.bando==="atacante"?"rgba(255,60,60,0.25)":"rgba(68,136,255,0.25)"}`,marginBottom:12}}>
                            <div>
                              <div style={{fontSize:10,color:"#6a4020",fontFamily:"'Rajdhani',sans-serif",letterSpacing:"0.1em"}}>MI CONTRIBUCIÓN</div>
                              <div style={{fontSize:11,color:"#a08050",fontFamily:"'Rajdhani',sans-serif",marginTop:2}}>
                                {miPart.total_ataques||0} ataques · <span style={{color:miPart.bando==="atacante"?"#ff6644":"#4488ff",fontWeight:700}}>{miPart.bando==="atacante"?"ATACANTE":miPart.es_traidor?"INFILTRADO":"DEFENSOR"}</span>
                              </div>
                            </div>
                            <div style={{textAlign:"right"}}>
                              <div style={{fontSize:20,color:miPart.bando==="atacante"?"#ff6644":"#4488ff",fontFamily:"'Orbitron',monospace",fontWeight:700,textShadow:`0 0 12px ${miPart.bando==="atacante"?"rgba(255,100,68,0.7)":"rgba(68,136,255,0.7)"}`}}>{Math.round(miPart.fuerza_aportada||0)}</div>
                              <div style={{fontSize:9,color:"#5a3820",fontFamily:"'Rajdhani',sans-serif"}}>FUERZA</div>
                            </div>
                          </div>
                        ):null;
                      })()}
                      <GlowBtn onClick={atacarEnGuerra} color="#ff4444"
                        style={{padding:"16px",borderRadius:10,fontSize:15,fontWeight:700,letterSpacing:"0.08em",background:"linear-gradient(180deg,#3a0808,#220404)",color:"#ff6644",border:"2px solid rgba(255,80,80,0.6)",boxShadow:"0 0 20px rgba(255,60,60,0.3),0 4px 0 rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.1)",marginBottom:8,display:"block",textAlign:"center"}}>
                        ⚔️ ATACAR  <span style={{fontSize:11,opacity:0.7}}>(-10 ⚡ · +fuerza)</span>
                      </GlowBtn>
                      <div style={{fontSize:10,color:"#4a2810",textAlign:"center",fontFamily:"'Rajdhani',sans-serif",marginBottom:14}}>Energía: <span style={{color:energia>=10?"#44cc66":"#ff4444",fontFamily:"'Orbitron',monospace",fontWeight:700}}>{energia}/100</span></div>
                      <div style={{background:"rgba(0,0,0,0.35)",borderRadius:10,padding:12,marginBottom:12,border:"1px solid rgba(240,192,64,0.15)"}}>
                        <div style={{fontSize:10,color:"#8a6020",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,marginBottom:10}}>💰 Recursos → Fuerza</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                          {[{label:"$1,000",oro:1000,fuerza:10},{label:"$5,000",oro:5000,fuerza:55},{label:"$10,000",oro:10000,fuerza:125},{label:"$50,000",oro:50000,fuerza:700}].map((op,i)=>(
                            <GlowBtn key={i} onClick={()=>enviarRecursosGuerra(op.oro)} color="#f0c040"
                              disabled={dinero<op.oro}
                              style={{padding:"9px 6px",borderRadius:7,fontSize:11,fontWeight:700,background:dinero>=op.oro?"linear-gradient(180deg,#281e04,#181202)":"rgba(0,0,0,0.4)",color:dinero>=op.oro?"#f0c040":"#4a3820",border:`1px solid ${dinero>=op.oro?"rgba(240,192,64,0.4)":"rgba(255,255,255,0.05)"}`,textAlign:"center"}}>
                              {op.label}<br/><span style={{fontSize:9,opacity:0.7}}>+{op.fuerza} fuerza</span>
                            </GlowBtn>
                          ))}
                        </div>
                      </div>
                      {/* Misiones */}
                      <div style={{background:"rgba(0,0,0,0.35)",borderRadius:10,padding:12,border:"1px solid rgba(170,68,255,0.15)"}}>
                        <div style={{fontSize:10,color:"#7a40aa",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,marginBottom:10}}>🎯 Misiones</div>
                        {misionesGuerra.length===0?(
                          <div style={{textAlign:"center",color:"#4a3060",fontSize:12,fontFamily:"'Rajdhani',sans-serif",padding:"8px 0"}}>Cargando...</div>
                        ):misionesGuerra.map((m,i)=>{
                          const pct=Math.min(100,Math.round((m.progreso||0)/m.meta*100));
                          const reclamada=!!(miPartMisiones&(m.id==="m1"?1:m.id==="m2"?2:4));
                          return(
                            <div key={i} style={{background:m.completada?"rgba(68,204,102,0.06)":"rgba(0,0,0,0.3)",borderRadius:8,padding:"10px 12px",marginBottom:8,border:`1px solid ${m.completada?"rgba(68,204,102,0.25)":"rgba(170,68,255,0.15)"}`}}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                                <div style={{flex:1}}>
                                  <div style={{fontSize:13,color:m.completada?"#44cc66":"#d0b080",fontWeight:700,fontFamily:"'Rajdhani',sans-serif"}}>{m.icono} {m.titulo}</div>
                                  <div style={{fontSize:11,color:"#5a4030",fontFamily:"'Rajdhani',sans-serif"}}>{m.desc}</div>
                                </div>
                                <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
                                  <div style={{fontSize:12,color:"#aa44ff",fontFamily:"'Orbitron',monospace",fontWeight:700}}>+{m.recompensa} XP</div>
                                </div>
                              </div>
                              <div style={{height:6,background:"rgba(0,0,0,0.5)",borderRadius:3,overflow:"hidden",marginBottom:6}}>
                                <div style={{height:"100%",width:`${pct}%`,background:m.completada?"linear-gradient(90deg,#44aa44,#44ff44)":"linear-gradient(90deg,#6622aa,#aa44ff)",borderRadius:3,boxShadow:m.completada?"0 0 8px #44ff44":"0 0 8px #aa44ff"}}/>
                              </div>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                <span style={{fontSize:10,color:"#6a4830",fontFamily:"'Rajdhani',sans-serif"}}>{m.progreso||0}/{m.meta}</span>
                                {m.completada&&!reclamada&&(
                                  <GlowBtn onClick={()=>reclamarMision(m)} color="#44cc66"
                                    style={{padding:"5px 12px",borderRadius:6,fontSize:11,fontWeight:700,background:"linear-gradient(180deg,#0c2010,#081408)",color:"#44cc66",border:"1px solid rgba(68,204,102,0.4)"}}>
                                    ✅ RECLAMAR
                                  </GlowBtn>
                                )}
                                {reclamada&&<span style={{fontSize:10,color:"#44cc66",fontFamily:"'Rajdhani',sans-serif"}}>✓ Reclamado</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Combatientes */}
                  {participantesGuerra.length>0&&(
                    <div style={{marginTop:12}}>
                      <div style={{fontSize:10,color:"#6a3020",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Rajdhani',sans-serif",marginBottom:8}}>Combatientes ({participantesGuerra.length})</div>
                      {participantesGuerra.map((p,i)=>(
                        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 12px",background:p.bando==="atacante"?"rgba(255,60,60,0.08)":"rgba(68,136,255,0.08)",borderRadius:7,border:`1px solid ${p.bando==="atacante"?"rgba(255,60,60,0.2)":"rgba(68,136,255,0.2)"}`,marginBottom:5}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontSize:16}}>{p.es_traidor?"🕵️":p.bando==="atacante"?"⚔️":"🛡️"}</span>
                            <div>
                              <div style={{fontSize:12,color:"#d0c090",fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>{p.jugador_nombre}{p.es_traidor&&<span style={{color:"#aa44ff",fontSize:10}}> (Infiltrado)</span>}</div>
                              <div style={{fontSize:10,color:"#5a4020",fontFamily:"'Rajdhani',sans-serif"}}>{p.total_ataques||0} ataques</div>
                            </div>
                          </div>
                          <span style={{fontSize:13,color:p.bando==="atacante"?"#ff6644":"#4488ff",fontFamily:"'Orbitron',monospace",fontWeight:700}}>{Math.round(p.fuerza_aportada)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Resultado */}
                  {guerraActiva.fase==="resuelta"&&(
                    <div style={{textAlign:"center",marginTop:14,padding:16,background:guerraActiva.resultado==="atacante"?"rgba(255,60,60,0.1)":"rgba(68,136,255,0.1)",borderRadius:10,border:`2px solid ${guerraActiva.resultado==="atacante"?"rgba(255,60,60,0.4)":"rgba(68,136,255,0.4)"}`}}>
                      <div style={{fontSize:32,marginBottom:8}}>{guerraActiva.resultado==="atacante"?"⚔️🏆":"🛡️🏆"}</div>
                      <div style={{fontSize:18,fontWeight:700,color:guerraActiva.resultado==="atacante"?"#ff6644":"#4488ff",fontFamily:"'Rajdhani',sans-serif",letterSpacing:"0.08em"}}>
                        VICTORIA: {guerraActiva.resultado==="atacante"?guerraActiva.atacante_pais:guerraActiva.defensor_pais}
                      </div>
                    </div>
                  )}
                </div>
              ):(
                <div style={{textAlign:"center",padding:30,color:"#4a3820",fontFamily:"'Rajdhani',sans-serif",fontSize:13}}>Guerra no encontrada</div>
              )}
            </>)}
          </div>
        )}

        {/* FÁBRICAS Y TRABAJO */}
        {tab==="empresas" && (
          <div>
            {showCrearFabrica && (
              <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
                <div style={{background:"#0f1420",border:"1px solid rgba(201,168,76,0.3)",borderRadius:12,padding:20,width:"100%",maxWidth:380}}>
                  <div style={{fontSize:16,color:"#c9a84c",fontWeight:"bold",marginBottom:16,textAlign:"center"}}>🏭 Fundar Fábrica — $5,000</div>
                  <input placeholder="Nombre de la fábrica..." value={nuevaFabrica.nombre} onChange={e=>setNuevaFabrica(p=>({...p,nombre:e.target.value}))} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,168,76,0.3)",color:"#e8e8e8",padding:"10px 14px",borderRadius:6,fontSize:14,marginBottom:10,boxSizing:"border-box",outline:"none",fontFamily:"Georgia,serif"}} />
                  <select value={nuevaFabrica.tipo_recurso} onChange={e=>setNuevaFabrica(p=>({...p,tipo_recurso:e.target.value}))} style={{width:"100%",background:"#0f1420",border:"1px solid rgba(201,168,76,0.3)",color:"#e8e8e8",padding:"10px 14px",borderRadius:6,fontSize:13,marginBottom:10,boxSizing:"border-box",outline:"none"}}>
                    {Object.entries(TIPOS_RECURSO).map(([k,v])=><option key={k} value={k}>{v.icon} {k}</option>)}
                  </select>
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:12,color:"#888",marginBottom:6}}>Tasa salarial: <strong style={{color:"#c9a84c"}}>{nuevaFabrica.tasa_salarial}%</strong></div>
                    <input type="range" min="10" max="95" value={nuevaFabrica.tasa_salarial} onChange={e=>setNuevaFabrica(p=>({...p,tasa_salarial:parseInt(e.target.value)}))} style={{width:"100%",accentColor:"#c9a84c"}} />
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#555"}}>
                      <span>Trabajador: {nuevaFabrica.tasa_salarial}%</span>
                      <span>Dueño: {90-nuevaFabrica.tasa_salarial}%</span>
                      <span>Estado: 10%</span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>setShowCrearFabrica(false)} style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",color:"#888",padding:"11px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif"}}>CANCELAR</button>
                    <button onClick={crearFabrica} disabled={(dinero||0)<5000} style={{flex:2,background:(dinero||0)>=5000?"linear-gradient(135deg,#c9a84c,#a07830)":"#2a2a3a",border:"none",color:(dinero||0)>=5000?"#0a0e1a":"#444",padding:"11px",borderRadius:6,cursor:(dinero||0)>=5000?"pointer":"not-allowed",fontFamily:"Georgia,serif",fontWeight:"bold"}}>🏭 FUNDAR</button>
                  </div>
                </div>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:11,color:"#c9a84c",letterSpacing:2,textTransform:"uppercase"}}>🏭 Fábricas y Trabajo</div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>setShowCrearFabrica(true)} style={{background:"rgba(201,168,76,0.15)",border:"1px solid rgba(201,168,76,0.3)",color:"#c9a84c",padding:"6px 12px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif",fontSize:11,fontWeight:"bold"}}>+ FUNDAR</button>
              </div>
            </div>
            <div style={{background:"rgba(3,169,244,0.08)",border:"1px solid rgba(3,169,244,0.25)",borderRadius:8,padding:14,marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontSize:13,color:"#03a9f4",fontWeight:"bold"}}>⚡ Energía</div>
                <div style={{fontSize:16,color:energia>30?"#03a9f4":"#e53935",fontFamily:"monospace",fontWeight:"bold"}}>{energia}<span style={{fontSize:11,color:"#555"}}>/100</span></div>
              </div>
              <div style={{height:10,background:"rgba(255,255,255,0.06)",borderRadius:5,overflow:"hidden",marginBottom:6}}>
                <div style={{height:"100%",width:`${energia}%`,background:`linear-gradient(90deg,${energia>30?"#03a9f4":"#e53935"},${energia>30?"#4fc3f7":"#ef9a9a"})`,borderRadius:5,transition:"width 1s ease"}}/>
              </div>
              <div style={{fontSize:11,color:"#555"}}>{energia>=10?`✅ Puedes trabajar ${Math.floor(energia/10)} veces`:`⏳ Recargando +1/min · Faltan ${10-energia} para trabajar`}</div>
            </div>
            {fabricas.length===0?(
              <div style={{textAlign:"center",padding:30,color:"#555"}}>
                <div style={{fontSize:32,marginBottom:8}}>🏭</div>
                <div style={{fontSize:14,color:"#888",marginBottom:8}}>No hay fábricas todavía</div>
                <button onClick={()=>setShowCrearFabrica(true)} style={{background:"linear-gradient(135deg,#c9a84c,#a07830)",border:"none",color:"#0a0e1a",padding:"12px 24px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:"bold"}}>🏭 FUNDAR PRIMERA</button>
              </div>
            ) : (() => {
              // Categorías de fábricas
              const CATS = [
                {key:"estatal",  label:"🏛️ Estatales",  color:"#2196f3", filter:f=>f.nombre.toLowerCase().includes("estatal")||f.nombre.toLowerCase().includes("granja")||f.nombre.toLowerCase().includes("petrolera")},
                {key:"comida",   label:"🌾 Granjas",     color:"#4caf50", filter:f=>f.tipo_recurso==="Comida"&&!f.nombre.toLowerCase().includes("estatal")&&!f.nombre.toLowerCase().includes("granja")},
                {key:"petroleo", label:"🛢️ Petroleras",  color:"#ff8f00", filter:f=>f.tipo_recurso==="Petróleo"&&!f.nombre.toLowerCase().includes("estatal")&&!f.nombre.toLowerCase().includes("petrolera")},
                {key:"energia",  label:"⚡ Energéticas", color:"#03a9f4", filter:f=>f.tipo_recurso==="Energía"},
                {key:"mineral",  label:"⛏️ Mineras",     color:"#795548", filter:f=>f.tipo_recurso==="Mineral"},
                {key:"militar",  label:"⚔️ Militares",   color:"#e53935", filter:f=>f.tipo_recurso==="Armas"},
                {key:"oro",      label:"🪙 Económicas",  color:"#c9a84c", filter:f=>f.tipo_recurso==="Oro"},
              ];

              // Separar fábricas por país
              const fabsPais = fabricas.filter(f => f.pais === (paisActivoFabricas || selectedCountry));
              const fabsOtros = fabricas.filter(f => f.pais !== selectedCountry);

              const renderFabrica = (fab, i) => {
                const tipo = TIPOS_RECURSO[fab.tipo_recurso]||{icon:"🏭",color:"#888"};
                const esMia = fab.owner_id===jugador?.id;
                const esEstatal = fab.nombre.toLowerCase().includes("estatal")||fab.nombre.toLowerCase().includes("granja")||fab.nombre.toLowerCase().includes("petrolera");
                const nivelReq = esEstatal?0:fab.nivel>=3?15:fab.nivel>=2?8:3;
                const puedoAcceder = nivel>=nivelReq;
                const tieneVisa = tengoVisa(fab.pais);
                const puedoTrabajar = energia>=10&&puedoAcceder&&tieneVisa;
                const salarioEstimado = Math.floor((fab.nivel*(fab.produccion_base||100)*0.9)*fab.tasa_salarial/100);
                return (
                  <div key={i} style={{background:esEstatal?"rgba(33,150,243,0.06)":esMia?"rgba(201,168,76,0.06)":"rgba(255,255,255,0.02)",border:`1px solid ${esEstatal?"rgba(33,150,243,0.3)":esMia?"rgba(201,168,76,0.3)":tipo.color+"33"}`,borderRadius:8,padding:12,marginBottom:8,opacity:puedoAcceder?1:0.5}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                          <span style={{fontSize:16}}>{tipo.icon}</span>
                          <span style={{fontSize:13,color:esEstatal?"#2196f3":esMia?"#c9a84c":"#e8e8e8",fontWeight:"bold"}}>{fab.nombre}</span>
                          {esEstatal&&<span style={{fontSize:9,color:"#2196f3",background:"rgba(33,150,243,0.15)",padding:"1px 6px",borderRadius:10}}>ESTATAL</span>}
                          {esMia&&!esEstatal&&<span style={{fontSize:9,color:"#c9a84c",background:"rgba(201,168,76,0.15)",padding:"1px 6px",borderRadius:10}}>MÍA</span>}
                        </div>
                        <div style={{fontSize:10,color:"#666"}}>{fab.pais} · Nv.{fab.nivel} · {fab.tasa_salarial}% para ti · 👥{fab.trabajadores_actuales||0}</div>
                      </div>
                      <div style={{fontSize:14,color:"#4caf50",fontFamily:"monospace",fontWeight:"bold"}}>${salarioEstimado}</div>
                    </div>
                    {!puedoAcceder&&<div style={{fontSize:10,color:"#e53935",marginBottom:4}}>⛔ Nivel {nivelReq} requerido</div>}
                    {!tieneVisa&&<div style={{fontSize:10,color:"#ff9800",marginBottom:4}}>🛂 Necesitas visa de trabajo para este país</div>}
                    <button onClick={()=>{if(!tieneVisa&&fab.pais!==selectedCountry){setVisaTarget(fab.pais);setShowVisaModal(true);}else realizarTrabajo(fab);}} disabled={(!puedoTrabajar&&tieneVisa)||trabajandoEn===fab.id}
                      style={{width:"100%",background:puedoTrabajar?"linear-gradient(135deg,rgba(76,175,80,0.3),rgba(76,175,80,0.15))":"rgba(255,255,255,0.03)",border:`1px solid ${puedoTrabajar?"rgba(76,175,80,0.5)":"rgba(255,255,255,0.06)"}`,color:puedoTrabajar?"#4caf50":"#555",padding:"9px",borderRadius:6,cursor:puedoTrabajar?"pointer":"not-allowed",fontFamily:"Georgia,serif",fontWeight:"bold",fontSize:12}}>
                      {trabajandoEn===fab.id?"⏳ Trabajando...":!tieneVisa&&fab.pais!==selectedCountry?`🛂 Obtener visa`:!puedoAcceder?`🔒 Nivel ${nivelReq}`:puedoTrabajar?`💼 TRABAJAR — $${salarioEstimado} · ⚡-10`:`⚡ Sin energía`}
                    </button>
                  </div>
                );
              };

              const fabsFiltradas = (vistaOtroPais ? fabsOtros : fabsPais).filter(f => {
                const cat = CATS.find(cc => cc.key === catActiva);
                return cat ? cat.filter(f) : true;
              });

              return (
                <>
                  {/* Toggle mi país / otros países */}
                  {paisActivoFabricas && (
                    <div style={{background:"rgba(33,150,243,0.08)",border:"1px solid rgba(33,150,243,0.25)",borderRadius:8,padding:"10px 14px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:13,color:"#2196f3",fontWeight:"bold"}}>🌍 Viendo: {paisActivoFabricas}</span>
                      <button onClick={()=>{setPaisActivoFabricas(null);setVistaOtroPais(true);}} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"#888",padding:"5px 10px",borderRadius:6,cursor:"pointer",fontSize:11,fontFamily:"Georgia,serif"}}>← Volver</button>
                    </div>
                  )}
                  <div style={{display:"flex",gap:8,marginBottom:12}}>
                    <button onClick={()=>{setVistaOtroPais(false);setPaisActivoFabricas(null);}} style={{flex:1,background:!vistaOtroPais?"rgba(201,168,76,0.2)":"rgba(255,255,255,0.03)",border:`1px solid ${!vistaOtroPais?"rgba(201,168,76,0.5)":"rgba(255,255,255,0.08)"}`,color:!vistaOtroPais?"#c9a84c":"#666",padding:"10px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:"bold",fontSize:12}}>
                      🏠 Mi País ({fabsPais.length})
                    </button>
                    <button onClick={()=>setVistaOtroPais(true)} style={{flex:1,background:vistaOtroPais?"rgba(255,152,0,0.2)":"rgba(255,255,255,0.03)",border:`1px solid ${vistaOtroPais?"rgba(255,152,0,0.5)":"rgba(255,255,255,0.08)"}`,color:vistaOtroPais?"#ff9800":"#666",padding:"10px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:"bold",fontSize:12}}>
                      🌍 Otros Países ({fabsOtros.length})
                    </button>
                  </div>

                  {/* Vista Otros Países — lista de países con botón de visa */}
                  {vistaOtroPais && !paisActivoFabricas && (
                    <div style={{marginBottom:12}}>
                      <div style={{background:"rgba(255,152,0,0.08)",border:"1px solid rgba(255,152,0,0.3)",borderRadius:8,padding:12,marginBottom:12,fontSize:12,color:"#ff9800"}}>
                        🛂 Selecciona un país para solicitar visa de trabajo. Los países donde ya tienes visa aparecen primero.
                      </div>
                      {(() => {
                        const paisesConVisa = misVisas.map(v=>v.pais_destino);
                        const todosPaises = COUNTRIES.filter(p=>p!==selectedCountry);
                        const ordenados = [
                          ...todosPaises.filter(p=>paisesConVisa.includes(p)),
                          ...todosPaises.filter(p=>!paisesConVisa.includes(p))
                        ];
                        return (
                          <div style={{display:"flex",flexDirection:"column",gap:6}}>
                            {ordenados.map((pais,i)=>{
                              const tieneVisa = paisesConVisa.includes(pais);
                              const fabsEnPais = fabricas.filter(f=>f.pais===pais).length;
                              return (
                                <button key={i} onClick={()=>{setVisaTarget(pais);setShowVisaModal(true);}}
                                  style={{background:tieneVisa?"rgba(76,175,80,0.08)":"rgba(255,255,255,0.02)",border:`1px solid ${tieneVisa?"rgba(76,175,80,0.3)":"rgba(255,255,255,0.07)"}`,borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",fontFamily:"Georgia,serif"}}>
                                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                                    <span style={{fontSize:13,color:tieneVisa?"#4caf50":"#e8e8e8"}}>{pais}</span>
                                    {tieneVisa&&<span style={{fontSize:9,color:"#4caf50",background:"rgba(76,175,80,0.15)",padding:"1px 6px",borderRadius:10}}>✓ VISA</span>}
                                  </div>
                                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                                    {fabsEnPais>0&&<span style={{fontSize:11,color:"#666"}}>🏭 {fabsEnPais}</span>}
                                    <span style={{fontSize:11,color:tieneVisa?"#4caf50":"#ff9800"}}>{tieneVisa?"Ver fábricas":"Solicitar visa →"}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Botones de categoría */}
                  <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:12,paddingBottom:4}}>
                    {CATS.map(cat => {
                      const count = (vistaOtroPais?fabsOtros:fabsPais).filter(cat.filter).length;
                      if (count === 0) return null;
                      return (
                        <button key={cat.key} onClick={()=>setCatActiva(cat.key)}
                          style={{flexShrink:0,background:catActiva===cat.key?`${cat.color}22`:"rgba(255,255,255,0.03)",border:`1px solid ${catActiva===cat.key?cat.color:"rgba(255,255,255,0.08)"}`,color:catActiva===cat.key?cat.color:"#666",padding:"7px 12px",borderRadius:20,cursor:"pointer",fontSize:11,fontFamily:"Georgia,serif",whiteSpace:"nowrap"}}>
                          {cat.label} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* Lista de fábricas */}
                  {fabsFiltradas.length === 0 ? (
                    <div style={{textAlign:"center",color:"#555",padding:20,fontSize:13}}>
                      No hay fábricas en esta categoría
                    </div>
                  ) : fabsFiltradas.map((fab,i) => renderFabrica(fab,i))}

                  {/* Modal solicitar visa */}
                  {showVisaModal && visaTarget && (
                    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
                      <div style={{background:"#0f1420",border:"1px solid rgba(255,152,0,0.4)",borderRadius:12,padding:22,width:"100%",maxWidth:380}}>
                        <div style={{fontSize:28,textAlign:"center",marginBottom:8}}>🛂</div>
                        <h3 style={{color:"#ff9800",textAlign:"center",marginBottom:4,fontSize:16}}>VISA DE TRABAJO</h3>
                        <p style={{color:"#888",fontSize:12,textAlign:"center",marginBottom:16}}>País destino: <strong style={{color:"#e8e8e8"}}>{visaTarget}</strong></p>
                        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                          {VISAS.map(v => (
                            <button key={v.tipo} onClick={()=>setVisaSeleccionada(v.tipo)}
                              style={{background:visaSeleccionada===v.tipo?"rgba(255,152,0,0.2)":"rgba(255,255,255,0.03)",border:`1px solid ${visaSeleccionada===v.tipo?"rgba(255,152,0,0.6)":"rgba(255,255,255,0.08)"}`,color:visaSeleccionada===v.tipo?"#ff9800":"#888",padding:"12px 16px",borderRadius:8,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",fontFamily:"Georgia,serif"}}>
                              <div style={{textAlign:"left"}}>
                                <div style={{fontSize:13,fontWeight:"bold"}}>{v.label}</div>
                                <div style={{fontSize:11,opacity:0.7}}>{v.desc}</div>
                              </div>
                              <div style={{fontSize:14,fontWeight:"bold",color:(dinero||0)>=v.precio?"#4caf50":"#e53935"}}>${v.precio.toLocaleString()}</div>
                            </button>
                          ))}
                        </div>
                        <div style={{fontSize:11,color:"#555",marginBottom:14,textAlign:"center"}}>
                          30% va al presidente del país · 70% se quema del juego
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <button onClick={()=>{setShowVisaModal(false);setVisaTarget(null);setVisaSeleccionada(null);}} style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",color:"#888",padding:"11px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif"}}>CANCELAR</button>
                          <button onClick={solicitarVisa} disabled={!visaSeleccionada||(dinero||0)<(VISAS.find(v=>v.tipo===visaSeleccionada)?.precio||0)}
                            style={{flex:2,background:visaSeleccionada&&(dinero||0)>=(VISAS.find(v=>v.tipo===visaSeleccionada)?.precio||0)?"linear-gradient(135deg,#ff9800,#e65100)":"#2a2a3a",border:"none",color:visaSeleccionada?"#fff":"#444",padding:"11px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:"bold"}}>
                            🛂 SOLICITAR VISA
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

                {/* TIENDA */}
        {tab==="tienda" && (
          <div>
            <div style={{fontSize:11,color:"#c9a84c",letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>🛒 Tienda Premium</div>

            {/* Banner premium activo */}
            {jugador?.premium && (
              <div style={{background:"linear-gradient(135deg,rgba(201,168,76,0.15),rgba(201,168,76,0.05))",border:"1px solid rgba(201,168,76,0.4)",borderRadius:8,padding:14,marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:28}}>💎</span>
                <div>
                  <div style={{fontSize:13,color:"#c9a84c",fontWeight:"bold"}}>{jugador.premium_plan} Activo</div>
                  <div style={{fontSize:11,color:"#888"}}>Expira: {jugador.premium_hasta?.slice(0,10)||"N/A"}</div>
                </div>
              </div>
            )}

            {/* Planes Premium */}
            <div style={{fontSize:11,color:"#6a6a8a",letterSpacing:1,marginBottom:10,textTransform:"uppercase"}}>💎 Planes Premium — 30 días</div>
            {[
              {key:"premium_basico",    icon:"⭐", nombre:"Pase Básico",       precio:11, color:"#9e9e9e", beneficios:["Trabajar cada 7min","Salario +25%","XP +25%","Badge ⭐"]},
              {key:"premium_estandar", icon:"💎", nombre:"Pase Estándar",     precio:15, color:"#2196f3", beneficios:["Trabajar cada 5min","Salario +50%","XP +50%","+1 decreto/día","Badge 💎"]},
              {key:"premium_presid",   icon:"👑", nombre:"Pase Presidencial", precio:20, color:"#c9a84c", beneficios:["Trabajar cada 3min","Salario +100%","XP +100%","+3 decretos/día","Escudo anti-golpe","Badge 👑"]},
            ].map((plan,i)=>(
              <div key={i} style={{background:`linear-gradient(135deg,${plan.color}12,${plan.color}06)`,border:`1px solid ${plan.color}44`,borderRadius:8,padding:14,marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div>
                    <div style={{fontSize:16,color:plan.color,fontWeight:"bold",marginBottom:4}}>{plan.icon} {plan.nombre}</div>
                    <div style={{fontSize:11,color:"#666"}}>30 días de beneficios</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:22,color:plan.color,fontFamily:"monospace",fontWeight:"bold"}}>${plan.precio}</div>
                    <div style={{fontSize:10,color:"#555"}}>USDT TRC20</div>
                  </div>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                  {plan.beneficios.map((b,j)=>(
                    <span key={j} style={{fontSize:10,color:plan.color,background:`${plan.color}15`,padding:"3px 8px",borderRadius:10,border:`1px solid ${plan.color}33`}}>✓ {b}</span>
                  ))}
                </div>
                <button onClick={()=>iniciarPago(plan.key,plan.precio,plan.nombre)} style={{width:"100%",background:`linear-gradient(135deg,${plan.color},${plan.color}88)`,border:"none",color:"#0a0e1a",padding:"12px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:"bold",fontSize:13,letterSpacing:1}}>
                  💳 COMPRAR — ${plan.precio} USDT
                </button>
              </div>
            ))}

            {/* Recursos */}
            <div style={{fontSize:11,color:"#6a6a8a",letterSpacing:1,marginBottom:10,marginTop:16,textTransform:"uppercase"}}>💰 Recursos — $11 USDT c/u</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
              {[
                {key:"pack_economico",icon:"💰",nombre:"Pack Económico",desc:"+20% PIB 24h",color:"#c9a84c"},
                {key:"pack_militar",  icon:"⚔️",nombre:"Pack Militar",   desc:"+20% Ejército 24h",color:"#e53935"},
                {key:"pack_petroleo", icon:"🛢️",nombre:"Pack Petróleo",  desc:"+30 Petróleo",color:"#ff8f00"},
                {key:"pack_comida",   icon:"🌾",nombre:"Pack Comida",    desc:"+30 Comida",color:"#4caf50"},
              ].map((rec,i)=>(
                <button key={i} onClick={()=>iniciarPago(rec.key,11,rec.nombre)} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${rec.color}33`,borderRadius:8,padding:12,cursor:"pointer",textAlign:"left",fontFamily:"Georgia,serif"}}>
                  <div style={{fontSize:22,marginBottom:6}}>{rec.icon}</div>
                  <div style={{fontSize:12,color:"#e8e8e8",fontWeight:"bold",marginBottom:4}}>{rec.nombre}</div>
                  <div style={{fontSize:11,color:"#666",marginBottom:8}}>{rec.desc}</div>
                  <div style={{fontSize:12,color:rec.color,fontWeight:"bold"}}>$11 USDT</div>
                </button>
              ))}
            </div>

            {/* Ventajas tácticas */}
            <div style={{fontSize:11,color:"#6a6a8a",letterSpacing:1,marginBottom:10,textTransform:"uppercase"}}>⚡ Ventajas Tácticas</div>
            {[
              {key:"escudo_golpe",  icon:"🛡️",nombre:"Escudo Anti-Golpe", desc:"Inmune 24h a golpes",   precio:12,color:"#2196f3"},
              {key:"poder_pol",     icon:"⚡",nombre:"Poder Político x2", desc:"+20 poder político",     precio:11,color:"#9c27b0"},
              {key:"decretos_extra",icon:"📜",nombre:"Decretos Extra",    desc:"+3 decretos hoy",        precio:11,color:"#ff9800"},
              {key:"reset_trabajo", icon:"🔄",nombre:"Reset Cooldown",    desc:"Reinicia trabajo ahora", precio:11,color:"#4caf50"},
            ].map((tact,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${tact.color}33`,borderRadius:8,padding:"12px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:22}}>{tact.icon}</span>
                  <div>
                    <div style={{fontSize:13,color:"#e8e8e8",fontWeight:"bold"}}>{tact.nombre}</div>
                    <div style={{fontSize:11,color:"#666"}}>{tact.desc}</div>
                  </div>
                </div>
                <button onClick={()=>iniciarPago(tact.key,tact.precio,tact.nombre)} style={{background:`${tact.color}22`,border:`1px solid ${tact.color}55`,color:tact.color,padding:"8px 14px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:"bold",fontSize:12,flexShrink:0}}>
                  ${tact.precio}
                </button>
              </div>
            ))}

            <div style={{fontSize:11,color:"#555",textAlign:"center",marginTop:16,lineHeight:1.7}}>
              Pago seguro con USDT TRC20 via NOWPayments.<br/>
              Los beneficios se activan automáticamente.
            </div>
          </div>
        )}
      </div>

      {/* ═══ BOTTOM NAV — Epic 3D ═══ */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:200,paddingBottom:"calc(env(safe-area-inset-bottom) + 2px)"}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,transparent 0%,rgba(2,4,8,0.97) 18%)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)"}}/>
        <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(0,255,100,0.15) 15%,rgba(201,168,76,0.9) 50%,rgba(0,255,100,0.15) 85%,transparent)",animationName:"pulse-glow",animationDuration:"2.5s",animationTimingFunction:"ease-in-out",animationIterationCount:"infinite",zIndex:1}}/>
        <div style={{display:"flex",position:"relative",zIndex:1,paddingTop:6}}>
          {[
            {id:"panel",ico:"panel",label:"Panel"},
            {id:"decretos",ico:"scroll",label:"Gobernar"},
            {id:"guerra",ico:"war",label:"Guerra"},
            {id:"empresas",ico:"work",label:"Trabajo"},
            {id:"tienda",ico:"shop",label:"Tienda"},
          ].map(({id,ico,label})=>{
            const active=tab===id;
            return (
              <button key={id}
                onClick={()=>{tg?.HapticFeedback?.selectionChanged();setTab(id);if(id==="empresas"){loadFabricas();loadVisas();}if(id==="guerra"){setVistaGuerra("lista");loadGuerraActiva();loadTodasGuerras();}}}
                style={{flex:1,background:"transparent",border:"none",padding:"6px 2px 10px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,position:"relative",transition:"all 0.2s"}}>
                {active&&<div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 10%,rgba(201,168,76,0.14),transparent 65%)",borderRadius:8,animationName:"pulse-glow",animationDuration:"2s",animationTimingFunction:"ease-in-out",animationIterationCount:"infinite"}}/>}
                {active&&<div style={{position:"absolute",top:0,left:"18%",right:"18%",height:2,background:"linear-gradient(90deg,transparent,#f0c040,rgba(255,240,100,0.9),#f0c040,transparent)",borderRadius:1,boxShadow:"0 0 10px rgba(240,192,64,0.9),0 0 20px rgba(240,192,64,0.4)"}}/>}
                <div style={{width:38,height:38,borderRadius:10,background:active?"linear-gradient(145deg,rgba(201,168,76,0.2),rgba(0,0,0,0.5))":"linear-gradient(145deg,rgba(255,255,255,0.04),rgba(0,0,0,0.4))",border:`1px solid ${active?"rgba(201,168,76,0.5)":"rgba(255,255,255,0.06)"}`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:active?"0 4px 0 rgba(0,0,0,0.6),0 0 14px rgba(201,168,76,0.35),inset 0 1px 0 rgba(255,255,255,0.12)":"0 2px 0 rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.04)",transition:"all 0.2s cubic-bezier(0.34,1.5,0.64,1)",transform:active?"scale(1.12) translateY(-2px)":"scale(1)",position:"relative",overflow:"hidden"}}>
                  {active&&<div style={{position:"absolute",top:0,left:0,right:0,height:"50%",background:"rgba(255,255,255,0.08)",borderRadius:"10px 10px 0 0"}}/>}
                  <Icon type={ico} size={20} color={active?"#f0c040":"#3a4860"} glow={active}/>
                </div>
                <span style={{fontSize:9,fontFamily:"'Rajdhani',sans-serif",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:active?"#f0c040":"#2a3448",textShadow:active?"0 0 10px rgba(240,192,64,0.7)":"none",transition:"all 0.2s"}}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
