import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import FetchDataSteps from "@/components/tutorial/fetch-data-steps";
import { InfoIcon } from "lucide-react";
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";

export const runtime = 'edge'

export default async function ProtectedPage() {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/sign-in')
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="flex-1 w-full flex flex-col gap-8">
          <div className="w-full">
            <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
              <InfoIcon size="16" strokeWidth={2} />
              This is a protected page that you can only see as an authenticated user
            </div>
          </div>
          <div className="flex flex-col gap-2 items-start">
            <h2 className="font-bold text-2xl mb-4">Your user details</h2>
            <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto bg-gray-50">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
          <div>
            <h2 className="font-bold text-2xl mb-4">Next steps</h2>
            <FetchDataSteps />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
