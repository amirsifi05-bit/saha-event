import { Toaster } from 'sonner'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center px-4 py-12">
      {children}
      <Toaster position="top-center" richColors />
    </div>
  )
}
