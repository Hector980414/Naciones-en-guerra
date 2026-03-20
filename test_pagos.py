#!/usr/bin/env python3
"""
Test completo del sistema de pagos NOWPayments
Ejecutar en Termux: python3 test_pagos.py
"""
import asyncio
import httpx
import json

SUPABASE_URL = "https://wdbupgqymgqfpobcbfze.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYnVwZ3F5bWdxZnBvYmNiZnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NjM0NjAsImV4cCI6MjA4OTUzOTQ2MH0.Psq7trqKDSNltKK8bqaLdXgg56FSjK6sfM4EH4TRnBo"
EDGE_FUNCTION_URL = "https://wdbupgqymgqfpobcbfze.supabase.co/functions/v1/Pago"
NOWPAYMENTS_KEY = ""  # Pon tu nueva API key aquí

HEADERS_SB = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

async def test_supabase_connection():
    """Test 1: Verificar conexión a Supabase"""
    print("\n🔵 TEST 1: Conexión a Supabase...")
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/jugadores?select=id,nombre&limit=3",
            headers=HEADERS_SB
        )
        if r.status_code == 200:
            data = r.json()
            print(f"   ✅ Conectado. Jugadores encontrados: {len(data)}")
            for j in data:
                print(f"      → {j.get('nombre')} (ID: {j.get('id')})")
        else:
            print(f"   ❌ Error: {r.status_code} - {r.text}")

async def test_tablas():
    """Test 2: Verificar que todas las tablas existen"""
    print("\n🔵 TEST 2: Verificando tablas...")
    tablas = ["jugadores", "naciones", "partidos", "golpes", "guerras", "pagos", "tick_global", "empresas"]
    async with httpx.AsyncClient() as client:
        for tabla in tablas:
            r = await client.get(
                f"{SUPABASE_URL}/rest/v1/{tabla}?select=*&limit=1",
                headers=HEADERS_SB
            )
            if r.status_code == 200:
                print(f"   ✅ Tabla '{tabla}' existe")
            else:
                print(f"   ❌ Tabla '{tabla}' NO existe o hay error: {r.status_code}")

async def test_columnas_premium():
    """Test 3: Verificar columnas premium en jugadores"""
    print("\n🔵 TEST 3: Verificando columnas premium...")
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/jugadores?select=id,premium,premium_hasta,premium_plan,trabajo_intervalo,bonus_xp,bonus_salario,decretos_extra,escudo_hasta,badge,xp,nivel,dinero&limit=1",
            headers=HEADERS_SB
        )
        if r.status_code == 200:
            print("   ✅ Todas las columnas premium existen")
            data = r.json()
            if data:
                print(f"   📊 Ejemplo: {json.dumps(data[0], indent=6)}")
        else:
            print(f"   ❌ Faltan columnas: {r.text}")

async def test_edge_function_webhook():
    """Test 4: Simular webhook de NOWPayments"""
    print("\n🔵 TEST 4: Simulando webhook de pago...")
    
    # Obtener un jugador real de la DB
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/jugadores?select=id,nombre&limit=1",
            headers=HEADERS_SB
        )
        jugadores = r.json()
        if not jugadores:
            print("   ⚠️ No hay jugadores para testear")
            return
        
        jugador_id = jugadores[0]["id"]
        jugador_nombre = jugadores[0]["nombre"]
        print(f"   👤 Usando jugador: {jugador_nombre} (ID: {jugador_id})")
        
        # Simular webhook de pago confirmado
        webhook_payload = {
            "payment_status": "finished",
            "order_id": f"naciones_{jugador_id}_2.00",
            "price_amount": 2.00,
            "pay_currency": "USDTTRC20",
            "payment_id": "TEST_123456789"
        }
        
        r2 = await client.post(
            EDGE_FUNCTION_URL,
            json=webhook_payload,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        if r2.status_code == 200:
            print(f"   ✅ Edge Function respondió correctamente: {r2.text}")
            
            # Verificar que se activó el premium
            r3 = await client.get(
                f"{SUPABASE_URL}/rest/v1/jugadores?select=premium,premium_plan,premium_hasta&id=eq.{jugador_id}",
                headers=HEADERS_SB
            )
            data = r3.json()
            if data and data[0].get("premium"):
                print(f"   ✅ Premium activado: {data[0]['premium_plan']}")
                print(f"   ✅ Expira: {data[0]['premium_hasta']}")
            else:
                print("   ⚠️ Premium no se activó en DB (puede ser error del secreto)")
        else:
            print(f"   ❌ Error en Edge Function: {r2.status_code} - {r2.text}")

async def test_nowpayments_api():
    """Test 5: Verificar API de NOWPayments"""
    print("\n🔵 TEST 5: Verificando API NOWPayments...")
    if not NOWPAYMENTS_KEY:
        print("   ⚠️ NOWPAYMENTS_KEY vacía — pon tu nueva API key en el script")
        return
    
    async with httpx.AsyncClient() as client:
        r = await client.get(
            "https://api.nowpayments.io/v1/status",
            headers={"x-api-key": NOWPAYMENTS_KEY}
        )
        if r.status_code == 200:
            print(f"   ✅ NOWPayments API activa: {r.json()}")
        else:
            print(f"   ❌ Error NOWPayments: {r.status_code}")

async def test_crear_factura():
    """Test 6: Crear factura de prueba en NOWPayments"""
    print("\n🔵 TEST 6: Creando factura de prueba...")
    if not NOWPAYMENTS_KEY:
        print("   ⚠️ NOWPAYMENTS_KEY vacía — saltando test")
        return
    
    async with httpx.AsyncClient() as client:
        # Obtener jugador
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/jugadores?select=id&limit=1",
            headers=HEADERS_SB
        )
        jugadores = r.json()
        if not jugadores:
            print("   ⚠️ No hay jugadores")
            return
        
        jugador_id = jugadores[0]["id"]
        
        payload = {
            "price_amount": 2,
            "price_currency": "usd",
            "pay_currency": "usdttrc20",
            "order_id": f"naciones_{jugador_id}_2.00",
            "order_description": "Naciones en Guerra - Pase Básico 7 días",
            "ipn_callback_url": f"{EDGE_FUNCTION_URL}",
            "success_url": "https://t.me/NacionesEnGuerra_Bot",
            "cancel_url": "https://t.me/NacionesEnGuerra_Bot"
        }
        
        r2 = await client.post(
            "https://api.nowpayments.io/v1/invoice",
            json=payload,
            headers={
                "x-api-key": NOWPAYMENTS_KEY,
                "Content-Type": "application/json"
            }
        )
        
        if r2.status_code == 200:
            data = r2.json()
            print(f"   ✅ Factura creada exitosamente!")
            print(f"   🔗 URL de pago: {data.get('invoice_url')}")
            print(f"   💳 ID: {data.get('id')}")
        else:
            print(f"   ❌ Error creando factura: {r2.status_code} - {r2.text}")

async def main():
    print("=" * 50)
    print("🧪 TEST SISTEMA DE PAGOS — NACIONES EN GUERRA")
    print("=" * 50)
    
    await test_supabase_connection()
    await test_tablas()
    await test_columnas_premium()
    await test_edge_function_webhook()
    await test_nowpayments_api()
    await test_crear_factura()
    
    print("\n" + "=" * 50)
    print("✅ Tests completados")
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(main())
