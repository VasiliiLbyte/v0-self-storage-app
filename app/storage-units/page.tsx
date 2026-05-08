import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/server"
import {
  StorageUnitsCatalog,
  type StorageUnitRow,
} from "@/components/storage-units-catalog"

export const metadata: Metadata = {
  title: "Каталог ячеек хранения | ПЕЛИКАН",
  description:
    "Все боксы самообслуживания в Санкт-Петербурге: размеры XS–L, площадь, высота, цена за месяц. Забронируйте ячейку онлайн.",
}

export default async function StorageUnitsPage() {
  const supabase = await createClient()
  const { data: rows, error } = await supabase
    .from("boxes")
    .select(
      "id, name, type, number, size_m2, height_m, price_month, is_available",
    )
    .eq("in_maintenance", false)
    .order("number", { ascending: true })

  if (error) {
    console.error("storage-units:", error.message)
  }

  const boxes = (rows ?? []) as StorageUnitRow[]

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-5rem)] pt-20">
        <StorageUnitsCatalog boxes={boxes} />
      </main>
      <Footer />
    </>
  )
}
