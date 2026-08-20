"""
ShopOnline Telegram Bot — Admin panel + Mini App + Buyurtma tizimi
"""
import asyncio
import json
import logging

from aiogram import Bot, Dispatcher, F
from aiogram.types import (
    Message, WebAppInfo, InlineKeyboardButton,
    InlineKeyboardMarkup, ReplyKeyboardMarkup, KeyboardButton,
    MenuButtonWebApp, CallbackQuery
)
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.client.default import DefaultBotProperties

from config import BOT_TOKEN, ADMIN_ID, MINI_APP_URL
from admin import router as admin_router
from api import start_api
import firebase_db as db

# Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Bot & Dispatcher
bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode="HTML"))
dp = Dispatcher(storage=MemoryStorage())
dp.include_router(admin_router)


# ─── Keyboards ───────────────────────────────────────────────

def get_main_reply_keyboard(is_admin: bool = False):
    keyboard = [
        [KeyboardButton(text="🛍 Katalogni ochish", web_app=WebAppInfo(url=MINI_APP_URL))],
        [KeyboardButton(text="📞 Biz bilan aloqa"), KeyboardButton(text="ℹ️ Yordam")]
    ]
    if is_admin:
        keyboard.append([KeyboardButton(text="🛠 Admin Panel")])
    return ReplyKeyboardMarkup(keyboard=keyboard, resize_keyboard=True)


def get_start_inline_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🛍 Katalogni ochish (Mini App)", web_app=WebAppInfo(url=MINI_APP_URL))],
        [InlineKeyboardButton(text="🌐 Brauzerda ochish", url=MINI_APP_URL)]
    ])


# ─── Order Notification ─────────────────────────────────────

async def notify_admin_order(order_data: dict):
    """Mini App'dan kelgan buyurtmani adminga xabar qilish"""
    try:
        customer = order_data.get("customer", {})
        products = order_data.get("products", [])
        total = order_data.get("totalFormatted", "—")

        text = "🛍 <b>YANGI BUYURTMA KELDI!</b>\n"
        text += "━" * 22 + "\n\n"
        text += f"👤 <b>Mijoz:</b> {customer.get('name', '—')}\n"
        text += f"📞 <b>Telefon:</b> <code>{customer.get('phone', '—')}</code>\n"
        text += f"📍 <b>Manzil:</b> {customer.get('address', '—')}\n"

        if customer.get("location"):
            text += f"📌 <b>Lokatsiya:</b> {customer['location']}\n"
        if customer.get("comment"):
            text += f"💬 <b>Izoh:</b> {customer['comment']}\n"

        text += "\n📦 <b>Buyurtma qilingan mahsulotlar:</b>\n"
        for i, p in enumerate(products, 1):
            qty = p.get("quantity", 1)
            item_total = db.format_price(p.get("price", 0) * qty)
            text += f"  <b>{i}. {p.get('name', '—')}</b>\n"
            text += f"     └ {qty} ta × {db.format_price(p.get('price', 0))} = <b>{item_total}</b>\n"

        text += "\n" + "━" * 22 + "\n"
        text += f"💰 <b>Jami summa: {total}</b>\n"
        text += "⏰ <b>Status:</b> 🟡 Yangi buyurtma"

        kb = InlineKeyboardMarkup(inline_keyboard=[
            [
                InlineKeyboardButton(text="✅ Qabul qilindi", callback_data="order_status_accept"),
                InlineKeyboardButton(text="🚚 Yetkazilmoqda", callback_data="order_status_delivering")
            ],
            [
                InlineKeyboardButton(text="🎉 Bajarildi", callback_data="order_status_done"),
                InlineKeyboardButton(text="❌ Bekor qilish", callback_data="order_status_cancel")
            ]
        ])

        await bot.send_message(ADMIN_ID, text, reply_markup=kb)
        logger.info(f"[OK] Buyurtma adminga yuborildi: {customer.get('name')}")
    except Exception as e:
        logger.error(f"[ERR] Buyurtma xabari yuborishda xato: {e}")


@dp.callback_query(F.data.startswith("order_status_"))
async def cb_order_status(callback: CallbackQuery):
    if callback.from_user.id != ADMIN_ID:
        return
    status_map = {
        "order_status_accept": "🟢 Qabul qilindi",
        "order_status_delivering": "🚚 Yetkazilmoqda",
        "order_status_done": "🎉 Bajarildi",
        "order_status_cancel": "🔴 Bekor qilindi",
    }
    action = callback.data
    status_text = status_map.get(action, "Status o'zgardi")

    current_text = callback.message.html_text
    if "⏰ <b>Status:</b>" in current_text:
        new_text = current_text.split("⏰ <b>Status:</b>")[0] + f"⏰ <b>Status:</b> {status_text}"
    else:
        new_text = current_text + f"\n\n⏰ <b>Status:</b> {status_text}"

    await callback.message.edit_text(new_text, reply_markup=callback.message.reply_markup)
    await callback.answer(f"Status o'zgartirildi: {status_text}")


