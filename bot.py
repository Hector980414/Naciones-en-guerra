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
HOST_ID = 8127548189

HEADERS_SB = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}
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

def es_host(update):
    return update.effective_user.id == HOST_ID

def menu_admin():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("📊 Ver jugadores", callback_data="admin_jugadores")],
        [InlineKeyboardButton("🟢 Mas activos", callback_data="admin_activos"),
         InlineKeyboardButton("🔍 Buscar usuario", callback_data="admin_buscar")],
        [InlineKeyboardButton("💰 Darme dinero", callback_data="admin_dinero_host"),
         InlineKeyboardButton("⚡ Mi energia", callback_data="admin_energia_host")],
        [InlineKeyboardButton("💸 Dar dinero a jugador", callback_data="admin_dinero_jugador"),
         InlineKeyboardButton("⚡ Energia a jugador", callback_data="admin_energia_jugador")],
        [InlineKeyboardButton("🌍 Estadisticas", callback_data="admin_stats")],
        [InlineKeyboardButton("⚔️ Ver guerras", callback_data="admin_guerras"),
         InlineKeyboardButton("🏭 Ver fabricas", callback_data="admin_fabricas")],
        [InlineKeyboardButton("💎 Activar premium", callback_data="admin_premium"),
         InlineKeyboardButton("🚫 Banear jugador", callback_data="admin_banear")],
        [InlineKeyboardButton("🔄 Resetear tick", callback_data="admin_tick")],
        [InlineKeyboardButton("💣 Dinero a todos", callback_data="admin_dinero_todos")],
        [InlineKeyboardButton("📢 Broadcast", callback_data="admin_broadcast")],
    ])

