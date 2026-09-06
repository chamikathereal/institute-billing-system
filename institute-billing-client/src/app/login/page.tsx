'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  GraduationCap,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/axios';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // If already authenticated, redirect to home dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  // Fetch dynamic institute branding
  const { data: settingsData } = useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  const instituteName =
    settingsData?.settings?.institute_name || settingsData?.tenant?.name || 'Nimas Fashion Academy';
  const instituteTagline =
    settingsData?.settings?.institute_tagline ||
    settingsData?.tenant?.tagline ||
    'Excellence in Fashion & Apparel Education';
  const logoUrl = settingsData?.tenant?.logoUrl;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      error('Missing Fields', 'Please enter your email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      success('Welcome Back!', 'Logged into the Administrator Portal successfully.');
    } catch (err: any) {
      const msg =
        err.response?.data?.message || 'Invalid email or password. Please try again.';
      error('Login Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@nimas.edu');
    setPassword('Admin@123');
  };

  return (
    <div className="h-screen w-screen max-h-screen overflow-hidden flex flex-col justify-center items-center px-4 py-3 sm:py-4 bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 relative">
      {/* Background Decorative Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-3 sm:space-y-3.5 my-auto">
        {/* Institute Branding Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-xs">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={instituteName}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <GraduationCap className="h-8 w-8 text-primary" />
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 font-heading leading-tight">
            {instituteName}
          </h1>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto line-clamp-1">
            {instituteTagline}
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border shadow-lg backdrop-blur-sm bg-card/95">
          <CardHeader className="py-3 px-5 pb-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-primary" />
                <span>Admin Panel Login</span>
              </CardTitle>
              <CardDescription className="text-[11px] mt-0.5">
                Enter administrative credentials to manage billing and courses
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="py-3 px-5 space-y-3">
            <form onSubmit={handleSubmit} className="space-y-2.5">
              {/* Email field */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />
                  <span>Administrator Email</span>
                </label>
                <Input
                  type="text"
                  inputMode="email"
                  placeholder="admin@nimas."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="h-9 text-xs"
                />
              </div>

              {/* Password field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <KeyRound className="h-3 w-3" />
                    <span>Password</span>
                  </label>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    required
                    className="h-9 pr-9 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-9 text-xs font-semibold gap-2 shadow-xs mt-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Session...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </form>

            {/* Quick Demo Credentials Button */}
            <div className="pt-2 border-t border-dashed border-border/80">
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="w-full py-1.5 px-2.5 rounded-md text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span>Fill Default Admin Credentials (Demo)</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Public Student Portal Link */}
        <div className="py-2.5 px-4 rounded-lg bg-card/80 border border-border shadow-xs flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            Student looking for invoices?
          </span>
          <Link
            href="/portal"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
          >
            <span>Public Student Portal</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-muted-foreground">
          © {new Date().getFullYear()} {instituteName}. Multi-Tenant Institute Billing System.
        </div>
      </div>
    </div>
  );
}
