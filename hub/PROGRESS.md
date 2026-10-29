# Pelikan Storage: прогресс и память проекта

Живой журнал. Обновляется в конце каждой сессии и после каждого деплоя. Версионируется git.
**Последнее обновление:** 2026-10-29 (правила задеплоены; план SEC-BOOKING-PRICE)

> Правило ротации: если файл больше ~1500 строк, закрытые задачи старше месяца и лог сессий
> старше месяца переносятся в `archive/PROGRESS-<YYYY-MM>.md`. Раздел «Ожидает деплоя»
> не ротируется: в нём остаются все незакрытые строки и строки не старше 3 месяцев.

---

## Активно

<!-- Одна задача = один блок. Сверху самое свежее.
### <ID>: <суть> (<YYYY-MM-DD>)
- **Статус:** plan → approved → in progress → verified → DEP-NNN deployed
- **Файл задачи:** `hub/tasks/<дата>-<ID>.task.md`
- **Сейчас:** <что происходит, кто держит мяч>
- **Решения оператора:** <если были>
-->

### DESIGN-THEME-TOKENS: токены `accent` / `inverse`, тема без вспышки, цвета графиков (2026-10-29)
- **Статус:** verified (графики админки вживую — после доступа к БД)
- **Файл задачи:** `hub/tasks/2026-10-29-DESIGN-THEME-TOKENS.task.md`, ветка `feat/design-theme-tokens` от `main`, DEP-002
- **Сейчас:** `0f8fd46` запушен, Preview собран (Vercel success, `https://v0-self-storage-nfqpv056q-ig9573407-6185s-projects.vercel.app`, закрыт Vercel-авторизацией). Ждёт смоука и merge оператором (только UI, без миграций)
- **Решения оператора:** начать дизайн-работы с этого пакета

### SEC-BOOKING-PRICE: брони, платежи и документы пишет только сервер (2026-10-29)
- **Статус:** in progress → код проверен (tsc, build, формулы, 401), слой данных ждёт Preview
- **Файл задачи:** `hub/tasks/2026-10-29-SEC-BOOKING-PRICE.task.md`, ветка `fix/sec-booking-price`, DEP-001
- **Сейчас:** **HOLD** до покупки сервера и домена (решение оператора 2026-10-29). `1c78ce6` запушен, Preview собран (Vercel success, закрыт Vercel-авторизацией). Дальше: смоук, merge, миграция 007 (после кода)
- **Решения оператора:** в скоупе bookings + payments + documents + Storage `documents`; простая проверка занятости ячейки (active с пересечением дат или pending < 30 мин)

## Следующее

1. **TOOLING-LINT**: `npm run lint` не работает (нет `eslint` и конфига). Решить: поставить
   eslint + `eslint-config-next` или убрать скрипт.
2. **TOOLING-TYPES**: `ignoreBuildErrors: true` в `next.config.mjs`. Сейчас `tsc` чистый,
   можно включить проверку типов в сборке.
3. **TEST-INFRA**: тестов нет. Начать с чистых функций денег и дат (скидки, `computeRentalEndDateIso`,
   продление в webhook).
4. **CONTENT-CONTACTS**: телефон и email в `lib/site-config.ts` заглушки
   (или задать `NEXT_PUBLIC_SITE_PHONE*` / `NEXT_PUBLIC_SITE_EMAIL` на Vercel).
5. **BOOKING-DOUBLE-PAY**: проверка занятости не атомарна; брошенная `pending`-бронь старше 30 мин, оплаченная позже, может дать две `active` одной ячейки. Варианты: проверка в webhook или exclusion constraint (см. отчёт SEC-BOOKING-PRICE).
6. **DEV-ENV-SUPABASE**: хост Supabase из `.env.local` не резолвится (проект на паузе или удалён) — локально нельзя работать с БД. Оператору: обновить `.env.local` или выделить dev-проект.
7. **CHORE-NEXT-PROXY**: Next.js 16 предупреждает, что `middleware.ts` устарел, надо переименовать в `proxy.ts` (осторожно: затрагивает сессии, см. LESSONS).
8. **Дизайн и UI** — по аудиту `hub/tasks/2026-10-29-DESIGN-AUDIT.audit.md`, по порядку:
   **DESIGN-THEME-TOKENS** — в работе →
   **DESIGN-QUICK-FIXES** (legal под шапкой, дубль title, «ТВОЙ» / `skladtvoy.ru`, скрытый первый экран, типографика чисел) →
   **CONTENT-TRUST** (противоречивые цифры, демо-отзывы, заглушки контактов, цены калькулятора не из БД; нужны факты оператора, поглощает CONTENT-CONTACTS) →
   **UI-STATUS-FEEDBACK** → **UI-SYSTEM** → **UI-APP-SHELL** (после рабочего Supabase).
9. **CHORE-CLEANUP**: пустая папка `Новая папка/` в корне, `.DS_Store`; README в основном шаблон v0.

## Блокеры и открытые вопросы