async def start(update, context):
    keyboard = [[InlineKeyboardButton("🌍 JUGAR AHORA", web_app=WebAppInfo(url=WEBAPP_URL))]]
    if es_host(update):
        keyboard.append([InlineKeyboardButton("⚙️ Panel Admin", callback_data="admin_menu")])
    await update.message.reply_text(
        "🌍 Naciones en Guerra\n\n195 naciones compiten por el poder global.\nToma el control, emite decretos y lidera tu partido.",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def admin(update, context):
    if not es_host(update):
        await update.message.reply_text("Sin acceso.")
        return
    await update.message.reply_text(
        "Panel de Control - Naciones en Guerra",
        reply_markup=menu_admin()
    )

async def estado(update, context):
    uid = update.effective_user.id
    jugador = await sb_get("jugadores", f"select=nombre,pais,rol,xp,nivel,dinero,energia,premium,premium_plan&id=eq.{uid}")
    if jugador:
        j = jugador[0]
        nacion = await sb_get("naciones", f"select=pib,militar,aprobacion&jugador_id=eq.{uid}")
        n = nacion[0] if nacion else {}
        premium_text = j.get('premium_plan', 'Sin premium') if j.get('premium') else 'Sin premium'
        keyboard = [[InlineKeyboardButton("Ver panel", web_app=WebAppInfo(url=WEBAPP_URL))]]
        msg = (
            f"*{j['nombre']}* - {j['pais']}\n"
            f"{j.get('rol','ciudadano').upper()}\n\n"
            f"PIB: {n.get('pib',67)}%\n"
            f"Militar: {n.get('militar',45)}%\n"
            f"Nivel: {j.get('nivel',1)} XP: {j.get('xp',0)}\n"
            f"Dinero: ${j.get('dinero',1000):,}\n"
            f"Energia: {j.get('energia',100)}/100\n"
            f"Premium: {premium_text}"
        )
        await update.message.reply_text(msg, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
    else:
        await update.message.reply_text("No tienes nacion registrada.")

async def ayuda(update, context):
    text = "Comandos:\n/start - Jugar\n/estado - Ver nacion\n/ayuda - Ayuda"
    if es_host(update):
        text += "\n\nAdmin:\n/admin - Panel\n/dinero ID CANTIDAD\n/energia ID\n/buscar NOMBRE\n/premium ID\n/ban ID\n/broadcast MENSAJE"
    await update.message.reply_text(text)

async def button_handler(update, context):
    query = update.callback_query
    await query.answer()
    uid = query.from_user.id
    data = query.data
    volver = InlineKeyboardMarkup([[InlineKeyboardButton("Volver", callback_data="admin_menu")]])

    if data.startswith("admin_") and uid != HOST_ID:
        await query.edit_message_text("Sin acceso.")
        return

    if data == "admin_menu":
        await query.edit_message_text("Panel de Control", reply_markup=menu_admin())

    elif data == "admin_jugadores":
        jugadores = await sb_get("jugadores", "select=nombre,pais,rol,nivel,dinero,energia&order=nivel.desc&limit=20")
        lineas = ["Jugadores registrados:\n"]
        for j in jugadores:
            icon = "👑" if j.get('rol') == 'presidente' else "🏴"
            lineas.append(f"{icon} {j['nombre']} - {j['pais']} Nv.{j.get('nivel',1)} ${j.get('dinero',0):,} E:{j.get('energia',100)}")
        await query.edit_message_text("\n".join(lineas) or "Sin jugadores.", reply_markup=volver)

    elif data == "admin_activos":
        jugadores = await sb_get("jugadores", "select=nombre,pais,rol,nivel,dinero,energia,ultimo_acceso&order=ultimo_acceso.desc.nullslast&limit=20")
        lineas = ["Usuarios por ultima actividad:\n"]
        for j in jugadores:
            icon = "👑" if j.get("rol") == "presidente" else "🏴"
            ultimo = j.get("ultimo_acceso", "")[:10] if j.get("ultimo_acceso") else "Nunca"
            lineas.append(f"{icon} {j['nombre']} - {j['pais']} Nv.{j.get('nivel',1)} ${j.get('dinero',0):,} E:{j.get('energia',100)} Ultimo:{ultimo}")
        await query.edit_message_text("\n".join(lineas) or "Sin datos.", reply_markup=volver)

    elif data == "admin_buscar":
        await query.edit_message_text("Para buscar usa: /buscar NOMBRE\nEjemplo: /buscar Marta", reply_markup=volver)

    elif data == "admin_dinero_host":
        await sb_patch("jugadores", {"dinero": 9999999}, f"id=eq.{HOST_ID}")
        await query.edit_message_text("Saldo actualizado a $9,999,999. Recarga el juego.", reply_markup=volver)

    elif data == "admin_energia_host":
        await sb_patch("jugadores", {"energia": 100, "ultima_energia": datetime.utcnow().isoformat()}, f"id=eq.{HOST_ID}")
        await query.edit_message_text("Energia recargada a 100/100. Recarga el juego.", reply_markup=volver)

    elif data == "admin_dinero_jugador":
        await query.edit_message_text("Para dar dinero usa: /dinero ID CANTIDAD\nEjemplo: /dinero 123456789 50000", reply_markup=volver)

    elif data == "admin_energia_jugador":
        await query.edit_message_text("Para recargar energia usa: /energia ID\nEjemplo: /energia 123456789", reply_markup=volver)

    elif data == "admin_stats":
        jugadores = await sb_get("jugadores", "select=id,rol&limit=200")
        presidentes = len([j for j in jugadores if j.get('rol') == 'presidente'])
        fabricas = await sb_get("fabricas", "select=id&activa=eq.true&limit=200")
        visas = await sb_get("visas", "select=id&estado=eq.pendiente&limit=50")
        msg = (
            f"Estadisticas:\n\n"
            f"Jugadores: {len(jugadores)}\n"
            f"Presidentes: {presidentes}\n"
            f"Ciudadanos: {len(jugadores)-presidentes}\n"
            f"Fabricas: {len(fabricas)}\n"
            f"Visas pendientes: {len(visas)}"
        )
        await query.edit_message_text(msg, reply_markup=volver)

    elif data == "admin_tick":
        await sb_patch("tick_global", {
            "ultimo_tick": datetime.utcnow().isoformat(),
            "proximo_tick": (datetime.utcnow() + timedelta(hours=1)).isoformat()
        }, "id=eq.1")
        await query.edit_message_text("Tick reseteado. Proximo en 1 hora.", reply_markup=volver)

    elif data == "admin_guerras":
        guerras = await sb_get("guerras", "select=tipo,pais_atacante,pais_defensor,resultado&order=created_at.desc&limit=10")
        lineas = ["Ultimas guerras:\n"]
        for g in guerras:
            lineas.append(f"{g['tipo']}: {g['pais_atacante']} vs {g['pais_defensor']} - {g.get('resultado','?')}")
        await query.edit_message_text("\n".join(lineas) or "Sin guerras.", reply_markup=volver)

    elif data == "admin_fabricas":
        fabricas = await sb_get("fabricas", "select=nombre,pais,tipo_recurso,nivel,trabajadores_actuales&activa=eq.true&limit=20")
        lineas = ["Fabricas activas:\n"]
        for f in fabricas:
            lineas.append(f"{f['nombre']} ({f['pais']}) Nv.{f['nivel']} {f['tipo_recurso']} Trabajadores:{f.get('trabajadores_actuales',0)}")
        await query.edit_message_text("\n".join(lineas) or "Sin fabricas.", reply_markup=volver)

    elif data == "admin_premium":
        await query.edit_message_text("Para activar premium usa: /premium ID", reply_markup=volver)

    elif data == "admin_banear":
        await query.edit_message_text("Para banear usa: /ban ID", reply_markup=volver)

    elif data == "admin_dinero_todos":
        await query.edit_message_text(
            "Dar $5,000 a TODOS los jugadores?",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("SI confirmar", callback_data="admin_dinero_todos_ok")],
                [InlineKeyboardButton("Cancelar", callback_data="admin_menu")]
            ]))

    elif data == "admin_dinero_todos_ok":
        jugadores = await sb_get("jugadores", "select=id,dinero&limit=200")
        count = 0
        for j in jugadores:
            nuevo = (j.get('dinero') or 1000) + 5000
            ok = await sb_patch("jugadores", {"dinero": nuevo}, f"id=eq.{j['id']}")
            if ok: count += 1
        await query.edit_message_text(f"$5,000 enviados a {count} jugadores.", reply_markup=volver)

    elif data == "admin_broadcast":
        await query.edit_message_text("Para broadcast usa: /broadcast MENSAJE", reply_markup=volver)

    elif data.startswith("visa_aprobar_"):
        parts = data.split("_")
        visa_id, sol_id, precio = int(parts[2]), int(parts[3]), int(parts[4])
        await sb_patch("visas", {"estado": "aprobada"}, f"id=eq.{visa_id}")
        ganancia = int(precio * 0.3)
        jdata = await sb_get("jugadores", f"select=dinero&id=eq.{uid}")
        if jdata:
            nuevo = (jdata[0].get("dinero") or 1000) + ganancia
            await sb_patch("jugadores", {"dinero": nuevo}, f"id=eq.{uid}")
        await query.edit_message_text(
            f"Visa aprobada. Ganaste ${ganancia:,} (30%)",
            reply_markup=volver
        )
        try:
            await context.bot.send_message(
                chat_id=sol_id,
                text="Tu visa fue aprobada. Ya puedes trabajar en ese pais. Recarga el juego."
            )
        except Exception as e:
            log.error(f"Error visa aprobada: {e}")

    elif data.startswith("visa_rechazar_"):
        parts = data.split("_")
        visa_id, sol_id, precio = int(parts[2]), int(parts[3]), int(parts[4])
        await sb_patch("visas", {"estado": "rechazada"}, f"id=eq.{visa_id}")
        sdata = await sb_get("jugadores", f"select=dinero&id=eq.{sol_id}")
        if sdata:
            devolver = (sdata[0].get("dinero") or 0) + precio
            await sb_patch("jugadores", {"dinero": devolver}, f"id=eq.{sol_id}")
        await query.edit_message_text("Visa rechazada. Dinero devuelto al solicitante.", reply_markup=volver)
        try:
            await context.bot.send_message(
                chat_id=sol_id,
                text="Tu visa fue rechazada. Se te devolvio el dinero."
            )
        except Exception as e:
            log.error(f"Error visa rechazada: {e}")

