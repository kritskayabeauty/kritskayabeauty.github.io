// Все тексты, цены и фото приложения. Меняйте только этот файл.
// Строки пишутся в кавычках. После правки сохраните файл и закоммитьте.

window.SITE = {
  // Шапка
  name: "Мария Крицкая",
  role: "Визажист · стилист по причёскам",
  city: "Омск",
  tagline: "Макияж и причёски для праздников и фотосессий",

  // Telegram жены без @. На этот аккаунт клиентки будут писать с кнопки «Записаться».
  telegram: "kkkritskaya",
  // Группа в Telegram: полная ссылка https://t.me/... и подпись. Пусто: строки нет
  telegramGroup: "",
  telegramGroupLabel: "",
  phone: "",                   // например "+7 900 000-00-00". Пусто: кнопки «Позвонить» нет
  instagram: "kritskaya.beauty", // ник без @, можно пустым. Появится кнопка «Написать в Direct»
  whatsapp: "",                // номер, например "+7 900 000-00-00", можно пустым
  address: "Студия в центре Омска или выезд к вам",

  // Фото в круге наверху. Положите файл в папку photos.
  avatar: "photos/avatar.jpg",

  // Цифры под именем, например { value: "50+", label: "образов" }. Пусто: блок скрыт.
  stats: [],

  about:
    "Я визажист и стилист по причёскам. Делаю макияж и причёски " +
    "для праздников, фотосессий и выпускных. Подбираю образ под вас и под событие, " +
    "заранее обсуждаем референсы, чтобы результат совпал с ожиданиями.",

  // Как проходит запись
  steps: [
    "Пишете в Telegram или Direct: дата, время и какой образ нужен",
    "Обсуждаем референсы и детали, бронирую время",
    "В назначенный день создаём ваш образ"
  ],

  // Мелкий шрифт под услугами, например "Выезд по городу: +500 ₽". Пусто: блок скрыт.
  notes: [
    "Выезд к вам: +1 000 ₽"
  ],

  // Разделы портфолио и услуг. В этом порядке они идут на сайте
  categories: [
    { id: "makeup", title: "Макияж" },
    { id: "hair", title: "Причёски" },
    { id: "look", title: "Полный образ" }
  ],

  // Портфолио. Файлы кладите в папку photos, имя пишите в src.
  // Новые работы добавляйте сверху списка: они показываются первыми.
  // Одна работа: { src: "photos/work-01.jpg", category: "hair", title: "..." }
  // Видео: { video: "photos/video-01.mp4", poster: "photos/cover-01.jpg", badge: "до / после", ... }
  // ratio: пропорции файла, их проставляю я, чтобы кадр показывался целиком
  // Блок образа (один и тот же человек): { category, title, note, media: [ {src}, {video, poster, badge, caption, note} ] }
  // caption и note у кадра нужны, когда у кадра своё название
  works: [
    // Причёски, в том порядке, как присылали
    { src: "photos/work-01.jpg", category: "hair", title: "Высокий текстурный пучок", ratio: "590 / 784" },
    { src: "photos/work-02.jpg", category: "hair", title: "Низкий текстурный пучок", ratio: "590 / 784" },
    { src: "photos/work-03.jpg", category: "hair", title: "Серф-локоны", ratio: "590 / 784" },
    { src: "photos/work-04.jpg", category: "hair", title: "Объёмные локоны", ratio: "590 / 783" },
    {
      // Один и тот же человек: фото «Голливудская волна» и видео «До/после объёмные локоны»
      category: "hair", title: "Голливудская волна",
      note: "Такая причёска подойдёт для более официального образа",
      media: [
        { src: "photos/work-05.jpg", ratio: "590 / 1046" },
        { video: "photos/video-02.mov", fallback: "photos/video-02.mp4", poster: "photos/cover-02.jpg", badge: "до / после", ratio: "1080 / 1920",
          caption: "До/после: объёмные локоны" },
        { video: "photos/video-03.mp4", poster: "photos/cover-03.jpg", ratio: "464 / 848" }
      ]
    },

    // Макияж, в том порядке, как присылали
    {
      // Один и тот же человек: видео «До/после смоки лифтинг-макияж» и фото «Лифтинг-макияж»
      category: "makeup", title: "Лифтинг-макияж",
      media: [
        { video: "photos/video-01.mp4", poster: "photos/cover-01.jpg", badge: "до / после", ratio: "720 / 1280", caption: "До/после: смоки лифтинг-макияж" },
        { src: "photos/work-06.jpg", ratio: "590 / 1046", caption: "Лифтинг-макияж" }
      ]
    },
    { src: "photos/work-07.jpg", category: "makeup", title: "Смоки", ratio: "590 / 784" },
    { src: "photos/work-08.jpg", category: "makeup", title: "Смоки", ratio: "590 / 784" },
    {
      category: "makeup", title: "Смоки",
      media: [
        { src: "photos/work-09.jpg", ratio: "590 / 1046" },
        { video: "photos/video-05.mp4", poster: "photos/cover-05.jpg", badge: "до / после", ratio: "720 / 1280" }
      ]
    },
    { src: "photos/work-10.jpg", category: "makeup", title: "Нюдовый макияж", ratio: "590 / 782" },
    { src: "photos/work-11.jpg", category: "makeup", title: "Голливудский макияж", ratio: "590 / 1046" },
    {
      category: "makeup", title: "Растушёванная стрелка",
      media: [
        { src: "photos/work-12.jpg", ratio: "590 / 784" },
        { video: "photos/video-06.mp4", poster: "photos/cover-06.jpg", ratio: "720 / 1280" }
      ]
    },
    { src: "photos/work-13.jpg", category: "makeup", title: "Растушёванная стрелка", ratio: "576 / 1200" }
  ],

  // Услуги. category берётся из списка categories выше.
  services: [
    {
      category: "makeup",
      title: "Макияж",
      description: "Дневной или вечерний, под ваше событие и образ",
      duration: "1 ч",
      price: "2 500 ₽"
    },
    {
      category: "hair",
      title: "Причёска",
      description: "Локоны, волны, пучок или собранная причёска",
      duration: "1,5 ч",
      price: "2 500 ₽"
    },
    {
      category: "look",
      title: "Полный образ",
      description: "Макияж и причёска вместе",
      duration: "2,5 ч",
      price: "5 000 ₽"
    }
  ]
};
