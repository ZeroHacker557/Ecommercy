"""
ShopOnline Telegram Bot — Admin panel + Mini App + Buyurtma + To'lov tizimi
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
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.client.default import DefaultBotProperties

from config import BOT_TOKEN, ADMIN_ID, MINI_APP_URL, CARD_NUMBER, CARD_OWNER
from admin import router as admin_router
import firebase_db as db

# Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Bot & Dispatcher
bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode="HTML"))
dp = Dispatcher(storage=MemoryStorage())
dp.include_router(admin_router)


# ─── FSM States ──────────────────────────────────────────────

class PaymentUpload(StatesGroup):
    waiting_photo = State()


# ─── Keyboards ───────────────────────────────────────────────

def get_main_reply_keyboard(is_admin: bool = False):
    keyboard = [
        [KeyboardButton(text="🛍 Katalogni ochish", web_app=WebAppInfo(url=MINI_APP_URL))],
        [KeyboardButton(text="📦 Buyurtmalarim")],
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


# ─── Order Notification to Admin ─────────────────────────────

async def notify_admin_order(order_data: dict):
    """Mini App'dan kelgan buyurtmani adminga xabar qilish"""
    try:
        customer    = order_data.get("customer", {})
        products    = order_data.get("products", [])
        total       = order_data.get("total", 0)
        order_id    = order_data.get("id", "Noma'lum")
        user_name   = order_data.get("username", customer.get("name", "—"))
        pay_method  = order_data.get("paymentMethod", "Naqd")

        total_str = db.format_price(total) if isinstance(total, (int, float)) else str(total)

        text  = f"🛍 <b>YANGI BUYURTMA! ({order_id})</b>\n"
        text += "━" * 22 + "\n\n"
        text += f"👤 <b>Mijoz:</b> {user_name}\n"
        text += f"📞 <b>Telefon:</b> <code>{customer.get('phone', '—')}</code>\n"
        text += f"📍 <b>Manzil:</b> {customer.get('address', '—')}\n"

        if customer.get("location"):
            lat = customer["location"].get("lat")
            lng = customer["location"].get("lng")
            if lat and lng:
                map_url = f"https://www.google.com/maps?q={lat},{lng}"
                text += f"📌 <b>Lokatsiya:</b> <a href='{map_url}'>Xaritada ko'rish</a>\n"

        if customer.get("comment"):
            text += f"💬 <b>Izoh:</b> {customer['comment']}\n"

        pay_label = "💵 Naqd pul (yetkazganda)" if pay_method == "Naqd" else "💳 Karta o'tkazmasi"
        text += f"💳 <b>To'lov usuli:</b> {pay_label}\n"

        text += "\n📦 <b>Mahsulotlar:</b>\n"
        for i, p in enumerate(products, 1):
            qty = p.get("quantity", 1)
            prod_info = p.get("product", p)
            item_total = db.format_price(prod_info.get("price", 0) * qty)
            text += f"  <b>{i}. {prod_info.get('name', '—')}</b>\n"
            text += f"     └ {qty} ta × {db.format_price(prod_info.get('price', 0))} = <b>{item_total}</b>\n"

        text += "\n" + "━" * 22 + "\n"
        text += f"💰 <b>Jami: {total_str}</b>\n"
        text += "⏰ <b>Status:</b> 🟡 Yangi\n"

        if pay_method == "Karta":
            text += "💳 <b>To'lov:</b> ⏳ Chek kutilmoqda"

        kb = InlineKeyboardMarkup(inline_keyboard=[
            [
                InlineKeyboardButton(text="✅ Qabul", callback_data=f"os:Qabul qilindi:{order_id}"),
                InlineKeyboardButton(text="🚚 Yetkazish", callback_data=f"os:Yetkazilmoqda:{order_id}")
            ],
            [
                InlineKeyboardButton(text="🎉 Bajarildi", callback_data=f"os:Yetkazildi:{order_id}"),
                InlineKeyboardButton(text="❌ Rad etish", callback_data=f"os:Rad etildi:{order_id}")
            ],
        ])

        await bot.send_message(ADMIN_ID, text, reply_markup=kb, disable_web_page_preview=True)
        logger.info(f"[OK] Buyurtma adminga yuborildi: {order_id}")
    except Exception as e:
        logger.error(f"[ERR] Buyurtma yuborishda xato: {e}")