async def cmd_dinero(update, context):
    if not es_host(update): return
    if len(context.args) < 2:
        await update.message.reply_text("Uso: /dinero ID CANTIDAD")
        return
    target_id = context.args[0]
    try:
        cantidad = int(context.args[1])
    except:
        await update.message.reply_text("La cantidad debe ser un numero.")
        return
    jugador = await sb_get("jugadores", f"select=nombre,dinero&id=eq.{target_id}")
    if not jugador:
        await update.message.reply_text("Jugador no encontrado.")
        return
    nuevo = (jugador[0].get("dinero") or 0) + cantidad
    await sb_patch("jugadores", {"dinero": nuevo}, f"id=eq.{target_id}")
    nombre = jugador[0].get("nombre", "?")
    await update.message.reply_text(f"${cantidad:,} enviados a {nombre}. Saldo: ${nuevo:,}")
    try:
        await context.bot.send_message(
            chat_id=int(target_id),
            text=f"El admin te envio ${cantidad:,}. Saldo: ${nuevo:,}"
        )
    except: pass

async def cmd_energia(update, context):
    if not es_host(update): return
    if not context.args:
        await update.message.reply_text("Uso: /energia ID")
        return
    target_id = context.args[0]
    jugador = await sb_get("jugadores", f"select=nombre&id=eq.{target_id}")
    if not jugador:
        await update.message.reply_text("Jugador no encontrado.")
        return
    await sb_patch("jugadores", {"energia": 100, "ultima_energia": datetime.utcnow().isoformat()}, f"id=eq.{target_id}")
    nombre = jugador[0].get("nombre", "?")
    await update.message.reply_text(f"Energia recargada a {nombre}.")
    try:
        await context.bot.send_message(chat_id=int(target_id), text="El admin recargo tu energia a 100/100.")
    except: pass