| # | Вопрос | Кого ждём | С какого числа |
|---|---|---|---|
| 1 | Прод-URL (для `hub/PROJECT.md` §3 и смоука). Оператор берёт сервер и домен — уточнить, остаётся ли Vercel (от этого зависит `hub/DEPLOY.md`) | оператор | 2026-10-29 |
| 2 | Preview-деплои Vercel смотрят в тот же Supabase-проект, что и прод? Есть ли тестовый магазин ЮKassa? От этого зависит, можно ли проверять оплату на preview | оператор | 2026-10-29 |
| 3 | `.env.local` смотрит в недоступный Supabase-проект (DNS не резолвится): локальная проверка с БД невозможна | оператор | 2026-10-29 |

## Отложено / HOLD

- **DEP-001 / SEC-BOOKING-PRICE смоук**: решение оператора 2026-10-29 — после покупки сервера и домена. Код в `fix/sec-booking-price`, в `main` не слит, миграция 007 не применена.

## Закрыто (последний месяц)

- Нет.

---

## Ожидает деплоя (Pending deploy)

Здесь то, что **закоммичено и проверено**, но ещё не в `main` или не стало Ready на Vercel.
Номер выдаёт `bash hub/scripts/next-id.sh DEP`. Порядок описан в [`DEPLOY.md`](DEPLOY.md).

| ID | Изменение | Ветка | SHA | Миграции | Код | Прод | Evidence |
|---|---|---|---|---|---|---|---|
| DEP-002 | DESIGN-THEME-TOKENS: токены `accent` / `inverse`, next-themes, цвета графиков | `feat/design-theme-tokens` | `0f8fd46` | нет | verified | **preview** | Vercel Preview success; смоук — оператор |
| DEP-001 | SEC-BOOKING-PRICE: брони, платежи, документы пишет сервер; проверка занятости | `fix/sec-booking-price` | `1c78ce6` | `007` после кода | локально verified, Preview собран | **preview** | Vercel Preview success; смоук — оператор |

Статусы колонки «Прод»: `pending` → `preview` → **`deployed`** (оператор, дата) / `rolled back`.
Статус `deployed` ставится, когда есть SHA Ready-деплоя `main` на Vercel, прод 200 и смоук.

---

## Лог сессий

<!-- Сверху самое свежее. Одна строка = одно событие с ID. -->
- **2026-10-29 (DEP-002 preview):** `feat/design-theme-tokens` `0f8fd46` запушен, Vercel Preview success. Ждёт смоука и merge оператором.
- **2026-10-29 (DESIGN-THEME-TOKENS verified):** ветка `feat/design-theme-tokens` от `main`, не закоммичено. Verify: tsc ✓, build ✓; светлый футер — цвета до/после совпали; тёмный футер `lab(0.64)` вместо оранжевого; hover ghost — светлая подложка; next-themes скрипт до `<header>`, без hydration-предупреждений; графики: `hsl(var(--primary))` = чёрный → `var(--chart-1)` = оранжевый. Добавлено: текст hover на 404. DEP-002 pending.
- **2026-10-29 (DESIGN-AUDIT):** обход страниц на 1280 и 375, светлая и тёмная темы; кабинет и админка по коду (БД недоступна). Итог в `hub/tasks/2026-10-29-DESIGN-AUDIT.audit.md`: 8 × P0, 10 × P1, 9 × P2, 6 пакетов работ (позже: 9 × P0 — графики аналитики; P2-9 поправлен: кнопка 404 оранжевая). Смоук DEP-001 на HOLD до сервера и домена.
- **2026-10-29 (DEP-001 preview):** `fix/sec-booking-price` `1c78ce6` запушен, Vercel Preview success. Preview закрыт SSO (302), смоук агентом невозможен — ждёт оператора.
- **2026-10-29 (SEC-BOOKING-PRICE реализация):** ветка `fix/sec-booking-price`, не закоммичено. Verify: tsc ✓, build ✓, service role вне клиентского бандла ✓, формулы цены/дат = старым (0 расхождений, MSK и UTC), curl без сессии 401 ✓. ⚠️ Запросы к БД не проверены: Supabase из `.env.local` недоступен. Отклонение: своя pending-бронь не блокирует пользователю ячейку. DEP-001 pending.
- **2026-10-29 (SEC-BOOKING-PRICE plan):** план в `hub/tasks/2026-10-29-SEC-BOOKING-PRICE.task.md`; найдено, что те же RLS-дыры есть в `payments`, `documents` и Storage `documents`, плюс нет проверки занятости ячейки. Ждёт approve.
- **2026-10-29 (правила в проде):** merge `2cbd1c2` (ветка `chore/control-hub-rules`, `3ff4743`) в `main`, Vercel status `success`. Код сайта не менялся, DEP не заводился. Прод-домен не известен: адрес деплоя закрыт Vercel-авторизацией (302).
- **2026-10-29 (старт):** правила Control Hub Kit адаптированы: `AGENTS.md`, `CLAUDE.md`, `hub/`,
  `.claude/commands/`, `.cursor/rules/`. Проверка: `tsc --noEmit` ✓. Найдена дыра SEC-BOOKING-PRICE.
