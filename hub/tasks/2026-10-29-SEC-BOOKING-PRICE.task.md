# SEC-BOOKING-PRICE: брони, платежи и документы пишет только сервер (2026-10-29)

**Статус:** in progress → код проверен локально, слой данных ждёт смоука на Preview
**Цель:** клиент не может сам задать цену, статус, даты брони, платёж или документ, и одну ячейку нельзя забронировать дважды.
**Размер:** рискованная (деньги, RLS, миграция, 7+ файлов)
**Ветка:** `fix/sec-booking-price`
**Деплой:** DEP-001

**Решения оператора (2026-10-29):**
- В скоуп входят `bookings`, `payments`, `documents` и Storage-бакет `documents`: прямые записи клиента закрываются целиком.
- Проверка занятости ячейки при создании брони: отказ, если у ячейки есть `active`-бронь с пересекающимися датами или `pending`-бронь моложе 30 минут. Занятые ячейки скрываются в выборе.

> **NB:** порядок выкатки обратный обычному (D-002): **сначала код, потом миграция**. Новый код пишет через service role и работает при старых политиках. Если миграцию применить раньше кода, текущее бронирование из браузера сломается.

---

## 1. Текущее состояние (проверено в коде)

- `app/booking/page.tsx:169-172`: цена, скидка (3 мес → 5%, 6+ → 10%) и `finalPrice` считаются в браузере.
- `app/booking/page.tsx:218-239`: `supabase.from("bookings").insert({... base_price, discount_percent, final_price, access_code, status: "pending"})` из браузера. `access_code` генерируется через `Math.random()`.
- `app/booking/page.tsx:277-286`: в `/api/payments/create` уходит `amount: finalPrice` и `description` от клиента.
- `app/booking/page.tsx:105-113`: ячейки грузятся с фильтром только `in_maintenance = false`, занятость не учитывается.
- `app/api/payments/create/route.ts:81`: проверяет `booking.final_price === body.amount`, но `final_price` записал клиент. `:127`: insert в `payments` пользовательским клиентом (RLS `payments_insert_own`).
- `app/api/bookings/extend/route.ts:114`: insert в `payments` пользовательским клиентом. Сумма берётся из `boxes.price_month`, это корректно.
- `app/api/bookings/sign/route.ts:68-79`: update `bookings` пользовательским клиентом (RLS `bookings_update_own`).
- `app/api/bookings/cancel/route.ts:44-47`: update `status → cancelled` пользовательским клиентом.
- `app/api/payments/webhook/route.ts:53-56`: если `payments.status` уже `succeeded`, выходит. `:87-93`: генерирует договор, только если в `documents` нет строки `contract` (фальшивая строка от клиента это блокирует). Всё остальное пишет через service role.
- БД, `scripts/001_create_tables.sql:198-221`: политики `bookings_insert_own`, `bookings_update_own`, `payments_insert_own`, `payments_update_own`, `documents_insert_own`, `documents_update_own`. Все проверяют только `auth.uid() = user_id`, любые поля.
- Storage, `scripts/003_dashboard_extras.sql:65-70`: `documents_insert_own` позволяет клиенту загрузить файл в бакет `documents` в свою папку.
- Клиентских записей в `payments` и `documents` в коде нет (проверено grep). Профиль (`profiles`) клиент пишет сам; `role`, `verified`, `notes` защищены триггером, это остаётся как есть.
- Env: `SUPABASE_SERVICE_ROLE_KEY` (уже нужен webhook-у, на проде должен быть).

## 2. План

