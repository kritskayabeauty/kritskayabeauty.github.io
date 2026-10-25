// Ответ бота @kritskayabeauty_bot на любое сообщение, в том числе /start.
// Живёт в @BotFather → бот → Serverless → Handlers → message. Здесь копия.
import { api } from 'sdk';

const APP = 'https://kritskayabeauty.github.io/';

export default async function (message) {
  const name = message.from && message.from.first_name ? `, ${message.from.first_name}` : '';
  await api.sendPhoto({
    chat_id: message.chat.id,
    photo: 'https://kritskayabeauty.github.io/photos/cover.jpg',
    caption:
      `Здравствуйте${name}! ✨\n\n` +
      'Я Мария Крицкая, визажист и стилист по причёскам в Омске.\n\n' +
      'В приложении мои работы, цены и запись в пару касаний:\n' +
      'Макияж 2 500 ₽ · Причёска 2 500 ₽ · Полный образ 5 000 ₽',
    reply_markup: {
      inline_keyboard: [
        [{ text: '✨ Открыть приложение', web_app: { url: APP } }],
        [{ text: 'Написать Марии', url: 'https://t.me/kkkritskaya' }],
        [{ text: 'Канал с работами', url: 'https://t.me/kritskayabeauty' }],
      ],
    },
  });
}
