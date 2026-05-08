/** Amount in whole rubles as required by YooKassa (two decimal places). */
export function formatRublesForYooKassa(amountRubles: number): string {
  return `${amountRubles.toFixed(2)}`
}

export type YooKassaCreatePaymentBody = {
  amount: { value: string; currency: "RUB" }
  confirmation: { type: "redirect"; return_url: string }
  capture: boolean
  description: string
  metadata: Record<string, string>
}

export type YooKassaPaymentResponse = {
  id: string
  status?: string
  confirmation?: {
    type: string
    confirmation_url?: string
    return_url?: string
  }
}

export async function createYooKassaPayment(params: {
  shopId: string
  secretKey: string
  idempotenceKey: string
  body: YooKassaCreatePaymentBody
}): Promise<YooKassaPaymentResponse> {
  const credentials = Buffer.from(`${params.shopId}:${params.secretKey}`).toString(
    "base64",
  )
  const res = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
      "Idempotence-Key": params.idempotenceKey,
    },
    body: JSON.stringify(params.body),
  })

  const json = (await res.json()) as YooKassaPaymentResponse & {
    type?: string
    description?: string
    code?: string
  }

  if (!res.ok) {
    const msg =
      json.description ||
      json.code ||
      json.type ||
      `YooKassa request failed with HTTP ${res.status}`
    throw new Error(msg)
  }

  return json
}

export type YooKassaRefundResponse = {
  id?: string
  status?: string
  payment_id?: string
}

export async function createYooKassaRefund(params: {
  shopId: string
  secretKey: string
  idempotenceKey: string
  yookassaPaymentId: string
  amountRubles: number
}): Promise<YooKassaRefundResponse> {
  const credentials = Buffer.from(`${params.shopId}:${params.secretKey}`).toString("base64")
  const res = await fetch("https://api.yookassa.ru/v3/refunds", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
      "Idempotence-Key": params.idempotenceKey,
    },
    body: JSON.stringify({
      payment_id: params.yookassaPaymentId,
      amount: {
        value: formatRublesForYooKassa(params.amountRubles),
        currency: "RUB",
      },
    }),
  })

  const json = (await res.json()) as YooKassaRefundResponse & {
    type?: string
    description?: string
    code?: string
  }

  if (!res.ok) {
    const msg =
      json.description ||
      json.code ||
      json.type ||
      `YooKassa refund failed with HTTP ${res.status}`
    throw new Error(msg)
  }

  return json
}
