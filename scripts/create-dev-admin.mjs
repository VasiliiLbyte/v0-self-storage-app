/**
 * Создаёт пользователя в Supabase Auth и назначает profiles.role = 'admin'.
 * Нужны переменные из .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 *
 * Запуск:
 *   npm run create-dev-admin
 *   DEV_ADMIN_EMAIL=you@x.com DEV_ADMIN_PASSWORD='Secret123!' npm run create-dev-admin
 *
 * Без DEV_* используются значения по умолчанию (только для локальной разработки).
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync, existsSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const DEFAULT_EMAIL = "admin@pelikan.local"
const DEFAULT_PASSWORD = "PelikanAdmin!Dev2026"

function loadDotEnvFile(relPath) {
  const path = resolve(__dirname, "..", relPath)
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

async function main() {
  const fileEnv = loadDotEnvFile(".env.local")
  let url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    fileEnv.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  )
    .trim()
    .replace(/\/$/, "")
  // Иногда вставляют URL PostgREST (.../rest/v1/) — Supabase JS ждёт только корень проекта.
  url = url.replace(/\/rest\/v1\/?$/i, "").replace(/\/$/, "")
  const serviceKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    fileEnv.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  ).trim()

  const email =
    process.env.DEV_ADMIN_EMAIL || fileEnv.DEV_ADMIN_EMAIL || DEFAULT_EMAIL
  const password =
    process.env.DEV_ADMIN_PASSWORD || fileEnv.DEV_ADMIN_PASSWORD || DEFAULT_PASSWORD

  if (!url || !serviceKey) {
    console.error(
      "Нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY (в .env.local или в окружении).",
    )
    process.exit(1)
  }

  if (password.length < 6) {
    console.error("Пароль должен быть не короче 6 символов.")
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Dev Admin" },
  })

  let userId

  if (createError) {
    const msg = createError.message || ""
    const duplicate =
      msg.toLowerCase().includes("already") ||
      msg.toLowerCase().includes("registered") ||
      createError.status === 422

    if (!duplicate) {
      console.error("createUser:", createError.message)
      process.exit(1)
    }

    const { data: list, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    })
    if (listError) {
      console.error("listUsers:", listError.message)
      process.exit(1)
    }
    const existing = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (!existing) {
      console.error("Пользователь с таким email уже есть, но не найден в первой странице списка.")
      process.exit(1)
    }
    userId = existing.id
    console.log("Пользователь уже существует, обновляю только роль в profiles…")
  } else {
    userId = created.user.id
    console.log("Создан новый пользователь в Auth.")
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      role: "admin",
      full_name: "Dev Admin",
      email,
    })
    .eq("id", userId)

  if (profileError) {
    console.error("profiles update:", profileError.message)
    process.exit(1)
  }

  console.log("")
  console.log("Готово. Вход в /auth/login и затем /admin:")
  console.log("  Email:   ", email)
  console.log("  Password:", password)
  console.log("")
  console.log("Смените пароль после первого входа. Не используйте эти креды в продакшене.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
