# Блок деплоя для оператора: как оформлять

Оператор вставляет блок в терминал целиком. Поэтому:

- **только команды**, без prompt `user@host$`, без вывода и markdown внутри
- **без `#`-комментариев** в строках: пояснения пишутся строкой markdown **над** блоком
- один блок решает одну задачу: SQL, merge и push, проверка
- путь проекта всегда в кавычках: `"/Users/vasilii/Desktop/code /pelikan-storage"`
- после merge всегда `git log -1 --oneline`, чтобы сверить SHA

---

## DEP-NNN: <суть>

**Ветка / целевой SHA:** `<branch>` `<sha>` (<сообщение коммита>)
**Миграции:** <нет | `scripts/NNN_<суть>.sql`, применить в Supabase SQL Editor **до** merge>
**Env на Vercel:** <без изменений | добавить `NAME` для Production и Preview, затем Redeploy>
**Preview gate:** <не нужен | нужен, потому что деньги / auth / RLS / миграция>

1. Миграция (если есть): Supabase → SQL Editor → вставить `scripts/NNN_<суть>.sql` целиком → Run.
   Проверка:

```sql
<select …, который подтверждает, что миграция применилась>
```

2. Preview (если нужен gate): ссылка `<preview-URL>`, смоук ниже.

3. Merge и push в прод:

```bash
cd "/Users/vasilii/Desktop/code /pelikan-storage"
git fetch origin
git switch main
git pull --ff-only origin main
git merge --no-ff <branch>
git log -1 --oneline
git push origin main
```

4. Когда деплой на Vercel станет Ready:

```bash
curl -s -o /dev/null -w "%{http_code}\n" <прод-URL>/
curl -s -o /dev/null -w "%{http_code}\n" <прод-URL>/storage-units
```

**Ожидается:** SHA merge-коммита, деплой Ready, оба curl `200`.

**Смоук (3–5 пунктов):**
- [ ] <страница / сценарий → ожидаемый результат>
- [ ] <регрессия соседнего сценария>
- [ ] Главная открывается, логин держится после 2–3 переходов, бронь доходит до шага оплаты

**Если что-то пошло не так:** откат по `hub/DEPLOY.md` §6, затем `templates/INCIDENT.md`.

**Что вернуть агенту:** вывод `git log -1`, ссылку или статус деплоя Vercel, вывод curl, отметки смоука.
