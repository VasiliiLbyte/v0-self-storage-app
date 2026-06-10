import React from "react"
import crypto from "crypto"
import { renderToBuffer } from "@react-pdf/renderer"
import { ContractPdf } from "./contract-pdf"
import type { ContractData } from "./contract-content"

export async function generateContractPdf(
  data: ContractData,
): Promise<{ buffer: Buffer; sha256: string }> {
  const element = React.createElement(ContractPdf, { data })
  const buffer = Buffer.from(
    await renderToBuffer(element as Parameters<typeof renderToBuffer>[0]),
  )
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex")
  return { buffer, sha256 }
}
