# Pelikan Storage: рамка проекта

Якорь для каждой сессии. Меняется только при смене архитектуры, окружений или стека.
Всё в `<угловых скобках>` пока не известно и заполняется оператором.

## 1. Что строим

Сайт self-storage «Пеликан»: клиент выбирает ячейку на плане (53 ячейки XS/S/M/L),
подписывает договор-оферту простой электронной подписью, оплачивает через ЮKassa и получает
код доступа. В личном кабинете он продлевает и отменяет аренду, видит платежи и документы.
Админ управляет ячейками, бронями, клиентами, платежами и возвратами.

**Оператор:** Василий (VasiliiLbyte). Задаёт приоритеты, говорит «go», мержит и пушит в `main`,
применяет SQL в Supabase, меняет env на Vercel и настройки ЮKassa.
**Агент:** Claude Code, пишет код и сам проверяет его (D-001).

## 2. Репозиторий

| Репо | Локальный путь | Remote | Рабочая ветка | Порт |
|---|---|---|---|---|
| `pelikan-storage` | `"/Users/vasilii/Desktop/code /pelikan-storage"` | `https://github.com/VasiliiLbyte/v0-self-storage-app.git` | `main` | 3000 |

> В пути есть пробел (`code /`), путь всегда в кавычках.
> Ветку `origin/v0/*` создавал v0, она не рабочая. В v0 изменения больше не вносятся.

Память проекта: `hub/` в этом же репо (D-001).

## 3. Окружения

| Окружение | URL | Что проверять | Что там крутится | Кто деплоит |
|---|---|---|---|---|
| prod | `<https://… — заполнить>` | `/` 200, `/storage-units` 200 | Vercel, `main` @ последний Ready-деплой | push в `main` (оператор) |
| preview | `https://<ветка>-….vercel.app` | смоук задачи | Vercel Preview на каждую ветку | push ветки |
| local | `http://localhost:3000` | — | `npm run dev` | — |

- Vercel: `installCommand: npm ci`, `buildCommand: npm run build` ([`vercel.json`](../vercel.json)).
- Supabase: один проект `<prod или отдельный для preview? — уточнить>`.
- ЮKassa: webhook `{NEXT_PUBLIC_APP_URL}/api/payments/webhook`. Тестовый магазин для preview: `<есть / нет>`.
- Локально `NEXT_PUBLIC_APP_URL` указывает на ngrok-туннель, чтобы ЮKassa доставала webhook.

Раннбук: [`DEPLOY.md`](DEPLOY.md).

## 4. Стек

| Слой | Что | Особенности |
|---|---|---|
| Фреймворк | Next.js 16.2 App Router, React 19, TypeScript 5.7 | `next.config.mjs`: `typescript.ignoreBuildErrors: true`, поэтому build не ловит ошибки типов, их ловит только `tsc` |
| UI | Tailwind 4, shadcn/ui (`components/ui/*`), Radix, framer-motion | `components/ui/*` сгенерированы shadcn, руками правятся только осознанно |
| Данные | Supabase Postgres + RLS, Auth, Storage (`avatars`, `documents`) | Миграции: `scripts/NNN_*.sql`, оператор применяет вручную в SQL Editor, следующая `007` |
| Платежи | ЮKassa API v3 (`lib/yookassa-client.ts`) | Webhook проверяет IP ЮKassa (`lib/yookassa-ip.ts`) |
| Документы | `@react-pdf/renderer`, шрифты PT Sans | Договор в PDF создаётся в webhook после оплаты, версия в `CONTRACT_VERSION` |
| Юр. тексты | `content/legal/*.html` из `.docx` | Сгенерированы `npm run build:legal`. HTML руками не правится |
| Тесты | **нет** | См. «Следующее» в PROGRESS |
| Линтер | **не работает**: `npm run lint` вызывает `eslint`, но его нет в зависимостях и нет конфига | См. «Следующее» в PROGRESS |

Клиенты Supabase:
- `lib/supabase/server.ts`: server components и route handlers (cookie-сессия пользователя)
- `lib/supabase/client.ts`: браузер, singleton, `autoRefreshToken: false` (токен обновляет только middleware)
- `lib/supabase/admin.ts`: service role, **только сервер**, обходит RLS
- `lib/supabase/proxy.ts`: обновление сессии в middleware и проверка роли admin для `/admin`

## 5. Команды проверки

| Что | Команда | Примечание |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | Обязательно: build типы не проверяет |
| Сборка | `npm run build` | Нужен `.env.local` с переменными Supabase |
| Линт | — | Не настроен |
| Тесты | — | Нет |
| Локальный запуск | `npm run dev` | http://localhost:3000 |
| Юр. тексты | `npm run build:legal` | Только когда меняется `.docx` |

## 6. Источники правды

| Что | Где правда | Где НЕ правда |
|---|---|---|
| Схема БД, RLS, политики Storage | `scripts/001…NNN_*.sql` + фактическое состояние Supabase | типы в коде, отрисованный UI |
| Ячейки, цены, доступность | таблица `boxes` | калькулятор и каталог на сайте, `002_seed_data.sql` после правок в админке |
| Сумма к оплате | `boxes.price_month` и правила скидок на сервере | `final_price`, пришедший из браузера |
| Статус оплаты | webhook ЮKassa → `payments.status` | `return_url`, страница `/booking/success` |
| Контракт API | [`API_CONTRACT.md`](API_CONTRACT.md) + `app/api/**/route.ts` | память агента |
| Что стоит на проде | Vercel: последний Ready-деплой `main` и его SHA | `PROGRESS.md` без evidence |
| Env прода | Vercel → Project Settings → Environment Variables (видит только оператор) | `.env.example`, `.env.local` |
| Текст договора | `lib/contract/contract-content.ts` + `content/legal/source/*.docx` | — |

## 7. Задачи только с подтверждением оператора

- Изменения RLS-политик, триггеров и миграций: оператор применяет SQL сам
- Изменение текста договора и юр. страниц: меняется `CONTRACT_VERSION`, нужна юр. сверка
- Цены, скидки, логика сумм и возвратов
- Новые зависимости

## 8. Модели

| Тип задачи | Модель |
|---|---|
| Вёрстка, контент, мелкие фиксы | любая |
| Деньги, ЮKassa, webhook, цены, RLS, auth/сессии, миграции, рефактор на 5+ файлов | сильнейшая доступная, план обязателен |
