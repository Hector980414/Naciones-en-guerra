#!/usr/bin/env python3
import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

TOKEN = "8759601075:AAHuztMAKGLO9b-nkmQzANsgjkNEQDcJvnU"
WEBAPP_URL = "https://Hector980414.github.io/Naciones-en-guerra/"

logging.basicConfig(level=logging.INFO)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [[InlineKeyboardButton("🌍 JUGAR AHORA", web_app=WebAppInfo(url=WEBAPP_URL))]]
    await update.message.reply_text(
        "🌍 *Naciones en Guerra*\n\n"
        "195 naciones compiten por el poder global\\.\n"
        "Toma el control, emite decretos y lidera tu partido\\.\n\n"
        "¿Listo para gobernar?",
        parse_mode="MarkdownV2",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def ayuda(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🎮 *Comandos:*\n/start \\- Abrir el juego\n/ayuda \\- Esta ayuda",
        parse_mode="MarkdownV2"
    )

def main():
    print("🚀 Naciones en Guerra bot iniciando...")
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("ayuda", ayuda))
    print("✅ Bot corriendo!")
    app.run_polling()

if __name__ == "__main__":
    main()
