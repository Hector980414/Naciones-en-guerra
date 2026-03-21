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
HOST_ID = 8127548189  # Solo Hector

HEADERS_SB = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
log = logging.getLogger(__name__)

# ── Supabase helpers ──────────────────────────────────────
async def sb_get(table, params=""):
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(f"{SUPABASE_URL}/rest/v1/{table}?{params}", headers=HEADERS_SB)
        return r.json() if r.status_code == 200 else []

async def sb_patch(table, data, match):
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.patch(f"{SUPABASE_URL}/rest/v1/{table}?{match}", headers=HEADERS_SB, json=data)
        return r.status_code in [200, 204]

async def sb_post(table, data):
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.post(f"{SUPABASE_URL}/rest/v1/{table}", headers=HEADERS_SB, json=data)
        return r.status_code in [200, 201]

# ── Verificar si es host ──────────────────────────────────
def es_host(update: Update) -> bool:
    return update.effective_user.id == HOST_ID

# ── Panel de control del host ─────────────────────────────
def menu_admin():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("📊 Ver todos los jugadores", callback_data="admin_jugadores")],
        [InlineKeyboardButton("💰 Darme dinero gratis", callback_data="admin_dinero_host"),
         InlineKeyboardButton("⚡ Rellenar mi energía", callback_data="admin_energia_host")],
        [InlineKeyboardButton("🌍 Ver estadísticas", callback_data="admin_stats")],
        [InlineKeyboardButton("⚔️ Ver guerras activas", callback_data="admin_guerras")],
        [InlineKeyboardButton("🏭 Ver todas las fábricas", callback_data="admin_fabricas")],
        [InlineKeyboardButton("💎 Activar premium a jugador", callback_data="admin_premium")],
        [InlineKeyboardButton("🚫 Banear jugador", callback_data="admin_banear")],
        [InlineKeyboardButton("🔄 Resetear tick global", callback_data="admin_tick")],
        [InlineKeyboardButton("💣 Dar dinero a todos", callback_data="admin_dinero_todos")],
        [InlineKeyboardButton("📢 Mensaje a todos", callback_data="admin_broadcast")],
    ])

