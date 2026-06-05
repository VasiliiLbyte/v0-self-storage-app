import { readFileSync } from "node:fs"
import path from "node:path"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

const SLUGS = {
  privacy: "Политика конфиденциальности",
  offer: "Публичная оферта",
  rules: "Правила пользования боксами",
  prohibited: "Перечень запрещённых вещей",
  terms: "Пользовательское соглашение",
} as const

type LegalSlug = keyof typeof SLUGS

export async function generateStaticParams() {
  return Object.keys(SLUGS).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const title = SLUGS[slug as LegalSlug]
  if (!title) return {}
  return { title: `${title} | ПЕЛИКАН` }
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const title = SLUGS[slug as LegalSlug]
  if (!title) notFound()

  const html = readFileSync(
    path.join(process.cwd(), "content/legal", `${slug}.html`),
    "utf8",
  )

  return (
    <>
      <h1 className="text-headline mb-8 text-3xl">{title}</h1>
      <div
        className="legal-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  )
}