async def cmd_buscar(update, context):
    if not es_host(update): return
    if not context.args:
        await update.message.reply_text("Uso: /buscar NOMBRE")
        return
    nombre = " ".join(context.args)
    jugadores = await sb_get("jugadores", f"select=id,nombre,pais,rol,nivel,dinero,energia,ultimo_acceso&nombre=ilike.*{nombre}*&limit=10")
    if not jugadores:
        await update.message.reply_text(f"No se encontro: {nombre}")
        return
    lineas = [f"Resultados para {nombre}:\n"]
    for j in jugadores:
        icon = "👑" if j.get("rol") == "presidente" else "🏴"
        ultimo = j.get("ultimo_acceso", "")[:10] if j.get("ultimo_acceso") else "Nunca"
        lineas.append(
            f"{icon} {j['nombre']} ID:{j['id']}\n"
            f"  {j['pais']} Nv.{j.get('nivel',1)} ${j.get('dinero',0):,} E:{j.get('energia',100)} Ultimo:{ultimo}"
        )
    await update.message.reply_text("\n".join(lineas))

async def cmd_premium(update, context):
    if not es_host(update): return
    if not context.args:
        await update.message.reply_text("Uso: /premium ID")
        return
    target_id = context.args[0]
    expira = (datetime.utcnow() + timedelta(days=30)).isoformat()
    await sb_patch("jugadores", {
        "premium": True, "premium_hasta": expira,
        "premium_plan": "Pase Presidencial Admin",
        "trabajo_intervalo": 3, "bonus_xp": 200, "bonus_salario": 200
    }, f"id=eq.{target_id}")
    await update.message.reply_text(f"Premium activado para {target_id} por 30 dias.")
    try:
        await context.bot.send_message(chat_id=int(target_id), text="El admin te activo Premium Presidencial por 30 dias.")
    except: pass

async def cmd_ban(update, context):
    if not es_host(update): return
    if not context.args:
        await update.message.reply_text("Uso: /ban ID")
        return
    target_id = context.args[0]
    await sb_patch("jugadores", {"exiliado": True, "exilio_hasta": "2099-01-01T00:00:00Z"}, f"id=eq.{target_id}")
    await update.message.reply_text(f"Jugador {target_id} baneado.")

async def cmd_broadcast(update, context):
    if not es_host(update): return
    if not context.args:
        await update.message.reply_text("Uso: /broadcast MENSAJE")
        return
    mensaje = " ".join(context.args)
    jugadores = await sb_get("jugadores", "select=id&limit=200")
    enviados = 0
    for j in jugadores:
        try:
            await context.bot.send_message(chat_id=j["id"], text=f"Mensaje del admin:\n\n{mensaje}")
            enviados += 1
            await asyncio.sleep(0.05)
        except: pass
    await update.message.reply_text(f"Enviado a {enviados} jugadores.")

