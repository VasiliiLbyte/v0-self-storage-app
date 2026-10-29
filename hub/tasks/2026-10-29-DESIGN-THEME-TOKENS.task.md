# DESIGN-THEME-TOKENS: токены `accent` / `inverse`, тема без вспышки, цвета графиков (2026-10-29)

**Статус:** verified (кроме графиков админки вживую)
**Цель:** тёмная и светлая темы выглядят как задумано: футер и 404 не ломаются в тёмной теме, hover и выделение в кнопках и меню — лёгкая подложка, тема применяется до первой отрисовки, графики админки в фирменном цвете.
**Размер:** обычная (UI, 9 файлов, без денег, auth и БД)
**Ветка:** `feat/design-theme-tokens` от `main`
**Деплой:** DEP-002 (выдать при `verified`)
**Основание:** `hub/tasks/2026-10-29-DESIGN-AUDIT.audit.md` P0-1, P0-2, P0-3, P0-9

---

## 1. Текущее состояние (проверено в коде)

- `app/globals.css:20-21`: `--accent` = тёмно-синий `oklch(0.22 0.04 255)` в светлой теме; `:56-57` в `.dark` = оранжевый, как `primary`.
- shadcn использует `accent` как лёгкую подложку: `components/ui/button.tsx:16,20` (`outline`, `ghost` → `hover:bg-accent`), `select.tsx:110` и `dropdown-menu.tsx:77,95,131` (`focus:bg-accent`), `calendar.tsx:107-113`.
- Как «тёмный фирменный фон» `accent` используют: `components/footer.tsx:10` и далее (`bg-accent text-accent-foreground`, `/40…/70`), `app/not-found.tsx:71,85` (квадраты), `:150` (hover-заливка кнопки «На главную»).
- Тема: `components/theme-toggle.tsx` ставит класс `dark` в `useEffect` (после гидрации → вспышка светлой темы), ключ `localStorage` — `theme`, значения `light` / `dark`. `components/theme-provider.tsx` (next-themes) есть, но не подключён в `app/layout.tsx`.
- `app/layout.tsx:33-34`: `themeColor` `#ffffff` / `#1a1f36`, фактический фон — `#fcfcfc` / `#02060d`.
- `components/admin-shell.tsx:5,48`: `Toaster` импортирован напрямую из `sonner` и не знает о теме; в `components/ui/sonner.tsx` есть обёртка с `useTheme()`.
- `components/admin-analytics-charts.tsx:65,76,88`: `hsl(var(--primary))`, `hsl(var(--muted-foreground))` при oklch-токенах — невалидный цвет. `components/admin-dashboard-charts.tsx:41,43,64`: `#FF6B00`.
- `app/globals.css:194`: границы таблиц юр. страниц `#ddd` — в тёмной теме светлые линии.

## 2. План

1. **`app/globals.css`**:
   - `:root` — `--accent: oklch(0.96 0.01 255)`, `--accent-foreground: oklch(0.15 0.02 255)` (как `secondary`); новые `--inverse: oklch(0.22 0.04 255)`, `--inverse-foreground: oklch(0.99 0 0)` (сегодняшний тёмно-синий).
   - `.dark` — `--accent: oklch(0.22 0.03 255)`, `--accent-foreground: oklch(0.96 0 0)`; `--inverse: oklch(0.09 0.02 255)`, `--inverse-foreground: oklch(0.96 0 0)` (футер темнее фона страницы).
   - `@theme inline` — `--color-inverse`, `--color-inverse-foreground`.
   - `.legal-content th, td` — `border: 1px solid var(--border)`.
2. **`components/footer.tsx`** — `accent` → `inverse` во всех классах (фон, текст, прозрачности, водяной знак). Текст водяного знака и подпись не меняются (это DESIGN-QUICK-FIXES).
3. **`app/not-found.tsx`** — `border-accent`, `bg-accent` → `border-inverse`, `bg-inverse` (3 места).
4. **`app/layout.tsx`** — обернуть в `ThemeProvider` (`attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`), `suppressHydrationWarning` на `<html>`, `themeColor` → `#fcfcfc` / `#02060d`.
5. **`components/theme-toggle.tsx`** — на `useTheme()` / `resolvedTheme`; до монтирования — кнопка того же размера без иконки (без hydration mismatch). Ключ `theme` и значения совместимы с next-themes: сохранённый выбор пользователей не потеряется.
6. **`components/admin-shell.tsx`** — `Toaster` из `@/components/ui/sonner` (те же `richColors`, `position`).
7. **Графики**: `admin-analytics-charts.tsx` → `var(--chart-1)` и `var(--muted-foreground)`; `admin-dashboard-charts.tsx` → `var(--chart-1)`.

