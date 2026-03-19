#!/usr/bin/env python3
"""
Naciones en Guerra - Bot de Telegram
Conecta el bot con la Mini App
"""
import os
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

TOKEN = "8759601075:AAHuztMAKGLO9b-nkmQzANsgjkNEQDcJvnU"

# URL donde estará tu Mini App (la cambias cuando la subas online)
# Por ahora usa ngrok para pruebas
WEBAPP_URL = "https://TU_URL_AQUI.ngrok.io"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [[
        InlineKeyboardButton(
            "🌍 JUGAR AHORA",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )
    ]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        "🌍 *Naciones en Guerra*\n\n"
        "El mundo está en caos\\. 195 naciones compiten por el poder global\\.\n\n"
        "Toma el control de tu país, emite decretos, forma alianzas y lidera tu partido hacia la hegemonía mundial\\.\n\n"
        "¿Estás listo para gobernar?",
        parse_mode="MarkdownV2",
        reply_markup=reply_markup
    )

async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🎮 *Comandos disponibles:*\n\n"
        "/start - Abrir el juego\n"
        "/estado - Ver tu nación\n"
        "/ayuda - Esta ayuda",
        parse_mode="Markdown"
    )

def main():
    print("🚀 Bot Naciones en Guerra iniciando...")
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("ayuda", help_cmd))
    app.add_handler(CommandHandler("help", help_cmd))
    print("✅ Bot corriendo. Presiona Ctrl+C para detener.")
    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
