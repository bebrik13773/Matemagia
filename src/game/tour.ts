import { PetMood } from './engine';

export type TourScreen = 'hub' | 'pet' | 'map' | 'exam' | 'ach';

export interface TourStep {
  id: string;
  screen: TourScreen;
  selector: string;
  title: string;
  text: string;
  mood: PetMood;
  speech: string;
  actionHint: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    screen: 'hub',
    selector: '[data-tour="hub-hero"]',
    title: 'Привет! Я твоя Гусеничка 🐛',
    text: 'Добро пожаловать в «Матемагию»! Я помогу тебе выучить таблицу умножения и деления. Сейчас я проведу короткую экскурсию и покажу, где я живу и зачем нужна каждая кнопка.',
    mood: 'excited',
    speech: 'Привет! Познакомимся?',
    actionHint: 'Главный экран — Штаб',
  },
  {
    id: 'streak',
    screen: 'hub',
    selector: '[data-tour="hub-streak"]',
    title: 'Ежедневная серия и бонус XP',
    text: 'Занимайся каждый день подряд, чтобы растить серию 🔥 и получать бонус от +10% до +50% опыта за каждый верный ответ.',
    mood: 'happy',
    speech: 'Заходи каждый день!',
    actionHint: 'Шкала 7-дневной серии',
  },
  {
    id: 'timer',
    screen: 'hub',
    selector: '[data-tour="hub-diff"]',
    title: 'Кнопки строгости таймера',
    text: 'Выбирай «Спокойный», «Обычный» или «Строгий» — эти кнопки меняют время на размышление. Чем строже таймер, тем больше опыта за скорость.',
    mood: 'idle',
    speech: 'Настрой удобный темп',
    actionHint: 'Переключатель режима таймера',
  },
  {
    id: 'course',
    screen: 'hub',
    selector: '[data-tour="hub-course-btn"]',
    title: 'Кнопка «Урок курса»',
    text: 'Главная кнопка для старта! Внутри 12 примеров, которые умный алгоритм подбирает специально под твои ошибки, скорость и этап изучения таблицы.',
    mood: 'excited',
    speech: 'Жми сюда для старта!',
    actionHint: 'Адаптивный урок из 12 заданий',
  },
  {
    id: 'free-train',
    screen: 'hub',
    selector: '[data-tour="hub-free-btn"]',
    title: 'Кнопка «Свободная тренировка»',
    text: 'Хочешь порешать случайные примеры по всей таблице умножения и деления сразу? Эта кнопка запускает свободную тренировку на 12 заданий.',
    mood: 'idle',
    speech: 'Случайный микс примеров',
    actionHint: 'Вся таблица от 2×2 до 9×9',
  },
  {
    id: 'weak-spots',
    screen: 'hub',
    selector: '[data-tour="hub-weak-btn"]',
    title: 'Кнопка «Прокачать слабые места»',
    text: 'Сверху показаны 5 примеров, которые пока даются труднее всего. Нажми эту кнопку, чтобы устроить короткую фокус-тренировку из 10 заданий только на них.',
    mood: 'hungry',
    speech: 'Подтянем трудные пары!',
    actionHint: 'Фокус-тренировка сложных примеров',
  },
  {
    id: 'profile',
    screen: 'hub',
    selector: '[data-tour="hub-profile"]',
    title: 'Имя, перенос прогресса и сброс',
    text: 'Кнопка «✏️ Имя» задаёт твоё имя для сертификата. «📥 Экспорт» и «📤 Импорт» сохраняют прогресс в файл, «🐛 Обучение» запускает этот гид снова, а «Сбросить прогресс» очищает данные.',
    mood: 'idle',
    speech: 'Тут твои настройки профиля',
    actionHint: 'Кнопки управления профилем',
  },
  {
    id: 'pet-home',
    screen: 'pet',
    selector: '[data-tour="pet-habitat"]',
    title: 'Мой домик — вкладка «Питомец»!',
    text: 'Вот где я живу! Нажимай прямо на меня, чтобы погладить. А во время тренировок я буду рядом с примерами и за каждый твой верный ответ съем сочный листик 🍃 и вырасту!',
    mood: 'happy',
    speech: 'Добро пожаловать ко мне домой!',
    actionHint: 'Живой домик гусенички',
  },
  {
    id: 'pet-wardrobe',
    screen: 'pet',
    selector: '[data-tour="pet-wardrobe"]',
    title: 'Скины за новые уровни',
    text: 'Повышай уровень в тренировках и открывай новые наряды: Ягодную, Космическую, Радужную и даже Королеву. Нажимай на открытую карточку, чтобы переодеть меня!',
    mood: 'excited',
    speech: 'Обожаю наряжаться!',
    actionHint: 'Карточки скинов питомца',
  },
  {
    id: 'map-screen',
    screen: 'map',
    selector: '[data-tour="map-controls"]',
    title: 'Вкладка «Карта» — вся таблица',
    text: 'На карте видны все 36 семейств примеров. Кнопка сверху переключает умножение × и деление ÷, а нажатие на любую клетку открывает статистику и кнопку тренировки именно этого примера.',
    mood: 'idle',
    speech: 'Видно каждый пример!',
    actionHint: 'Кнопка переключения × / ÷ и сетка',
  },
  {
    id: 'exam-screen',
    screen: 'exam',
    selector: '[data-tour="exam-start-btn"]',
    title: 'Вкладка «Экзамен» и сертификат',
    text: 'Нажми «Начать финальный тест», когда выучишь таблицу: 36 заданий без вариантов ответа с цифровой клавиатурой. Решишь 36 из 36 без ошибок — получишь именной сертификат 📜!',
    mood: 'excited',
    speech: 'Главная проверка знаний!',
    actionHint: 'Кнопка запуска экзамена 36/36',
  },
  {
    id: 'bottomnav',
    screen: 'ach',
    selector: '#bottomnav',
    title: 'Вкладка «Награды» и нижняя панель',
    text: 'Здесь собраны все 14 достижений, а нижняя панель позволяет в одно касание переходить между Штабом, моим домиком, Картой, Экзаменом и Наградами.',
    mood: 'happy',
    speech: 'Собери все 14 наград!',
    actionHint: 'Навигация по всем разделам',
  },
  {
    id: 'topbar',
    screen: 'hub',
    selector: '[data-tour="topbar-controls"]',
    title: 'Верхние кнопки: музыка, звук и гид',
    text: 'В правом верхнем углу кнопки включают фоновую музыку 🎵 и звуковые эффекты 🔊, а кнопка «❓» всегда позовёт меня снова. Жми «Начать учиться» и попробуй первый урок!',
    mood: 'excited',
    speech: 'Готов к первому уроку!',
    actionHint: 'Музыка, звук и повтор обучения',
  },
];

