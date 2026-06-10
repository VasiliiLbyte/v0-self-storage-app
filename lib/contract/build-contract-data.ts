import { getContractSiteFields, type ContractData } from "./contract-content"

export type BookingContractRow = {
  id: string
  start_date: string
  end_date: string
  months: number
  final_price: number
  access_code: string
  signed_at: string | null
  sign_ip: string | null
  sign_user_agent: string | null
  consent_crossborder: boolean | null
  consent_marketing: boolean | null
  profiles: { full_name: string | null; phone: string | null; email: string | null } | null
  boxes: { name: string; number: number; size_m2: number } | null
}

function formatIsoDateRu(isoDate: string): string {
  const [y, m, d] = isoDate.split("-")
  if (!y || !m || !d) return isoDate
  return `${d.padStart(2, "0")}.${m.padStart(2, "0")}.${y}`
}

function formatSignedAt(iso: string): { date: string; time: string } {
  const dt = new Date(iso)
  return {
    date: dt.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    time: dt.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }),
  }
}

export function buildContractData(row: BookingContractRow): ContractData {
  const signedIso = row.signed_at ?? new Date().toISOString()
  const { date: signed_date, time: signed_time } = formatSignedAt(signedIso)
  const year = new Date(signedIso).getFullYear()
  const site = getContractSiteFields()

  return {
    contract_number: `PEL-${year}-${row.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
    signed_date,
    signed_time,
    client_ip: row.sign_ip ?? "",
    user_agent: row.sign_user_agent ?? "",
    client_full_name: row.profiles?.full_name?.trim() ?? "",
    client_phone: row.profiles?.phone?.trim() ?? "",
    client_email: row.profiles?.email?.trim() ?? "",
    box_name: row.boxes?.name ?? "",
    box_number: row.boxes?.number ?? "",
    size_m2: row.boxes?.size_m2 ?? "",
    access_code: row.access_code,
    start_date: formatIsoDateRu(row.start_date),
    end_date: formatIsoDateRu(row.end_date),
    months: row.months,
    final_price: row.final_price.toLocaleString("ru-RU"),
    premises_address: site.premises_address,
    cadastral_number: site.cadastral_number,
    company_ogrnip: site.company_ogrnip,
    company_address: site.company_address,
    consent_crossborder: !!row.consent_crossborder,
    consent_marketing: !!row.consent_marketing,
  }
}
