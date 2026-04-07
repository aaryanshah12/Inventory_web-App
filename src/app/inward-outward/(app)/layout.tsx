import IOLayout from '@/components/io/IOLayout'
import { IOFactoryProvider } from '@/contexts/IOFactoryContext'

export default function IOAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <IOFactoryProvider>
      <IOLayout>{children}</IOLayout>
    </IOFactoryProvider>
  )
}