# ─── Start Command ───────────────────────────────────────────

@dp.message(F.text == "/start")
async def cmd_start(message: Message):
    user = message.from_user
    is_admin = user.id == ADMIN_ID

    welcome = (
        f"Assalomu alaykum, <b>{user.first_name}</b>! 👋\n\n"
        f"✨ <b>ShopOnline</b> — qulay va sifatli internet do'konga xush kelibsiz!\n\n"
        f"🛒 Bizning Mini App orqali barcha mahsulotlarni ko'rishingiz, savatchaga qo'shishingiz "
        f"va tezkor buyurtma berishingiz mumkin.\n\n"
        f"👇 Pastdagi <b>\"🛍 Katalogni ochish\"</b> tugmasini bosing:"
    )

    if is_admin:
        welcome += "\n\n🔑 <b>Siz adminsiz:</b> Boshqarish uchun <b>🛠 Admin Panel</b> tugmasini bosing yoki /admin yuboring."

    await message.answer(
        welcome,
        reply_markup=get_main_reply_keyboard(is_admin)
    )


# ─── Text Handlers for Reply Keyboard ────────────────────────

@dp.message(F.text == "🛠 Admin Panel")
async def handle_admin_panel_button(message: Message, state):
    from admin import cmd_admin
    await cmd_admin(message, state)


@dp.message(F.text == "📞 Biz bilan aloqa")
async def cmd_contact(message: Message):
    contact_text = (
        "📞 <b>Biz bilan aloqa:</b>\n\n"
        "👨‍💻 <b>Qo'llab-quvvatlash:</b> @admin\n"
        "📞 <b>Telefon:</b> +998 90 123 45 67\n"
        "📍 <b>Manzil:</b> Toshkent shahri\n"
        "⏰ <b>Ish vaqti:</b> 09:00 - 20:00 (Hamma kunlar)"
    )
    await message.answer(contact_text)


@dp.message(F.text == "ℹ️ Yordam")
@dp.message(F.text == "/help")
async def cmd_help(message: Message):
    text = (
        "ℹ️ <b>Qanday xarid qilinadi?</b>\n\n"
        "1️⃣ Pastdagi <b>\"🛍 Katalogni ochish\"</b> tugmasini bosing.\n"
        "2️⃣ O'zingizga yoqqan mahsulotlarni tanlab savatchaga qo'shing.\n"
        "3️⃣ Buyurtma berish tugmasini bosib, ismingiz va manzilingizni kiriting.\n"
        "4️⃣ Buyurtma berilgach, biz siz bilan bog'lanamiz!\n\n"
        "❓ Qo'shimcha savollar bo'lsa, <b>📞 Biz bilan aloqa</b> bo'limidan foydalaning."
    )
    if message.from_user.id == ADMIN_ID:
        text += "\n\n🛠 <b>Admin buyruqlari:</b>\n/admin — Admin panelni ochish"
    await message.answer(text)


# ─── Handle Web App Data ────────────────────────────────────

@dp.message(F.web_app_data)
async def handle_webapp_data(message: Message):
    """WebApp.sendData() orqali kelgan ma'lumotlarni qayta ishlash"""
    try:
        data = json.loads(message.web_app_data.data)
        await notify_admin_order(data)
        await message.answer(
            "🎉 <b>Buyurtmangiz muvaffaqiyatli qabul qilindi!</b>\n\n"
            "Tez orada operatorimiz siz bilan bog'lanadi va yetkazib berish tafsilotlarini aniqlaydi. "
            "Xaridingiz uchun rahmat! 🛍"
        )
    except Exception as e:
        logger.error(f"WebApp data error: {e}")
        await message.answer("❌ Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.")


# ─── Main ────────────────────────────────────────────────────

async def main():
    # Set Bot Menu Button to open Web App directly!
    try:
        await bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(
                text="🛍 Katalog",
                web_app=WebAppInfo(url=MINI_APP_URL)
            )
        )
        logger.info("[BOT] Menu Button sozlandi")
    except Exception as e:
        logger.warning(f"[BOT] Menu Button sozlashda ogohlantirish: {e}")

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
