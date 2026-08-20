"""
ShopOnline Telegram Bot — Admin panel + Mini App + Buyurtma tizimi
"""
import asyncio
import logging

from aiogram import Bot, Dispatcher, F
from aiogram.types import (
    Message, WebAppInfo, InlineKeyboardButton,
    InlineKeyboardMarkup, ReplyKeyboardMarkup, KeyboardButton
)
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.client.default import DefaultBotProperties

from config import BOT_TOKEN, ADMIN_ID, MINI_APP_URL
from admin import router as admin_router
from api import start_api
import database as db

# Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Bot & Dispatcher
bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode="HTML"))
dp = Dispatcher(storage=MemoryStorage())
dp.include_router(admin_router)


# ─── Order Notification ─────────────────────────────────────

async def notify_admin_order(order_data: dict):
    """Mini App'dan kelgan buyurtmani adminga xabar qilish"""
    try:
        customer = order_data.get("customer", {})
        products = order_data.get("products", [])
        total = order_data.get("totalFormatted", "—")

        text = "🛒 <b>YANGI BUYURTMA!</b>\n\n"
        text += f"👤 <b>Mijoz:</b> {customer.get('name', '—')}\n"
        text += f"📱 <b>Telefon:</b> {customer.get('phone', '—')}\n"
        text += f"📍 <b>Manzil:</b> {customer.get('address', '—')}\n"

        if customer.get("location"):
            text += f"📌 <b>Lokatsiya:</b> {customer['location']}\n"
        if customer.get("comment"):
            text += f"💬 <b>Izoh:</b> {customer['comment']}\n"

        text += "\n<b>📦 Mahsulotlar:</b>\n"
        for i, p in enumerate(products, 1):
            price = db.format_price(p.get("price", 0))
            qty = p.get("quantity", 1)
            text += f"  {i}. {p.get('name', '—')} × {qty} = {db.format_price(p.get('price', 0) * qty)}\n"

        text += f"\n💰 <b>Jami: {total}</b>"

        await bot.send_message(ADMIN_ID, text)
        logger.info(f"[OK] Buyurtma adminga yuborildi: {customer.get('name')}")
    except Exception as e:
        logger.error(f"[ERR] Buyurtma xabari yuborishda xato: {e}")


# ─── Start Command ───────────────────────────────────────────

@dp.message(F.text == "/start")
async def cmd_start(message: Message):
    user = message.from_user
    is_admin = user.id == ADMIN_ID

    welcome = (
        f"Salom, <b>{user.first_name}</b>! 👋\n\n"
        f"🛍 <b>ShopOnline</b> — sifatli mahsulotlar do'koniga xush kelibsiz!\n\n"
        f"📱 Ilovani ochish uchun havola (Localhost):\n"
        f"👉 {MINI_APP_URL}\n\n"
        f"<i>Eslatma: Telegram ichida Mini App ochilishi uchun HTTPS (ngrok) kerak.</i>\n"
    )

    if is_admin:
        welcome += "\n🔑 Siz <b>admin</b>siz. /admin buyrug'ini yuboring."

    await message.answer(welcome)


# ─── Help Command ────────────────────────────────────────────

@dp.message(F.text == "/help")
async def cmd_help(message: Message):
    text = (
        "ℹ️ <b>Yordam</b>\n\n"
        "🛍 <b>Katalogni ochish</b> — mahsulotlarni ko'rish va xarid qilish\n"
        "📦 Mahsulotni tanlab, savatchaga qo'shing\n"
        "📝 Buyurtma berishda ismingiz, telefon va manzilingizni kiriting\n"
        "✅ Buyurtma berilganda biz siz bilan bog'lanamiz!\n"
    )
    if message.from_user.id == ADMIN_ID:
        text += (
            "\n<b>Admin buyruqlari:</b>\n"
            "/admin — admin panelni ochish\n"
        )
    await message.answer(text)


# ─── Handle Web App Data ────────────────────────────────────

@dp.message(F.web_app_data)
async def handle_webapp_data(message: Message):
    """WebApp.sendData() orqali kelgan ma'lumotlarni qayta ishlash"""
    try:
        import json
        data = json.loads(message.web_app_data.data)
        await notify_admin_order(data)
        await message.answer("✅ Buyurtmangiz qabul qilindi! Tez orada bog'lanamiz.")
    except Exception as e:
        logger.error(f"WebApp data error: {e}")
        await message.answer("❌ Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.")


# ─── Main ────────────────────────────────────────────────────

async def main():
    # Start API server
    api_runner = await start_api(order_callback=notify_admin_order)
    logger.info("[API] Server ishga tushdi")

    # Start bot
    logger.info("[BOT] Ishga tushmoqda...")
    try:
        await dp.start_polling(bot)
    finally:
        await api_runner.cleanup()
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
