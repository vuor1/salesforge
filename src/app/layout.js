import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata = {
  title: 'SalesForge',
  description: 'Myyntitiimin tietopankki ja AI-sparraaja',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fi" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full flex flex-col">{children}</body>
    </html>
  )
}
