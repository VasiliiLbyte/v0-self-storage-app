# Pelikan Storage: раннбук деплоя

Деплоит **оператор**. Агент готовит блоки команд по этому раннбуку
(`templates/DEPLOY_BLOCK.md`) и проверяет evidence после деплоя.

Хостинг: **Vercel**, проект собирается из GitHub `VasiliiLbyte/v0-self-storage-app`.
**Push в `main` сразу запускает прод-деплой.** Push любой другой ветки создаёт Preview.

---

## 1. Карта окружений

| Окружение | Откуда | URL | Env | Проверка |
|---|---|---|---|---|
| prod | `main` | `<прод-URL>` | Vercel → Environment Variables → Production | `/` и `/storage-units` 200, смоук |
| preview | любая ветка | ссылка из Vercel / статуса коммита на GitHub | Vercel → Preview | смоук задачи |
| Supabase | — | Dashboard проекта | — | SQL Editor, Table Editor |
| ЮKassa | — | личный кабинет магазина | — | webhook `<прод-URL>/api/payments/webhook` |

Переменные окружения (только имена): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`,
`NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`, опционально `NEXT_PUBLIC_SITE_PHONE`,
`NEXT_PUBLIC_SITE_PHONE_DISPLAY`, `NEXT_PUBLIC_SITE_EMAIL`.

> `NEXT_PUBLIC_*` вшиваются в бандл при сборке. После их изменения на Vercel нужен
> **Redeploy**, иначе прод продолжит работать со старыми значениями.

## 2. Чеклист перед деплоем

- [ ] Задача в `PROGRESS.md` → «Ожидает деплоя» со статусом `verified` и SHA
- [ ] Проверка по `playbook/VERIFY.md` пройдена, отчёт в файле задачи
- [ ] Миграции: есть или нет, номера; применены в Supabase **до** merge
- [ ] Деньги, auth, RLS, миграции → сначала смоук на Preview (§4)
- [ ] Новые env: заведены на Vercel для Production (и Preview) до merge
- [ ] Смоук-чеклист на 3–5 пунктов готов

## 3. Миграция (Supabase SQL Editor)

1. Оператор делает бэкап, если миграция меняет или удаляет данные:
   Supabase → Database → Backups, или выгрузка затрагиваемых таблиц.
2. Открывает `scripts/NNN_<суть>.sql`, копирует содержимое целиком в SQL Editor, Run.
3. Проверяет результат запросом из блока деплоя (например, `select … from pg_policies where tablename = '…'`).

Миграция применяется **до** кода, который от неё зависит. Если новый код ломается на
старой схеме, а старый на новой, это нужно описать в блоке деплоя и согласовать порядок.

## 4. Preview gate (деньги, auth, RLS, миграции)

1. Push ветки задачи → Vercel создаёт Preview.
2. Смоук на Preview по чеклисту задачи.
3. Только после этого merge в `main`.

> Пока не выяснено, в какой Supabase и какой магазин ЮKassa смотрит Preview
> (`PROGRESS.md` → «Блокеры» #2), оплату на Preview проходить только с тестовыми данными
> и с ведома оператора.

## 5. Деплой в прод

```bash
cd "/Users/vasilii/Desktop/code /pelikan-storage"
git fetch origin
git switch main
git pull --ff-only origin main
git merge --no-ff <ветка-задачи>
git log -1 --oneline
git push origin main
```

После push: Vercel → Deployments → деплой с этим SHA перешёл в **Ready**. Затем:

```bash
curl -s -o /dev/null -w "%{http_code}\n" <прод-URL>/
curl -s -o /dev/null -w "%{http_code}\n" <прод-URL>/storage-units
```

**Evidence для `deployed`:** SHA Ready-деплоя совпадает с целевым, оба curl вернули 200,
смоук отмечен. Статус деплоя по SHA видно и через GitHub:
`gh api repos/VasiliiLbyte/v0-self-storage-app/commits/<sha>/status --jq '.statuses[] | {context, state, target_url}'`.

## 6. Откат

Быстро: Vercel → Deployments → предыдущий Ready-деплой → **Promote to Production**
(Instant Rollback). Код в `main` при этом не меняется, поэтому дальше:

```bash
cd "/Users/vasilii/Desktop/code /pelikan-storage"
git switch main
git pull --ff-only origin main
git revert --no-edit <sha>
git push origin main
```

Если откатываемый деплой включал миграцию, решение принимает оператор: откатить схему
обратным SQL или оставить схему и откатить только код. После отката заводится инцидент
(`templates/INCIDENT.md`), в «Ожидает деплоя» ставится `rolled back`.

## 7. Антипаттерны

| Нельзя | Нужно |
|---|---|
| Пушить в `main` «чтобы посмотреть» | Push ветки → Preview |
| Комментарий `# …` в строке с git в блоке для терминала | Пояснение над блоком. zsh принимает комментарий за аргумент |
| `cd ~/Desktop/code /pelikan-storage` без кавычек | Путь с пробелом всегда в кавычках |
| Менять `NEXT_PUBLIC_*` на Vercel без Redeploy | Redeploy после правки env |
| Править уже применённый `scripts/00N_*.sql` | Новый файл со следующим номером |
| Ставить `deployed` по словам «вроде всё ок» | SHA Ready-деплоя, 200, смоук |
| Проверять оплату по странице `/booking/success` | Смотреть `payments.status`, его ставит webhook |

## 8. Журнал инфраструктурных изменений

| Дата | Что изменили (env на Vercel, домен, webhook ЮKassa, Supabase Auth) | Кто | Evidence |
|---|---|---|---|
| | | | |
