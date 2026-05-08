import packageJson from "../../../package.json"

export default function AdminSettingsPage() {
  const envHints = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_APP_URL",
    "YOOKASSA_SHOP_ID",
    "YOOKASSA_SECRET_KEY",
  ]

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Настройки</h1>
        <p className="text-sm text-muted-foreground">
          Справочная страница. Секреты здесь не отображаются.
        </p>
      </div>

      <section className="rounded-xl border border-border p-4">
        <h2 className="mb-2 text-sm font-semibold">Версия приложения</h2>
        <p className="text-sm text-muted-foreground">
          package.json: <span className="font-mono text-foreground">{packageJson.version}</span>
        </p>
      </section>

      <section className="rounded-xl border border-border p-4">
        <h2 className="mb-2 text-sm font-semibold">Webhook ЮKassa</h2>
        <p className="mb-2 text-sm text-muted-foreground">
          Укажите в личном кабинете ЮKassa URL уведомлений (HTTPS в продакшене):
        </p>
        <code className="block break-all rounded-md bg-muted px-3 py-2 text-xs">
          {"{NEXT_PUBLIC_APP_URL}/api/payments/webhook"}
        </code>
      </section>

      <section className="rounded-xl border border-border p-4">
        <h2 className="mb-2 text-sm font-semibold">Переменные окружения</h2>
        <p className="mb-2 text-sm text-muted-foreground">
          Значения задайте в `.env.local` (см. README). Имена:
        </p>
        <ul className="list-inside list-disc space-y-1 font-mono text-xs text-muted-foreground">
          {envHints.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border p-4">
        <h2 className="mb-2 text-sm font-semibold">Роль администратора</h2>
        <p className="text-sm text-muted-foreground">
          Выполните в SQL Editor Supabase (подставьте UUID пользователя):
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-xs">
{`UPDATE public.profiles
SET role = 'admin'
WHERE id = '00000000-0000-0000-0000-000000000000';`}
        </pre>
      </section>
    </div>
  )
}
