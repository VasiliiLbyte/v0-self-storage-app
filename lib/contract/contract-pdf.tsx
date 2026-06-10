import path from "path"
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer"
import {
  CONTRACT_TITLE,
  CONTRACT_SUBTITLE,
  CONTRACT_BLOCKS,
  COMPANY_REQUISITES,
  ASP_FOOTER_LINES,
  type ContractData,
  type Block,
} from "./contract-content"

const fontsDir = path.join(process.cwd(), "lib/contract/fonts")
Font.register({
  family: "PTSans",
  fonts: [
    { src: path.join(fontsDir, "PTSans-Regular.ttf"), fontWeight: 400 },
    { src: path.join(fontsDir, "PTSans-Bold.ttf"), fontWeight: 700 },
  ],
})

function fillTemplate(template: string, data: ContractData): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = data[key as keyof ContractData]
    return v != null ? String(v) : ""
  })
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "PTSans",
    fontSize: 10.5,
    lineHeight: 1.35,
    padding: 56,
    color: "#111",
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    textAlign: "center",
    marginBottom: 4,
  },
  contractNumber: {
    fontSize: 10,
    textAlign: "center",
    marginBottom: 16,
  },
  heading: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 10,
    marginBottom: 4,
  },
  clauseRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  clauseNum: {
    width: 36,
    fontWeight: 700,
    flexShrink: 0,
  },
  clauseText: {
    flex: 1,
  },
  paragraph: {
    marginBottom: 4,
  },
  paragraphBold: {
    marginBottom: 4,
    fontWeight: 700,
  },
  listItem: {
    marginBottom: 3,
    paddingLeft: 12,
  },
  kvTable: {
    marginVertical: 6,
    borderWidth: 0.5,
    borderColor: "#ccc",
  },
  kvRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  kvRowLast: {
    flexDirection: "row",
  },
  kvLabel: {
    width: "35%",
    padding: 4,
    fontWeight: 700,
    borderRightWidth: 0.5,
    borderRightColor: "#ccc",
    backgroundColor: "#f5f5f5",
  },
  kvValue: {
    width: "65%",
    padding: 4,
  },
  consentBlock: {
    marginBottom: 6,
  },
  consentCheck: {
    marginTop: 3,
    fontWeight: 700,
  },
  consentNote: {
    fontSize: 9,
    marginTop: 2,
    color: "#444",
  },
  footerSection: {
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#ccc",
  },
  footerHeading: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
  },
  aspLine: {
    fontSize: 9,
    marginBottom: 2,
    color: "#333",
  },
})

function KvTable({ rows, data }: { rows: [string, string][]; data: ContractData }) {
  return (
    <View style={styles.kvTable}>
      {rows.map(([label, value], i) => (
        <View key={i} style={i < rows.length - 1 ? styles.kvRow : styles.kvRowLast}>
          <Text style={styles.kvLabel}>{fillTemplate(label, data)}</Text>
          <Text style={styles.kvValue}>{fillTemplate(value, data)}</Text>
        </View>
      ))}
    </View>
  )
}

function BlockRenderer({ block, data }: { block: Block; data: ContractData }) {
  switch (block.k) {
    case "note":
      return null

    case "h":
      return <Text style={styles.heading}>{fillTemplate(block.t, data)}</Text>

    case "c":
      return (
        <View style={styles.clauseRow}>
          <Text style={styles.clauseNum}>{fillTemplate(block.n, data)}</Text>
          <Text style={styles.clauseText}>{fillTemplate(block.t, data)}</Text>
        </View>
      )

    case "p":
      return (
        <Text style={block.bold ? styles.paragraphBold : styles.paragraph}>
          {fillTemplate(block.t, data)}
        </Text>
      )

    case "li":
      return <Text style={styles.listItem}>— {fillTemplate(block.t, data)}</Text>

    case "kv":
      return <KvTable rows={block.rows} data={data} />

    case "consent": {
      const checked = block.consentKey
        ? block.consentKey === "crossborder"
          ? data.consent_crossborder
          : data.consent_marketing
        : true
      return (
        <View style={styles.consentBlock}>
          <View style={styles.clauseRow}>
            <Text style={styles.clauseNum}>{fillTemplate(block.n, data)}</Text>
            <Text style={styles.clauseText}>{fillTemplate(block.t, data)}</Text>
          </View>
          {block.note ? (
            <Text style={styles.consentNote}>{fillTemplate(block.note, data)}</Text>
          ) : null}
          <Text style={styles.consentCheck}>
            {checked ? "Отметка согласия: ДА" : "Отметка согласия: НЕТ"}
          </Text>
        </View>
      )
    }

    default:
      return null
  }
}

export function ContractPdf({ data }: { data: ContractData }) {
  const requisitesRows = COMPANY_REQUISITES.map(
    ([label, value]) => [label, value] as [string, string],
  )

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{CONTRACT_TITLE}</Text>
        <Text style={styles.subtitle}>{CONTRACT_SUBTITLE}</Text>
        <Text style={styles.contractNumber}>№ {data.contract_number}</Text>

        {CONTRACT_BLOCKS.map((block, i) => (
          <BlockRenderer key={i} block={block} data={data} />
        ))}

        <View style={styles.footerSection}>
          <Text style={styles.footerHeading}>Реквизиты Исполнителя</Text>
          <KvTable rows={requisitesRows} data={data} />

          <Text style={[styles.footerHeading, { marginTop: 12 }]}>Реквизиты Клиента</Text>
          <KvTable
            rows={[
              ["ФИО", "{{client_full_name}}"],
              ["Телефон", "{{client_phone}}"],
              ["E-mail", "{{client_email}}"],
            ]}
            data={data}
          />

          <View style={{ marginTop: 12 }}>
            {ASP_FOOTER_LINES(data).map((line, i) => (
              <Text key={i} style={styles.aspLine}>
                {line}
              </Text>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  )
}
