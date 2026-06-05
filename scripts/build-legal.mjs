import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import mammoth from "mammoth"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const sourceDir = join(root, "content/legal/source")
const outDir = join(root, "content/legal")

const SLUGS = ["privacy", "offer", "rules", "prohibited", "terms"]

function stripTags(html) {
  return html.replace(/<[^>]+>/g, "")
}

function removeRevisionNote(html) {
  let removed = false
  return html.replace(/<p[^>]*>[\s\S]*?<\/p>/gi, (match) => {
    if (removed) return match
    const text = stripTags(match).trimStart()
    if (text.startsWith("Редакция от")) {
      removed = true
      return ""
    }
    return match
  })
}

mkdirSync(outDir, { recursive: true })

const generated = []

for (const slug of SLUGS) {
  const docxPath = join(sourceDir, `${slug}.docx`)
  const { value: html } = await mammoth.convertToHtml({ path: docxPath })
  const cleaned = removeRevisionNote(html)
  const outPath = join(outDir, `${slug}.html`)
  writeFileSync(outPath, cleaned, "utf8")
  generated.push(outPath)
}

console.log("Generated legal HTML files:")
for (const file of generated) {
  console.log(`  ${file}`)
}
