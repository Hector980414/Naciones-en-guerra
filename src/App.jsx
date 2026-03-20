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

const COUNTRIES = ["Cuba","México","Venezuela","Argentina","Brasil","Colombia","Chile","Perú","Ecuador","Bolivia","España","Francia","Alemania","Rusia","China","USA","India","Japón","Corea del Sur","Nigeria","Egipto","Turquía","Irán","Arabia Saudita","Sudáfrica","Indonesia","Pakistán","Bangladesh","Etiopía","Rep. Dominicana","Ucrania","Polonia","Canadá","Australia","Suecia","Noruega","Suiza","Israel","Grecia","Portugal"];

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

const clamp=(v,mn=0,mx=100)=>Math.min(mx,Math.max(mn,Math.round(v)));

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

// ── Components ────────────────────────────────────────────
const ResourceBar = ({ icon, label, value, color }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
    <div style={{ width:28,height:28,background:`${color}22`,border:`1px solid ${color}44`,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0 }}>{icon}</div>
    <div style={{ flex:1 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
        <span style={{ fontSize:11,color:"#aaa",fontFamily:"monospace" }}>{label}</span>
        <span style={{ fontSize:11,color:value>60?"#4caf50":value>35?"#c9a84c":"#e53935",fontFamily:"monospace",fontWeight:"bold" }}>{value}%</span>
      </div>
      <div style={{ height:5,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden" }}>
        <div style={{ height:"100%",width:`${value}%`,background:`linear-gradient(90deg,${color},${color}88)`,borderRadius:3,transition:"width 0.8s ease" }} />
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
  const [otrosJugadores, setOtrosJugadores] = useState([]);
  const [rankingData, setRankingData] = useState([]);
  const [saving, setSaving] = useState(false);
  const [xp, setXp] = useState(0);
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
  const tickRef = useRef(null);

  useEffect(() => {
    if(tg){tg.ready();tg.expand();tg.setBackgroundColor("#0a0e1a");}
    initPlayer();
  }, []);

  const syncTick = useCallback(async () => {
    try {
      const { data } = await db.from("tick_global").select("proximo_tick").eq("id",1).single();
      if(data?.proximo_tick) setCountdown(Math.max(0,Math.floor((new Date(data.proximo_tick)-new Date())/1000)));
    } catch {}
  }, []);

  useEffect(() => {
    syncTick();
    const si = setInterval(syncTick, 300000);
    tickRef.current = setInterval(() => setCountdown(c=>Math.max(0,c-1)), 1000);
    return () => { clearInterval(si); clearInterval(tickRef.current); };
  }, [syncTick]);

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
      if(rol==="ciudadano") showNotif(`⚠️ ${selectedCountry} ya tiene presidente. Eres ciudadano.`,"error");
      else showNotif(`✅ Eres el Presidente de ${selectedCountry}`,"info");
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
    <div style={{minHeight:"100vh",background:"#0a0e1a",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,fontFamily:"Georgia,serif"}}>
      <div style={{fontSize:52}}>🌍</div>
      <div style={{color:"#c9a84c",fontSize:13,letterSpacing:3,textTransform:"uppercase"}}>Cargando...</div>
    </div>
  );

  // ── ONBOARDING ──────────────────────────────────────────
  if(screen==="onboarding") return (
    <div style={{minHeight:"100vh",background:"#0a0e1a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",padding:20,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(201,168,76,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.04) 1px,transparent 1px)",backgroundSize:"40px 40px"}} />
      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:420}}>
        {step===0 && (
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:64,marginBottom:16}}>🌍</div>
            <div style={{fontSize:11,color:"#c9a84c",letterSpacing:4,textTransform:"uppercase",marginBottom:8}}>Bienvenido al</div>
            <h1 style={{fontSize:28,color:"#e8e8e8",letterSpacing:3,margin:"0 0 4px",textTransform:"uppercase",fontWeight:"normal"}}>NACIONES</h1>
            <h1 style={{fontSize:28,color:"#c9a84c",letterSpacing:3,margin:"0 0 20px",textTransform:"uppercase"}}>EN GUERRA</h1>
            <p style={{color:"#6a6a8a",fontSize:13,lineHeight:1.8,marginBottom:32}}>195 naciones compiten por el poder global.<br/>Sé presidente o ciudadano. Forma partidos.<br/>Haz golpes de estado. Conquista el mundo.</p>
            <button onClick={()=>setStep(1)} style={{background:"linear-gradient(135deg,#c9a84c,#a07830)",border:"none",color:"#0a0e1a",padding:"16px",borderRadius:6,fontSize:14,letterSpacing:3,textTransform:"uppercase",cursor:"pointer",fontWeight:"bold",width:"100%",boxShadow:"0 4px 20px rgba(201,168,76,0.3)"}}>TOMAR EL PODER</button>
          </div>
        )}
        {step===1 && (
          <div>
            <div style={{fontSize:32,textAlign:"center",marginBottom:12}}>🗺️</div>
            <h2 style={{color:"#c9a84c",letterSpacing:2,marginBottom:6,textTransform:"uppercase",fontSize:15,textAlign:"center"}}>Elige tu Nación</h2>
            <p style={{color:"#6a6a8a",fontSize:12,marginBottom:6,textAlign:"center"}}>Si el país ya tiene presidente, serás ciudadano.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:18,maxHeight:280,overflowY:"auto"}}>
              {COUNTRIES.map(c=><button key={c} onClick={()=>setSelectedCountry(c)} style={{background:selectedCountry===c?"rgba(201,168,76,0.2)":"rgba(255,255,255,0.04)",border:`1px solid ${selectedCountry===c?"#c9a84c":"rgba(255,255,255,0.08)"}`,color:selectedCountry===c?"#c9a84c":"#777",padding:"9px 4px",borderRadius:4,fontSize:10,cursor:"pointer",transition:"all 0.2s"}}>{c}</button>)}
            </div>
            <button disabled={!selectedCountry} onClick={()=>setStep(2)} style={{background:selectedCountry?"linear-gradient(135deg,#c9a84c,#a07830)":"#2a2a3a",border:"none",color:selectedCountry?"#0a0e1a":"#444",padding:"14px",borderRadius:6,fontSize:13,letterSpacing:2,textTransform:"uppercase",cursor:selectedCountry?"pointer":"not-allowed",fontWeight:"bold",width:"100%"}}>CONTINUAR →</button>
          </div>
        )}
        {step===2 && (
          <div>
            <div style={{fontSize:32,textAlign:"center",marginBottom:12}}>🏛️</div>
            <h2 style={{color:"#c9a84c",letterSpacing:2,marginBottom:6,textTransform:"uppercase",fontSize:15,textAlign:"center"}}>Tu Ideología</h2>
            <p style={{color:"#6a6a8a",fontSize:12,marginBottom:14,textAlign:"center"}}>Define cómo gobernarás o lucharás por el poder.</p>
            <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:18,maxHeight:300,overflowY:"auto"}}>
              {Object.entries(IDEOLOGIES).map(([key,val])=><button key={key} onClick={()=>setSelectedIdeology(key)} style={{background:selectedIdeology===key?`${val.color}22`:"rgba(255,255,255,0.03)",border:`1px solid ${selectedIdeology===key?val.color:"rgba(255,255,255,0.07)"}`,color:selectedIdeology===key?val.color:"#777",padding:"11px 16px",borderRadius:6,fontSize:12,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all 0.2s"}}><span style={{fontSize:14}}>{val.icon} {val.label}</span><span style={{fontSize:10,opacity:0.7,maxWidth:150,textAlign:"right"}}>{val.bonus}</span></button>)}
            </div>
            <button disabled={!selectedIdeology} onClick={()=>setStep(3)} style={{background:selectedIdeology?"linear-gradient(135deg,#c9a84c,#a07830)":"#2a2a3a",border:"none",color:selectedIdeology?"#0a0e1a":"#444",padding:"14px",borderRadius:6,fontSize:13,letterSpacing:2,textTransform:"uppercase",cursor:selectedIdeology?"pointer":"not-allowed",fontWeight:"bold",width:"100%"}}>CONTINUAR →</button>
          </div>
        )}
        {step===3 && (
          <div>
            <div style={{fontSize:32,textAlign:"center",marginBottom:12}}>✍️</div>
            <h2 style={{color:"#c9a84c",letterSpacing:2,marginBottom:6,textTransform:"uppercase",fontSize:15,textAlign:"center"}}>Tu Identidad</h2>
            <p style={{color:"#6a6a8a",fontSize:12,marginBottom:20,textAlign:"center"}}>El partido es opcional — puedes crearlo después.</p>
            <input placeholder="Tu nombre como líder..." value={leaderName} onChange={e=>setLeaderName(e.target.value)} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,168,76,0.3)",color:"#e8e8e8",padding:"12px 16px",borderRadius:6,fontSize:14,marginBottom:24,boxSizing:"border-box",outline:"none",fontFamily:"Georgia,serif"}} />
            <button disabled={!leaderName||saving} onClick={registerPlayer} style={{background:leaderName?"linear-gradient(135deg,#c9a84c,#a07830)":"#2a2a3a",border:"none",color:leaderName?"#0a0e1a":"#444",padding:"16px",borderRadius:6,fontSize:13,letterSpacing:2,textTransform:"uppercase",cursor:leaderName?"pointer":"not-allowed",fontWeight:"bold",width:"100%",boxShadow:leaderName?"0 4px 20px rgba(201,168,76,0.3)":"none"}}>
              {saving?"⏳ REGISTRANDO...":"🌍 ASUMIR MI DESTINO"}
            </button>
          </div>
        )}
        <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:20}}>
          {[0,1,2,3].map(i=><div key={i} style={{width:i===step?20:6,height:6,borderRadius:3,background:i===step?"#c9a84c":"#2a2a3a",transition:"all 0.3s"}} />)}
        </div>
      </div>
    </div>
  );

  // ── GAME ────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:"#0a0e1a",fontFamily:"Georgia,serif",color:"#e8e8e8",position:"relative"}}>
      <div style={{position:"fixed",inset:0,backgroundImage:"linear-gradient(rgba(201,168,76,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.025) 1px,transparent 1px)",backgroundSize:"50px 50px",pointerEvents:"none"}} />


      {/* XP Gained Popup */}
      {showXpModal && (
        <div style={{position:"fixed",top:80,right:16,background:"linear-gradient(135deg,rgba(201,168,76,0.95),rgba(160,120,48,0.95))",borderRadius:10,padding:"10px 16px",zIndex:2000,boxShadow:"0 4px 20px rgba(201,168,76,0.4)",animation:"slideIn 0.3s ease"}}>
          <div style={{fontSize:13,color:"#0a0e1a",fontWeight:"bold"}}>+{xpGanado} XP ⭐</div>
          <div style={{fontSize:11,color:"#0a0e1a88"}}>{xpMotivo}</div>
        </div>
      )}
      {/* Notification */}
      {notification && <div style={{position:"fixed",top:12,left:"50%",transform:"translateX(-50%)",background:notification.type==="error"?"rgba(229,57,53,0.15)":"rgba(201,168,76,0.15)",border:`1px solid ${notification.type==="error"?"#e53935":"#c9a84c"}`,color:notification.type==="error"?"#e53935":"#c9a84c",padding:"10px 20px",borderRadius:6,fontSize:13,zIndex:1000,whiteSpace:"nowrap",backdropFilter:"blur(10px)"}}>{notification.msg}</div>}

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

      {/* Header */}
      <div style={{background:"linear-gradient(180deg,rgba(10,14,26,0.98) 0%,rgba(10,14,26,0.95) 100%)",borderBottom:"1px solid rgba(201,168,76,0.25)",position:"sticky",top:0,zIndex:100,backdropFilter:"blur(20px)"}}>
        <div style={{background:"rgba(0,0,0,0.4)",padding:"6px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:`linear-gradient(135deg,${ideo.color},${ideo.color}88)`,border:`2px solid ${ideo.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{ideo.icon}</div>
            <div>
              <div style={{fontSize:12,color:"#e8e8e8",fontWeight:"bold"}}>{leaderName}</div>
              <div style={{fontSize:10,display:"flex",alignItems:"center",gap:6}}>
                <span style={{color:ideo.color}}>{selectedCountry}</span>
                <span style={{background:esPresidente?"rgba(201,168,76,0.2)":"rgba(76,175,80,0.2)",color:esPresidente?"#c9a84c":"#4caf50",padding:"1px 6px",borderRadius:10,fontSize:9,letterSpacing:0.5}}>
                  {esPresidente?"PRESIDENTE":"CIUDADANO"}
                </span>
              </div>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:9,color:"#555",letterSpacing:1,textTransform:"uppercase"}}>TICK GLOBAL</div>
            <div style={{fontSize:14,color:countdown<300?"#e53935":"#c9a84c",fontFamily:"monospace",fontWeight:"bold"}}>{formatTime(countdown)}</div>
          </div>
        </div>
        <div style={{padding:"8px 12px",display:"flex",gap:8,overflowX:"auto"}}>
          {esPresidente
            ? [{icon:"💰",val:stats.pib,color:"#c9a84c"},{icon:"⚔️",val:stats.militar,color:"#e53935"},{icon:"👥",val:stats.aprobacion,color:"#e91e63"},{icon:"🛢️",val:stats.petroleo,color:"#ff8f00"},{icon:"🌾",val:stats.comida,color:"#4caf50"},{icon:"⚡",val:stats.energia,color:"#03a9f4"}].map((s,i)=>(
              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",background:"rgba(0,0,0,0.3)",border:`1px solid ${s.color}33`,borderRadius:8,padding:"5px 10px",minWidth:52}}>
                <span style={{fontSize:14}}>{s.icon}</span>
                <span style={{fontSize:13,color:s.val>60?"#4caf50":s.val>35?"#c9a84c":"#e53935",fontFamily:"monospace",fontWeight:"bold"}}>{s.val}%</span>
              </div>
            ))
            : (
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <div style={{background:"rgba(201,168,76,0.1)",border:"1px solid rgba(201,168,76,0.3)",borderRadius:8,padding:"6px 14px",textAlign:"center"}}>
                  <div style={{fontSize:10,color:"#666",textTransform:"uppercase",letterSpacing:0.5}}>Poder Político</div>
                  <div style={{fontSize:18,color:"#c9a84c",fontFamily:"monospace",fontWeight:"bold"}}>{jugador?.poder_politico||0}/100</div>
                </div>
                <div style={{background:"rgba(76,175,80,0.1)",border:"1px solid rgba(76,175,80,0.3)",borderRadius:8,padding:"6px 14px",textAlign:"center"}}>
                  <div style={{fontSize:10,color:"#666",textTransform:"uppercase",letterSpacing:0.5}}>Partido</div>
                  <div style={{fontSize:12,color:"#4caf50"}}>{jugador?.partido||"Sin partido"}</div>
                </div>
              </div>
            )
          }
        </div>
      </div>

      <div style={{padding:12,paddingBottom:80}}>

        {/* PANEL */}
        {tab==="panel" && (
          <div>
            {/* Ciudadano panel */}
            {esCiudadano && (
              <div style={{background:"linear-gradient(135deg,rgba(76,175,80,0.1),rgba(76,175,80,0.05))",border:"1px solid rgba(76,175,80,0.25)",borderRadius:8,padding:16,marginBottom:14}}>
                <div style={{fontSize:11,color:"#4caf50",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>🏴 PANEL CIUDADANO</div>
                <p style={{fontSize:13,color:"#aaa",lineHeight:1.7,marginBottom:14}}>Como ciudadano puedes crear un partido, acumular poder político y hacer un golpe de estado para convertirte en Presidente.</p>
                <div style={{background:"rgba(0,0,0,0.3)",borderRadius:8,padding:12,marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:12,color:"#aaa"}}>Poder político</span>
                    <span style={{fontSize:12,color:"#c9a84c",fontFamily:"monospace",fontWeight:"bold"}}>{jugador?.poder_politico||0}/100</span>
                  </div>
                  <div style={{height:8,background:"rgba(255,255,255,0.06)",borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${jugador?.poder_politico||0}%`,background:"linear-gradient(90deg,#c9a84c,#e6c96a)",borderRadius:4,transition:"width 0.8s ease"}} />
                  </div>
                  <div style={{fontSize:11,color:"#555",marginTop:6}}>Necesitas ≥10 para intentar golpe de estado</div>
                </div>
                {/* XP Bar */}
                <div style={{background:"rgba(0,0,0,0.3)",borderRadius:8,padding:12,marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:12,color:colorNivel(nivel),fontWeight:"bold"}}>Nv.{nivel} — {tituloNivel(nivel)}</span>
                    <span style={{fontSize:11,color:"#888",fontFamily:"monospace"}}>{xp} / {Math.round(100*(nivel+1)*(nivel+1))} XP</span>
                  </div>
                  <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${Math.min(100,((xp - Math.round(100*nivel*nivel)) / (Math.round(100*(nivel+1)*(nivel+1)) - Math.round(100*nivel*nivel)))*100)}%`,background:`linear-gradient(90deg,${colorNivel(nivel)},${colorNivel(nivel)}88)`,borderRadius:3,transition:"width 0.8s ease"}} />
                  </div>
                  <div style={{fontSize:11,color:"#555",marginTop:4}}>💰 Dinero: ${dinero?.toLocaleString()}</div>
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button onClick={trabajar} style={{flex:1,minWidth:100,background:"rgba(33,150,243,0.15)",border:"1px solid rgba(33,150,243,0.3)",color:"#2196f3",padding:"11px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif",fontSize:12}}>💼 TRABAJAR</button>
                  {!jugador?.partido && <button onClick={()=>setShowCreateParty(true)} style={{flex:1,minWidth:100,background:"rgba(201,168,76,0.15)",border:"1px solid rgba(201,168,76,0.3)",color:"#c9a84c",padding:"11px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif",fontSize:12}}>🏛️ CREAR PARTIDO</button>}
                  <button onClick={acumularPoder} style={{flex:1,minWidth:100,background:"rgba(76,175,80,0.15)",border:"1px solid rgba(76,175,80,0.3)",color:"#4caf50",padding:"11px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif",fontSize:12}}>⚡ ACUMULAR PODER</button>
                </div>
              </div>
            )}

            {esPresidente && (
              <>
                {/* XP Bar Presidente */}
                <div style={{background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.15)",borderRadius:8,padding:12,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:12,color:colorNivel(nivel),fontWeight:"bold"}}>Nv.{nivel} — {tituloNivel(nivel)}</div>
                    <div style={{height:4,width:120,background:"rgba(255,255,255,0.06)",borderRadius:2,overflow:"hidden",marginTop:4}}>
                      <div style={{height:"100%",width:`${Math.min(100,((xp - Math.round(100*nivel*nivel)) / (Math.round(100*(nivel+1)*(nivel+1)) - Math.round(100*nivel*nivel)))*100)}%`,background:colorNivel(nivel),borderRadius:2}} />
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:13,color:"#c9a84c",fontFamily:"monospace",fontWeight:"bold"}}>{xp} XP</div>
                    <div style={{fontSize:11,color:"#666"}}>💰 ${dinero?.toLocaleString()}</div>
                  </div>
                  <button onClick={trabajar} style={{background:"rgba(33,150,243,0.15)",border:"1px solid rgba(33,150,243,0.3)",color:"#2196f3",padding:"8px 14px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif",fontSize:11}}>💼 TRABAJAR</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                  <div style={{background:"linear-gradient(135deg,rgba(201,168,76,0.1),rgba(201,168,76,0.05))",border:"1px solid rgba(201,168,76,0.25)",borderRadius:8,padding:12}}>
                    <div style={{fontSize:10,color:"#c9a84c",letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>ECONOMÍA</div>
                    <div style={{fontSize:28,color:"#c9a84c",fontFamily:"monospace",fontWeight:"bold"}}>{stats.pib}%</div>
                    <div style={{fontSize:11,color:stats.pib>50?"#4caf50":"#e53935"}}>{stats.pib>50?"▲ Estable":"▼ En riesgo"}</div>
                  </div>
                  <div style={{background:"linear-gradient(135deg,rgba(233,30,99,0.1),rgba(233,30,99,0.05))",border:"1px solid rgba(233,30,99,0.25)",borderRadius:8,padding:12}}>
                    <div style={{fontSize:10,color:"#e91e63",letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>APROBACIÓN</div>
                    <div style={{fontSize:28,color:"#e91e63",fontFamily:"monospace",fontWeight:"bold"}}>{stats.aprobacion}%</div>
                    <div style={{fontSize:11,color:stats.aprobacion>50?"#4caf50":"#e53935"}}>{stats.aprobacion>50?"▲ Popular":"▼ Impopular"}</div>
                  </div>
                </div>
                {stats.rebeldia>60 && <div style={{background:"rgba(229,57,53,0.08)",border:"1px solid rgba(229,57,53,0.3)",borderRadius:8,padding:"10px 14px",marginBottom:10,display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:20}}>⚠️</span><div><div style={{fontSize:12,color:"#e53935",fontWeight:"bold"}}>Alta Rebeldía — {stats.rebeldia}%</div><div style={{fontSize:11,color:"#888",marginTop:2}}>Ciudadanos podrían intentar un golpe de estado.</div></div></div>}
                {stats.aprobacion<30 && <div style={{background:"rgba(229,57,53,0.08)",border:"1px solid rgba(229,57,53,0.3)",borderRadius:8,padding:"10px 14px",marginBottom:10,display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:20}}>🗳️</span><div><div style={{fontSize:12,color:"#e53935",fontWeight:"bold"}}>Aprobación Crítica — {stats.aprobacion}%</div><div style={{fontSize:11,color:"#888",marginTop:2}}>Eres vulnerable a golpes de estado. Actúa.</div></div></div>}
              </>
            )}

            <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:8,padding:14}}>
              <div style={{fontSize:11,color:"#6a6a8a",letterSpacing:1,marginBottom:12,textTransform:"uppercase"}}>📊 Indicadores Nacionales</div>
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
          </div>
        )}

        {/* DECRETOS */}
        {tab==="decretos" && (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:11,color:"#c9a84c",letterSpacing:2,textTransform:"uppercase"}}>📜 Decretos Presidenciales</div>
              {esPresidente && <div style={{background:decreeUsed.length>=3?"rgba(229,57,53,0.15)":"rgba(201,168,76,0.1)",border:`1px solid ${decreeUsed.length>=3?"rgba(229,57,53,0.5)":"rgba(201,168,76,0.4)"}`,color:decreeUsed.length>=3?"#e53935":"#c9a84c",padding:"4px 14px",borderRadius:20,fontSize:12,fontFamily:"monospace"}}>{3-decreeUsed.length}/3 hoy</div>}
            </div>

            {esCiudadano && (
              <div style={{background:"rgba(76,175,80,0.06)",border:"1px solid rgba(76,175,80,0.25)",borderRadius:8,padding:16,marginBottom:14,textAlign:"center"}}>
                <div style={{fontSize:24,marginBottom:8}}>🏴</div>
                <div style={{fontSize:14,color:"#4caf50",fontWeight:"bold",marginBottom:8}}>Eres Ciudadano</div>
                <div style={{fontSize:13,color:"#888",lineHeight:1.7,marginBottom:14}}>Los decretos son exclusivos de los presidentes. Para emitir decretos necesitas convertirte en presidente mediante un golpe de estado o eligiendo un país sin gobierno.</div>
                <button onClick={()=>setTab("diplomacia")} style={{background:"rgba(201,168,76,0.15)",border:"1px solid rgba(201,168,76,0.3)",color:"#c9a84c",padding:"11px 20px",borderRadius:6,cursor:"pointer",fontFamily:"Georgia,serif",fontSize:12}}>⚔️ VER PRESIDENTES PARA GOLPE</button>
              </div>
            )}

            {esPresidente && (
              <>
                {selectedDecree && (
                  <div style={{background:"linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.04))",border:"1px solid rgba(201,168,76,0.3)",borderRadius:8,padding:16,marginBottom:14}}>
                    <div style={{fontSize:13,color:"#c9a84c",marginBottom:10,fontWeight:"bold",display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:20}}>{selectedDecree.icon}</span>{selectedDecree.name} — Consecuencias</div>
                    {decreeLoading
                      ? <div style={{color:"#6a6a8a",fontSize:13,display:"flex",alignItems:"center",gap:8}}><span>⏳</span> Evaluando impacto internacional...</div>
                      : <div style={{color:"#d0d0d0",fontSize:13,lineHeight:1.9}}>{decreeResponse}</div>
                    }
                  </div>
                )}
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {DECREES.map(d=>{
                    const used=decreeUsed.includes(d.id);
                    const exhausted=decreeUsed.length>=3&&!used;
                    return (
                      <button key={d.id} onClick={()=>issueDecree(d)} disabled={used||exhausted} style={{background:used?"rgba(255,255,255,0.02)":selectedDecree?.id===d.id?"rgba(201,168,76,0.08)":"rgba(255,255,255,0.04)",border:`1px solid ${used?"rgba(255,255,255,0.05)":selectedDecree?.id===d.id?"rgba(201,168,76,0.4)":"rgba(201,168,76,0.15)"}`,borderRadius:8,padding:"14px 16px",textAlign:"left",cursor:used||exhausted?"not-allowed":"pointer",opacity:used||exhausted?0.35:1,transition:"all 0.2s",fontFamily:"Georgia,serif"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                          <div style={{display:"flex",gap:12}}>
                            <span style={{fontSize:24}}>{d.icon}</span>
                            <div>
                              <div style={{fontSize:14,color:used?"#555":"#e8e8e8",marginBottom:4,fontWeight:"bold"}}>{d.name}</div>
                              <div style={{fontSize:12,color:"#666",marginBottom:6}}>{d.desc}</div>
                              <div style={{fontSize:11,color:"#c9a84c",fontFamily:"monospace"}}>{d.effect}</div>
                            </div>
                          </div>
                          {used && <span style={{fontSize:10,color:"#4caf50",border:"1px solid #4caf5044",padding:"3px 10px",borderRadius:10,flexShrink:0}}>✓ EMITIDO</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
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
          <div>
            <div style={{fontSize:11,color:"#c9a84c",letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>🏆 Ranking Mundial</div>
            {rankingData.length===0 ? (
              <div style={{textAlign:"center",color:"#555",padding:40}}>Cargando ranking...</div>
            ) : rankingData.map((j,i)=>{
              const jideo=IDEOLOGIES[j.ideologia]||IDEOLOGIES.democracia;
              const medalColor=i===0?"#FFD700":i===1?"#C0C0C0":i===2?"#CD7F32":"#555";
              const tuPosicion=j.id===jugador?.id;
              return (
                <div key={i} style={{background:tuPosicion?"rgba(201,168,76,0.08)":"rgba(255,255,255,0.02)",border:`1px solid ${tuPosicion?"rgba(201,168,76,0.3)":"rgba(255,255,255,0.06)"}`,borderRadius:8,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:i<3?`${medalColor}22`:"rgba(255,255,255,0.05)",border:`2px solid ${medalColor}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:i<3?18:13,fontFamily:"monospace",fontWeight:"bold",color:medalColor,flexShrink:0}}>
                    {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <span style={{fontSize:13,color:tuPosicion?"#c9a84c":"#e8e8e8",fontWeight:"bold"}}>{j.nombre}</span>
                        {tuPosicion&&<span style={{fontSize:10,color:"#c9a84c",marginLeft:6}}>(tú)</span>}
                      </div>
                      <span style={{fontSize:15,color:"#c9a84c",fontFamily:"monospace",fontWeight:"bold"}}>{j.puntuacion}</span>
                    </div>
                    <div style={{fontSize:11,display:"flex",gap:8,marginTop:4,alignItems:"center"}}>
                      <span style={{color:jideo.color}}>{jideo.icon} {j.pais}</span>
                      <span style={{background:j.rol==="presidente"?"rgba(201,168,76,0.15)":"rgba(76,175,80,0.15)",color:j.rol==="presidente"?"#c9a84c":"#4caf50",padding:"1px 6px",borderRadius:10,fontSize:9}}>{j.rol==="presidente"?"PRES":"CIU"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
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

      {/* Bottom Nav */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(10,14,26,0.97)",borderTop:"1px solid rgba(201,168,76,0.2)",display:"flex",backdropFilter:"blur(20px)",paddingBottom:"env(safe-area-inset-bottom)"}}>
        {[["panel","📊","Panel"],["decretos","📜","Decretos"],["diplomacia",esPresidente?"🤝":"⚔️",esPresidente?"Diplo":"Golpe"],["tienda","🛒","Tienda"],["ranking","🏆","Ranking"]].map(([id,icon,label])=>(
          <button key={id} onClick={()=>{tg?.HapticFeedback?.selectionChanged();setTab(id);}} style={{flex:1,background:"transparent",border:"none",padding:"10px 4px 12px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,position:"relative"}}>
            {tab===id&&<div style={{position:"absolute",top:0,left:"20%",right:"20%",height:2,background:"linear-gradient(90deg,transparent,#c9a84c,transparent)",borderRadius:1}} />}
            <span style={{fontSize:18}}>{icon}</span>
            <span style={{fontSize:9,color:tab===id?"#c9a84c":"#444",letterSpacing:0.5,textTransform:"uppercase"}}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
