#!/usr/bin/env python3
"""
Naciones en Guerra — Bot V5
- Tick global cada 1 hora (recursos)
- Tick mayor cada 24 horas (decretos reset)
- Keep-alive Supabase cada 3 días
- Notificaciones automáticas a jugadores
"""
import asyncio
import logging
from datetime import datetime, timedelta
import httpx
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

# ── Config ────────────────────────────────────────────────
TOKEN = "8759601075:AAHuztMAKGLO9b-nkmQzANsgjkNEQDcJvnU"
WEBAPP_URL = "https://Hector980414.github.io/Naciones-en-guerra/"
SUPABASE_URL = "https://wdbupgqymgqfpobcbfze.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYnVwZ3F5bWdxZnBvYmNiZnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NjM0NjAsImV4cCI6MjA4OTUzOTQ2MH0.Psq7trqKDSNltKK8bqaLdXgg56FSjK6sfM4EH4TRnBo"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
log = logging.getLogger(__name__)

# ── Supabase helpers ──────────────────────────────────────
async def sb_get(table, params=""):
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{SUPABASE_URL}/rest/v1/{table}?{params}", headers=HEADERS)
        return r.json() if r.status_code == 200 else []

async def sb_patch(table, data, match):
    async with httpx.AsyncClient() as client:
        r = await client.patch(
            f"{SUPABASE_URL}/rest/v1/{table}?{match}",
            headers=HEADERS, json=data
        )
        return r.status_code in [200, 204]

async def sb_post(table, data):
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers=HEADERS, json=data
        )
        return r.status_code in [200, 201]

# ── Mensajes de tick ──────────────────────────────────────
TICK_MSGS = [
    "⚙️ El mundo avanza. Tus recursos han sido actualizados.",
    "🌍 Nuevo ciclo mundial. Revisa el estado de tu nación.",
    "📊 Los mercados se mueven. ¿Estás preparado?",
    "⏰ Tick global ejecutado. Tu economía continúa su curso.",
    "🔔 El mundo no duerme. Entra y toma decisiones.",
]

MAJOR_TICK_MSGS = [
    "🌅 ¡Nuevo día! Tienes 3 decretos frescos para gobernar.",
    "📜 Tus poderes presidenciales se han renovado. 3 decretos disponibles.",
    "🗓️ Un nuevo día político comienza. El mundo te observa.",
    "⭐ Reset diario completado. ¡A gobernar con todo!",
]

EVENTOS_RANDOM = [
    ("🌋", "Actividad volcánica detectada en región norte. Posibles pérdidas industriales."),
    ("📈", "Los mercados globales suben. Oportunidad para exportaciones."),
    ("🌪️", "Tormenta tropical amenaza zonas costeras. Activar protección civil."),
    ("💰", "Inversores extranjeros muestran interés en tu región."),
    ("✈️", "Fuga de capitales reportada. Revisa tu política económica."),
    ("🦠", "Brote de enfermedad en región sur. Refuerza el sistema de salud."),
    ("🛢️", "Descubrimiento de reservas petroleras en tu territorio."),
    ("📉", "Crisis económica regional afecta tus indicadores."),
    ("🤝", "Delegación diplomática solicita reunión urgente."),
    ("⚡", "Apagones masivos afectan la productividad industrial."),
]

import random

# ── Tick menor (cada 1 hora) ──────────────────────────────
async def run_minor_tick(app):
    log.info("🔄 Ejecutando tick menor (1h)...")
    try:
        # Actualizar próximo tick en Supabase
        await sb_patch("tick_global", {
            "ultimo_tick": datetime.utcnow().isoformat(),
            "proximo_tick": (datetime.utcnow() + timedelta(hours=1)).isoformat()
        }, "id=eq.1")

        # Obtener todos los jugadores
        jugadores = await sb_get("jugadores", "select=id,nombre")
        log.info(f"📊 {len(jugadores)} jugadores activos")

        if not jugadores:
            return

        # Actualizar recursos de todas las naciones (pequeños cambios)
        naciones = await sb_get("naciones", "select=jugador_id,petroleo,comida,energia,rebeldia")
        for n in naciones:
            cambios = {
                "petroleo": min(100, n.get("petroleo", 34) + random.randint(0, 2)),
                "comida": min(100, n.get("comida", 71) + random.randint(0, 1)),
                "energia": min(100, n.get("energia", 52) + random.randint(0, 1)),
                "rebeldia": max(0, n.get("rebeldia", 28) + random.randint(-1, 1)),
                "updated_at": datetime.utcnow().isoformat()
            }
            await sb_patch("naciones", cambios, f"jugador_id=eq.{n['jugador_id']}")

        # Notificar a jugadores (1 de cada 3 ticks para no spamear)
        if random.random() < 0.33:
            evento = random.choice(EVENTOS_RANDOM)
            msg_tick = random.choice(TICK_MSGS)
            for j in jugadores:
                try:
                    keyboard = [[InlineKeyboardButton("🌍 Ver mi nación", web_app=WebAppInfo(url=WEBAPP_URL))]]
                    await app.bot.send_message(
                        chat_id=j["id"],
                        text=f"{msg_tick}\n\n{evento[0]} *Evento:* {evento[1]}",
                        parse_mode="Markdown",
                        reply_markup=InlineKeyboardMarkup(keyboard)
                    )
                except Exception as e:
                    log.warning(f"No se pudo notificar a {j['id']}: {e}")

        log.info("✅ Tick menor completado")
    except Exception as e:
        log.error(f"❌ Error en tick menor: {e}")