# ─── Order Status Change → Notify User ───────────────────────

@dp.callback_query(F.data.startswith("os:"))
async def cb_order_status(callback: CallbackQuery):
    if callback.from_user.id != ADMIN_ID:
        return

    _, status, order_id = callback.data.split(":", 2)

    updated = db.update_order_status(order_id, status)
    if not updated:
        await callback.answer("❌ Firestore'da yangilashda xatolik", show_alert=True)
        return

    status_emoji_map = {
        "Qabul qilindi": "🟢",
        "Yetkazilmoqda": "🚚",
        "Yetkazildi":    "🎉",
        "Rad etildi":    "🔴",
        "Bekor qilingan":"🔴",
    }
    emoji = status_emoji_map.get(status, "ℹ️")

    # ── Foydalanuvchiga xabar yuborish ──
    order = db.get_order_by_id(order_id)
    if order and order.get("userId"):
        try:
            user_text  = f"📦 <b>Buyurtmangiz yangilandi!</b>\n"
            user_text += "━" * 22 + "\n\n"
            user_text += f"🆔 Buyurtma: <b>{order_id}</b>\n"
            user_text += f"⏰ Yangi status: {emoji} <b>{status}</b>\n\n"
            user_text += "Batafsil ko'rish uchun 👇"
            user_kb = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(
                    text="🛍 Buyurtmalarimni ko'rish",
                    web_app=WebAppInfo(url=MINI_APP_URL)
                )]
            ])
            await bot.send_message(order["userId"], user_text, reply_markup=user_kb)
        except Exception as e:
            logger.warning(f"Foydalanuvchiga xabar yuborib bo'lmadi: {e}")

    # ── Admin xabarini yangilash ──
    current_text = callback.message.html_text
    if "⏰ <b>Status:</b>" in current_text:
        new_text = current_text.split("⏰ <b>Status:</b>")[0] + f"⏰ <b>Status:</b> {emoji} {status}"
    else:
        new_text = current_text + f"\n⏰ <b>Status:</b> {emoji} {status}"

    await callback.message.edit_text(
        new_text, reply_markup=callback.message.reply_markup,
        disable_web_page_preview=True
    )
    await callback.answer(f"✅ Status: {status}")


# ─── Chek yuborish: callback tugma ───────────────────────────

@dp.callback_query(F.data.startswith("send_receipt:"))
async def cb_send_receipt(callback: CallbackQuery, state: FSMContext):
    order_id = callback.data.split("send_receipt:", 1)[-1]
    await state.update_data(receipt_order_id=order_id)
    await state.set_state(PaymentUpload.waiting_photo)
    await callback.message.answer(
        "📸 <b>To'lov chekini yuboring</b>\n\n"
        "Pul o'tkazganingizni tasdiqlovchi <b>screenshot yoki rasmni</b> yuboring.\n"
        "Admin tekshirib, tasdiqlaydi ✅",
    )
    await callback.answer()


# ─── Chek rasmi keldi → Adminga yuborish ────────────────────

@dp.message(PaymentUpload.waiting_photo, F.photo)
async def handle_receipt_photo(message: Message, state: FSMContext):
    data = await state.get_data()
    order_id = data.get("receipt_order_id", "—")
    user_id  = message.from_user.id

    order = db.get_order_by_id(order_id) if order_id != "—" else None

    # Adminga caption
    caption  = "💳 <b>TO'LOV CHEKI KELDI!</b>\n"
    caption += "━" * 22 + "\n\n"
    caption += f"📦 Buyurtma: <b>{order_id}</b>\n"
    if order:
        uname = order.get("username") or order.get("customer", {}).get("name", "—")
        phone = order.get("customer", {}).get("phone", "—")
        total = order.get("total", 0)
        caption += f"👤 Mijoz: {uname}\n"
        caption += f"📞 Telefon: <code>{phone}</code>\n"
        caption += f"💰 Summa: <b>{db.format_price(total) if isinstance(total,(int,float)) else total}</b>\n"
    caption += "━" * 22

    admin_kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(
                text="✅ To'lovni tasdiqlash",
                callback_data=f"pconf:approve:{order_id}:{user_id}"
            ),
            InlineKeyboardButton(
                text="❌ Rad etish",
                callback_data=f"pconf:reject:{order_id}:{user_id}"
            )
        ]
    ])

    photo_file_id = message.photo[-1].file_id
    await bot.send_photo(ADMIN_ID, photo=photo_file_id, caption=caption,
                         reply_markup=admin_kb)

    await state.clear()
    await message.answer(
        "✅ <b>Chekingiz yuborildi!</b>\n\n"
        "Admin tekshirib, tez orada natijasini xabar qilamiz 📬"
    )