async def admin(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not es_host(update):
        await update.message.reply_text("⛔ No tienes acceso a este comando.")
        return
    await update.message.reply_text(
        "🎮 *Panel de Control — Naciones en Guerra*\n\n"
        f"👤 Host: Hector\n"
        f"🕐 {datetime.now().strftime('%d/%m/%Y %H:%M')}\n\n"
        "Selecciona una acción:",
        parse_mode="Markdown",
        reply_markup=menu_admin()
    )

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("🌍 JUGAR AHORA", web_app=WebAppInfo(url=WEBAPP_URL))],
    ]
    if es_host(update):
        keyboard.append([InlineKeyboardButton("⚙️ Panel Admin", callback_data="admin_menu")])
    await update.message.reply_text(
        "🌍 *Naciones en Guerra*\n\n"
        "195 naciones compiten por el poder global\\.\n"
        "Toma el control, emite decretos y lidera tu partido\\.",
        parse_mode="MarkdownV2",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def estado(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    jugador = await sb_get("jugadores", f"select=nombre,pais,rol,xp,nivel,dinero,energia,premium,premium_plan&id=eq.{uid}")
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
            f"💵 Dinero: ${j.get('dinero',1000):,}\n"
            f"⚡ Energía: {j.get('energia',100)}/100\n"
            f"🎖️ {premium_text}",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
    else:
        await update.message.reply_text("No tienes una nación registrada.")

async def ayuda(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (
        "🎮 *Comandos*\n\n"
        "/start — Abrir el juego\n"
        "/estado — Ver tu nación\n"
        "/ayuda — Esta ayuda\n\n"
        "🛒 La tienda está dentro del juego\n"
        "⏰ Tick cada 1h · Decretos se renuevan cada 24h"
    )
    if es_host(update):
        text += "\n\n⚙️ /admin — Panel de control"
    await update.message.reply_text(text, parse_mode="Markdown")

# ── Callback handler ──────────────────────────────────────
async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    uid = query.from_user.id
    data = query.data

    # Panel admin solo para host
    if data.startswith("admin_") and uid != HOST_ID:
        await query.edit_message_text("⛔ No tienes acceso.")
        return

    if data == "admin_menu":
        await query.edit_message_text(
            "🎮 *Panel de Control*\nSelecciona una acción:",
            parse_mode="Markdown",
            reply_markup=menu_admin()
        )

    elif data == "admin_jugadores":
        jugadores = await sb_get("jugadores", "select=nombre,pais,rol,nivel,dinero,energia&order=nivel.desc&limit=20")
        if not jugadores:
            await query.edit_message_text("No hay jugadores.", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("← Volver", callback_data="admin_menu")]]))
            return
        texto = "👥 *Jugadores registrados:*\n\n"
        for j in jugadores:
            rol_icon = "👑" if j.get('rol') == 'presidente' else "🏴"
            texto += f"{rol_icon} *{j['nombre']}* — {j['pais']}\n"
            texto += f"   Nv.{j.get('nivel',1)} · ${j.get('dinero',1000):,} · ⚡{j.get('energia',100)}\n\n"
        await query.edit_message_text(
            texto, parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("← Volver", callback_data="admin_menu")]])
        )

    elif data == "admin_dinero_host":
        ok = await sb_patch("jugadores", {"dinero": 9999999}, f"id=eq.{HOST_ID}")
        if ok:
            await query.edit_message_text(
                "💰 *¡Dinero activado!*\n\nTu saldo fue actualizado a $9,999,999\nRecarga el juego para verlo.",
                parse_mode="Markdown",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("← Volver", callback_data="admin_menu")]])
            )
        else:
            await query.edit_message_text("❌ Error al actualizar.", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("← Volver", callback_data="admin_menu")]]))

    elif data == "admin_energia_host":
        ok = await sb_patch("jugadores", {"energia": 100, "ultima_energia": datetime.utcnow().isoformat()}, f"id=eq.{HOST_ID}")
        if ok:
            await query.edit_message_text(
                "⚡ *¡Energía recargada!*\n\nTu energía fue rellenada a 100/100\nRecarga el juego para verlo.",
                parse_mode="Markdown",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("← Volver", callback_data="admin_menu")]])
            )
        else:
            await query.edit_message_text("❌ Error.", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("← Volver", callback_data="admin_menu")]]))

    elif data == "admin_stats":
        jugadores = await sb_get("jugadores", "select=id,rol&limit=100")
        presidentes = len([j for j in jugadores if j.get('rol') == 'presidente'])
        ciudadanos = len([j for j in jugadores if j.get('rol') == 'ciudadano'])
        fabricas = await sb_get("fabricas", "select=id&eq.activa=true&limit=100")
        await query.edit_message_text(
            f"📊 *Estadísticas del juego*\n\n"
            f"👥 Total jugadores: {len(jugadores)}\n"
            f"👑 Presidentes: {presidentes}\n"
            f"🏴 Ciudadanos: {ciudadanos}\n"
            f"🏭 Fábricas activas: {len(fabricas)}\n"
            f"🕐 {datetime.now().strftime('%d/%m/%Y %H:%M')}",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("← Volver", callback_data="admin_menu")]])
        )

    elif data == "admin_tick":
        proximo = (datetime.utcnow() + timedelta(hours=1)).isoformat()
        ok = await sb_patch("tick_global", {
            "ultimo_tick": datetime.utcnow().isoformat(),
            "proximo_tick": proximo
        }, "id=eq.1")
        if ok:
            await query.edit_message_text(
                "🔄 *Tick global reseteado*\n\nEl próximo tick es en 1 hora.",
                parse_mode="Markdown",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("← Volver", callback_data="admin_menu")]])
            )

    elif data == "admin_guerras":
        guerras = await sb_get("guerras", "select=tipo,pais_atacante,pais_defensor,resultado,created_at&order=created_at.desc&limit=10")
        if not guerras:
            await query.edit_message_text("No hay guerras.", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("← Volver", callback_data="admin_menu")]]))
            return
        texto = "⚔️ *Últimas guerras:*\n\n"
        for g in guerras:
            res = g.get('resultado', 'activa')
            texto += f"• {g['tipo']}: {g['pais_atacante']} vs {g['pais_defensor']} — {res}\n"
        await query.edit_message_text(texto, parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("← Volver", callback_data="admin_menu")]]))

    elif data == "admin_fabricas":
        fabricas = await sb_get("fabricas", "select=nombre,pais,tipo_recurso,nivel,trabajadores_actuales&eq.activa=true&limit=20")
        if not fabricas:
            await query.edit_message_text("No hay fábricas.", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("← Volver", callback_data="admin_menu")]]))
            return
        texto = "🏭 *Fábricas activas:*\n\n"
        for f in fabricas:
            texto += f"• {f['nombre']} ({f['pais']}) — Nv.{f['nivel']} · {f['tipo_recurso']} · 👥{f['trabajadores_actuales']}\n"
        await query.edit_message_text(texto, parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("← Volver", callback_data="admin_menu")]]))

    elif data == "admin_premium":
        await query.edit_message_text(
            "💎 Para activar premium a un jugador usa:\n\n`/premium ID_TELEGRAM`\n\nEjemplo: `/premium 123456789`",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("← Volver", callback_data="admin_menu")]]))

    elif data == "admin_banear":
        await query.edit_message_text(
            "🚫 Para banear un jugador usa:\n\n`/ban ID_TELEGRAM`\n\nEjemplo: `/ban 123456789`",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("← Volver", callback_data="admin_menu")]]))

    elif data == "admin_dinero_todos":
        await query.edit_message_text(
            "💣 ¿Dar $5,000 a TODOS los jugadores?\n\nEsto afectará la economía del juego.",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("✅ SÍ, dar dinero a todos", callback_data="admin_dinero_todos_confirm")],
                [InlineKeyboardButton("← Cancelar", callback_data="admin_menu")]
            ])
        )

    elif data == "admin_dinero_todos_confirm":
        jugadores = await sb_get("jugadores", "select=id,dinero&limit=200")
        count = 0
        for j in jugadores:
            nuevo = (j.get('dinero') or 1000) + 5000
            ok = await sb_patch("jugadores", {"dinero": nuevo}, f"id=eq.{j['id']}")
            if ok: count += 1
        await query.edit_message_text(
            f"✅ *$5,000 enviados a {count} jugadores*",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("← Volver", callback_data="admin_menu")]]))

    elif data == "admin_broadcast":
        await query.edit_message_text(
            "📢 Para enviar mensaje a todos usa:\n\n`/broadcast Tu mensaje aquí`",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("← Volver", callback_data="admin_menu")]]))