# ── Tick mayor (cada 24 horas) ────────────────────────────
async def run_major_tick(app):
    log.info("🌅 Ejecutando tick MAYOR (24h)...")
    try:
        # Reset de decretos para todos
        await sb_patch("naciones", {
            "decretos_usados": [],
            "updated_at": datetime.utcnow().isoformat()
        }, "jugador_id=gt.0")

        # Notificar a todos
        jugadores = await sb_get("jugadores", "select=id,nombre,pais")
        msg = random.choice(MAJOR_TICK_MSGS)
        for j in jugadores:
            try:
                keyboard = [[InlineKeyboardButton("📜 Emitir decretos", web_app=WebAppInfo(url=WEBAPP_URL))]]
                await app.bot.send_message(
                    chat_id=j["id"],
                    text=f"{msg}\n\n🏴 *{j.get('nombre','Presidente')}* — tus decretos presidenciales han sido renovados. El mundo espera tus decisiones.",
                    parse_mode="Markdown",
                    reply_markup=InlineKeyboardMarkup(keyboard)
                )
            except Exception as e:
                log.warning(f"No se pudo notificar a {j['id']}: {e}")

        log.info("✅ Tick mayor completado")
    except Exception as e:
        log.error(f"❌ Error en tick mayor: {e}")

# ── Keep-alive Supabase (cada 3 días) ────────────────────
async def keep_alive_supabase():
    log.info("💓 Keep-alive Supabase...")
    try:
        await sb_get("jugadores", "select=id&limit=1")
        log.info("✅ Supabase activo")
    except Exception as e:
        log.error(f"❌ Keep-alive falló: {e}")

# ── Scheduler principal ───────────────────────────────────
async def scheduler(app):
    minor_tick_interval  = 3600        # 1 hora en segundos
    major_tick_interval  = 86400       # 24 horas en segundos
    keepalive_interval   = 259200      # 3 días en segundos

    minor_counter   = 0
    major_counter   = 0
    keepalive_counter = 0

    log.info("⏰ Scheduler iniciado — tick cada 1h, reset cada 24h")

    while True:
        await asyncio.sleep(60)  # revisa cada minuto
        minor_counter   += 60
        major_counter   += 60
        keepalive_counter += 60

        if minor_counter >= minor_tick_interval:
            await run_minor_tick(app)
            minor_counter = 0

        if major_counter >= major_tick_interval:
            await run_major_tick(app)
            major_counter = 0

        if keepalive_counter >= keepalive_interval:
            await keep_alive_supabase()
            keepalive_counter = 0

# ── Comandos del bot ──────────────────────────────────────
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [[InlineKeyboardButton("🌍 JUGAR AHORA", web_app=WebAppInfo(url=WEBAPP_URL))]]
    await update.message.reply_text(
        "🌍 *Naciones en Guerra*\n\n"
        "195 naciones compiten por el poder global\\.\n"
        "Toma el control de tu país, emite decretos,\n"
        "forma alianzas y lidera tu partido hacia\n"
        "la hegemonía mundial\\.\n\n"
        "¿Estás listo para gobernar?",
        parse_mode="MarkdownV2",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def estado(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    jugador = await sb_get("jugadores", f"select=nombre,pais,ideologia&id=eq.{uid}")
    if jugador:
        j = jugador[0]
        nacion = await sb_get("naciones", f"select=pib,militar,aprobacion,rebeldia&jugador_id=eq.{uid}")
        n = nacion[0] if nacion else {}
        keyboard = [[InlineKeyboardButton("📊 Ver panel completo", web_app=WebAppInfo(url=WEBAPP_URL))]]
        await update.message.reply_text(
            f"🏴 *{j['nombre']}* — {j['pais']}\n\n"
            f"💰 PIB: {n.get('pib',67)}%\n"
            f"⚔️ Militar: {n.get('militar',45)}%\n"
            f"👥 Aprobación: {n.get('aprobacion',58)}%\n"
            f"😤 Rebeldía: {n.get('rebeldia',28)}%",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
    else:
        keyboard = [[InlineKeyboardButton("🌍 Registrarse", web_app=WebAppInfo(url=WEBAPP_URL))]]
        await update.message.reply_text("No tienes una nación aún. ¡Regístrate!", reply_markup=InlineKeyboardMarkup(keyboard))

async def ayuda(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🎮 *Naciones en Guerra — Comandos*\n\n"
        "/start — Abrir el juego\n"
        "/estado — Ver stats de tu nación\n"
        "/ayuda — Esta ayuda\n\n"
        "⏰ *Ticks:*\n"
        "• Cada 1h — recursos actualizados\n"
        "• Cada 24h — decretos renovados",
        parse_mode="Markdown"
    )

# ── Main ──────────────────────────────────────────────────
async def main():
    log.info("🚀 Naciones en Guerra Bot V5 iniciando...")
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("estado", estado))
    app.add_handler(CommandHandler("ayuda", ayuda))
    app.add_handler(CommandHandler("help", ayuda))

    async with app:
        await app.start()
        await app.updater.start_polling(allowed_updates=Update.ALL_TYPES)
        log.info("✅ Bot corriendo con scheduler integrado")
        await scheduler(app)

if __name__ == "__main__":
    asyncio.run(main())
