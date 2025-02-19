"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from '@/lib/supabase/client';

import { signUpSchema } from "@/lib/validations/auth";
import type { SignUpInput } from "@/lib/validations/auth";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper function to wait for a specified time
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to verify user profile creation
const verifyUserProfile = async (supabase: any, userId: string, maxAttempts = 3) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Wait between attempts with exponential backoff
      if (attempt > 0) {
        await wait(Math.pow(2, attempt) * 1000);
      }

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        continue;
      }

      if (profile) {
        return profile;
      }
    } catch (error) {
      console.error(`Verification attempt ${attempt + 1} failed:`, error);
    }
  }
  return null;
};

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      phone: "",
      role: "client",
    },
  });

  async function onSubmit(data: SignUpInput) {
    try {
      setIsLoading(true);
      const supabase = createClient();

      // Check if user exists with better error handling
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', data.email)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing user:', checkError);
        throw new Error('Error checking user existence. Please try again.');
      }

      if (existingUser) {
        throw new Error('An account with this email already exists');
      }

      // Sign up the user with role and metadata
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: data.fullName,
            email: data.email,
            role: data.role,
            phone: data.phone || null
          }
        }
      });

      if (signUpError) {
        console.error('Sign up error:', signUpError);
        throw new Error(signUpError.message || 'Failed to create account');
      }

      if (!authData.user) {
        throw new Error('No user data returned from signup');
      }

      // Create user profile in the users table
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: data.email,
            full_name: data.fullName,
            phone: data.phone || null,
            role: data.role,
            is_active: true
          }
        ]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Attempt to delete the auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error('Failed to create user profile. Please try again.');
      }

      // Verify profile creation
      const profile = await verifyUserProfile(supabase, authData.user.id);
      if (!profile) {
        throw new Error('Failed to verify user profile creation. Please try again.');
      }

      // Show success message and redirect
      toast.success("Account created successfully! Please check your email to verify your account.");
      
      // Use router.push in a setTimeout to avoid React state update conflicts
      setTimeout(() => {
        router.push("/sign-in?message=Please check your email to verify your account");
      }, 100);

    } catch (error: any) {
      console.error('Sign-up error:', error);
      toast.error(error.message || "Failed to create account. Please try again.");
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
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your details to create your account
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow-sm rounded-lg sm:px-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your full name"
                        className="h-12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="Enter your phone number"
                        className="h-12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select your account type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="worker">Worker</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password"
                          className="h-12"
                          {...field}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          className="h-12"
                          {...field}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-sm text-center text-gray-500">
                By signing up, you agree to our{" "}
                <Link href="/terms" className="text-[#FF6B6B] hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-[#FF6B6B] hover:underline">
                  Privacy Policy
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#FF6B6B] hover:bg-[#FF6B6B]/90"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create account"}
              </Button>

              <div className="text-center">
                <Link
                  href="/sign-in"
                  className="text-sm font-medium text-[#FF6B6B] hover:text-[#FF6B6B]/90"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
} 