# v0-self-storage-app

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_nyigcvxhzP8KQv4mQxscuTxXf2w5)

## Environment variables

**Подробная пошаговая настройка Supabase (SQL, Auth, Storage, ключи):** [docs/supabase-setup.md](docs/supabase-setup.md)

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project.
- `SUPABASE_SERVICE_ROLE_KEY` — **server only** (Route Handlers for YooKassa webhook and `audit_log`). Never expose in the browser.
- `NEXT_PUBLIC_APP_URL` — public site base URL with no trailing slash (used as YooKassa `return_url`, e.g. `http://localhost:3000` or your production URL).
- `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY` — [YooKassa](https://yookassa.ru/) shop credentials for API v3 (Basic Auth).

In the YooKassa merchant UI, set the HTTP notification URL to:

`{NEXT_PUBLIC_APP_URL}/api/payments/webhook`

Use HTTPS in production (required by YooKassa for webhooks). Subscribe to payment events such as **payment.succeeded** and **payment.canceled**.

## Личный кабинет (`/dashboard`)

Многостраничный кабинет с общим [`app/dashboard/layout.tsx`](app/dashboard/layout.tsx) и навигацией [`components/dashboard-nav.tsx`](components/dashboard-nav.tsx) (боковое меню на desktop, нижняя панель на mobile).

| Маршрут | Назначение |
|--------|------------|
| `/dashboard` | Обзор, быстрые ссылки, краткая сводка |
| `/dashboard/bookings` | Аренды: продление (+1 мес., оплата ЮKassa), отмена |
| `/dashboard/payments` | История платежей |
| `/dashboard/documents` | Договоры и акты (ссылки из таблицы `documents`) |
| `/dashboard/profile` | Профиль, аватар (Storage), смена пароля, удаление аккаунта |
| `/dashboard/access` | Коды доступа к активным ячейкам |

Для аватаров и политик Storage на существующем проекте выполните [`scripts/003_dashboard_extras.sql`](scripts/003_dashboard_extras.sql) (в свежей установке колонка `profiles.avatar_url` уже есть в [`scripts/001_create_tables.sql`](scripts/001_create_tables.sql)).

## Админ-панель (`/admin`)

Доступ только при `profiles.role = 'admin'` (проверка в [`lib/supabase/proxy.ts`](lib/supabase/proxy.ts) и в [`app/admin/layout.tsx`](app/admin/layout.tsx)). Неавторизованные и пользователи без роли admin перенаправляются на `/`.

| Маршрут | Назначение |
|--------|------------|
| `/admin` | KPI, графики выручки и занятости |
| `/admin/units` | Ячейки: цена, обслуживание |
| `/admin/bookings` | Все бронирования, фильтры, карточка |
| `/admin/clients` | Клиенты и заметки |
| `/admin/payments` | Платежи, ручной возврат (ЮKassa) |
| `/admin/analytics` | Аналитика |
| `/admin/settings` | Справка и env (без секретов) |

**Локальный админ (удобно для разработки):** в `.env.local` должны быть `SUPABASE_SERVICE_ROLE_KEY` и URL проекта. Затем:

```bash
npm run create-dev-admin
```

По умолчанию создаётся пользователь **admin@pelikan.local** с паролем **PelikanAdmin!Dev2026** (или берётся `DEV_ADMIN_EMAIL` / `DEV_ADMIN_PASSWORD` из окружения или из `.env.local`). Если пользователь с таким email уже есть, скрипт только выставит `role = 'admin'`. После входа смените пароль; **не используйте эти креды в продакшене.**

Вручную в Supabase (SQL): `UPDATE public.profiles SET role = 'admin' WHERE id = '<uuid пользователя>';`

На уже развёрнутой БД добавьте колонку обслуживания ячеек: [`scripts/004_admin_units_maintenance.sql`](scripts/004_admin_units_maintenance.sql).

Ручной возврат в ЮKassa (только для admin, см. [`app/api/payments/refund/route.ts`](app/api/payments/refund/route.ts)): `POST /api/payments/refund` с JSON `{ "payment_id": "<uuid строки payments>" }` для успешного платежа.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

<a href="https://v0.app/chat/api/kiro/clone/VasiliiLbyte/v0-self-storage-app" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