async def check_visas_pendientes(app):
    try:
        visas = await sb_get("visas", "select=*&estado=eq.pendiente&limit=20")
        for v in visas:
            pres_id = v.get("presidente_id")
            sol_id = v.get("solicitante_id")
            if not pres_id: continue
            sol = await sb_get("jugadores", f"select=nombre,pais&id=eq.{sol_id}")
            sol_nombre = sol[0]["nombre"] if sol else "?"
            sol_pais = sol[0]["pais"] if sol else "?"
            visa_tipo = v.get("tipo", "?").replace("_", " ")
            precio = v.get("precio", 0)
            visa_id = v.get("id")
            keyboard = InlineKeyboardMarkup([[
                InlineKeyboardButton("APROBAR", callback_data=f"visa_aprobar_{visa_id}_{sol_id}_{precio}"),
                InlineKeyboardButton("RECHAZAR", callback_data=f"visa_rechazar_{visa_id}_{sol_id}_{precio}")
            ]])
            try:
                await app.bot.send_message(
                    chat_id=pres_id,
                    text=(
                        f"Solicitud de Visa de Trabajo\n\n"
                        f"Solicitante: {sol_nombre} ({sol_pais})\n"
                        f"Tipo: {visa_tipo}\n"
                        f"Precio: ${precio:,}\n"
                        f"Tu ganancia (30%): ${int(precio*0.3):,}\n\n"
                        f"Apruebas esta visa?"
                    ),
                    reply_markup=keyboard
                )
                await sb_patch("visas", {"estado": "notificada"}, f"id=eq.{visa_id}")
            except Exception as e:
                log.error(f"Error notificando visa {visa_id}: {e}")
    except Exception as e:
        log.error(f"Error check_visas: {e}")

async def run_minor_tick(app):
    try:
        await sb_patch("tick_global", {
            "ultimo_tick": datetime.utcnow().isoformat(),
            "proximo_tick": (datetime.utcnow() + timedelta(hours=1)).isoformat()
        }, "id=eq.1")
        log.info("Tick menor ejecutado")
    except Exception as e:
        log.error(f"Tick menor error: {e}")

async def run_major_tick(app):
    try:
        await sb_patch("naciones", {
            "decretos_usados": [],
            "updated_at": datetime.utcnow().isoformat()
        }, "jugador_id=gt.0")
        jugadores = await sb_get("jugadores", "select=id")
        for j in jugadores:
            try:
                await app.bot.send_message(
                    chat_id=j["id"],
                    text="Nuevo dia. Tienes 3 decretos frescos para gobernar.",
                    reply_markup=InlineKeyboardMarkup([[
                        InlineKeyboardButton("Gobernar", web_app=WebAppInfo(url=WEBAPP_URL))
                    ]])
                )
            except: pass
        log.info(f"Tick mayor: {len(jugadores)} jugadores notificados")
    except Exception as e:
        log.error(f"Tick mayor error: {e}")

async def scheduler(app):
    minor = major = alive = visa_check = 0
    log.info("Scheduler iniciado")
    while True:
        await asyncio.sleep(60)
        minor += 60
        major += 60
        alive += 60
        visa_check += 60
        if minor >= 3600:
            await run_minor_tick(app)
            minor = 0
        if major >= 86400:
            await run_major_tick(app)
            major = 0
        if visa_check >= 120:
            await check_visas_pendientes(app)
            visa_check = 0
        if alive >= 259200:
            await sb_get("jugadores", "select=id&limit=1")
            alive = 0

async def main():
    log.info(f"Bot iniciando. HOST: {HOST_ID}")
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("estado", estado))
    app.add_handler(CommandHandler("ayuda", ayuda))
    app.add_handler(CommandHandler("help", ayuda))
    app.add_handler(CommandHandler("admin", admin))
    app.add_handler(CommandHandler("dinero", cmd_dinero))
    app.add_handler(CommandHandler("energia", cmd_energia))
    app.add_handler(CommandHandler("buscar", cmd_buscar))
    app.add_handler(CommandHandler("premium", cmd_premium))
    app.add_handler(CommandHandler("ban", cmd_ban))
    app.add_handler(CommandHandler("broadcast", cmd_broadcast))
    app.add_handler(CallbackQueryHandler(button_handler))
    async with app:
        await app.start()
        await app.updater.start_polling(allowed_updates=Update.ALL_TYPES)
        log.info("Bot corriendo con panel admin y visas")
        await scheduler(app)

if __name__ == "__main__":
    asyncio.run(main())
