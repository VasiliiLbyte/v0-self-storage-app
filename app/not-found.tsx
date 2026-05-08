"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export default function NotFound() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen bg-background overflow-hidden relative flex flex-col">
      {/* Massive 404 background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <motion.div
          className="text-[40vw] md:text-[50vw] font-black text-foreground/[0.03] dark:text-foreground/[0.05] leading-none tracking-tighter"
          style={{
            x: mousePosition.x * 2,
            y: mousePosition.y * 2,
          }}
        >
          404
        </motion.div>
      </div>

      {/* Floating box elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-[15%] left-[10%] w-16 h-16 md:w-24 md:h-24 border-4 border-primary"
          animate={{
            rotate: [0, 90, 180, 270, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            x: mousePosition.x * -1.5,
            y: mousePosition.y * -1.5,
          }}
        />
        <motion.div
          className="absolute top-[60%] right-[15%] w-12 h-12 md:w-20 md:h-20 bg-primary"
          animate={{
            rotate: [45, 135, 225, 315, 405],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            x: mousePosition.x * 1.2,
            y: mousePosition.y * 1.2,
          }}
        />
        <motion.div
          className="absolute bottom-[20%] left-[20%] w-8 h-8 md:w-14 md:h-14 border-2 border-accent dark:border-primary/50"
          animate={{
            y: [0, -20, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            x: mousePosition.x * 0.8,
          }}
        />
        <motion.div
          className="absolute top-[30%] right-[25%] w-6 h-6 md:w-10 md:h-10 bg-accent dark:bg-primary/30"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl"
        >
          {/* Error label */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-primary/20 rounded-full mb-8"
          >
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-medium text-primary uppercase tracking-wider">
              Ошибка 404
            </span>
          </motion.div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 text-balance">
            <span className="block text-foreground">Упс.</span>
            <span className="block text-foreground/40">Бокс пустой.</span>
          </h1>

          {/* Witty copy */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg md:text-xl text-muted-foreground mb-12 max-w-md mx-auto"
          >
            Эта страница куда-то переехала. Может, на склад? 
            Но точно не на наш — у нас всё под контролем.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              className="group relative inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground font-semibold text-lg rounded-full overflow-hidden transition-transform hover:scale-105"
            >
              <motion.span
                className="absolute inset-0 bg-accent"
                initial={{ x: "-100%" }}
                animate={{ x: isHovering ? "0%" : "-100%" }}
                transition={{ duration: 0.3 }}
              />
              <span className="relative flex items-center gap-2">
                На главную
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={{ x: isHovering ? 4 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </motion.svg>
              </span>
            </Link>

            <Link
              href="/booking"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-foreground/20 text-foreground font-semibold text-lg rounded-full transition-all hover:border-primary hover:text-primary hover:scale-105"
            >
              Забронировать бокс
            </Link>
          </motion.div>
        </motion.div>

        {/* Fun fact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <p className="text-sm text-muted-foreground/60 font-mono">
            P.S. Код 404 придумали в CERN в 1992 году. Мы — нет.
          </p>
        </motion.div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-6 left-6">
        <Link href="/" className="text-2xl font-black tracking-tight text-foreground hover:text-primary transition-colors">
          ПЕЛИКАН
        </Link>
      </div>
      <div className="absolute top-6 right-6 text-sm text-muted-foreground font-mono">
        err_page_not_found
      </div>
    </div>
  )
}