export interface RectBox {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

export interface TourCardPlacement {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  mode: 'below' | 'above' | 'side' | 'docked-top' | 'docked-bottom';
}

export function computeTourCardPlacement(
  targetRect: RectBox | null,
  viewportWidth: number,
  viewportHeight: number
): TourCardPlacement {
  const margin = viewportWidth <= 640 ? 12 : 18;
  const topSafe = 72;
  const bottomSafe = 14;
  const cardWidth = Math.min(430, Math.max(260, viewportWidth - margin * 2));
  const estCardHeight = viewportWidth <= 640 ? 255 : 275;

  if (!targetRect) {
    return {
      bottom: bottomSafe,
      left: Math.round((viewportWidth - cardWidth) / 2),
      width: cardWidth,
      mode: 'docked-bottom',
    };
  }

  // On mobile viewports, dock cleanly opposite to where the highlighted target lives
  if (viewportWidth <= 640) {
    const targetCenterY = targetRect.top + targetRect.height / 2;
    const placeTop = targetCenterY > viewportHeight * 0.52;
    return placeTop
      ? {
          top: topSafe,
          left: Math.round((viewportWidth - cardWidth) / 2),
          width: cardWidth,
          mode: 'docked-top',
        }
      : {
          bottom: bottomSafe,
          left: Math.round((viewportWidth - cardWidth) / 2),
          width: cardWidth,
          mode: 'docked-bottom',
        };
  }

  const gap = 16;
  const clampLeft = (idealLeft: number) =>
    Math.round(Math.max(margin, Math.min(viewportWidth - cardWidth - margin, idealLeft)));

  const centeredLeft = clampLeft(targetRect.left + targetRect.width / 2 - cardWidth / 2);

  // Prefer placing below target
  if (viewportHeight - (targetRect.bottom + gap + bottomSafe) >= estCardHeight) {
    return {
      top: Math.round(targetRect.bottom + gap),
      left: centeredLeft,
      width: cardWidth,
      mode: 'below',
    };
  }

  // Otherwise try above target
  if (targetRect.top - gap - topSafe >= estCardHeight) {
    return {
      bottom: Math.round(viewportHeight - targetRect.top + gap),
      left: centeredLeft,
      width: cardWidth,
      mode: 'above',
    };
  }

  // Try placing to the right of target
  if (viewportWidth - (targetRect.right + gap + margin) >= cardWidth) {
    const sideTop = Math.round(
      Math.max(
        topSafe,
        Math.min(viewportHeight - estCardHeight - bottomSafe, targetRect.top)
      )
    );
    return {
      top: sideTop,
      left: Math.round(targetRect.right + gap),
      width: cardWidth,
      mode: 'side',
    };
  }

  // Try placing to the left of target
  if (targetRect.left - gap - margin >= cardWidth) {
    const sideTop = Math.round(
      Math.max(
        topSafe,
        Math.min(viewportHeight - estCardHeight - bottomSafe, targetRect.top)
      )
    );
    return {
      top: sideTop,
      left: Math.round(targetRect.left - gap - cardWidth),
      width: cardWidth,
      mode: 'side',
    };
  }

  // Fallback: dock opposite vertical half
  const targetCenterY = targetRect.top + targetRect.height / 2;
  if (targetCenterY > viewportHeight * 0.55) {
    return {
      top: topSafe,
      left: centeredLeft,
      width: cardWidth,
      mode: 'docked-top',
    };
  }

  return {
    bottom: bottomSafe,
    left: centeredLeft,
    width: cardWidth,
    mode: 'docked-bottom',
  };
}