@dp.message(PaymentUpload.waiting_photo)
async def handle_receipt_not_photo(message: Message):
    await message.answer(
        "❌ Iltimos, to'lov chekini <b>rasm (foto) sifatida</b> yuboring!\n"
        "Faylni bosing → rasm tanlang → yuboring."
    )


# ─── Admin: To'lovni tasdiqlash / rad etish ──────────────────

@dp.callback_query(F.data.startswith("pconf:"))
async def cb_payment_confirm(callback: CallbackQuery):
    if callback.from_user.id != ADMIN_ID:
        return

    parts   = callback.data.split(":")
    action  = parts[1]                   # approve | reject
    order_id = parts[2]                  # #1234567
    user_id  = int(parts[3])             # Telegram user ID

    if action == "approve":
        db.update_payment_status(order_id, "Tolangan")

        # Foydalanuvchiga xabar
        try:
            user_text  = "✅ <b>To'lovingiz tasdiqlandi!</b>\n"
            user_text += "━" * 22 + "\n\n"
            user_text += f"📦 Buyurtma: <b>{order_id}</b>\n"
            user_text += "💰 To'lov muvaffaqiyatli qabul qilindi!\n"
            user_text += "Tez orada buyurtmangiz yetkaziladi 🚀"
            user_kb = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(
                    text="🛍 Buyurtmalarimni ko'rish",
                    web_app=WebAppInfo(url=MINI_APP_URL)
                )]
            ])
            await bot.send_message(user_id, user_text, reply_markup=user_kb)
        except Exception as e:
            logger.warning(f"User {user_id} ga xabar yuborib bo'lmadi: {e}")

        # Admin xabarini yangilash
        try:
            new_caption = (callback.message.caption or "") + "\n\n✅ <b>TO'LOV TASDIQLANDI</b>"
            await callback.message.edit_caption(new_caption)
        except Exception:
            pass
        await callback.answer("✅ To'lov tasdiqlandi!", show_alert=True)

    elif action == "reject":
        db.update_payment_status(order_id, "Rad etildi")

        # Foydalanuvchiga xabar + qayta yuborish tugmasi
        try:
            user_text  = "❌ <b>To'lov cheki rad etildi</b>\n"
            user_text += "━" * 22 + "\n\n"
            user_text += f"📦 Buyurtma: <b>{order_id}</b>\n"
            user_text += "Iltimos, to'g'ri to'lov chekini qayta yuboring."
            user_kb = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(
                    text="💳 Qayta chek yuborish",
                    callback_data=f"send_receipt:{order_id}"
                )]
            ])
            await bot.send_message(user_id, user_text, reply_markup=user_kb)
        except Exception as e:
            logger.warning(f"User {user_id} ga xabar yuborib bo'lmadi: {e}")

        try:
            new_caption = (callback.message.caption or "") + "\n\n❌ <b>RAD ETILDI — Mijoz qayta yuboradi</b>"
            await callback.message.edit_caption(new_caption)
        except Exception:
            pass
        await callback.answer("❌ Chek rad etildi!", show_alert=True)


# ─── Buyurtmalarim ───────────────────────────────────────────

