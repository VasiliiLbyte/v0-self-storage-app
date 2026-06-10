import type { Metadata } from "next"
import {
  CONTRACT_TITLE,
  CONTRACT_SUBTITLE,
  CONTRACT_BLOCKS,
  COMPANY_REQUISITES,
  getContractSiteFields,
  type Block,
} from "@/lib/contract/contract-content"

export const metadata: Metadata = {
  title: "Типовой договор | ПЕЛИКАН",
}

const SITE_FIELD_KEYS = new Set([
  "company_ogrnip",
  "cadastral_number",
  "premises_address",
  "company_address",
])

function fillTemplate(text: string): string {
  const site = getContractSiteFields()
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    if (SITE_FIELD_KEYS.has(key)) {
      return site[key as keyof typeof site] ?? ""
    }
    return "____"
  })
}

function KvTable({ rows }: { rows: [string, string][] }) {
  return (
    <table>
      <tbody>
        {rows.map(([label, value], i) => (
          <tr key={i}>
            <td>{fillTemplate(label)}</td>
            <td>{fillTemplate(value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function BlockRenderer({ block }: { block: Block }) {
  switch (block.k) {
    case "note":
      return null

    case "h":
      return <h2>{fillTemplate(block.t)}</h2>

    case "c":
      return (
        <p>
          <strong>{fillTemplate(block.n)}</strong> {fillTemplate(block.t)}
        </p>
      )

    case "p":
      return (
        <p className={block.bold ? "font-semibold" : undefined}>
          {fillTemplate(block.t)}
        </p>
      )

    case "li":
      return <p className="pl-4">— {fillTemplate(block.t)}</p>

    case "kv":
      return <KvTable rows={block.rows} />

    case "consent":
      return (
        <div>
          <p>
            <strong>{fillTemplate(block.n)}</strong> {fillTemplate(block.t)}
          </p>
          {block.note ? (
            <p className="text-sm text-muted-foreground">
              {fillTemplate(block.note)}
            </p>
          ) : null}
        </div>
      )

    default:
      return null
  }
}

export default function ContractLegalPage() {
  return (
    <>
      <h1 className="text-headline mb-8 text-3xl">Типовой договор</h1>
      <div className="legal-content">
        <p className="text-muted-foreground">
          Типовая форма. Индивидуальные условия (бокс, срок, цена, реквизиты
          Клиента) заполняются автоматически при оформлении бронирования.
        </p>

        <p className="text-center font-bold">{CONTRACT_TITLE}</p>
        <p className="text-center">{CONTRACT_SUBTITLE}</p>
        <p className="text-center">№ ____</p>

        {CONTRACT_BLOCKS.map((block, i) => (
          <BlockRenderer key={i} block={block} />
        ))}

        <h2>Реквизиты Исполнителя</h2>
        <KvTable rows={COMPANY_REQUISITES} />
      </div>
    </>
  )
}