# ── Comandos admin por texto ──────────────────────────────
async def cmd_premium(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not es_host(update): return
    if not context.args:
        await update.message.reply_text("Uso: /premium ID_TELEGRAM")
        return
    target_id = context.args[0]
    expira = (datetime.utcnow() + timedelta(days=30)).isoformat()
    ok = await sb_patch("jugadores", {
        "premium": True, "premium_hasta": expira,
        "premium_plan": "Pase Presidencial (Admin)",
        "trabajo_intervalo": 3, "bonus_xp": 200, "bonus_salario": 200
    }, f"id=eq.{target_id}")
    if ok:
        await update.message.reply_text(f"✅ Premium activado para {target_id} por 30 días.")
        try:
            await context.bot.send_message(chat_id=int(target_id),
                text="🎉 *¡El administrador te activó Premium Presidencial por 30 días!*\n\n👑 Disfruta todos los beneficios.",
                parse_mode="Markdown")
        except: pass
    else:
        await update.message.reply_text("❌ Error. Verifica el ID.")

async def cmd_ban(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not es_host(update): return
    if not context.args:
        await update.message.reply_text("Uso: /ban ID_TELEGRAM")
        return
    target_id = context.args[0]
    ok = await sb_patch("jugadores", {"exiliado": True, "exilio_hasta": "2099-01-01T00:00:00Z"}, f"id=eq.{target_id}")
    if ok:
        await update.message.reply_text(f"🚫 Jugador {target_id} baneado permanentemente.")
    else:
        await update.message.reply_text("❌ Error.")

async def cmd_broadcast(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not es_host(update): return
    if not context.args:
        await update.message.reply_text("Uso: /broadcast Tu mensaje")
        return
    mensaje = " ".join(context.args)
    jugadores = await sb_get("jugadores", "select=id&limit=200")
    enviados = 0
    for j in jugadores:
        try:
            await context.bot.send_message(
                chat_id=j["id"],
                text=f"📢 *Mensaje del administrador:*\n\n{mensaje}",
                parse_mode="Markdown"
            )
            enviados += 1
            await asyncio.sleep(0.05)
        except: pass
    await update.message.reply_text(f"✅ Mensaje enviado a {enviados} jugadores.")

# ── Scheduler ─────────────────────────────────────────────
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
        if minor >= 3600: await run_minor_tick(app); minor = 0
        if major >= 86400: await run_major_tick(app); major = 0
        if alive >= 259200:
            await sb_get("jugadores", "select=id&limit=1"); alive = 0

async def main():
    log.info(f"🚀 Bot iniciando... HOST_ID: {HOST_ID}")
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("estado", estado))
    app.add_handler(CommandHandler("ayuda", ayuda))
    app.add_handler(CommandHandler("help", ayuda))
    app.add_handler(CommandHandler("admin", admin))
    app.add_handler(CommandHandler("premium", cmd_premium))
    app.add_handler(CommandHandler("ban", cmd_ban))
    app.add_handler(CommandHandler("broadcast", cmd_broadcast))
    app.add_handler(CallbackQueryHandler(button_handler))
    async with app:
        await app.start()
        await app.updater.start_polling(allowed_updates=Update.ALL_TYPES)
        log.info("✅ Bot corriendo con panel admin")
        await scheduler(app)

if __name__ == "__main__":
    asyncio.run(main())
