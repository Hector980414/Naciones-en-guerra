# Naciones en Guerra V2 — Comandos

## PASO 1: Instalar dependencias del frontend
cd ~/naciones-en-guerra-v2
npm install

## PASO 2: Instalar python-telegram-bot
pip install python-telegram-bot --break-system-packages

## PASO 3: Instalar ngrok (para exponer tu app online)
pkg install wget -y
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-arm64.tgz
tar xvzf ngrok-v3-stable-linux-arm64.tgz

## PASO 4: Correr la app
npm run dev

## PASO 5: En otra sesión de Termux, exponer con ngrok
./ngrok http 5173

## PASO 6: Copiar la URL de ngrok en bot.py (línea WEBAPP_URL)

## PASO 7: Correr el bot
python bot.py
