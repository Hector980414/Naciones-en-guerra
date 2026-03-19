import { useState, useEffect } from "react";

// Telegram WebApp SDK helper
const tg = window.Telegram?.WebApp;

const IDEOLOGIES = {
  socialismo: { icon: "🔴", label: "Socialismo", color: "#e53935", bonus: "+Salud +Educación" },
  liberalismo: { icon: "🔵", label: "Liberalismo", color: "#1e88e5", bonus: "+PIB +Comercio" },
  autoritarismo: { icon: "⚫", label: "Autoritarismo", color: "#424242", bonus: "+Militar +Control" },
  ecologismo: { icon: "🟢", label: "Ecologismo", color: "#43a047", bonus: "+Recursos +Naturaleza" },
  nacionalismo: { icon: "🟡", label: "Nacionalismo", color: "#f9a825", bonus: "+Aprobación interna" },
  tecnocracia: { icon: "⚪", label: "Tecnocracia", color: "#90a4ae", bonus: "+Educación +IA" },
};

const COUNTRIES = ["Cuba","México","Venezuela","Argentina","Brasil","Colombia","Chile","Perú","Ecuador","Bolivia","España","Francia","Alemania","Rusia","China","USA","India","Japón","Corea del Sur","Nigeria","Egipto","Turquía","Irán","Arabia Saudita","Sudáfrica"];

const DECREES = [
  { id: 1, name: "Reforma Fiscal", icon: "💰", desc: "Aumentar impuestos corporativos", effect: "+PIB 3%, -Aprobación 5%", statChanges: { pib: 3, aprobacion: -5 } },
  { id: 2, name: "Reclutamiento", icon: "⚔️", desc: "Ampliar el ejército nacional", effect: "+Militar 8%, -PIB 4%", statChanges: { militar: 8, pib: -4 } },
  { id: 3, name: "Plan Social", icon: "🏥", desc: "Subsidiar salud y educación", effect: "+Aprobación 10%, -PIB 6%", statChanges: { aprobacion: 10, pib: -6 } },
  { id: 4, name: "Industrialización", icon: "🏭", desc: "Inversión en industria pesada", effect: "+Industria 7%, -PIB 4%", statChanges: { industria: 7, pib: -4 } },
  { id: 5, name: "Apertura Comercial", icon: "🚢", desc: "Reducir aranceles de importación", effect: "+PIB 9%, -Industria 4%", statChanges: { pib: 9, industria: -4 } },
  { id: 6, name: "Operación Espía", icon: "🕵️", desc: "Infiltrar inteligencia enemiga", effect: "+Intel 15%, -Diplomacia", statChanges: { intel: 15 } },
];

const ALLIES = [
  { country: "México", ideology: "nacionalismo", approval: 87, status: "aliado" },
  { country: "Venezuela", ideology: "socialismo", approval: 72, status: "aliado" },
  { country: "España", ideology: "liberalismo", approval: 45, status: "neutral" },
  { country: "Rusia", ideology: "autoritarismo", approval: 23, status: "tenso" },
];

const EVENTS = [
  { id: 1, type: "crisis", icon: "🌋", title: "Terremoto en Región Norte", desc: "Un sismo 7.2 sacude tu región industrial. Pérdidas estimadas en $2.3B.", time: "hace 2h", urgent: true },
  { id: 2, type: "diplo", icon: "🤝", title: "Propuesta de Alianza — Brasil", desc: "Brasil solicita un pacto de no agresión por 30 días de juego.", time: "hace 4h", urgent: false },
  { id: 3, type: "economic", icon: "📈", title: "Boom Petrolero", desc: "Los precios del crudo suben 18%. Tus reservas valen más.", time: "hace 6h", urgent: false },
  { id: 4, type: "military", icon: "⚠️", title: "Movimiento de Tropas", desc: "Colombia reporta concentración militar en tu frontera sur.", time: "hace 8h", urgent: true },
];

const PARTIES = [
  { name: "Frente Bolivariano", ideology: "socialismo", members: 12, countries: ["Cuba","Venezuela","Bolivia"], power: 78 },
  { name: "Alianza Atlántica", ideology: "liberalismo", members: 18, countries: ["España","Francia","Chile"], power: 85 },
  { name: "Bloque del Este", ideology: "autoritarismo", members: 8, countries: ["Rusia","China","Irán"], power: 91 },
];

const clamp = (v, min = 0, max = 100) => Math.min(max, Math.max(min, v));

