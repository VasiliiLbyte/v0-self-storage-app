"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

type Profile = {
  id: string
  full_name: string | null
  phone: string | null
}

export function DashboardProfile({
  user,
  profile,
}: {
  user: User
  profile: Profile | null
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || user.user_metadata?.full_name || "",
    phone: profile?.phone || "",
  })

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: formData.full_name,
        phone: formData.phone,
      })

    if (!error) {
      setEditing(false)
      router.refresh()
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Профиль</h2>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-lg font-semibold text-accent-foreground">
            {getInitials(formData.full_name || user.email || "U")}
          </div>
          <div className="flex-1">
            <div className="font-semibold">
              {formData.full_name || "Пользователь"}
            </div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>

        {editing ? (
          <div className="space-y-4 border-t border-border pt-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Имя</label>
              <Input
                value={formData.full_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                }
                placeholder="Иван Иванов"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Телефон</label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+7 (999) 123-45-67"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Телефон</span>
              <span>{formData.phone || "Не указан"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Email подтверждён</span>
              <span>{user.email_confirmed_at ? "Да" : "Нет"}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              className="mt-2 w-full"
            >
              Редактировать
            </Button>
          </div>
        )}

        <div className="mt-4 border-t border-border pt-4">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full text-destructive hover:text-destructive"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
            Выйти
          </Button>
        </div>
      </Card>

      {/* Help */}
      <Card className="mt-4 p-5">
        <h3 className="mb-3 font-semibold">Нужна помощь?</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Свяжитесь с нами любым удобным способом
        </p>
        <div className="space-y-2 text-sm">
          <a
            href="tel:+74951234567"
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
              />
            </svg>
            +7 (495) 123-45-67
          </a>
          <a
            href="mailto:support@skladtvoy.ru"
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
            support@skladtvoy.ru
          </a>
        </div>
      </Card>
    </div>
  )
}
