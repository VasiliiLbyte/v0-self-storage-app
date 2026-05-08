"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export function AdminClientNotesForm({
  profileId,
  initialNotes,
}: {
  profileId: string
  initialNotes: string | null
}) {
  const router = useRouter()
  const [notes, setNotes] = useState(initialNotes ?? "")
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/profiles/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error ?? res.statusText)
      toast.success("Заметка сохранена")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2 rounded-xl border border-border p-4">
      <h3 className="text-sm font-semibold">Заметка (только для админов)</h3>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        placeholder="Внутренняя заметка о клиенте…"
      />
      <Button size="sm" onClick={save} disabled={saving}>
        Сохранить
      </Button>
    </div>
  )
}
