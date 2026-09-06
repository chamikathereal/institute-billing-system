'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Lock,
  Mail,
  ShieldCheck,
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
    setEmail('admin@nimasfashion.lk');
    setPassword('AdminPassword@123');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 relative overflow-hidden">
      {/* Background Decorative Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Institute Branding Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-sm mb-1">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={instituteName}
                className="w-12 h-12 rounded-xl object-cover"
              />
            ) : (
              <GraduationCap className="h-10 w-10 text-primary" />
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 font-heading">
            {instituteName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
            {instituteTagline}
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border shadow-xl backdrop-blur-sm bg-card/95">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  <span>Admin Panel Login</span>
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Enter your administrative credentials to manage billing and courses
                </CardDescription>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                <ShieldCheck className="h-3 w-3" />
                <span>JWT Secure</span>
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  <span>Administrator Email</span>
                </label>
                <Input
                  type="email"
                  placeholder="admin@nimasfashion.lk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="h-10"
                />
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5" />
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
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-10 font-semibold gap-2 shadow-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Session...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Quick Demo Credentials Button */}
            <div className="pt-2 border-t border-dashed border-border/80">
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Fill Default Admin Credentials (Demo)</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Public Student Portal Link */}
        <div className="text-center p-4 rounded-xl bg-card border border-border shadow-sm">
          <p className="text-xs text-muted-foreground">
            Looking for Student Invoices & Payment Timetables?
          </p>
          <Link
            href="/portal"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mt-1.5"
          >
            <span>Access Passwordless Student Portal</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} {instituteName}. Multi-Tenant Institute Billing System.
        </div>
      </div>
    </div>
  );
}
