'use client'

import Link from "next/link";
import { Badge } from "./ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { useEffect, useState } from 'react'

export default function HeaderAuth() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <>
          <span className="text-sm text-gray-600">
            {user.email}
          </span>
          <Button
            variant="ghost"
            className="text-sm font-medium hover:underline underline-offset-4"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </>
      ) : (
        <>
          <Link
            href="/sign-in"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Sign Up
          </Link>
        </>
      )}
      {(!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) && (
        <Badge variant="destructive" className="rounded-sm">
          Missing env vars
        </Badge>
      )}
    </div>
  );
}
