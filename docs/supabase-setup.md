# Настройка Supabase для ПЕЛИКАН (пошагово)

Этот документ описывает всё, что нужно сделать в [Supabase](https://supabase.com) и в локальном `.env.local`, чтобы сайт, личный кабинет, оплата и админ-панель работали.

---

## 1. Проект в Supabase

1. Зайдите на [https://supabase.com](https://supabase.com) и войдите в аккаунт.
2. Нажмите **New project** (или откройте уже созданный проект).
3. Укажите **имя**, **пароль базы данных** (сохраните его — он нужен для прямого подключения к Postgres, приложению Next.js он не обязателен), **регион**.
4. Дождитесь статуса проекта **Healthy** (обычно 1–2 минуты).

Дальше все шаги выполняются **внутри этого проекта** в Dashboard.

---

## 2. Ключи API и URL (для `.env.local`)

1. В левом меню: **Project Settings** (шестерёнка) → **API**.
2. Скопируйте:
   - **Project URL** — строка вида `https://xxxxxxxxxxxx.supabase.co`  
     **Важно:** копируйте **только это**, без `/rest/v1/` и без других путей. Если вставить URL из PostgREST или из сторонней документа с хвостом `/rest/v1/`, авторизация и скрипты будут падать с ошибками вроде `Invalid path specified in request URL`.
   - **anon public** — длинный ключ `eyJ...` (публичный, используется в браузере).
   - **service_role** — секретный ключ `eyJ...` (**никогда** не вставляйте его в фронтенд и не коммитьте в git). Нужен для серверных API (вебхук ЮKassa, `audit_log`, скрипт `create-dev-admin`).

3. В корне репозитория в файле **`.env.local`** (создайте из `.env.example`, если его нет) укажите:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...anon...
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
```

После любого изменения `.env.local` перезапустите `npm run dev`.

---

## 3. SQL: схема базы и данные (обязательно по порядку)

Все готовые скрипты лежат в папке [`scripts/`](../scripts/). Их нужно выполнять в **SQL Editor** Supabase.

### Как открыть SQL Editor

1. В левом меню: **SQL Editor**.
2. **New query**.
3. Вставьте **весь** текст файла скрипта, нажмите **Run** (или Ctrl/Cmd + Enter).
4. Убедитесь, что внизу нет красной ошибки; при успехе будет сообщение об успешном выполнении.

### Порядок выполнения

| № | Файл | Зачем |
|---|------|--------|
| 1 | [`001_create_tables.sql`](../scripts/001_create_tables.sql) | Таблицы `boxes`, `profiles`, `bookings`, `payments`, `documents`, `reviews`, `audit_log`, RLS-политики, триггеры (в т.ч. создание строки в `profiles` при регистрации). **Без этого шага приложение не сможет работать с данными.** |
| 2 | [`002_seed_data.sql`](../scripts/002_seed_data.sql) | Очищает старые строки в `documents` / `payments` / `bookings` / `boxes` и заново создаёт **53 ячейки** и тестовые отзывы. Нужен для калькулятора и бронирования. **Не запускайте на продакшене с реальными данными** — скрипт удаляет брони и платежи. |
| 3 | [`003_dashboard_extras.sql`](../scripts/003_dashboard_extras.sql) | Колонка `profiles.avatar_url`, бакеты Storage `avatars` и `documents`, политики доступа к файлам. Нужен для аватаров в профиле и раздела документов. |
| 4 | [`004_admin_units_maintenance.sql`](../scripts/004_admin_units_maintenance.sql) | Колонка `boxes.in_maintenance` для админки («ячейка на обслуживании»). Если колонка уже есть в свежей установке из `001`, скрипт безопасен (`IF NOT EXISTS`). |

**Минимум для первого запуска:** обязательно **001**; для полноценного UI бронирования — **001 + 002**; для кабинета с аватарами — ещё **003**; для админки с обслуживанием ячеек — **004**.

### Проверка после SQL

1. **Table Editor** → убедитесь, что есть таблицы `profiles`, `bookings`, `boxes`, `payments` и т.д.
2. После **002** в `boxes` должно быть **53** строки.

---

## 4. Authentication (вход и регистрация)

1. В меню: **Authentication** → **URL Configuration**.
2. **Site URL** для локальной разработки можно оставить `http://localhost:3000` или указать ваш продакшен-URL.
3. **Redirect URLs** — добавьте строки (каждая с новой строки или через запятую, как принято в UI):
   - `http://localhost:3000/**`
   - `http://localhost:3000/auth/callback`  
   Для продакшена добавьте `https://ваш-домен/**` и `https://ваш-домен/auth/callback`.

Без этого подтверждение email и OAuth-редиректы могут не сработать.

---

## 5. Storage (хранилище файлов)

Бакеты **`avatars`** и **`documents`** создаются скриптом **003**. Дополнительно в UI ничего создавать не обязательно.

Проверка: **Storage** → должны быть бакеты `avatars` (public) и `documents` (private).

---

## 6. Администратор сайта

Роль админа хранится в **`profiles.role`** (`'admin'`).

**Вариант A (рекомендуется для разработки):** после заполнения `.env.local` и выполнения **001** (и желательно остальных SQL):

```bash
npm run create-dev-admin
```

По умолчанию создаётся пользователь с email и паролем из [README](../README.md) (раздел «Админ-панель»); при необходимости задайте `DEV_ADMIN_EMAIL` и `DEV_ADMIN_PASSWORD`.

**Вариант B:** зарегистрируйтесь через `/auth/signup`, возьмите UUID пользователя в **Authentication → Users**, затем в **SQL Editor**:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'вставьте-uuid-пользователя';
```

Вход: тот же email/пароль, затем откройте **`/admin`**.

---

## 7. ЮKassa (оплата) — кратко

Это не настройка самого Supabase, но связано с env:

- В `.env.local`: `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`, `NEXT_PUBLIC_APP_URL`.
- В личном кабинете ЮKassa укажите URL вебхука:  
  `{NEXT_PUBLIC_APP_URL}/api/payments/webhook`  
  На localhost ЮKassa часто не достучится — для тестов оплаты нужен туннель (ngrok и т.п.) или стейджинг с HTTPS.

---

## 8. Типичные проблемы

| Симптом | Что проверить |
|--------|----------------|
| `Invalid path` / ошибки Auth при `npm run create-dev-admin` или в middleware | `NEXT_PUBLIC_SUPABASE_URL` без `/rest/v1/`, только `https://xxx.supabase.co`. |
| `Could not find the table 'public.profiles'` | Не выполнен **`001_create_tables.sql`** или выполнен с ошибкой. |
| Пустой список ячеек на сайте | Не выполнен **`002_seed_data.sql`** или RLS мешает (для `boxes` политика публичного чтения есть в 001). |
| Не грузится аватар | Выполнен ли **`003`**, есть ли бакет `avatars`. |
| Вход есть, `/admin` редиректит на `/` | У пользователя `profiles.role` не `'admin'`. |
| Ошибка при оплате | Переменные ЮKassa, `NEXT_PUBLIC_APP_URL`, вебхук. |

---

## 9. Чеклист перед первым запуском приложения

- [ ] Проект Supabase создан и активен.
- [ ] В `.env.local` указаны корректные **URL** (без `/rest/v1/`), **anon** и **service_role** ключи.
- [ ] Выполнены SQL **001** → **002** (при необходимости) → **003** → **004**.
- [ ] В **Authentication → URL Configuration** добавлены redirect URL для localhost (и продакшена).
- [ ] Создан админ (`npm run create-dev-admin` или `UPDATE profiles`).
- [ ] `npm run dev`, открыт `http://localhost:3000`.

Если что-то из списка пропущено, поведение сайта будет частичным или с ошибками — ориентируйтесь на таблицу в разделе 8.
