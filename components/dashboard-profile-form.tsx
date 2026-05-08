"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Profile = {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  avatar_url: string | null
}

export function DashboardProfileForm({
  user,
  profile,
}: {
  user: User
  profile: Profile | null
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [fullName, setFullName] = useState(
    profile?.full_name ?? user.user_metadata?.full_name ?? "",
  )
  const [phone, setPhone] = useState(profile?.phone ?? "")
  const [email, setEmail] = useState(user.email ?? "")
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null)
  const [password, setPassword] = useState("")
  const [password2, setPassword2] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSaveProfile = async () => {
    setSaving(true)
    const supabase = createClient()
    const { error: pErr } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      phone: phone || null,
      email: email || null,
    })
    if (email && email !== user.email) {
      const { error: aErr } = await supabase.auth.updateUser({ email })
      if (aErr) {
        alert("Email: " + aErr.message)
        setSaving(false)
        return
      }
    }
    if (pErr) {
      alert("Профиль: " + pErr.message)
      setSaving(false)
      return
    }
    setSaving(false)
    router.refresh()
  }

  const handleChangePassword = async () => {
    if (password.length < 8) {
      alert("Пароль не короче 8 символов")
      return
    }
    if (password !== password2) {
      alert("Пароли не совпадают")
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (error) {
      alert(error.message)
      return
    }
    setPassword("")
    setPassword2("")
    alert("Пароль обновлён")
  }

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert("Файл больше 5 МБ")
      return
    }
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const path = `${user.id}/avatar.${ext}`
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true,
      contentType: file.type,
    })
    if (upErr) {
      alert("Загрузка: " + upErr.message)
      setUploading(false)
      return
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path)
    const url = pub.publicUrl
    const { error: dbErr } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", user.id)
    setUploading(false)
    if (dbErr) {
      alert("Сохранение URL: " + dbErr.message + " (выполните scripts/003_dashboard_extras.sql)")
      return
    }
    setAvatarUrl(url)
    router.refresh()
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    const res = await fetch("/api/account/delete", { method: "POST", credentials: "include" })
    setDeleting(false)
    setDeleteOpen(false)
    if (!res.ok) {
      const j = (await res.json()) as { error?: string }
      alert(j.error ?? "Не удалось удалить аккаунт")
      return
    }
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-headline text-2xl md:text-3xl">Профиль</h1>
        <p className="mt-1 text-muted-foreground">Данные аккаунта и безопасность</p>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Фото</h2>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-muted">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={96}
                height={96}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <span className="text-2xl font-bold text-muted-foreground">
                {(fullName || user.email || "?").slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleAvatar}
            />
            <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? "Загрузка…" : "Загрузить фото"}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              JPG или PNG, не более 5 МБ.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Контакты</h2>
        <div className="grid max-w-lg gap-4">
          <div>
            <Label htmlFor="fullName">Имя</Label>
            <Input
              id="fullName"
              className="mt-1.5"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="phone">Телефон</Label>
            <Input
              id="phone"
              className="mt-1.5"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              className="mt-1.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Смена email может потребовать подтверждения письмом (настройки Supabase Auth).
            </p>
          </div>
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? "Сохранение…" : "Сохранить изменения"}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Смена пароля</h2>
        <div className="grid max-w-lg gap-4">
          <div>
            <Label htmlFor="pw1">Новый пароль</Label>
            <Input
              id="pw1"
              type="password"
              className="mt-1.5"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label htmlFor="pw2">Повторите пароль</Label>
            <Input
              id="pw2"
              type="password"
              className="mt-1.5"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <Button variant="secondary" onClick={handleChangePassword} disabled={saving || !password}>
            Обновить пароль
          </Button>
        </div>
      </Card>

      <Card className="border-destructive/30 p-6">
        <h2 className="mb-2 text-lg font-semibold text-destructive">Удаление аккаунта</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Будут удалены профиль, бронирования и связанные данные. Действие необратимо.
        </p>
        <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
          Удалить аккаунт
        </Button>
      </Card>

      <p className="text-sm text-muted-foreground">
        <Link href="/dashboard" className="text-primary underline">
          Назад к обзору
        </Link>
      </p>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить аккаунт навсегда?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Убедитесь, что нет неоплаченных обязательств.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <Button variant="destructive" disabled={deleting} onClick={handleDeleteAccount}>
              {deleting ? "Удаление…" : "Удалить навсегда"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