**Миграция:** нет. **Env:** нет. **API:** нет.

## 3. НЕ трогать

- `components/ui/*` (исправляется токенами, не правкой компонентов)
- Тексты и бренд: водяной знак «ТВОЙ», `v0.skladtvoy.ru`, цифры, контакты (DESIGN-QUICK-FIXES, CONTENT-TRUST)
- Анимации шапки и hero, отступы страниц, типографика (DESIGN-QUICK-FIXES, UI-SYSTEM)
- Цвета статусов `green-*` / `yellow-*` (UI-STATUS-FEEDBACK)
- `primary`, `secondary`, `muted`, `border` и остальные токены

## 4. Стоп-сигналы

- Правка файлов в `components/ui/*`
- Изменение `primary` или любых токенов, кроме `accent*` и новых `inverse*`
- Новая зависимость (next-themes уже стоит)
- Переход на другой ключ `localStorage` или другие значения темы
- Видимое изменение светлой темы, кроме hover / focus-подложек

## 5. Критерии готовности

- [ ] Светлая тема: футер тёмно-синий, как сейчас (сравнение скриншотов до / после на 1280)
- [ ] Тёмная тема: футер тёмный, кнопка «Забронировать бокс» оранжевая и читается; 404 без оранжевых квадратов на месте тёмных
- [ ] Наведение на «Войти» (ghost) и «Рассчитать» (outline): светлая подложка, текст читается в обеих темах
- [ ] Перезагрузка с сохранённой тёмной темой: в HTML-ответе есть скрипт next-themes, у `<html>` класс `dark` до гидрации, вспышки нет; в консоли нет hydration-предупреждений
- [ ] Переключатель работает, выбор сохраняется; без сохранённого выбора тема следует системе
- [ ] `/auth/login`, `/auth/signup`, `/legal/offer` читаемы в тёмной теме (теперь тема применяется и там, где нет шапки)
- [ ] Графики админки: цвет валиден (`CSS.supports`), столбцы и линия оранжевые ⚠️ вживую — когда будет доступна БД
- [ ] `npx tsc --noEmit` и `npm run build` зелёные

## 6. Крайние случаи

- Сохранённое значение `theme` — `light` / `dark` (старый переключатель), `system` или пусто
- Переход с лендинга в кабинет и админку: тема та же, без мигания
- `prefers-color-scheme` меняется при открытой вкладке (`enableSystem`)
- Тосты админки в тёмной теме

## 7. Оператору вне кода

- Ничего. Смоук после деплоя: главная в обеих темах, футер, 404.

---

## Отчёт о проверке (2026-10-29)

**Ветка / SHA:** `feat/design-theme-tokens` / не закоммичено · **Статус:** verified; ⚠️ графики админки вживую не открывались (нет БД), цвет проверен отдельно

### Изменённые файлы

| Файл | Что сделано |
|---|---|
| `app/globals.css` | `--accent` → лёгкая подложка в обеих темах; новые `--inverse` / `--inverse-foreground` и `--color-inverse*`; границы таблиц `.legal-content` → `var(--border)` |
| `components/footer.tsx` | `accent` → `inverse` (19 мест); водяной знак `text-inverse-foreground/[0.03]` вместо пары light/dark |
| `app/not-found.tsx` | квадраты и hover-заливка «На главную» → `inverse`; текст кнопки при наведении → `inverse-foreground` |
| `app/layout.tsx` | `ThemeProvider` (class, system, без анимации смены), `suppressHydrationWarning`, `themeColor` `#fcfcfc` / `#02060d` |
| `components/theme-toggle.tsx` | `useTheme()` / `resolvedTheme`, нейтральная кнопка до монтирования |
| `components/admin-shell.tsx` | `Toaster` из `@/components/ui/sonner` (знает тему) |
| `components/admin-analytics-charts.tsx`, `admin-dashboard-charts.tsx` | `hsl(var(--primary))` и `#FF6B00` → `var(--chart-1)`, `var(--muted-foreground)` |

### Проверки (вывод, не пересказ)

