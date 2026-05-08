import * as ipaddr from "ipaddr.js"

/**
 * IPv4 ranges and hosts from YooKassa webhook documentation
 * (https://yookassa.ru/developers/using-api/webhooks), including 77.75.154.128/25.
 */
const IPV4_CIDRS = [
  "185.71.76.0/27",
  "185.71.77.0/27",
  "77.75.153.0/25",
  "77.75.154.128/25",
] as const

const IPV4_SINGLE = ["77.75.156.11", "77.75.156.35"] as const

const IPV6_CIDR = "2a02:5180::/32"

/**
 * On Vercel and similar proxies, the original client is typically the first entry
 * in X-Forwarded-For (leftmost). Use that for YooKassa webhook IP checks.
 */
export function getNotificationClientIp(request: Request): string | null {
  const xff = request.headers.get("x-forwarded-for")
  if (xff) {
    const first = xff.split(",")[0]?.trim()
    if (first) return first
  }
  const real = request.headers.get("x-real-ip")?.trim()
  if (real) return real
  return null
}

export function isYooKassaNotificationIp(ip: string): boolean {
  if (!ip) return false
  if ((IPV4_SINGLE as readonly string[]).includes(ip)) return true
  try {
    const addr = ipaddr.parse(ip)
    if (addr.kind() === "ipv4") {
      const ipv4 = addr as ipaddr.IPv4
      for (const cidr of IPV4_CIDRS) {
        const [subnet, bits] = ipaddr.parseCIDR(cidr) as [ipaddr.IPv4, number]
        if (ipv4.match(subnet, bits)) return true
      }
    }
    if (addr.kind() === "ipv6") {
      const ipv6 = addr as ipaddr.IPv6
      const [subnet6, bits6] = ipaddr.parseCIDR(IPV6_CIDR) as [ipaddr.IPv6, number]
      if (ipv6.match(subnet6, bits6)) return true
    }
  } catch {
    return false
  }
  return false
}