1. **`lib/booking-pricing.ts`** (новый, чистые функции): `ALLOWED_MONTHS = [1, 3, 6, 12]`, `discountPercentFor(months)`, `computeBookingPrice(priceMonth, months)` → `{ base_price, discount_percent, final_price }`, `computeRentalEndDateIso(startDate, months)`. Логика скидок и дат переносится из `app/booking/page.tsx` без изменения результата.
2. **`POST /api/bookings/create`** (новый route handler):
   - Auth: сессия обязательна (401). Body `{ box_id: uuid, months: 1|3|6|12, start_date: "YYYY-MM-DD" }` через zod (400). `start_date` не раньше сегодняшнего дня по Москве и не дальше чем через 365 дней.
   - Ячейка: существует (404) и не `in_maintenance` (400).
   - Занятость (service role): есть бронь этой ячейки, `status = 'active'` с пересечением `[start_date, end_date)`, или `status = 'pending'`, `created_at > now() - 30 min` и пересечение → 409 «Ячейка уже занята, выберите другую».
   - Цена из `boxes.price_month` через `computeBookingPrice`, `end_date` через `computeRentalEndDateIso`, `access_code` через `crypto.randomInt(100000, 1000000)`.
   - Insert через service role с `user_id = user.id`, `status: 'pending'`. Ответ 200 `{ booking_id, final_price }`. Запись в `audit_log` (`booking.created`).
3. **`GET /api/boxes/occupied`** (новый): массив `box_id`, занятых сейчас по тем же правилам (без дат и персональных данных). Публичный, только чтение через service role.
4. **`app/booking/page.tsx`**:
   - Insert заменяется на `fetch("/api/bookings/create")`. На 409 — понятное сообщение и возврат на шаг выбора ячейки.
   - Цены для показа считаются через `lib/booking-pricing.ts`.
   - Занятые ячейки из `/api/boxes/occupied` не показываются в выборе, а предвыбранная из URL `?box=` занятая ячейка не выбирается.
   - В `/api/payments/create` отправляется только `booking_id`.
   - UI и шаги визуально не меняются.
5. **`POST /api/payments/create`**: сумма = `booking.final_price`, описание строится на сервере из ячейки и срока. `amount` и `description` в body больше не нужны: если `amount` передан и не совпадает, остаётся 400 (защита от устаревшей вкладки). Insert в `payments` через service role.
6. **`POST /api/bookings/extend`**: insert в `payments` через service role. Логика не меняется.
7. **`POST /api/bookings/sign`** и **`POST /api/bookings/cancel`**: проверки владельца и статуса пользовательским клиентом остаются, сам update — через service role с `.eq("id", …).eq("user_id", user.id)`.
8. **Миграция `scripts/007_server_only_writes.sql`**: `DROP POLICY IF EXISTS` для шести политик из §1 и Storage `documents_insert_own`. SELECT-политики и админские `admin_all_*` не трогаются. В шапке файла: применять **после** деплоя кода и SQL отката (пересоздание политик).
9. **Документация**: `hub/API_CONTRACT.md` (новые эндпоинты, изменения `payments/create`, §5 прямые записи), `hub/PROGRESS.md`, урок в `hub/playbook/LESSONS.md` уже есть.

**Миграция:** да, `scripts/007_server_only_writes.sql`. Идемпотентная, применяется **после** деплоя кода.
**Env:** без изменений (оператор подтверждает, что `SUPABASE_SERVICE_ROLE_KEY` есть на Vercel для Production и Preview).
**API:** новые `POST /api/bookings/create`, `GET /api/boxes/occupied`; `POST /api/payments/create` больше не требует `amount` и `description`.

## 3. НЕ трогать

- Webhook ЮKassa (`app/api/payments/webhook/route.ts`): логика активации, продления, договора
- Регистрация гостя на шаге бронирования (`supabase.auth.signUp`), авторизация и сессии (`lib/supabase/*`, `middleware.ts`)
- Обновление профиля из браузера (`profiles`)
- Админские эндпоинты и страницы, их подсчёт занятости
- Калькулятор на лендинге (`components/calculator.tsx`): свою таблицу скидок оставляем, она совпадает
- Текст договора и `CONTRACT_VERSION`
- Вёрстка шагов бронирования

## 4. Стоп-сигналы

