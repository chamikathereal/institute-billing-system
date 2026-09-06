'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus,
  CreditCard,
  Percent,
  GraduationCap,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/axios';

export default function StudentRegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, sms, error } = useToast();

  // Form states
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [nic, setNic] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [age, setAge] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const [selectedCourseId, setSelectedCourseId] = React.useState('');
  const [selectedDiscountId, setSelectedDiscountId] = React.useState('');
  const [customDiscountAmount, setCustomDiscountAmount] = React.useState('');
  const [discountReason, setDiscountReason] = React.useState('');

  const [paymentPlanType, setPaymentPlanType] = React.useState<'FULL_PAYMENT' | 'INSTALLMENT'>('INSTALLMENT');
  const [selectedSchemeId, setSelectedSchemeId] = React.useState('');

  const [initialPaymentMethod, setInitialPaymentMethod] = React.useState<'CASH' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [initialPaymentAmount, setInitialPaymentAmount] = React.useState('');
  const [paymentReference, setPaymentReference] = React.useState('');

  // Fetch courses
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await api.get('/courses');
      return res.data;
    },
  });

  // Fetch discounts
  const { data: discounts = [] } = useQuery({
    queryKey: ['discounts'],
    queryFn: async () => {
      const res = await api.get('/discounts');
      return res.data;
    },
  });

  // Selected course object
  const selectedCourse = courses.find((c: any) => c.id === selectedCourseId);
  const basePrice = selectedCourse ? Number(selectedCourse.basePrice) : 0;

  // Selected discount calculation
  let discountAmount = 0;
  if (selectedDiscountId === 'custom') {
    discountAmount = Number(customDiscountAmount) || 0;
  } else if (selectedDiscountId) {
    const disc = discounts.find((d: any) => d.id === selectedDiscountId);
    if (disc) {
      if (disc.type === 'PERCENTAGE') {
        discountAmount = (basePrice * Number(disc.value)) / 100;
      } else {
        discountAmount = Number(disc.value);
      }
    }
  }

  const finalPrice = Math.max(0, basePrice - discountAmount);
  const initialAmountPaid = Number(initialPaymentAmount) || 0;
  const balance = Math.max(0, finalPrice - initialAmountPaid);

  // Auto-set initial payment to full amount if Full Payment is selected
  React.useEffect(() => {
    if (paymentPlanType === 'FULL_PAYMENT' && finalPrice > 0) {
      setInitialPaymentAmount(String(finalPrice));
    }
  }, [paymentPlanType, finalPrice]);

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        newStudent: {
          firstName: firstName.trim(),
          lastName: lastName.trim() || undefined,
          mobile: mobile.trim(),
          nic: nic.trim() || undefined,
          email: email.trim() || undefined,
          age: age ? Number(age) : undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        courseId: selectedCourseId,
        paymentPlanType,
        installmentSchemeId: selectedSchemeId || undefined,
        initialPayment: initialAmountPaid > 0 ? {
          amount: initialAmountPaid,
          method: initialPaymentMethod,
          reference: paymentReference || undefined,
          notes: 'Initial registration payment',
        } : undefined,
      };

      if (selectedDiscountId === 'custom') {
        payload.customDiscountAmount = Number(customDiscountAmount);
        payload.discountReason = discountReason || 'Custom adjustment';
      } else if (selectedDiscountId) {
        payload.discountId = selectedDiscountId;
        payload.discountReason = discountReason || undefined;
      }

      const res = await api.post('/enrollments', payload);
      return res.data;
    },
    onSuccess: (data) => {
      success('Student Registered!', `Assigned Student ID: ${data.student.studentId}`);
      sms(
        'SMS Confirmation Sent',
        `Notification dispatched to ${data.student.mobile} with receipt ${data.payment?.paymentNumber || data.invoice.invoiceNumber}.`
      );
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });

      // Navigate to dedicated student profile
      router.push(`/students/${data.student.id}`);
    },
    onError: (err: any) => {
      error('Registration Failed', err.response?.data?.message || 'Could not complete enrollment.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      error('Validation Error', 'First Name is required.');
      return;
    }
    if (!mobile.trim()) {
      error('Validation Error', 'Mobile Number is required.');
      return;
    }
    if (!selectedCourseId) {
      error('Validation Error', 'Please select a course.');
      return;
    }
    enrollMutation.mutate();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-primary" />
              <span>Student Registration & Course Enrollment</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Standard order: Student information, course selection, dynamic discount application, and initial payment.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2-column form */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Student Information */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    1
                  </span>
                  <span>Student Personal Details</span>
                </CardTitle>
                <CardDescription>
                  Student ID will be auto-generated sequentially according to tenant settings (e.g. NFA-00000X).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      First Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="e.g. Sanduni"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Last Name
                    </label>
                    <Input
                      placeholder="e.g. Fernando"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Mobile Number <span className="text-destructive">*</span> (for SMS notifications)
                    </label>
                    <Input
                      placeholder="e.g. 0771234567"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      National ID Card (NIC)
                    </label>
                    <Input
                      placeholder="e.g. 200065412345"
                      value={nic}
                      onChange={(e) => setNic(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="e.g. student@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Age
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 22"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Home Address
                  </label>
                  <Input
                    placeholder="e.g. No 42, Flower Road, Colombo 07"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Internal Admin Notes
                  </label>
                  <Input
                    placeholder="e.g. Previous student in 2024, recommended by alumni"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 2. Course & Dynamic Discount Selection */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    2
                  </span>
                  <span>Course & Dynamic Discount</span>
                </CardTitle>
                <CardDescription>
                  Select the desired course and optionally apply a dynamic discount (fixed amount or percentage).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Select Course <span className="text-destructive">*</span>
                  </label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      const crs = courses.find((c: any) => c.id === e.target.value);
                      if (crs && crs.schemes?.length > 0) {
                        setSelectedSchemeId(crs.schemes[0].id);
                      } else {
                        setSelectedSchemeId('');
                      }
                    }}
                    required
                  >
                    <option value="">-- Choose a Course --</option>
                    {courses.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code}) - LKR {Number(c.basePrice).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCourse && (
                  <div className="p-3 bg-muted/40 rounded-lg border border-border/80 flex items-start gap-4">
                    {selectedCourse.thumbnailUrl && (
                      <img
                        src={selectedCourse.thumbnailUrl}
                        alt="Course thumbnail"
                        className="w-16 h-16 rounded-md object-cover border border-border shrink-0"
                      />
                    )}
                    <div className="text-xs space-y-1">
                      <div className="font-semibold text-sm text-foreground">{selectedCourse.name}</div>
                      <p className="text-muted-foreground line-clamp-2">{selectedCourse.description}</p>
                      <div className="flex items-center gap-2 pt-1 font-mono">
                        <span className="font-bold text-foreground">
                          LKR {Number(selectedCourse.basePrice).toLocaleString()}
                        </span>
                        {selectedCourse.duration && <span>• {selectedCourse.duration}</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Dynamic Discounts */}
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Percent className="h-3.5 w-3.5 text-primary" />
                      <span>Dynamic Discount</span>
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      e.g. Previous Student Discount
                    </span>
                  </div>

                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={selectedDiscountId}
                    onChange={(e) => setSelectedDiscountId(e.target.value)}
                  >
                    <option value="">No Discount (Full Fee)</option>
                    {discounts.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.type === 'PERCENTAGE' ? `${d.value}%` : `LKR ${Number(d.value).toLocaleString()}`})
                      </option>
                    ))}
                    <option value="custom">-- Custom Discount Amount --</option>
                  </select>

                  {selectedDiscountId === 'custom' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-1 block">
                          Custom Discount Amount (LKR)
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g. 5000"
                          value={customDiscountAmount}
                          onChange={(e) => setCustomDiscountAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-1 block">
                          Reason / Reference
                        </label>
                        <Input
                          placeholder="e.g. Returning student loyalty waiver"
                          value={discountReason}
                          onChange={(e) => setDiscountReason(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 3. Payment Plan & Initial Settlement */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    3
                  </span>
                  <span>Payment Plan & Initial Payment</span>
                </CardTitle>
                <CardDescription>
                  Choose between Full Payment or Installment Scheme, and record the initial registration payment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Plan Options Selector */}
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block">
                    Payment Plan Option
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentPlanType('INSTALLMENT')}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        paymentPlanType === 'INSTALLMENT'
                          ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div className="font-semibold text-sm">Installment Payment</div>
                      <div className="text-[11px] opacity-80 mt-0.5">Split into milestones with due dates</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentPlanType('FULL_PAYMENT')}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        paymentPlanType === 'FULL_PAYMENT'
                          ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div className="font-semibold text-sm">Full Payment</div>
                      <div className="text-[11px] opacity-80 mt-0.5">Settle 100% course fee (No due dates)</div>
                    </button>
                  </div>
                </div>

                {/* Installment Scheme Selector (if installment) */}
                {paymentPlanType === 'INSTALLMENT' && selectedCourse?.schemes?.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Installment Scheme
                    </label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={selectedSchemeId}
                      onChange={(e) => setSelectedSchemeId(e.target.value)}
                    >
                      {selectedCourse.schemes.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.numberOfInstallments} Installments)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Initial Payment Inputs */}
                <div className="pt-2 border-t border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      Initial Payment Today
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Receiving cash or card right now
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1 block">
                        Payment Method
                      </label>
                      <div className="flex gap-2">
                        {(['CASH', 'CARD', 'BANK_TRANSFER'] as const).map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setInitialPaymentMethod(method)}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                              initialPaymentMethod === method
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                            }`}
                          >
                            {method === 'BANK_TRANSFER' ? 'BANK' : method}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1 block">
                        Amount Paid Today (LKR)
                      </label>
                      <Input
                        type="number"
                        placeholder="e.g. 10000"
                        value={initialPaymentAmount}
                        onChange={(e) => setInitialPaymentAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Payment Reference / Cheque / Card Slip (Optional)
                    </label>
                    <Input
                      placeholder="e.g. POS-AUTH-4819"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Summary Card */}
          <div className="space-y-6">
            <Card className="sticky top-20 border-primary/20 shadow-lg">
              <CardHeader className="bg-primary/5 pb-4 border-b border-border">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Billing Summary</span>
                  <Badge variant="outline" className="font-mono">
                    LIVE
                  </Badge>
                </CardTitle>
                <CardDescription>Instant calculation before submission</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Base Course Price:</span>
                    <span className="font-mono font-medium text-foreground">
                      LKR {basePrice.toLocaleString()}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Discount:</span>
                      <span className="font-mono font-semibold">
                        - LKR {discountAmount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-border flex items-center justify-between font-bold text-base">
                    <span>Final Invoiced:</span>
                    <span className="font-mono text-primary">
                      LKR {finalPrice.toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-muted-foreground">
                    <span>Paid Today:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      LKR {initialAmountPaid.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Remaining Balance:</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                      LKR {balance.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span>Plan Type:</span>
                    <span className="font-semibold text-foreground">
                      {paymentPlanType === 'FULL_PAYMENT' ? 'Full Payment' : 'Installment Plan'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-muted/40 rounded-lg border border-border text-xs text-muted-foreground space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span>Automated Actions:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    <li>Dedicated student profile created</li>
                    <li>Invoice #{'<auto>'} generated</li>
                    <li>Receipt #{'<auto>'} issued</li>
                    <li>SMS confirmation sent to student mobile</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full font-bold shadow-md"
                  disabled={enrollMutation.isPending || !selectedCourseId || !firstName.trim()}
                >
                  {enrollMutation.isPending ? 'Processing Registration...' : 'Complete Registration'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
