import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import mammoth from "mammoth"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const sourceDir = join(root, "content/legal/source")
const outDir = join(root, "content/legal")

const SLUGS = ["privacy", "offer", "rules", "prohibited", "terms"]

const companyPublic = JSON.parse(
  readFileSync(join(root, "lib/company-public.json"), "utf8"),
)

function removeServiceNotes(html) {
  return html.replace(/<p><em>[\s\S]*?<\/em><\/p>/g, "")
}

function applyCompanyFields(html) {
  return html.replace(
    /(<p><strong>ОГРНИП<\/strong><\/p><\/td><td><p>)____________________(<\/p><\/td>)/g,
    `$1${companyPublic.ogrnip}$2`,
  )
}

mkdirSync(outDir, { recursive: true })

const generated = []

for (const slug of SLUGS) {
  const docxPath = join(sourceDir, `${slug}.docx`)
  const { value: html } = await mammoth.convertToHtml({ path: docxPath })
  const cleaned = applyCompanyFields(removeServiceNotes(html))
  const outPath = join(outDir, `${slug}.html`)
  writeFileSync(outPath, cleaned, "utf8")
  generated.push(outPath)
}

console.log("Generated legal HTML files:")
for (const file of generated) {
  console.log(`  ${file}`)
}