@dp.message(F.text == "📦 Buyurtmalarim")
async def handle_my_orders(message: Message):
    user_id = message.from_user.id
    orders  = db.get_user_orders(user_id)

    if not orders:
        await message.answer(
            "📦 <b>Buyurtmalarim</b>\n\n"
            "Hali hech qanday buyurtma berilmagan.\n"
            "Katalogdan mahsulot tanlab buyurtma bering! 🛍",
        )
        return

    status_emoji = {
        "Yangi":          "🟡",
        "Qabul qilindi":  "🟢",
        "Yetkazilmoqda":  "🚚",
        "Yetkazildi":     "🎉",
        "Rad etildi":     "🔴",
        "Bekor qilingan": "🔴",
    }
    pay_label_map = {
        "Tolangan":   "✅ To'langan",
        "Kutilmoqda": "⏳ Chek kutilmoqda",
        "Rad etildi": "❌ Rad etildi",
    }

    text  = f"📦 <b>Sizning buyurtmalaringiz</b> ({len(orders)} ta)\n"
    text += "━" * 22 + "\n\n"

    receipt_buttons = []
    for order in orders[:10]:
        oid         = order.get("id", "—")
        total       = order.get("total", 0)
        status      = order.get("status", "Yangi")
        pay_method  = order.get("paymentMethod", "Naqd")
        pay_status  = order.get("paymentStatus", "")
        e           = status_emoji.get(status, "ℹ️")
        total_str   = db.format_price(total) if isinstance(total, (int, float)) else str(total)

        text += f"🆔 <b>{oid}</b> • {total_str}\n"
        text += f"   ⏰ Status: {e} {status}\n"

        if pay_method == "Karta":
            plabel = pay_label_map.get(pay_status, "⏳ Chek kutilmoqda")
            text  += f"   💳 To'lov: {plabel}\n"
            # Chek yuborilmagan yoki rad etilgan bo'lsa tugma qo'shamiz
            if pay_status in ("", "Kutilmoqda", "Rad etildi"):
                receipt_buttons.append([
                    InlineKeyboardButton(
                        text=f"💳 {oid} — chek yuborish",
                        callback_data=f"send_receipt:{oid}"
                    )
                ])
        else:
            text += "   💵 To'lov: Naqd (yetkazganda)\n"

        text += "\n"

    kb = InlineKeyboardMarkup(inline_keyboard=receipt_buttons) if receipt_buttons else None
    await message.answer(text, reply_markup=kb)


# ─── Start Command ───────────────────────────────────────────

@dp.message(F.text == "/start")
async def cmd_start(message: Message):
    user     = message.from_user
    is_admin = user.id == ADMIN_ID

    welcome  = (
        f"Assalomu alaykum, <b>{user.first_name}</b>! 👋\n\n"
        "✨ <b>ShopOnline</b> — qulay va sifatli internet do'konga xush kelibsiz!\n\n"
        "🛒 Mini App orqali barcha mahsulotlarni ko'rish, savatga qo'shish "
        "va tezkor buyurtma berish mumkin.\n\n"
        "👇 Pastdagi <b>\"🛍 Katalogni ochish\"</b> tugmasini bosing:"
    )
    if is_admin:
        welcome += "\n\n🔑 <b>Siz adminsiz:</b> <b>🛠 Admin Panel</b> tugmasini bosing yoki /admin yuboring."

    await message.answer(welcome, reply_markup=get_main_reply_keyboard(is_admin))


# ─── Reply keyboard handlers ─────────────────────────────────

@dp.message(F.text == "🛠 Admin Panel")
async def handle_admin_panel_button(message: Message, state: FSMContext):
    from admin import cmd_admin
    await cmd_admin(message, state)


@dp.message(F.text == "📞 Biz bilan aloqa")
async def cmd_contact(message: Message):
    await message.answer(
        "📞 <b>Biz bilan aloqa:</b>\n\n"
        "👨‍💻 <b>Qo'llab-quvvatlash:</b> @admin\n"
        "📞 <b>Telefon:</b> +998 90 123 45 67\n"
        "📍 <b>Manzil:</b> Toshkent shahri\n"
        "⏰ <b>Ish vaqti:</b> 09:00 - 20:00 (Hamma kunlar)"
    )


