"""Пост в Telegram-канал с кнопкой приложения и закрепление.

Запускается из GitHub Actions («Пост с кнопкой в канал» → Run workflow).
Ключ бота берётся из секрета TELEGRAM_BOT_TOKEN, в коде его нет.
Бот должен быть администратором канала с правами публиковать и изменять сообщения.
"""
import json
import os
import sys
import urllib.parse
import urllib.request

CHANNEL = os.environ.get("TG_CHANNEL", "@kritskayabeauty")
APP = "https://t.me/kritskayabeauty_bot?startapp"

TEXT = (
    "✨ <b>Мария Крицкая</b> · визаж и причёски в Омске\n\n"
    "Портфолио, цены и запись собраны в одном приложении. "
    "Выберите услугу и запишитесь в пару касаний.\n\n"
    "Макияж 2 500 ₽ · Причёска 2 500 ₽ · Полный образ 5 000 ₽\n\n"
    f"👇 Открыть: {APP}"
)
BUTTONS = {"inline_keyboard": [[{"text": "✨ Открыть приложение", "url": APP}]]}


def call(token, method, **params):
    data = urllib.parse.urlencode({k: (json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else v)
                                   for k, v in params.items()}).encode()
    try:
        with urllib.request.urlopen(f"https://api.telegram.org/bot{token}/{method}", data, timeout=20) as r:
            res = json.load(r)
    except urllib.error.HTTPError as e:
        res = json.load(e)
    if not res.get("ok"):
        sys.exit(f"{method}: Telegram ответил ошибкой: {res.get('description')}")
    return res["result"]


def main():
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        sys.exit("Нет секрета TELEGRAM_BOT_TOKEN: Settings → Secrets and variables → Actions")
    msg = call(token, "sendMessage", chat_id=CHANNEL, text=TEXT, parse_mode="HTML", reply_markup=BUTTONS,
               link_preview_options={"url": APP, "prefer_large_media": True})
    call(token, "pinChatMessage", chat_id=CHANNEL, message_id=msg["message_id"], disable_notification=True)
    print(f"Пост {msg['message_id']} опубликован и закреплён в {CHANNEL}")


if __name__ == "__main__":
    main()
