'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Building,
  Save,
  MessageSquare,
  Clock,
  Sparkles,
  CheckCircle2,
  DollarSign,
  Hash,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/axios';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data: configData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  const [instituteName, setInstituteName] = React.useState('');
  const [instituteTagline, setInstituteTagline] = React.useState('');
  const [logoUrl, setLogoUrl] = React.useState('');
  const [institutePhone, setInstitutePhone] = React.useState('');
  const [instituteEmail, setInstituteEmail] = React.useState('');
  const [instituteAddress, setInstituteAddress] = React.useState('');

  const [studentIdPrefix, setStudentIdPrefix] = React.useState('NFA');
  const [currencySymbol, setCurrencySymbol] = React.useState('LKR');
  const [reminderDays, setReminderDays] = React.useState('7');
  const [smsSenderId, setSmsSenderId] = React.useState('NIMAS-SMS');

  React.useEffect(() => {
    if (configData) {
      const s = configData.settings || {};
      const t = configData.tenant || {};

      setInstituteName(s.institute_name || t.name || 'Nimas Fashion Academy');
      setInstituteTagline(s.institute_tagline || t.tagline || 'Excellence in Fashion & Apparel Education');
      setLogoUrl(s.logo_url || t.logoUrl || '');
      setInstitutePhone(s.institute_phone || t.phone || '+94 11 234 5678');
      setInstituteEmail(s.institute_email || t.email || 'info@nimasfashion.lk');
      setInstituteAddress(s.institute_address || t.address || '');

      setStudentIdPrefix(s.student_id_prefix || 'NFA');
      setCurrencySymbol(s.currency_symbol || t.currency || 'LKR');
      setReminderDays(s.reminder_days_before_due || '7');
      setSmsSenderId(s.sms_sender_id || 'NIMAS-SMS');
    }
  }, [configData]);

  const updateSettingsMutation = useMutation({
    mutationFn: async () => {
      const updates: Record<string, string> = {
        institute_name: instituteName.trim(),
        institute_tagline: instituteTagline.trim(),
        logo_url: logoUrl.trim(),
        institute_phone: institutePhone.trim(),
        institute_email: instituteEmail.trim(),
        institute_address: instituteAddress.trim(),
        student_id_prefix: studentIdPrefix.trim().toUpperCase(),
        currency_symbol: currencySymbol.trim(),
        reminder_days_before_due: reminderDays.trim(),
        sms_sender_id: smsSenderId.trim(),
      };

      const res = await api.patch('/settings', updates);
      return res.data;
    },
    onSuccess: (data) => {
      success('Settings Saved!', `Branding and rules updated for ${data.tenant.name}.`);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      error('Error', err.response?.data?.message || 'Failed to update settings');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate();
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              <span>Institute Settings & SaaS Rules</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Fully dynamic configuration. Change your institute branding, student ID prefixes, SMS reminders, and billing currency.
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={updateSettingsMutation.isPending}
            className="gap-2 shadow-sm font-semibold"
          >
            <Save className="h-4 w-4" />
            <span>{updateSettingsMutation.isPending ? 'Saving...' : 'Save All Settings'}</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Institute Branding */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                <span>Institute Profile & Branding</span>
              </CardTitle>
              <CardDescription>
                Customize your academy name, contact info, and logo. This reflects across the entire system, invoices, and public portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Institute / Academy Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Nimas Fashion Academy"
                    value={instituteName}
                    onChange={(e) => setInstituteName(e.target.value)}
                    required
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Change this to rebrand the platform for any client or institute.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Tagline / Subtitle
                  </label>
                  <Input
                    placeholder="e.g. Excellence in Fashion & Apparel Education"
                    value={instituteTagline}
                    onChange={(e) => setInstituteTagline(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Logo / Avatar Image URL
                </label>
                <Input
                  placeholder="https://... (URL to your institute logo)"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Official Phone Number
                  </label>
                  <Input
                    placeholder="e.g. +94 11 234 5678"
                    value={institutePhone}
                    onChange={(e) => setInstitutePhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Official Contact Email
                  </label>
                  <Input
                    type="email"
                    placeholder="e.g. info@nimasfashion.lk"
                    value={instituteEmail}
                    onChange={(e) => setInstituteEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Campus Address
                </label>
                <Input
                  placeholder="e.g. No. 45, Fashion Avenue, Colombo 07, Sri Lanka"
                  value={instituteAddress}
                  onChange={(e) => setInstituteAddress(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 2. Student ID & Billing Currency */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="h-5 w-5 text-primary" />
                <span>Student ID & Currency Configurations</span>
              </CardTitle>
              <CardDescription>
                Configure automatic ID generation prefixes and system currency symbol.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Student ID Prefix
                  </label>
                  <Input
                    placeholder="e.g. NFA or DFA or ABC"
                    value={studentIdPrefix}
                    onChange={(e) => setStudentIdPrefix(e.target.value)}
                    className="font-mono uppercase font-semibold"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Student IDs will be generated as: <span className="font-mono font-bold text-foreground">{studentIdPrefix}-00000X</span>
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Currency Symbol
                  </label>
                  <Input
                    placeholder="e.g. LKR or USD"
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    className="font-mono uppercase font-semibold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Installment Due Reminder Rules & SMS */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>Installment Due Date Reminders & SMS Engine</span>
              </CardTitle>
              <CardDescription>
                Requirement 9: Maintain dynamic date range from the admin side to remind students of upcoming installment due dates via SMS.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Reminder Window (Days Before Due Date)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    placeholder="e.g. 7"
                    value={reminderDays}
                    onChange={(e) => setReminderDays(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Students will receive an SMS reminder <span className="font-bold text-foreground">{reminderDays} days</span> before their installment due date.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    SMS Sender Mask / Header
                  </label>
                  <Input
                    placeholder="e.g. NIMAS-SMS"
                    value={smsSenderId}
                    onChange={(e) => setSmsSenderId(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="p-4 bg-muted/40 rounded-xl border border-border text-xs text-muted-foreground space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-indigo-500" />
                  <span>SMS Gateway Integration Status:</span>
                </div>
                <p className="text-[11px]">
                  Currently running in <span className="font-bold text-foreground">Mock / Simulator Mode</span>. Every payment and reminder generates a fully audited SMS record in the database and triggers real-time toast alerts. When you choose your SMS telco gateway in the future, only the SMS provider adapter will be connected!
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="gap-2 shadow-sm font-semibold"
            >
              <Save className="h-4 w-4" />
              <span>{updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}</span>
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
