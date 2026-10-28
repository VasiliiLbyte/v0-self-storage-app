---
description: Проверить evidence деплоя и закрыть DEP-NNN. Аргумент — DEP-ID и что прислал оператор
argument-hint: <DEP-NNN> <вывод git log / статус Vercel / curl>
---

Оператор сообщает о деплое: $ARGUMENTS

1. Найди строку DEP в `hub/PROGRESS.md` → «Ожидает деплоя» и возьми ветку и целевой SHA.
2. Сверь evidence:
   - merge в `main` содержит целевой SHA: `git fetch origin` и `git branch -r --contains <sha>`
   - деплой этого SHA на Vercel в статусе Ready (из сообщения оператора или
     `gh api repos/VasiliiLbyte/v0-self-storage-app/commits/<sha>/status`)
   - прод-URL из `hub/PROJECT.md` §3: `/` и `/storage-units` отвечают 200 (сделай curl сам)
   - смоук по чеклисту блока деплоя: пройди ключевой сценарий в браузере, если это возможно
     без оплаты и без ввода данных
   - если была миграция, оператор подтвердил, что её применили
3. Если всё сходится: в строке DEP поставь **`deployed`** (оператор, дата, SHA), перенеси задачу
   из «Активно» в «Закрыто», добавь строку в лог сессий.
4. Если не сходится: статус не меняй и перечисли, чего не хватает. Если прод сломан, предложи
   откат по `hub/DEPLOY.md` §6 и заведи инцидент (`bash hub/scripts/new-task.sh incident INC-<суть>`).
