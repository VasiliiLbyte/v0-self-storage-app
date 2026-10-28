# Pelikan Storage: контракт API

Route handlers в `app/api/**/route.ts` и `app/auth/**/route.ts`. Клиенты: браузер
(бронирование, кабинет, админка) и ЮKassa (webhook). Кто меняет эндпоинт, обновляет этот файл
в том же коммите. Перед новым вызовом с клиента сначала читается этот файл.

**Base URL:** prod `<прод-URL>` · local `http://localhost:3000`
**Auth:** cookie-сессия Supabase (`@supabase/ssr`). `user` = залогинен, `admin` = `profiles.role = 'admin'`
(`lib/admin/auth.ts` → `requireAdmin()`: 401 без сессии, 403 без роли).
**Формат ошибок:** `{ "error": string }` (у админских PATCH при ошибке zod `error` = `flatten()`).
**Деньги:** суммы в рублях, целые (`integer`). В ЮKassa уходят строкой `"1234.00"` (`formatRublesForYooKassa`).

---

## 1. Бронирование и оплата (user)

### `POST /api/bookings/create`
Создаёт бронь в статусе `pending`. Цену, скидку, даты и код доступа считает сервер.

| | |
|---|---|
| Body | `{ box_id: uuid, months: 1\|3\|6\|12, start_date: "YYYY-MM-DD" }` |
| Проверки | `start_date` от сегодняшней даты по Москве до +365 дней; ячейка существует и не на обслуживании; ячейка свободна: нет `active`-брони с пересечением `[start_date, end_date)` и чужой `pending`-брони моложе 30 минут |
| Расчёт | `base_price = price_month × months`, скидка 5 % от 3 мес., 10 % от 6 мес., `final_price` округляется до рубля (`lib/booking-pricing.ts`) |
| 200 | `{ booking_id: uuid, final_price: number }`, запись в `audit_log` (`booking.created`) |
| Ошибки | 400 (zod `flatten()` или текст про дату / обслуживание), 401 (нет сессии, в т.ч. гость до подтверждения email), 404, 409 (ячейка занята), 500, 503 (нет service role) |

### `POST /api/bookings/sign`
Фиксирует подписание договора-оферты для брони в статусе `pending`.

| | |
|---|---|
| Body | `{ booking_id: string, consent_marketing: boolean, user_agent: string }` |
| 200 | `{ ok: true }`. Пишет в `bookings` (service role) время, IP, UA, версию договора; запись в `audit_log` |
| Ошибки | 400 (валидация, `Booking is not pending`), 401, 403 (чужая бронь), 404, 500, 503 |

### `POST /api/payments/create`
Создаёт платёж ЮKassa за первичную бронь.

| | |
|---|---|
| Body | `{ booking_id: string, amount?: number }` |
| Проверки | бронь своя, `status = 'pending'`, ячейка не на обслуживании; если передан `amount`, он должен совпасть с `bookings.final_price` |
| Сумма / описание | сумма = `bookings.final_price`, описание `Аренда <ячейка> (<N> мес.)` — оба с сервера |
| 200 | `{ confirmation_url: string }`. Строка в `payments` (service role) со статусом `pending`, `return_url` = `/booking/success?payment_id=<uuid>` |
| Ошибки | 400, 401, 403, 404, 500, 502 (ЮKassa), 503 (нет env ЮKassa или service role) |

### `POST /api/bookings/extend`
Платёж за продление активной аренды на 1 месяц.

| | |
|---|---|
| Body | `{ booking_id: string }` |
| Проверки | бронь своя, `status = 'active'`; сумма = `boxes.price_month` (считается на сервере) |
| 200 | `{ confirmation_url: string }`. В `payments` строка `pending` (service role), в metadata ЮKassa `kind: "extension"` |
| Ошибки | 400, 401, 403, 404, 500, 502, 503 |

### `POST /api/bookings/cancel`

| | |
|---|---|
| Body | `{ booking_id: string }` |
| Проверки | бронь своя, статус `pending` или `active` |
| 200 | `{ ok: true }`, `status → 'cancelled'` (service role) |
| Ошибки | 400, 401, 403, 404, 500, 503 |