- Сумма, скидка, статус, даты или `access_code` берутся из тела запроса или считаются в браузере для записи
- Service role клиент импортируется в модуль с `"use client"` или попадает в браузерный бандл
- Удаление SELECT-политик или `admin_all_*`
- Миграция без `IF EXISTS` или с правкой старых `scripts/00N`
- Изменение webhook-а или логики активации
- `/api/boxes/occupied` отдаёт что-то кроме `box_id`

## 5. Критерии готовности

- [ ] Бронь создаётся только через `/api/bookings/create`; цена совпадает с `boxes.price_month × months` со скидкой 0/5/10 %
- [ ] Подмена `months` на 2, `start_date` в прошлом, чужой или несуществующий `box_id` → 400 / 404
- [ ] Вторая бронь той же ячейки на пересекающиеся даты, пока первая `pending` < 30 мин или `active` → 409; через 30 мин после брошенной `pending` → проходит
- [ ] Занятая ячейка не видна в выборе на `/booking`
- [ ] `/api/payments/create` создаёт платёж на `final_price` из БД, игнорируя `description` клиента; `amount`, отличный от брони → 400
- [ ] `sign`, `cancel`, `extend` работают как раньше (ответы по `API_CONTRACT.md`)
- [ ] После миграции 007: прямой `insert`/`update` в `bookings`, `payments`, `documents` и upload в бакет `documents` с anon-ключом и сессией пользователя отклоняются RLS (проверка в SQL Editor и из консоли браузера на Preview)
- [ ] Регрессия: полный сценарий брони до страницы ЮKassa; логин держится после переходов; кабинет показывает брони, платежи, документы
- [ ] `npx tsc --noEmit` и `npm run build` зелёные
- [ ] `hub/API_CONTRACT.md` обновлён

## 6. Крайние случаи

- Двойной клик «Оплатить»: вторая бронь той же ячейки тем же пользователем получит 409. Сообщение не должно пугать: «Бронь уже создаётся».
- Гонка двух клиентов в одну секунду: простая проверка не атомарна, обе брони могут пройти. Принимаем как ограничение (вероятность мала), фиксируем в рисках. Защита на уровне БД (exclusion constraint) — отдельная задача, если понадобится.
- Брошенная `pending`-бронь старше 30 минут, оплаченная позже: обе брони могут стать `active`. В рисках; варианты — срок жизни платежа ЮKassa или проверка в webhook (отдельная задача).
- Гость с подтверждением email: после `signUp` сессии нет → 401 на `/api/bookings/create`, как и сейчас insert падал на RLS. Показать понятное сообщение «Подтвердите email и войдите».
- `start_date` «сегодня» при разнице часовых поясов браузера и сервера: сравнение по московской дате.
- Нет `SUPABASE_SERVICE_ROLE_KEY`: 503 с понятным сообщением, а не 500.

## 7. Оператору вне кода

- Подтвердить, что `SUPABASE_SERVICE_ROLE_KEY` задан на Vercel для Production и Preview.
- Ответить на «Блокеры» #2: Preview смотрит в прод-Supabase? Если да, смоук на Preview создаёт настоящие брони — отменить их после проверки.
- После деплоя кода применить `scripts/007_server_only_writes.sql` в SQL Editor и выполнить проверочный запрос из блока деплоя.

---

## Отчёт о проверке (2026-10-29)

**Ветка / SHA:** `fix/sec-booking-price` / `1c78ce6` · **Статус:** код и сборка ✅, запросы к БД ⚠️ (локальный Supabase из `.env.local` не резолвится в DNS — проверка на Preview)

### Изменённые файлы