```text
$ npm run build
✓ Compiled successfully
$ npx tsc --noEmit
tsc exit 0          (перед этим удалены устаревшие .next/types с другой ветки)

Вычисленные цвета в браузере (1280×800), до → после:
Светлая: футер bg        lab(9.32 -1.00 -13.95) → lab(9.32 -1.00 -13.95)   без изменений
Светлая: футер текст     lab(98.84)             → lab(98.84)               без изменений
Светлая: hover «Войти»   lab(9.32 …) + белый    → lab(95.34 -0.81 -3.67) + lab(3.0)  светлая подложка
Тёмная:  футер bg        lab(66.24 48.73 60.23) (= цвет CTA) → lab(0.64 -0.04 -1.85)
Тёмная:  CTA в футере    lab(66.24 …) — теперь контрастна фону
Тёмная:  404 hover «На главную»: заливка lab(0.64 …), текст lab(95.36)
Тёмная:  .legal-content td border → lab(16.42 …) (= --border)
SVG fill: hsl(var(--primary)) → rgb(0, 0, 0) (было: чёрные графики); var(--chart-1) → lab(66.24 48.73 60.23)

Тема:
HTML-ответ `/`: inline-скрипт next-themes стоит до <header>; theme-color #fcfcfc / #02060d
Клик по переключателю → localStorage.theme = "dark", <html class="… dark">; после перезагрузки — dark
Без сохранённого выбора: ОС dark → class "dark"; ОС light → class "light"
Консоль: только ERR_NAME_NOT_RESOLVED (Supabase из .env.local), hydration-предупреждений нет
```

### Слои VERIFY.md

| Слой | Как проверил | Результат |
|---|---|---|
| Код | `git diff` целиком; grep: `accent` вне `components/ui/*` больше не используется | ✅ `components/ui/*` не тронуты |
| Типы и сборка | `tsc`, `npm run build` | ✅ |
| API | не затронут | — |
| Живой UI | `/`, футер, hover в шапке, 404, `/auth/login`, `/legal/privacy` в обеих темах; переключатель, перезагрузка, системная тема | ✅ |
| Данные и безопасность | не затронуты | — |

### Критерии

| Критерий из §5 | Как проверил | Статус |
|---|---|---|
| Светлая: футер как сейчас | вычисленные цвета до / после совпали | ✅ |
| Тёмная: футер тёмный, CTA читается; 404 без «оранжевое на оранжевом» | вычисленные цвета + скриншоты | ✅ |
| Hover ghost / outline — светлая подложка | hover «Войти»: `lab(95.3)` + тёмный текст | ✅ (outline — тот же токен) |
| Нет вспышки, нет hydration-предупреждений | скрипт в HTML до `<header>`, консоль | ✅ |
| Переключатель, сохранение, системная тема | клик, reload, эмуляция `prefers-color-scheme` | ✅ |
| Вход и юр. страницы в тёмной теме | скриншоты | ✅ |
| Графики админки оранжевые | вычисленный `fill` для `var(--chart-1)` и старого `hsl(var(--primary))` | ✅ цвет / ⚠️ сам экран не открыт — нет БД |
| `tsc` и `build` | вывод выше | ✅ |

### Отклонения от плана, риски, follow-up

- **Добавлено по ходу:** на 404 в тёмной теме hover-заливка `inverse` сделала бы текст «На главную» невидимым (тёмный на тёмном) — добавлен `hover:text-inverse-foreground`. В светлой теме цвет текста не меняется (оба белые).
- **Риск:** тема теперь применяется на всех страницах, включая админку и кабинет (раньше — только после монтирования шапки). Админку в тёмной теме вживую не смотрел — нет БД.
- **Замечено вне скоупа:** в тёмной теме на 404 оранжевые квадраты задаются через `dark:*-primary/*` — оставлено как было.

### Деплой

#### DEP-002: токены `accent` / `inverse`, тема без вспышки, цвета графиков

**Ветка / целевой SHA:** `feat/design-theme-tokens` `<после коммита>`
**Миграции:** нет · **Env:** без изменений · **Preview gate:** не обязателен (только UI), но удобен для смоука

```bash
cd "/Users/vasilii/Desktop/code /pelikan-storage"
git fetch origin
git switch main
git pull --ff-only origin main
git merge --no-ff feat/design-theme-tokens
git log -1 --oneline
git push origin main
```

**Смоук:**
- [ ] Главная в светлой теме: футер тёмно-синий, как раньше
- [ ] Переключить на тёмную: футер тёмный, «Забронировать бокс» оранжевая и читается
- [ ] Перезагрузить в тёмной теме: светлой вспышки нет
- [ ] Наведение на «Войти» и «Рассчитать»: светлая подложка, текст читается
- [ ] Админка → Аналитика: столбцы и линия оранжевые (когда будет доступ)