### `GET /api/boxes/occupied`
Публичный. 200 `{ box_ids: uuid[] }`: ячейки с `active`-бронью, которая ещё не закончилась,
или с `pending`-бронью моложе 30 минут. Ни дат, ни данных клиентов. `Cache-Control: no-store`.
Ошибки 500, 503.

## 2. Webhook ЮKassa

### `POST /api/payments/webhook`

| | |
|---|---|
| Auth | IP отправителя в списке ЮKassa (`lib/yookassa-ip.ts`), иначе 403 |
| Body | уведомление ЮKassa: `{ type: "notification", event, object: { id, status, metadata } }` |
| `payment.succeeded` | `payments.status → succeeded` (идемпотентно). `kind = "extension"`: `end_date + 1 мес`, `months + 1`, `final_price + amount`. Иначе бронь `active`, генерация PDF договора в Storage `documents` и строка в `documents` |
| `payment.canceled` / `payment.cancelled` | платёж `cancelled` |
| Ответ | всегда 200 после прохождения IP-фильтра и парсинга (чтобы ЮKassa не ретраила), 400 на невалидный JSON |

## 3. Аккаунт (user)

### `POST /api/account/delete`
Удаляет пользователя через service role. 200 `{ ok: true }`, 401, 500, 503 (нет service role key).

### `GET /auth/callback`
Обмен кода Supabase на сессию, редирект.

### `POST /auth/logout`
Выход и 303 на `/auth/login`. **Только POST**: GET-ссылку Next.js мог предзагрузить и разлогинить пользователя.

## 4. Админка (admin)

### `PATCH /api/admin/bookings/[id]`

| Body (`action`) | Эффект | 200 |
|---|---|---|
| `{ action: "set_status", status: "pending"\|"active"\|"completed"\|"cancelled" }` | смена статуса | `{ ok: true }` |
| `{ action: "extend_month" }` | `end_date + 1 мес` без оплаты | `{ ok: true, end_date }` |
| `{ action: "reassign_box", box_id: uuid }` | перенос на другую ячейку (не та же, не на обслуживании) | `{ ok: true, box_id }` |

Ошибки: 400 (`Invalid id`, zod, бизнес-проверки), 401, 403, 404, 500.

### `PATCH /api/admin/boxes/[id]`
Body: `{ price_month?: int (1…10 000 000), in_maintenance?: boolean }`, хотя бы одно поле.
200 `{ ok: true }`. Ошибки 400, 401, 403, 500.

### `PATCH /api/admin/profiles/[id]`
Body: `{ notes: string (≤ 5000) }`. 200 `{ ok: true }`.

### `POST /api/payments/refund`
Ручной полный возврат в ЮKassa.

| | |
|---|---|
| Body | `{ payment_id: uuid }` (id строки `payments`) |
| Проверки | платёж `succeeded`, есть `yookassa_payment_id` |
| 200 | `{ ok: true, refund_id, status }`, `payments.status → refunded`, запись в `audit_log` |
| Ошибки | 400, 401, 403, 404, 500 (возврат прошёл, а БД не обновилась), 502, 503 |

## 5. Прямые запросы к Supabase из браузера

Часть записи идёт мимо API: через anon-ключ и RLS. Это тоже контракт, и защищает его только RLS.
В `bookings`, `payments`, `documents` и Storage `documents` клиент не пишет: после
`scripts/007_server_only_writes.sql` у него нет политик INSERT/UPDATE, пишет только сервер.

| Где | Таблица | Операция |
|---|---|---|
| `app/booking/page.tsx`, `components/dashboard-profile-form.tsx` | `profiles` | UPDATE / upsert своего профиля (`role`, `verified`, `notes` защищены триггером `profiles_protect_privileged`) |
| `components/dashboard-profile-form.tsx` | Storage `avatars` | upload аватара |

---

## Changelog

| Дата | Раздел | Изменение | Задача |
|---|---|---|---|
| 2026-10-29 | §1, §5 | Новые `POST /api/bookings/create`, `GET /api/boxes/occupied`; `payments/create` берёт сумму и описание из БД, `amount` необязателен; клиент больше не пишет в bookings/payments/documents | SEC-BOOKING-PRICE |
| 2026-10-29 | все | Контракт описан по текущему коду | старт |
