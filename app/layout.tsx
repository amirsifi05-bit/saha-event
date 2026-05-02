import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PageTransition from '@/components/PageTransition'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Saha-Event — Book Event Halls in Algeria',
  description:
    'Find and book the perfect event hall for your celebration across Algeria.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F7F8FA]`}>
        <Navbar />
        <main className="pt-16 pb-20 lg:pb-0">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
        <Toaster
          position="top-center"
          richColors
          expand={false}
          duration={3500}
          toastOptions={{
            style: {
              borderRadius: '12px',
              fontFamily: 'inherit',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  )
}
