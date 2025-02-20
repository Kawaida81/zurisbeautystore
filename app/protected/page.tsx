'use client';

import FetchDataSteps from "@/components/tutorial/fetch-data-steps";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { InfoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";

export default function ProtectedPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/sign-in");
      } else {
        setUser(user);
      }
    }
    checkUser();
  }, [router, supabase.auth]);

  if (!user) {
    return null;
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
              {JSON.stringify(user, null, 2)}
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
  );
}
