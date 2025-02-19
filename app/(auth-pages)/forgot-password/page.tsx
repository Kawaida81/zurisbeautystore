"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { createClient } from '@/lib/supabase/client';

import { forgotPasswordSchema } from "@/lib/validations/auth";
import type { ForgotPasswordInput } from "@/lib/validations/auth";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordInput) {
    try {
      setIsLoading(true);
      const supabase = createClient();

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', data.email)
        .single();

      if (!existingUser) {
        throw new Error('No account found with this email address');
      }

      // Send password reset email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        data.email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        console.error('Password reset error:', resetError);
        throw new Error(resetError.message);
      }

      toast.success("Check your email for password reset instructions!");
      router.push("/sign-in?message=Check your email for password reset instructions");
    } catch (error: any) {
      console.error('Forgot password error:', error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF5F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="text-4xl font-bold text-[#FF6B6B]">
            ZURI&apos;s Beauty
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight">
            Forgot your password?
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow-sm rounded-lg sm:px-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        className="h-12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 bg-[#FF6B6B] hover:bg-[#FF6B6B]/90"
                disabled={isLoading}
              >
                {isLoading ? "Sending link..." : "Send reset link"}
              </Button>

              <div className="text-center">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center text-sm font-medium text-[#FF6B6B] hover:text-[#FF6B6B]/90"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to sign in
                </Link>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
} 