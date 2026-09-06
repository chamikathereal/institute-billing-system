'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  Printer,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/axios';

function PaymentsTerminalContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const queryClient = useQueryClient();
  const { success, sms, error } = useToast();

  const [keyword, setKeyword] = React.useState(initialSearch);
  const [activeKeyword, setActiveKeyword] = React.useState(initialSearch);

  // Selected student and enrollment
  const [selectedInstallmentId, setSelectedInstallmentId] = React.useState<string | null>(null);
  const [payAmount, setPayAmount] = React.useState('');
  const [payMethod, setPayMethod] = React.useState<'CASH' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [customNextDueDate, setCustomNextDueDate] = React.useState('');
  const [payReference, setPayReference] = React.useState('');

  // Receipt modal state
  const [lastReceipt, setLastReceipt] = React.useState<any | null>(null);

  // Search student query
  const { data: student, isLoading, isError, refetch } = useQuery({
    queryKey: ['pending-installments', activeKeyword],
    queryFn: async () => {
      if (!activeKeyword.trim()) return null;
      const res = await api.get(`/payments/student-pending/${encodeURIComponent(activeKeyword.trim())}`);
      return res.data;
    },
    enabled: !!activeKeyword.trim(),
    retry: false,
  });

  const enrollment = student?.enrollments?.[0];
  const invoice = enrollment?.invoice;
  const paymentPlan = enrollment?.paymentPlan;
  const installments = paymentPlan?.installments || [];

  // Auto-select first unpaid installment
  React.useEffect(() => {
    if (installments.length > 0) {
      const firstUnpaid = installments.find(
        (i: any) => i.status === 'PENDING' || i.status === 'PARTIALLY_PAID'
      );
      if (firstUnpaid) {
        setSelectedInstallmentId(firstUnpaid.id);
        const rem = Number(firstUnpaid.expectedAmount) - Number(firstUnpaid.paidAmount);
        setPayAmount(String(rem > 0 ? rem : firstUnpaid.expectedAmount));
      }
    }
  }, [student]);

  const recordPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!student || !enrollment) throw new Error('No student or enrollment selected');

      const payload: any = {
        studentId: student.id,
        enrollmentId: enrollment.id,
        installmentId: selectedInstallmentId || undefined,
        amount: Number(payAmount),
        method: payMethod,
        reference: payReference || undefined,
        customNextDueDate: customNextDueDate || undefined,
        receivedBy: 'System Admin',
      };

      const res = await api.post('/payments', payload);
      return res.data;
    },
    onSuccess: (data) => {
      success('Payment Successful!', `Receipt #${data.payment.paymentNumber} issued.`);
      sms(
        'SMS Confirmation Sent',
        `Dispatched to ${student.mobile}. New balance: LKR ${Number(data.invoice.balance).toLocaleString()}`
      );
      setLastReceipt({
        ...data.payment,
        student,
        enrollment,
        invoice: data.invoice,
      });
      queryClient.invalidateQueries({ queryKey: ['pending-installments', activeKeyword] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (err: any) => {
      error('Payment Error', err.response?.data?.message || 'Failed to record payment');
    },
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      setActiveKeyword(keyword.trim());
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            <span>Installment Payment Terminal</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Search student by NIC, Student ID, mobile number, or email, then record exact, partial, or custom advance payments.
          </p>
        </div>

        {/* Search Student Box */}
        <Card className="border-primary/20 bg-gradient-to-r from-card to-primary/5">
          <CardContent className="p-6">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3.5 top-3 text-muted-foreground" />
                <Input
                  className="pl-10 h-10 bg-card text-sm"
                  placeholder="Enter Student ID (e.g. NFA-000001), NIC (e.g. 200065412345), mobile, or email..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  autoFocus
                />
              </div>
              <Button type="submit" className="h-10 px-6 font-semibold gap-2">
                <Search className="h-4 w-4" />
                <span>Search Student</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* If loading */}
        {isLoading && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Searching student billing records...
          </div>
        )}

        {/* If not found */}
        {isError && (
          <div className="p-8 text-center bg-card rounded-xl border border-destructive/20 text-destructive space-y-2">
            <AlertCircle className="h-8 w-8 mx-auto opacity-80" />
            <h3 className="font-bold text-base">Student Not Found</h3>
            <p className="text-xs text-muted-foreground">
              No active student matches "{activeKeyword}". Please verify the ID, NIC, or mobile number.
            </p>
          </div>
        )}

        {/* If student found */}
        {student && enrollment && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
            {/* Left 2 Cols: Student Info & Installments Selection */}
            <div className="lg:col-span-2 space-y-6">
              {/* Student & Course Summary Card */}
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                      {student.firstName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          {student.firstName} {student.lastName}
                        </CardTitle>
                        <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                          {student.studentId}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {student.mobile} • NIC: {student.nic || 'N/A'} • {enrollment.course.name}
                      </CardDescription>
                    </div>
                  </div>

                  <Link href={`/students/${student.id}`}>
                    <Button variant="ghost" size="xs" className="text-xs gap-1">
                      <span>View Profile</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="grid grid-cols-3 gap-3 p-3 bg-muted/40 rounded-lg text-xs font-mono">
                    <div>
                      <div className="text-muted-foreground">Total Invoiced</div>
                      <div className="font-bold text-foreground">
                        LKR {Number(invoice?.totalAmount || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total Paid</div>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        LKR {Number(invoice?.paidAmount || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Outstanding Balance</div>
                      <div className="font-bold text-amber-600 dark:text-amber-400">
                        LKR {Number(invoice?.balance || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Installment Scheme Selector */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Select Installment to Settle</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      Click an installment to populate expected amount
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {installments.map((inst: any) => {
                    const isSelected = selectedInstallmentId === inst.id;
                    const isPaid = inst.status === 'PAID';
                    const expected = Number(inst.expectedAmount);
                    const paid = Number(inst.paidAmount);
                    const rem = Math.max(0, expected - paid);

                    return (
                      <div
                        key={inst.id}
                        onClick={() => {
                          if (!isPaid) {
                            setSelectedInstallmentId(inst.id);
                            setPayAmount(String(rem));
                          }
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                            : isPaid
                            ? 'border-border/60 bg-muted/20 opacity-70 cursor-default'
                            : 'border-border bg-card hover:bg-muted/40'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{inst.title}</span>
                            {isPaid ? (
                              <Badge variant="success" className="text-[10px]">
                                Paid
                              </Badge>
                            ) : paid > 0 ? (
                              <Badge variant="warning" className="text-[10px]">
                                Partial
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-[10px]">
                                Due
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 font-mono">
                            <Clock className="h-3 w-3" />
                            <span>
                              Due:{' '}
                              {inst.dueDate
                                ? new Date(inst.dueDate).toLocaleDateString()
                                : 'Settlement'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <div className="font-bold text-sm text-foreground">
                            LKR {expected.toLocaleString()}
                          </div>
                          {paid > 0 && (
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                              Paid: LKR {paid.toLocaleString()}
                            </div>
                          )}
                          {!isPaid && (
                            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                              Rem: LKR {rem.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Payment Input & Overpayment Form */}
            <div>
              <Card className="sticky top-20 border-primary/30 shadow-lg">
                <CardHeader className="bg-primary/5 pb-4 border-b border-border">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Payment & Custom Schedule</span>
                  </CardTitle>
                  <CardDescription>
                    Record transaction and optionally reschedule next due date
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {/* Amount Input */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Payment Amount (LKR) <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 5000"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="font-mono text-base font-bold"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Example: If student pays LKR 10,000 on a LKR 5,000 installment, surplus is credited to subsequent milestones automatically.
                    </p>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Payment Method
                    </label>
                    <div className="flex gap-2">
                      {(['CASH', 'CARD', 'BANK_TRANSFER'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPayMethod(m)}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                            payMethod === m
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                          }`}
                        >
                          {m === 'BANK_TRANSFER' ? 'BANK' : m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Requirement 11: Next Due Date Setting */}
                  <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span>Adjust Next Due Date (Optional)</span>
                    </label>
                    <Input
                      type="date"
                      value={customNextDueDate}
                      onChange={(e) => setCustomNextDueDate(e.target.value)}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Set a custom next installment due date for the student directly from this payment.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Reference / Slip No. (Optional)
                    </label>
                    <Input
                      placeholder="e.g. POS-SLIP-49102"
                      value={payReference}
                      onChange={(e) => setPayReference(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={() => recordPaymentMutation.mutate()}
                    disabled={
                      recordPaymentMutation.isPending ||
                      !payAmount ||
                      Number(payAmount) <= 0
                    }
                    className="w-full font-bold shadow-md h-10 mt-2"
                  >
                    {recordPaymentMutation.isPending ? 'Processing...' : 'Record Payment & Send SMS'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Modal: Receipt Popup */}
        <Modal
          isOpen={!!lastReceipt}
          onClose={() => setLastReceipt(null)}
          title="Payment Receipt Issued"
          description="Payment recorded successfully and SMS dispatched to student."
        >
          {lastReceipt && (
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-muted/40 rounded-xl border border-border font-mono text-xs space-y-2">
                <div className="flex justify-between font-bold text-sm text-primary">
                  <span>Receipt #{lastReceipt.paymentNumber}</span>
                  <span>{lastReceipt.method}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span>Student:</span>
                  <span className="font-semibold text-foreground">
                    {lastReceipt.student?.firstName} {lastReceipt.student?.lastName} (
                    {lastReceipt.student?.studentId})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Course:</span>
                  <span className="text-foreground">{lastReceipt.enrollment?.course?.name}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <span>Amount Paid:</span>
                  <span>LKR {Number(lastReceipt.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold">
                  <span>Remaining Balance:</span>
                  <span>LKR {Number(lastReceipt.invoice?.balance || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg">
                <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                  SMS Notification:
                </span>
                <span>Sent to {lastReceipt.student?.mobile}</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setLastReceipt(null)}>
                  Close
                </Button>
                <Link href={`/invoices/${lastReceipt.invoice?.id}`} target="_blank">
                  <Button size="sm" className="gap-1.5">
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Invoice / Receipt</span>
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
}

export default function PaymentsTerminalPage() {
  return (
    <React.Suspense
      fallback={
        <AppLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </AppLayout>
      }
    >
      <PaymentsTerminalContent />
    </React.Suspense>
  );
}