@dp.message(F.text.in_({"ℹ️ Yordam", "/help"}))
async def cmd_help(message: Message):
    text = (
        "ℹ️ <b>Qanday xarid qilinadi?</b>\n\n"
        "1️⃣ <b>\"🛍 Katalogni ochish\"</b> tugmasini bosing.\n"
        "2️⃣ O'zingizga yoqqan mahsulotlarni savatchaga qo'shing.\n"
        "3️⃣ Buyurtma berish tugmasini bosib, ma'lumotlaringizni kiriting.\n"
        "4️⃣ <b>To'lov usulini tanlang:</b> 💵 Naqd yoki 💳 Karta.\n"
        "5️⃣ Karta tanlasangiz — pul o'tkazib, chekni botga yuboring.\n"
        "6️⃣ Admin tasdiqlagach, buyurtmangiz yetkaziladi! 🚀\n\n"
        "📦 Buyurtmalaringizni ko'rish: <b>\"📦 Buyurtmalarim\"</b> tugmasi\n\n"
        "❓ Qo'shimcha savollar: <b>📞 Biz bilan aloqa</b>"
    )
    if message.from_user.id == ADMIN_ID:
        text += "\n\n🛠 <b>Admin buyruqlari:</b>\n/admin — Admin panelni ochish"
    await message.answer(text)


# ─── WebApp Data — Buyurtma ──────────────────────────────────

@dp.message(F.web_app_data)
async def handle_webapp_data(message: Message):
    """WebApp.sendData() orqali kelgan buyurtmani qayta ishlash"""
    try:
        data        = json.loads(message.web_app_data.data)
        pay_method  = data.get("paymentMethod", "Naqd")
        order_id    = data.get("id", "")

        await notify_admin_order(data)

        if pay_method == "Karta":
            text  = (
                "🎉 <b>Buyurtmangiz qabul qilindi!</b>\n"
                "━" * 22 + "\n\n"
                f"🆔 Buyurtma: <b>{order_id}</b>\n\n"
                "💳 <b>Endi to'lovni amalga oshiring:</b>\n\n"
                f"🏦 Karta raqami:\n"
                f"<code>{CARD_NUMBER}</code>\n"
                f"👤 Egasi: <b>{CARD_OWNER}</b>\n\n"
                "📸 Pul o'tkazgandan so'ng, pastdagi tugmani bosib "
                "<b>to'lov chekini (screenshot)</b> yuboring.\n"
                "Admin tekshirib, buyurtmangizni tasdiqlaydi ✅"
            )
            kb = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(
                    text="💳 To'lov chekini yuborish",
                    callback_data=f"send_receipt:{order_id}"
                )]
            ])
            await message.answer(text, reply_markup=kb)
        else:
            await message.answer(
                "🎉 <b>Buyurtmangiz muvaffaqiyatli qabul qilindi!</b>\n\n"
                f"🆔 Buyurtma: <b>{order_id}</b>\n"
                "💵 To'lov: Naqd pul (yetkazganda)\n\n"
                "Tez orada operatorimiz siz bilan bog'lanadi 📞\n"
                "Xaridingiz uchun rahmat! 🛍"
            )
    except Exception as e:
        logger.error(f"WebApp data error: {e}")
        await message.answer("❌ Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.")


# ─── Main ────────────────────────────────────────────────────

async def main():
    try:
        await bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(
                text="🛍 Katalog",
                web_app=WebAppInfo(url=MINI_APP_URL)
            )
        )
        logger.info("[BOT] Menu Button sozlandi")
    except Exception as e:
        logger.warning(f"[BOT] Menu Button: {e}")

    loop = asyncio.get_running_loop()

    def on_new_order(order_data):
        asyncio.run_coroutine_threadsafe(notify_admin_order(order_data), loop)

    order_watch = db.listen_to_new_orders(on_new_order)
    logger.info("[FIRESTORE] Real-time orders listener ishga tushdi")

    logger.info("[BOT] Ishga tushmoqda...")
    try:
        await dp.start_polling(bot)
    finally:
        order_watch.unsubscribe()
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