| Файл | Что сделано |
|---|---|
| `lib/booking-pricing.ts` (новый) | Сроки 1/3/6/12, скидка, цена, дата окончания (UTC), «сегодня по Москве» |
| `lib/booking-availability.ts` (новый) | Проверка конфликта брони и список занятых ячеек (active / pending < 30 мин) |
| `app/api/bookings/create/route.ts` (новый) | Создание брони на сервере: zod, даты, обслуживание, занятость (409), цена из `boxes`, `crypto.randomInt`, insert через service role, `audit_log` |
| `app/api/boxes/occupied/route.ts` (новый) | `{ box_ids }` без дат и персональных данных, `no-store` |
| `app/booking/page.tsx` | Insert заменён на `/api/bookings/create`; занятые ячейки скрыты; 409 → возврат к выбору; цена для показа из общего хелпера; в `payments/create` уходит только `booking_id`; `months` из URL валидируется |
| `app/api/payments/create/route.ts` | Сумма и описание из БД, `amount` необязателен (сверяется, если передан), insert через service role (создаётся до вызова ЮKassa) |
| `app/api/bookings/extend/route.ts` | Insert платежа через service role |
| `app/api/bookings/sign/route.ts` | Update через service role с `user_id` и `status = pending` в условии |
| `app/api/bookings/cancel/route.ts` | Update через service role с `user_id` и статусом в условии |
| `scripts/007_server_only_writes.sql` (новый) | DROP 6 политик записи + Storage `documents_insert_own`, проверка и откат в комментариях |
| `hub/API_CONTRACT.md` | Новые эндпоинты, изменения `payments/create`, §5 |

### Проверки (вывод, не пересказ)

```text
$ npx tsc --noEmit
tsc exit 0

$ npm run build
… ├ ƒ /api/bookings/create … ├ ƒ /api/boxes/occupied …   (сборка без ошибок)

$ grep -rlE "SUPABASE_SERVICE_ROLE_KEY|booking-availability|findBoxConflict|listOccupiedBoxIds" .next/static
(пусто — серверный код не попал в клиентский бандл)

Сверка новых формул со старыми браузерными (node, TZ=Europe/Moscow и TZ=UTC):
цены p=1…30000 × {1,3,6,12}, даты окончания 800 дней × {1,3,6,12}
TZ Europe/Moscow mismatches: 0
TZ UTC mismatches: 0

curl localhost:3000 (без сессии):
POST /api/bookings/create      -> 401 {"error":"Войдите в аккаунт или подтвердите email, чтобы оформить бронь"}
POST /api/payments/create      -> 401
POST /api/bookings/sign|cancel|extend -> 401
GET  /api/boxes/occupied       -> 500 {"error":"Failed to load occupancy"}  (TypeError: fetch failed — хост Supabase из .env.local не резолвится)
GET  /booking, /               -> 200
```

### Слои VERIFY.md

| Слой | Как проверил | Результат |
|---|---|---|
| Код | `git diff` целиком, новые файлы прочитаны; сверка со скоупом, «НЕ трогать», стоп-сигналами | ✅ webhook, auth, профиль, админка, калькулятор не тронуты |
| Типы и сборка | `tsc --noEmit`, `npm run build`, grep по `.next/static` | ✅ |
| API | curl без сессии | ✅ 401 везде; ⚠️ 400/404/409/200 с сессией не проверены — нет доступной БД |
| Живой UI | `/booking` на 375px: рендер, скролл (`scrollWidth = clientWidth = 375`), консоль | ✅ рендер; ⚠️ сценарий до ЮKassa не пройден — нет БД |
| Данные и безопасность | Формулы цены и дат сверены со старыми; service role только в серверных модулях | ✅ расчёты; ⚠️ RLS после 007 проверяется на Preview |

### Критерии

| Критерий из §5 | Как проверил | Статус |
|---|---|---|
| Бронь только через `/api/bookings/create`, цена = `price_month × months` со скидкой | Код + сверка формул | ✅ код / ⚠️ живой вызов — Preview |
| Подмена `months`, прошлая дата, чужой/несуществующий `box_id` → 400/404 | zod + проверки в коде | ⚠️ Preview |
| Повторная бронь занятой ячейки → 409 | Код `findBoxConflict` | ⚠️ Preview |
| Занятая ячейка не видна в выборе | Код + обработка сбоя загрузки на странице | ⚠️ Preview |
| `payments/create` на `final_price` из БД, `amount` ≠ → 400 | Код | ⚠️ Preview |
| `sign`, `cancel`, `extend` как раньше | Код, 401 без сессии | ⚠️ Preview |
| После 007 прямые записи клиента отклоняются RLS | SQL готов | ⚠️ оператор + Preview |
| Регрессия: бронь до ЮKassa, логин, кабинет | — | ⚠️ Preview |
| `tsc` и `build` зелёные | Вывод выше | ✅ |
| `API_CONTRACT.md` обновлён | Файл | ✅ |