export default function NacionesEnGuerra() {
  const [screen, setScreen] = useState("onboarding");
  const [tab, setTab] = useState("panel");
  const [step, setStep] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedIdeology, setSelectedIdeology] = useState("");
  const [nationName, setNationName] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [decreeUsed, setDecreeUsed] = useState([]);
  const [selectedDecree, setSelectedDecree] = useState(null);
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [allianceAccepted, setAllianceAccepted] = useState(false);
  const [tgUser, setTgUser] = useState(null);

  // Stats with real state
  const [stats, setStats] = useState({
    pib: 67, militar: 45, aprobacion: 58, poblacion: 11.2,
    petroleo: 34, comida: 71, energia: 52, educacion: 63,
    salud: 55, rebeldia: 28, intel: 40, industria: 49,
  });

  // Tick countdown
  const [countdown, setCountdown] = useState(6 * 3600); // 6h in seconds

  useEffect(() => {
    // Init Telegram WebApp
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor("#080b14");
      tg.setBackgroundColor("#080b14");
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setTgUser(user);
        setLeaderName(user.first_name || "Presidente");
      }
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          // Tick! Apply passive changes
          setStats(s => ({
            ...s,
            pib: clamp(s.pib + Math.floor(Math.random() * 5) - 2),
            aprobacion: clamp(s.aprobacion + Math.floor(Math.random() * 4) - 2),
            rebeldia: clamp(s.rebeldia + Math.floor(Math.random() * 3) - 1),
          }));
          setDecreeUsed([]); // Reset decrees each tick
          showNotif("⏰ Nuevo tick — decretos renovados", "info");
          return 6 * 3600;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, "0");
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const showNotif = (msg, type = "info") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const issueDecree = async (decree) => {
    if (decreeUsed.includes(decree.id)) return;
    if (decreeUsed.length >= 3) { showNotif("⛔ Ya usaste tus 3 decretos de hoy", "error"); return; }

    // Haptic feedback in Telegram
    tg?.HapticFeedback?.impactOccurred("medium");

    setSelectedDecree(decree);
    setAiLoading(true);
    setAiResponse("");
    setTab("decretos");

    // Apply stat changes immediately
    setStats(prev => {
      const next = { ...prev };
      if (decree.statChanges) {
        Object.entries(decree.statChanges).forEach(([key, delta]) => {
          if (next[key] !== undefined) next[key] = clamp(next[key] + delta);
        });
      }
      return next;
    });

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Eres el narrador de "Naciones en Guerra", simulador geopolítico en Telegram.
El jugador es ${leaderName}, Presidente de ${selectedCountry} con ideología ${IDEOLOGIES[selectedIdeology]?.label || "neutral"}.
Emitió el decreto: "${decree.name}" — ${decree.desc}.
Stats actuales: PIB ${stats.pib}%, Aprobación ${stats.aprobacion}%, Militar ${stats.militar}%, Rebeldía ${stats.rebeldia}%.

Responde con 3 párrafos cortos:
1. Consecuencia inmediata dramática (como noticiario urgente)
2. Reacción de un país aliado o enemigo específico con nombre real
3. Evento secundario inesperado (bueno o malo 50/50)

Tono: serio, geopolítico, dramático. Máximo 100 palabras. Sin listas, solo párrafos.`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "Las consecuencias se despliegan por el territorio...";
      setAiResponse(text);
    } catch {
      setAiResponse("Las decisiones presidenciales tienen consecuencias que el mundo entero observa con atención...");
    }

    setDecreeUsed(p => [...p, decree.id]);
    setAiLoading(false);
  };

  const handleAllianceAccept = () => {
    tg?.HapticFeedback?.notificationOccurred("success");
    setAllianceAccepted(true);
    setStats(s => ({ ...s, pib: clamp(s.pib + 5), aprobacion: clamp(s.aprobacion + 3) }));
    showNotif("✅ Alianza con Brasil confirmada +PIB +Aprobación", "info");
  };

  const handleAllianceReject = () => {
    tg?.HapticFeedback?.notificationOccurred("error");
    setAllianceAccepted(false);
    setStats(s => ({ ...s, aprobacion: clamp(s.aprobacion - 2) }));
    showNotif("❌ Propuesta rechazada — relaciones tensas con Brasil", "error");
  };

  const StatBar = ({ label, value, color = "#c9a84c", icon }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11, color: "#a0a0a0", fontFamily: "monospace" }}>
        <span>{icon} {label}</span>
        <span style={{ color: value > 60 ? "#4caf50" : value > 35 ? "#c9a84c" : "#e53935", fontWeight: "bold" }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: "#1a1a2e", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)`, borderRadius: 3, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );

  // ── ONBOARDING ──
  if (screen === "onboarding") {
    return (
      <div style={{ minHeight: "100vh", background: "#080b14", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Georgia', serif", padding: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420, textAlign: "center" }}>

          {step === 0 && (
            <div>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🌍</div>
              <h1 style={{ fontSize: 30, color: "#c9a84c", letterSpacing: 3, margin: "0 0 4px", textTransform: "uppercase" }}>Naciones</h1>
              <h1 style={{ fontSize: 30, color: "#e8e8e8", letterSpacing: 3, margin: "0 0 20px", textTransform: "uppercase" }}>en Guerra</h1>
              {tgUser && <p style={{ color: "#c9a84c", fontSize: 13, marginBottom: 8 }}>Bienvenido, {tgUser.first_name} 👋</p>}
              <p style={{ color: "#6a6a8a", fontSize: 13, lineHeight: 1.8, marginBottom: 32 }}>El mundo está en caos. 195 naciones compiten por el poder global. Solo una alcanzará la hegemonía.</p>
              <button onClick={() => setStep(1)} style={{ background: "linear-gradient(135deg, #c9a84c, #a07830)", border: "none", color: "#080b14", padding: "14px 40px", borderRadius: 4, fontSize: 14, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", fontWeight: "bold", width: "100%" }}>
                TOMAR EL PODER
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🗺️</div>
              <h2 style={{ color: "#c9a84c", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase", fontSize: 16 }}>Elige tu Nación</h2>
              <p style={{ color: "#6a6a8a", fontSize: 12, marginBottom: 16 }}>Serás su Presidente. Para bien o para mal.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20, maxHeight: 260, overflowY: "auto" }}>
                {COUNTRIES.map(c => (
                  <button key={c} onClick={() => setSelectedCountry(c)} style={{ background: selectedCountry === c ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${selectedCountry === c ? "#c9a84c" : "rgba(255,255,255,0.08)"}`, color: selectedCountry === c ? "#c9a84c" : "#777", padding: "10px 4px", borderRadius: 4, fontSize: 11, cursor: "pointer", transition: "all 0.2s" }}>{c}</button>
                ))}
              </div>
              <button disabled={!selectedCountry} onClick={() => setStep(2)} style={{ background: selectedCountry ? "linear-gradient(135deg, #c9a84c, #a07830)" : "#2a2a3a", border: "none", color: selectedCountry ? "#080b14" : "#444", padding: "14px", borderRadius: 4, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", cursor: selectedCountry ? "pointer" : "not-allowed", fontWeight: "bold", width: "100%" }}>
                CONTINUAR →
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🏛️</div>
              <h2 style={{ color: "#c9a84c", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase", fontSize: 16 }}>Tu Ideología</h2>
              <p style={{ color: "#6a6a8a", fontSize: 12, marginBottom: 16 }}>Define cómo gobernarás. Afecta todos tus decretos.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {Object.entries(IDEOLOGIES).map(([key, val]) => (
                  <button key={key} onClick={() => setSelectedIdeology(key)} style={{ background: selectedIdeology === key ? `${val.color}22` : "rgba(255,255,255,0.03)", border: `1px solid ${selectedIdeology === key ? val.color : "rgba(255,255,255,0.07)"}`, color: selectedIdeology === key ? val.color : "#777", padding: "12px 16px", borderRadius: 4, fontSize: 13, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.2s" }}>
                    <span>{val.icon} {val.label}</span>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>{val.bonus}</span>
                  </button>
                ))}
              </div>
              <button disabled={!selectedIdeology} onClick={() => setStep(3)} style={{ background: selectedIdeology ? "linear-gradient(135deg, #c9a84c, #a07830)" : "#2a2a3a", border: "none", color: selectedIdeology ? "#080b14" : "#444", padding: "14px", borderRadius: 4, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", cursor: selectedIdeology ? "pointer" : "not-allowed", fontWeight: "bold", width: "100%" }}>
                CONTINUAR →
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✍️</div>
              <h2 style={{ color: "#c9a84c", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase", fontSize: 16 }}>Tu Identidad</h2>
              <p style={{ color: "#6a6a8a", fontSize: 12, marginBottom: 20 }}>El mundo entero sabrá tu nombre.</p>
              <input
                placeholder="Tu nombre como líder..."
                value={leaderName}
                onChange={e => setLeaderName(e.target.value)}
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.3)", color: "#e8e8e8", padding: "12px 16px", borderRadius: 4, fontSize: 14, marginBottom: 12, boxSizing: "border-box", outline: "none", fontFamily: "Georgia, serif" }}
              />
              <input
                placeholder="Nombre de tu partido político..."
                value={nationName}
                onChange={e => setNationName(e.target.value)}
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.3)", color: "#e8e8e8", padding: "12px 16px", borderRadius: 4, fontSize: 14, marginBottom: 24, boxSizing: "border-box", outline: "none", fontFamily: "Georgia, serif" }}
              />
              <button
                disabled={!leaderName || !nationName}
                onClick={() => { tg?.HapticFeedback?.notificationOccurred("success"); setScreen("game"); }}
                style={{ background: leaderName && nationName ? "linear-gradient(135deg, #c9a84c, #a07830)" : "#2a2a3a", border: "none", color: leaderName && nationName ? "#080b14" : "#444", padding: "14px", borderRadius: 4, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", cursor: leaderName && nationName ? "pointer" : "not-allowed", fontWeight: "bold", width: "100%" }}>
                🌍 ASUMIR EL PODER
              </button>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i === step ? "#c9a84c" : "#2a2a3a", transition: "all 0.3s" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── GAME ──
  const ideo = IDEOLOGIES[selectedIdeology] || IDEOLOGIES.liberalismo;

  return (
    <div style={{ minHeight: "100vh", background: "#080b14", fontFamily: "'Georgia', serif", color: "#e8e8e8", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />

      {notification && (
        <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: notification.type === "error" ? "#e5393522" : "#c9a84c22", border: `1px solid ${notification.type === "error" ? "#e53935" : "#c9a84c"}`, color: notification.type === "error" ? "#e53935" : "#c9a84c", padding: "10px 20px", borderRadius: 4, fontSize: 13, zIndex: 1000, letterSpacing: 1, whiteSpace: "nowrap" }}>
          {notification.msg}
        </div>
      )}

      {/* HEADER */}
      <div style={{ background: "rgba(8,11,20,0.97)", borderBottom: "1px solid rgba(201,168,76,0.2)", padding: "12px 16px", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(10px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: "#c9a84c", letterSpacing: 2, textTransform: "uppercase" }}>🌍 Naciones en Guerra</div>
            <div style={{ fontSize: 13, color: "#e8e8e8", marginTop: 2 }}>{leaderName} · <span style={{ color: ideo.color }}>{ideo.icon} {selectedCountry}</span></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#6a6a8a", letterSpacing: 1 }}>PRÓXIMO TICK</div>
            <div style={{ fontSize: 15, color: "#c9a84c", fontFamily: "monospace", fontWeight: "bold" }}>{formatCountdown(countdown)}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 10, overflowX: "auto", paddingBottom: 2 }}>
          {[["💰", stats.pib], ["⚔️", stats.militar], ["👥", stats.aprobacion], ["🛢️", stats.petroleo], ["🌾", stats.comida]].map(([icon, val], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.04)", padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
              <span style={{ fontSize: 12 }}>{icon}</span>
              <span style={{ fontSize: 12, color: val > 60 ? "#4caf50" : val > 35 ? "#c9a84c" : "#e53935", fontFamily: "monospace", fontWeight: "bold" }}>{val}%</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px", paddingBottom: 80 }}>

        {/* PANEL */}
        {tab === "panel" && (
          <div>
            <div style={{ fontSize: 11, color: "#c9a84c", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>📊 Panel Nacional</div>
            {EVENTS.filter(e => e.urgent).map(ev => (
              <div key={ev.id} style={{ background: "rgba(229,57,53,0.08)", border: "1px solid rgba(229,57,53,0.3)", borderRadius: 6, padding: "12px 14px", marginBottom: 10, display: "flex", gap: 12 }}>
                <span style={{ fontSize: 24 }}>{ev.icon}</span>
                <div>
                  <div style={{ fontSize: 13, color: "#e53935", fontWeight: "bold", marginBottom: 4 }}>⚠ {ev.title}</div>
                  <div style={{ fontSize: 12, color: "#888", lineHeight: 1.6 }}>{ev.desc}</div>
                  <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>{ev.time}</div>
                </div>
              </div>
            ))}
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
              <StatBar label="Defensa" value={62} icon="🛡️" color="#607d8b" />
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
                <div style={{ fontSize: 13, color: "#c9a84c", marginBottom: 10, fontWeight: "bold" }}>
                  {selectedDecree.icon} {selectedDecree.name} — Consecuencias
                </div>
                {aiLoading ? (
                  <div style={{ color: "#6a6a8a", fontSize: 13, fontStyle: "italic", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>⏳</span> Evaluando impacto internacional...
                  </div>
                ) : (
                  <div style={{ color: "#c0c0c0", fontSize: 13, lineHeight: 1.8 }}>{aiResponse}</div>
                )}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {DECREES.map(d => {
                const used = decreeUsed.includes(d.id);
                const exhausted = decreeUsed.length >= 3 && !used;
                return (
                  <button key={d.id} onClick={() => issueDecree(d)} disabled={used || exhausted} style={{ background: used ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)", border: `1px solid ${used ? "rgba(255,255,255,0.04)" : selectedDecree?.id === d.id ? "#c9a84c44" : "rgba(201,168,76,0.15)"}`, borderRadius: 6, padding: "14px 16px", textAlign: "left", cursor: used || exhausted ? "not-allowed" : "pointer", opacity: used || exhausted ? 0.4 : 1, transition: "all 0.2s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
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
                <div style={{ fontSize: 13, color: "#aaa", marginBottom: 12, lineHeight: 1.6 }}>Brasil solicita un <strong style={{ color: "#e8e8e8" }}>Pacto de No Agresión</strong> por 30 días. A cambio ofrece +15% comercio bilateral y +5% PIB.</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleAllianceAccept} style={{ flex: 1, background: "rgba(76,175,80,0.2)", border: "1px solid #4caf50", color: "#4caf50", padding: "10px", borderRadius: 4, fontSize: 12, cursor: "pointer", fontFamily: "Georgia, serif" }}>✅ ACEPTAR</button>
                  <button onClick={handleAllianceReject} style={{ flex: 1, background: "rgba(229,57,53,0.1)", border: "1px solid #e53935", color: "#e53935", padding: "10px", borderRadius: 4, fontSize: 12, cursor: "pointer", fontFamily: "Georgia, serif" }}>❌ RECHAZAR</button>
                </div>
              </div>
            ) : (
              <div style={{ background: "rgba(76,175,80,0.06)", border: "1px solid rgba(76,175,80,0.25)", borderRadius: 6, padding: 14, marginBottom: 16, textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>🤝</div>
                <div style={{ fontSize: 13, color: "#4caf50" }}>Alianza con Brasil activa — 30 días restantes</div>
              </div>
            )}

            {ALLIES.map((a, i) => {
              const aideo = IDEOLOGIES[a.ideology];
              const statusColor = a.status === "aliado" ? "#4caf50" : a.status === "neutral" ? "#c9a84c" : "#e53935";
              return (
                <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#e8e8e8", marginBottom: 4 }}>{aideo.icon} {a.country}</div>
                    <div style={{ fontSize: 11, color: "#666" }}>{aideo.label} · Rel. {a.approval}%</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: statusColor, border: `1px solid ${statusColor}44`, padding: "3px 10px", borderRadius: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{a.status}</div>
                    <button onClick={() => { tg?.HapticFeedback?.impactOccurred("light"); showNotif(`✉ Mensaje enviado a ${a.country}`, "info"); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#666", padding: "3px 10px", borderRadius: 4, fontSize: 10, cursor: "pointer", fontFamily: "Georgia, serif" }}>✉ CONTACTAR</button>
                  </div>
                </div>
              );
            })}

            <div style={{ fontSize: 11, color: "#6a6a8a", letterSpacing: 1, marginBottom: 10, marginTop: 16, textTransform: "uppercase" }}>Acciones</div>
            {[
              ["🤝", "Proponer Alianza", "Invitar a otro país a aliarse", () => showNotif("🤝 Selecciona un país para proponer alianza", "info")],
              ["📦", "Embargo Económico", "Bloquear comercio con un rival", () => { setStats(s => ({...s, pib: clamp(s.pib - 3)})); showNotif("📦 Embargo declarado — tu PIB baja 3%", "error"); }],
              ["🕵️", "Operación Espionaje", "Infiltrar inteligencia rival", () => { setStats(s => ({...s, intel: clamp(s.intel + 10)})); showNotif("🕵️ Operación exitosa +10 Intel", "info"); }],
              ["📢", "Discurso en ONU", "Influir en opinión global", () => { setStats(s => ({...s, aprobacion: clamp(s.aprobacion + 5)})); showNotif("📢 Discurso aplaudido +5 Aprobación", "info"); }],
            ].map(([icon, name, desc, action], i) => (
              <button key={i} onClick={() => { tg?.HapticFeedback?.impactOccurred("medium"); action(); }} style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, padding: "12px 14px", marginBottom: 8, textAlign: "left", cursor: "pointer", display: "flex", gap: 12, alignItems: "center", fontFamily: "Georgia, serif" }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 13, color: "#ddd" }}>{name}</div>
                  <div style={{ fontSize: 11, color: "#666" }}>{desc}</div>
                </div>
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
              <div style={{ fontSize: 18, color: "#e8e8e8", marginBottom: 4 }}>{ideo.icon} {nationName}</div>
              <div style={{ fontSize: 13, color: ideo.color, marginBottom: 12 }}>{ideo.label} · Fundador: {leaderName}</div>
              <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
                {[["1","MIEMBROS"],["1","PAÍSES"],["#1","RANKING"]].map(([v,l]) => (
                  <div key={l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 20, color: "#c9a84c", fontFamily: "monospace", fontWeight: "bold" }}>{v}</div>
                    <div style={{ fontSize: 10, color: "#666" }}>{l}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => { tg?.HapticFeedback?.impactOccurred("light"); showNotif("📤 Link de invitación copiado al portapapeles", "info"); }} style={{ width: "100%", background: `${ideo.color}22`, border: `1px solid ${ideo.color}66`, color: ideo.color, padding: "10px", borderRadius: 4, fontSize: 12, cursor: "pointer", fontFamily: "Georgia, serif", letterSpacing: 1 }}>
                📤 INVITAR MIEMBROS
              </button>
            </div>

            <div style={{ fontSize: 11, color: "#6a6a8a", letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>Partidos Globales</div>
            {PARTIES.map((p, i) => {
              const pideo = IDEOLOGIES[p.ideology];
              return (
                <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, color: "#e8e8e8", marginBottom: 4 }}>{pideo.icon} {p.name}</div>
                      <div style={{ fontSize: 12, color: pideo.color }}>{pideo.label} · {p.members} miembros</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, color: "#c9a84c", fontFamily: "monospace", fontWeight: "bold" }}>{p.power}</div>
                      <div style={{ fontSize: 10, color: "#666" }}>PODER</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                    {p.countries.map(c => <span key={c} style={{ fontSize: 10, color: "#777", background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>{c}</span>)}
                  </div>
                  <button onClick={() => { tg?.HapticFeedback?.impactOccurred("medium"); showNotif(`📨 Solicitud enviada a ${p.name}`, "info"); }} style={{ width: "100%", background: "transparent", border: `1px solid ${pideo.color}44`, color: pideo.color, padding: "8px", borderRadius: 4, fontSize: 11, cursor: "pointer", fontFamily: "Georgia, serif", letterSpacing: 1 }}>
                    SOLICITAR INGRESO
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* EVENTOS */}
        {tab === "eventos" && (
          <div>
            <div style={{ fontSize: 11, color: "#c9a84c", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>📡 Noticias Mundiales</div>
            {EVENTS.map(ev => (
              <div key={ev.id} style={{ background: ev.urgent ? "rgba(229,57,53,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${ev.urgent ? "rgba(229,57,53,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: 6, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 26 }}>{ev.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ fontSize: 13, color: ev.urgent ? "#e53935" : "#e8e8e8", fontWeight: "bold", marginBottom: 6, flex: 1 }}>{ev.title}</div>
                      {ev.urgent && <span style={{ fontSize: 9, color: "#e53935", border: "1px solid #e5393544", padding: "2px 6px", borderRadius: 10, marginLeft: 8, flexShrink: 0 }}>URGENTE</span>}
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

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(8,11,20,0.97)", borderTop: "1px solid rgba(201,168,76,0.15)", display: "flex", backdropFilter: "blur(10px)" }}>
        {[["panel","📊","Panel"],["decretos","📜","Decretos"],["diplomacia","🤝","Diplo"],["partidos","🏛️","Partidos"],["eventos","📡","Noticias"]].map(([id,icon,label]) => (
          <button key={id} onClick={() => { tg?.HapticFeedback?.selectionChanged(); setTab(id); }} style={{ flex: 1, background: "transparent", border: "none", padding: "10px 4px 14px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 9, color: tab === id ? "#c9a84c" : "#444", letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</span>
            {tab === id && <div style={{ width: 20, height: 2, background: "#c9a84c", borderRadius: 1 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}
