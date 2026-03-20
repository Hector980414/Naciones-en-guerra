#!/usr/bin/env python3
import asyncio, logging, httpx, os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

load_dotenv(os.path.expanduser("~/naciones-v2/.env"))

TOKEN = "8759601075:AAHuztMAKGLO9b-nkmQzANsgjkNEQDcJvnU"
WEBAPP_URL = "https://Hector980414.github.io/Naciones-en-guerra/"
SUPABASE_URL = "https://wdbupgqymgqfpobcbfze.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYnVwZ3F5bWdxZnBvYmNiZnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NjM0NjAsImV4cCI6MjA4OTUzOTQ2MH0.Psq7trqKDSNltKK8bqaLdXgg56FSjK6sfM4EH4TRnBo"
NOWPAYMENTS_KEY = os.getenv("NOWPAYMENTS_KEY", "")
EDGE_URL = "https://wdbupgqymgqfpobcbfze.supabase.co/functions/v1/Pago"

HEADERS_SB = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
log = logging.getLogger(__name__)

async def sb_get(table, params=""):
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(f"{SUPABASE_URL}/rest/v1/{table}?{params}", headers=HEADERS_SB)
        return r.json() if r.status_code == 200 else []

async def sb_patch(table, data, match):
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.patch(f"{SUPABASE_URL}/rest/v1/{table}?{match}", headers=HEADERS_SB, json=data)
        return r.status_code in [200, 204]

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("🌍 JUGAR AHORA", web_app=WebAppInfo(url=WEBAPP_URL))],
        [InlineKeyboardButton("🛒 TIENDA PREMIUM", web_app=WebAppInfo(url=WEBAPP_URL + "#tienda"))]
    ]
    await update.message.reply_text(
        "🌍 *Naciones en Guerra*\n\n"
        "195 naciones compiten por el poder global\\.\n"
        "Toma el control, emite decretos y lidera tu partido\\.\n\n"
        "¿Listo para gobernar?",
        parse_mode="MarkdownV2",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def estado(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    jugador = await sb_get("jugadores", f"select=nombre,pais,rol,xp,nivel,dinero,premium,premium_plan&id=eq.{uid}")
    if jugador:
        j = jugador[0]
        nacion = await sb_get("naciones", f"select=pib,militar,aprobacion&jugador_id=eq.{uid}")
        n = nacion[0] if nacion else {}
        premium_text = f"💎 {j.get('premium_plan')}" if j.get('premium') else "Sin premium"
        keyboard = [[InlineKeyboardButton("📊 Ver panel completo", web_app=WebAppInfo(url=WEBAPP_URL))]]
        await update.message.reply_text(
            f"🏴 *{j['nombre']}* — {j['pais']}\n"
            f"{j.get('rol','ciudadano').upper()}\n\n"
            f"💰 PIB: {n.get('pib',67)}%\n"
            f"⚔️ Militar: {n.get('militar',45)}%\n"
            f"👥 Aprobación: {n.get('aprobacion',58)}%\n"
            f"⭐ Nivel: {j.get('nivel',1)} · XP: {j.get('xp',0)}\n"
            f"💵 ${j.get('dinero',1000):,}\n"
            f"🎖️ {premium_text}",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
    else:
        keyboard = [[InlineKeyboardButton("🌍 Registrarse", web_app=WebAppInfo(url=WEBAPP_URL))]]
        await update.message.reply_text("No tienes una nación aún.", reply_markup=InlineKeyboardMarkup(keyboard))

async def ayuda(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🎮 *Comandos*\n\n"
        "/start — Abrir el juego\n"
        "/estado — Ver tu nación\n"
        "/ayuda — Esta ayuda\n\n"
        "🛒 La tienda está dentro del juego — toca la pestaña TIENDA\n\n"
        "⏰ Tick cada 1h · Decretos se renuevan cada 24h",
        parse_mode="Markdown"
    )

async def run_minor_tick(app):
    log.info("🔄 Tick menor...")
    try:
        await sb_patch("tick_global", {
            "ultimo_tick": datetime.utcnow().isoformat(),
            "proximo_tick": (datetime.utcnow() + timedelta(hours=1)).isoformat()
        }, "id=eq.1")
    except Exception as e:
        log.error(f"Tick error: {e}")

async def run_major_tick(app):
    log.info("🌅 Tick mayor...")
    try:
        await sb_patch("naciones", {
            "decretos_usados": [],
            "updated_at": datetime.utcnow().isoformat()
        }, "jugador_id=gt.0")
        jugadores = await sb_get("jugadores", "select=id")
        for j in jugadores:
            try:
                keyboard = [[InlineKeyboardButton("📜 Emitir decretos", web_app=WebAppInfo(url=WEBAPP_URL))]]
                await app.bot.send_message(
                    chat_id=j["id"],
                    text="🌅 *¡Nuevo día\\!* Tienes 3 decretos frescos para gobernar\\.",
                    parse_mode="MarkdownV2",
                    reply_markup=InlineKeyboardMarkup(keyboard)
                )
            except: pass
    except Exception as e:
        log.error(f"Tick mayor error: {e}")

async def scheduler(app):
    minor = major = alive = 0
    log.info("⏰ Scheduler iniciado")
    while True:
        await asyncio.sleep(60)
        minor += 60; major += 60; alive += 60
        if minor >= 3600:
            await run_minor_tick(app); minor = 0
        if major >= 86400:
            await run_major_tick(app); major = 0
        if alive >= 259200:
            await sb_get("jugadores", "select=id&limit=1"); alive = 0

async def main():
    log.info(f"🚀 Bot V8 iniciando... NOWPAYMENTS: {'✅' if NOWPAYMENTS_KEY else '❌'}")
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("estado", estado))
    app.add_handler(CommandHandler("ayuda", ayuda))
    app.add_handler(CommandHandler("help", ayuda))
    async with app:
        await app.start()
        await app.updater.start_polling(allowed_updates=Update.ALL_TYPES)
        log.info("✅ Bot V8 corriendo — tienda dentro de la app")
        await scheduler(app)

if __name__ == "__main__":
    asyncio.run(main())