### Отклонения от плана, риски, follow-up

- **Отклонение:** своя неоплаченная бронь пользователя не блокирует ему ту же ячейку (в плане §6 было 409 на двойной клик). Иначе клиент, вернувшийся со страницы ЮKassa, 30 минут не может повторить оплату своей ячейки. Двойной клик и так закрыт флагом `submitting`. Риск: у одного клиента могут остаться две `pending`-брони одной ячейки, оплатить он может обе — маловероятно.
- **Риск (принят в плане):** проверка занятости не атомарна; брошенная `pending`-бронь старше 30 минут, оплаченная позже, может дать две `active`-брони одной ячейки. Follow-up: проверка занятости в webhook или exclusion constraint в БД.
- **Найдено:** `.env.local` указывает на Supabase-проект, хост которого не резолвится (проект на паузе или удалён). Локальная разработка с БД сейчас невозможна.
- **Найдено:** на Next.js 16 `middleware.ts` помечен как deprecated (надо переименовать в `proxy`), в скоуп не входит.

### Деплой

См. блок DEP-001 ниже. Порядок: **код → Preview-смоук → merge → миграция 007 → проверка RLS**.

#### DEP-001: брони, платежи и документы пишет только сервер

**Ветка / целевой SHA:** `fix/sec-booking-price` `1c78ce6` (+ коммит журнала)
**Preview:** `https://v0-self-storage-cnnsxuoce-ig9573407-6185s-projects.vercel.app` (Vercel success)
**Миграции:** `scripts/007_server_only_writes.sql`, применять **после** деплоя кода в прод
**Env на Vercel:** без изменений; убедиться, что `SUPABASE_SERVICE_ROLE_KEY` есть для Production и Preview
**Preview gate:** нужен (деньги + RLS)

1. Push ветки → Vercel Preview. Смоук на Preview (если Preview смотрит в прод-БД, созданные брони потом отменить):
   - [ ] `/booking`: выбрать ячейку, 1 мес., дойти до страницы ЮKassa; сумма на ЮKassa = цена ячейки
   - [ ] то же на 3 мес. — скидка 5 %, сумма совпадает с «Итого»
   - [ ] из второго аккаунта: та же ячейка не видна в выборе; прямой `POST /api/bookings/create` на неё → 409
   - [ ] логин держится после 2–3 переходов; кабинет показывает брони и платежи
2. Merge и push в прод:

```bash
cd "/Users/vasilii/Desktop/code /pelikan-storage"
git fetch origin
git switch main
git pull --ff-only origin main
git merge --no-ff fix/sec-booking-price
git log -1 --oneline
git push origin main
```

3. Когда деплой Ready — Supabase SQL Editor: вставить `scripts/007_server_only_writes.sql` целиком → Run. Проверка (0 строк):

```sql
SELECT tablename, policyname FROM pg_policies
WHERE policyname IN ('bookings_insert_own','bookings_update_own','payments_insert_own',
  'payments_update_own','documents_insert_own','documents_update_own');
```

4. Смоук после миграции:
   - [ ] бронь до ЮKassa проходит как в п.1
   - [ ] из консоли браузера под клиентом `supabase.from("bookings").update({ status: "active" }).eq("id", "<своя бронь>")` → ошибка RLS или 0 строк

**Если что-то пошло не так:** до миграции — Instant Rollback на Vercel; после миграции и отката кода — SQL отката из комментария в `007`, затем `hub/templates/INCIDENT.md`.
