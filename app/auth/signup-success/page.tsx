import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function SignupSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <h1 className="text-headline mb-3 text-2xl">Проверьте почту</h1>
        <p className="mb-6 text-muted-foreground">
          Мы отправили письмо с ссылкой для подтверждения на указанный email. 
          Перейдите по ссылке, чтобы активировать аккаунт.
        </p>

        <Card className="mb-6 p-4 text-left text-sm text-muted-foreground">
          <p>Не получили письмо? Проверьте папку &quot;Спам&quot; или попробуйте зарегистрироваться снова.</p>
        </Card>

        <Button variant="outline" asChild>
          <Link href="/auth/login">Вернуться к входу</Link>
        </Button>
      </div>
    </div>
  )
}
