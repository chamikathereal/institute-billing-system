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
  ArrowRight,
  ArrowLeft,
  Check,
  User,
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
  const [birthday, setBirthday] = React.useState('');
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
      const res = await api.get('/courses?all=true');
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
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

  // Active scheme and 1st installment calculation
  const activeScheme =
    selectedCourse?.schemes?.find((s: any) => s.id === selectedSchemeId) ||
    selectedCourse?.schemes?.[0];

  let firstInstallmentAmount = 0;
  if (selectedCourse && finalPrice > 0) {
    if (activeScheme?.breakdownJson) {
      try {
        const steps = JSON.parse(activeScheme.breakdownJson);
        if (Array.isArray(steps) && steps.length > 0) {
          const schemeTotal = steps.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
          const ratio = schemeTotal > 0 ? finalPrice / schemeTotal : 1;
          firstInstallmentAmount = Math.round(Number(steps[0].amount) * ratio);
        }
      } catch (e) {}
    }
    if (!firstInstallmentAmount) {
      const numInstallments = activeScheme?.numberOfInstallments || 3;
      firstInstallmentAmount = Math.round(finalPrice / numInstallments);
    }
  }

  // Auto-set initial payment to 1st installment (if installment) or full amount (if full payment)
  React.useEffect(() => {
    if (finalPrice <= 0) return;

    if (paymentPlanType === 'FULL_PAYMENT') {
      setInitialPaymentAmount(String(finalPrice));
    } else if (paymentPlanType === 'INSTALLMENT' && firstInstallmentAmount > 0) {
      setInitialPaymentAmount(String(firstInstallmentAmount));
    }
  }, [paymentPlanType, selectedCourseId, selectedSchemeId, finalPrice, firstInstallmentAmount]);

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        newStudent: {
          firstName: firstName.trim(),
          lastName: lastName.trim() || undefined,
          mobile: mobile.trim(),
          nic: nic.trim() || undefined,
          email: email.trim() || undefined,
          age: undefined,
          birthday: birthday.trim() || undefined,
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

  // 3-Step Slideshow Navigation State
  const [currentStep, setCurrentStep] = React.useState<number>(1);

  const validateStep1 = () => {
    if (!firstName.trim()) {
      error('Validation Error', 'First Name is required.');
      return false;
    }
    if (!mobile.trim()) {
      error('Validation Error', 'Mobile Number is required for SMS notifications.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!selectedCourseId) {
      error('Validation Error', 'Please select a course to continue.');
      return false;
    }
    return true;
  };

  const goToNextStep = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
      setCurrentStep(3);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const goToStep = (stepNum: number) => {
    if (stepNum === 1) {
      setCurrentStep(1);
    } else if (stepNum === 2) {
      if (validateStep1()) setCurrentStep(2);
    } else if (stepNum === 3) {
      if (validateStep1() && validateStep2()) setCurrentStep(3);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    if (!validateStep2()) {
      setCurrentStep(2);
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

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Slideshow Column */}
          <div className="lg:col-span-2 min-w-0 space-y-4">
            {/* 3-Step Progress Stepper */}
            <div className="bg-card border border-border/80 rounded-xl p-4 shadow-2xs">
              <div className="relative flex items-center justify-between">
                {/* Connecting Background Line */}
                <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-muted rounded-full z-0">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
                    }}
                  />
                </div>

                {/* Step 1 Node */}
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="relative z-10 flex items-center gap-3 bg-card px-2 cursor-pointer group text-left"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      currentStep > 1
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : currentStep === 1
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-sm'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {currentStep > 1 ? <Check className="h-4 w-4" /> : '1'}
                  </div>
                  <div className="hidden sm:block">
                    <div className={`text-xs font-semibold ${currentStep >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Personal Details
                    </div>
                    <div className="text-[10px] text-muted-foreground">Student info & contact</div>
                  </div>
                </button>

                {/* Step 2 Node */}
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="relative z-10 flex items-center gap-3 bg-card px-2 cursor-pointer group text-left"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      currentStep > 2
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : currentStep === 2
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-sm'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {currentStep > 2 ? <Check className="h-4 w-4" /> : '2'}
                  </div>
                  <div className="hidden sm:block">
                    <div className={`text-xs font-semibold ${currentStep >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Course & Discount
                    </div>
                    <div className="text-[10px] text-muted-foreground">Select course & fee waiver</div>
                  </div>
                </button>

                {/* Step 3 Node */}
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="relative z-10 flex items-center gap-3 bg-card px-2 cursor-pointer group text-left"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      currentStep === 3
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-sm'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    3
                  </div>
                  <div className="hidden sm:block">
                    <div className={`text-xs font-semibold ${currentStep === 3 ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Payment & Plan
                    </div>
                    <div className="text-[10px] text-muted-foreground">Settlement & finalize</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Slideshow Window & Track */}
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xs">
              <div
                className="flex transition-transform duration-500 ease-in-out w-full"
                style={{ transform: `translateX(-${(currentStep - 1) * 100}%)` }}
              >
                {/* SLIDE 1: Student Information */}
                <div className="w-full shrink-0 p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          1
                        </span>
                        <span>Student Personal Details</span>
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Student ID will be auto-generated sequentially according to tenant settings (e.g. NFA-00000X).
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[11px] font-mono">
                      Step 1 of 3
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-1 block">
                          First Name <span className="text-destructive">*</span>
                        </label>
                        <Input
                          placeholder="e.g. Sanduni"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
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
                          Date of Birth
                        </label>
                        <Input
                          type="date"
                          value={birthday}
                          onChange={(e) => setBirthday(e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                          onClick={(e) => {
                            try {
                              (e.target as any).showPicker?.();
                            } catch (err) {}
                          }}
                          className="cursor-pointer"
                        />
                        <p className="text-[11px] text-muted-foreground mt-1">Select date of birth</p>
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
                  </div>

                  {/* Slide 1 Footer Navigation */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      Fill required name & mobile to proceed
                    </span>
                    <Button
                      type="button"
                      onClick={goToNextStep}
                      className="gap-2 font-semibold shadow-xs"
                    >
                      <span>Continue to Course Selection</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* SLIDE 2: Course & Dynamic Discount Selection */}
                <div className="w-full shrink-0 p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          2
                        </span>
                        <span>Course & Dynamic Discount</span>
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Select the desired course and optionally apply a dynamic discount (fixed amount or percentage).
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[11px] font-mono">
                      Step 2 of 3
                    </Badge>
                  </div>

                  <div className="space-y-4">
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
                  </div>

                  {/* Slide 2 Footer Navigation */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goToPrevStep}
                      className="gap-2 text-xs"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back to Personal Details</span>
                    </Button>
                    <Button
                      type="button"
                      onClick={goToNextStep}
                      className="gap-2 font-semibold shadow-xs"
                    >
                      <span>Continue to Payment & Plan</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* SLIDE 3: Payment Plan & Initial Settlement */}
                <div className="w-full shrink-0 p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          3
                        </span>
                        <span>Payment Plan & Initial Payment</span>
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Choose between Full Payment or Installment Scheme, and record the initial registration payment.
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[11px] font-mono">
                      Step 3 of 3
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {/* Plan Options Selector */}
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-2 block">
                        Payment Plan Option
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentPlanType('INSTALLMENT');
                            if (firstInstallmentAmount > 0) {
                              setInitialPaymentAmount(String(firstInstallmentAmount));
                            }
                          }}
                          className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
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
                          onClick={() => {
                            setPaymentPlanType('FULL_PAYMENT');
                            if (finalPrice > 0) {
                              setInitialPaymentAmount(String(finalPrice));
                            }
                          }}
                          className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
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

                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div>
                          <label className="text-xs font-semibold text-foreground mb-2 block">
                            Payment Method
                          </label>
                          <select
                            className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={initialPaymentMethod}
                            onChange={(e) => setInitialPaymentMethod(e.target.value as 'CASH' | 'CARD' | 'BANK_TRANSFER')}
                          >
                            <option value="CASH">💵 Cash</option>
                            <option value="CARD">💳 Card</option>
                            <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                          </select>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-foreground block">
                              Amount Paid Today (LKR)
                            </label>
                            {paymentPlanType === 'INSTALLMENT' && firstInstallmentAmount > 0 && (
                              <button
                                type="button"
                                onClick={() => setInitialPaymentAmount(String(firstInstallmentAmount))}
                                className="text-[10px] text-primary hover:underline font-mono cursor-pointer"
                              >
                                1st Part: LKR {firstInstallmentAmount.toLocaleString()}
                              </button>
                            )}
                            {paymentPlanType === 'FULL_PAYMENT' && finalPrice > 0 && (
                              <button
                                type="button"
                                onClick={() => setInitialPaymentAmount(String(finalPrice))}
                                className="text-[10px] text-primary hover:underline font-mono cursor-pointer"
                              >
                                Full Fee: LKR {finalPrice.toLocaleString()}
                              </button>
                            )}
                          </div>
                          <Input
                            type="number"
                            placeholder="e.g. 10000"
                            value={initialPaymentAmount}
                            onChange={(e) => setInitialPaymentAmount(e.target.value)}
                          />
                          {paymentPlanType === 'INSTALLMENT' && firstInstallmentAmount > 0 && (
                            <p className="text-[11px] text-muted-foreground mt-1">
                              Auto-filled with 1st installment (LKR {firstInstallmentAmount.toLocaleString()}). Can be adjusted if paying more or less.
                            </p>
                          )}
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
                  </div>

                  {/* Slide 3 Footer Navigation */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goToPrevStep}
                      className="gap-2 text-xs"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back to Course Selection</span>
                    </Button>
                    <Button
                      type="submit"
                      disabled={enrollMutation.isPending || !selectedCourseId || !firstName.trim() || !mobile.trim()}
                      className="gap-2 font-bold shadow-md px-6 bg-primary hover:bg-primary/90"
                    >
                      {enrollMutation.isPending ? (
                        <span>Processing Registration...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Complete Registration</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Summary Card */}
          <div className="space-y-6">
            <Card className="sticky top-20 border-primary/20 shadow-lg">
              <CardHeader className="bg-primary/5 pb-4 border-b border-border">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Billing Summary</span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="font-mono text-[10px] bg-card">
                      Step {currentStep}/3
                    </Badge>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      LIVE
                    </Badge>
                  </div>
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
                  {paymentPlanType === 'INSTALLMENT' && firstInstallmentAmount > 0 && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>1st Milestone:</span>
                      <span className="font-mono font-medium text-foreground">
                        LKR {firstInstallmentAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
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

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={goToNextStep}
                    className="w-full font-bold shadow-md gap-2"
                  >
                    <span>Continue to Step {currentStep + 1}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="w-full font-bold shadow-md gap-2"
                    disabled={enrollMutation.isPending || !selectedCourseId || !firstName.trim() || !mobile.trim()}
                  >
                    {enrollMutation.isPending ? (
                      'Processing Registration...'
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Complete Registration</span>
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
