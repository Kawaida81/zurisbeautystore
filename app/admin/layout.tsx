'use client'

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { createClient } from "@/lib/supabase/client";
import { Menu, ChevronLeft } from 'lucide-react';
import { Button } from './components/ui/button';
import { Sidebar } from "./components";
import { ErrorBoundary } from "./components/error-boundary";
import { LoadingState } from "./components/loading-spinner";
import { Toaster } from 'react-hot-toast';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        if (!user) {
          router.push('/sign-in');
          return;
        }

        const supabase = createClient();
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, is_active')
          .eq('id', user.id)
          .single();

        if (userError || !userData) {
          throw new Error('Failed to verify user role');
        }

        if (userData.role !== 'admin' || !userData.is_active) {
          router.push('/dashboard');
          return;
        }

        setIsAuthorized(true);
        setLoading(false);
      } catch (error) {
        console.error('Error checking admin access:', error);
        router.push('/dashboard');
      }
    };

    checkAdminAccess();
  }, [user, router]);

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
      <ErrorBoundary>
        {loading || !isAuthorized ? (
          <div className="flex h-screen items-center justify-center">
            <LoadingState />
          </div>
        ) : (
          <div className="relative flex h-screen bg-gray-100">
            {/* Menu Button - Visible on both mobile and desktop */}
            <Button
              variant="ghost"
              size="icon"
              className={`absolute ${isSidebarOpen ? 'left-[250px]' : 'left-4'} top-4 z-50 transition-all duration-200 ease-in-out`}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <ChevronLeft className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            {/* Sidebar */}
            <div 
              className={`
                fixed inset-y-0 left-0 z-40 transform bg-white transition-all duration-200 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
              `}
            >
              <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </div>

            {/* Overlay for mobile */}
            {isSidebarOpen && (
              <div
                className="fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity md:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Main Content */}
            <main className={`
              flex-1 overflow-y-auto transition-all duration-200 ease-in-out
              ${isSidebarOpen ? 'pl-[280px]' : 'pl-4'} pr-4 pt-16 pb-4 md:pr-6
            `}>
              <div className="mb-16 md:mb-0">
                {children}
              </div>
            </main>
          </div>
        )}
      </ErrorBoundary>
    </>
  );
} 