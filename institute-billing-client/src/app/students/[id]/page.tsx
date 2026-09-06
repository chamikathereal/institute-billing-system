'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Phone,
  Mail,
  CreditCard,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ArrowLeft,
  DollarSign,
  PlusCircle,
  Printer,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/axios';

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, sms, error } = useToast();
  const studentId = params?.id as string;

  // Payment modal state
  const [isPayModalOpen, setIsPayModalOpen] = React.useState(false);
  const [payInstallmentId, setPayInstallmentId] = React.useState<string | null>(null);
  const [payAmount, setPayAmount] = React.useState('');
  const [payMethod, setPayMethod] = React.useState<'CASH' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [customNextDueDate, setCustomNextDueDate] = React.useState('');
  const [payRef, setPayRef] = React.useState('');

  const { data: student, isLoading } = useQuery({
    queryKey: ['student-profile', studentId],
    queryFn: async () => {
      const res = await api.get(`/students/${studentId}`);
      return res.data;
    },
    enabled: !!studentId,
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async () => {
      const enrollment = student.enrollments?.[0];
      const payload: any = {
        studentId: student.id,
        enrollmentId: enrollment.id,
        installmentId: payInstallmentId || undefined,
        amount: Number(payAmount),
        method: payMethod,
        reference: payRef || undefined,
        customNextDueDate: customNextDueDate || undefined,
        receivedBy: 'System Admin',
      };

      const res = await api.post('/payments', payload);
      return res.data;
    },
    onSuccess: (data) => {
      success('Payment Recorded!', `Receipt #${data.payment.paymentNumber} created.`);
      sms(
        'SMS Receipt Sent',
        `Notification sent to ${student.mobile}. Remaining balance: LKR ${Number(data.invoice.balance).toLocaleString()}`
      );
      setIsPayModalOpen(false);
      setPayAmount('');
      setCustomNextDueDate('');
      setPayRef('');
      queryClient.invalidateQueries({ queryKey: ['student-profile', studentId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      error('Payment Error', err.response?.data?.message || 'Failed to record payment');
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
          Loading dedicated student profile...
        </div>
      </AppLayout>
    );
  }

  if (!student) {
    return (
      <AppLayout>
        <div className="p-8 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Student Record Not Found</h2>
          <Button onClick={() => router.push('/students')}>Back to Students</Button>
        </div>
      </AppLayout>
    );
  }

  const enrollment = student.enrollments?.[0];
  const invoice = enrollment?.invoice;
  const paymentPlan = enrollment?.paymentPlan;
  const installments = paymentPlan?.installments || [];
  const payments = student.payments || [];
  const smsLogs = student.smsLogs || [];

  const total = invoice ? Number(invoice.totalAmount) : 0;
  const paid = invoice ? Number(invoice.paidAmount) : 0;
  const balance = invoice ? Number(invoice.balance) : 0;

  const openPaymentForInstallment = (inst: any) => {
    const remaining = Number(inst.expectedAmount) - Number(inst.paidAmount);
    setPayInstallmentId(inst.id);
    setPayAmount(String(remaining > 0 ? remaining : inst.expectedAmount));
    setIsPayModalOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/students"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Student Directory</span>
          </Link>

          {invoice && (
            <Link href={`/invoices/${invoice.id}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                <Printer className="h-3.5 w-3.5" />
                <span>Print Official Invoice</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Profile Header Banner */}
        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-primary/60 text-primary-foreground flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
              {student.firstName.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {student.firstName} {student.lastName}
                </h1>
                <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                  {student.studentId}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {student.mobile}
                </span>
                {student.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {student.email}
                  </span>
                )}
                {student.nic && <span>NIC: {student.nic}</span>}
                {student.age && <span>Age: {student.age}</span>}
              </div>

              {student.address && (
                <p className="text-xs text-muted-foreground pt-1">
                  <span className="font-medium text-foreground">Address:</span> {student.address}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="text-right p-4 bg-muted/40 rounded-xl border border-border/80">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Current Balance
              </div>
              <div className="text-xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                LKR {balance.toLocaleString()}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Paid: LKR {paid.toLocaleString()} of {total.toLocaleString()}
              </div>
            </div>

            {balance > 0 && (
              <Button
                onClick={() => {
                  setPayInstallmentId(null);
                  setPayAmount(String(balance));
                  setIsPayModalOpen(true);
                }}
                className="gap-2 shadow-xs"
              >
                <CreditCard className="h-4 w-4" />
                <span>Collect Payment</span>
              </Button>
            )}
          </div>
        </div>

        {/* 2-Column Grid: Course & Invoice Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Course, Installments, Payments, SMS */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Card */}
            {enrollment ? (
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      <span>Enrolled Course: {enrollment.course.name}</span>
                    </CardTitle>
                    <CardDescription>
                      Course Code: {enrollment.course.code} • Enrolled on{' '}
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={enrollment.status === 'ACTIVE' ? 'success' : 'secondary'}>
                    {enrollment.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg text-xs font-mono">
                    <div>
                      <div className="text-muted-foreground">Base Fee</div>
                      <div className="font-bold text-foreground">
                        LKR {Number(enrollment.originalPrice).toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <div className="text-muted-foreground">Discounts</div>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        - LKR {Number(enrollment.discountTotal).toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <div className="text-muted-foreground">Final Invoiced</div>
                      <div className="font-bold text-primary">
                        LKR {Number(enrollment.finalPrice).toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <div className="text-muted-foreground">Plan Type</div>
                      <div className="font-bold text-foreground">
                        {enrollment.paymentPlanType}
                      </div>
                    </div>
                  </div>

                  {/* Applied Discounts breakdown */}
                  {enrollment.discounts?.length > 0 && (
                    <div className="p-3 border border-emerald-500/20 bg-emerald-500/5 rounded-lg text-xs space-y-1">
                      <div className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Dynamic Discount Applied:</span>
                      </div>
                      {enrollment.discounts.map((d: any) => (
                        <div key={d.id} className="flex justify-between text-muted-foreground">
                          <span>
                            {d.name} {d.reason && `(${d.reason})`}
                          </span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            - LKR {Number(d.amount).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {/* Installment Payment Schedule */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>Installment Timetable & Statuses</span>
                  </CardTitle>
                  <CardDescription>
                    Milestone due dates, scheduled amounts, and payment tracking
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Installment Title</TableHead>
                      <TableHead className="text-right">Expected</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installments.length > 0 ? (
                      installments.map((inst: any) => {
                        const isPaid = inst.status === 'PAID';
                        const isPartial = inst.status === 'PARTIALLY_PAID';
                        const expected = Number(inst.expectedAmount);
                        const paidAmount = Number(inst.paidAmount);

                        return (
                          <TableRow key={inst.id}>
                            <TableCell className="font-mono text-xs font-bold text-muted-foreground">
                              {inst.installmentNumber}
                            </TableCell>
                            <TableCell className="font-medium text-xs">
                              {inst.title}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              LKR {expected.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                              LKR {paidAmount.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground">
                              {inst.dueDate ? (
                                new Date(inst.dueDate).toLocaleDateString()
                              ) : (
                                <span className="text-muted-foreground/60">No due date</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isPaid ? (
                                <Badge variant="success" className="text-[10px]">
                                  Paid
                                </Badge>
                              ) : isPartial ? (
                                <Badge variant="warning" className="text-[10px]">
                                  Partial
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-[10px]">
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {!isPaid && (
                                <Button
                                  variant="outline"
                                  size="xs"
                                  className="text-[11px] h-6 px-2"
                                  onClick={() => openPaymentForInstallment(inst)}
                                >
                                  Pay
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-20 text-center text-muted-foreground text-xs">
                          No installment schedule found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Payment Receipts History */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span>Recorded Payment Receipts</span>
                </CardTitle>
                <CardDescription>
                  Complete transaction history for this student
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference / Note</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length > 0 ? (
                      payments.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs font-bold text-primary">
                            {p.paymentNumber}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(p.paidAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {p.method}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {p.reference || p.notes || '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                            + LKR {Number(p.amount).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-20 text-center text-muted-foreground text-xs">
                          No payments recorded yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Invoice Summary & SMS Notification Log */}
          <div className="space-y-6">
            {/* Invoice Summary Box */}
            {invoice && (
              <Card className="border-primary/20">
                <CardHeader className="bg-primary/5 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-primary">
                      {invoice.invoiceNumber}
                    </span>
                    <Badge variant={invoice.status === 'PAID' ? 'success' : 'warning'}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold">Official Invoice</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4 text-xs font-mono">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span className="text-foreground">LKR {Number(invoice.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount:</span>
                    <span>- LKR {Number(invoice.discountTotal).toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-border flex justify-between font-bold text-sm text-foreground">
                    <span>Total Invoiced:</span>
                    <span>LKR {Number(invoice.totalAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Paid to Date:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      LKR {Number(invoice.paidAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-amber-600 dark:text-amber-400 text-sm">
                    <span>Balance Due:</span>
                    <span>LKR {Number(invoice.balance).toLocaleString()}</span>
                  </div>

                  <div className="pt-3">
                    <Link href={`/invoices/${invoice.id}`} target="_blank">
                      <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                        <Printer className="h-3.5 w-3.5" />
                        <span>View Printable Invoice</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SMS Notification Log */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-indigo-500" />
                  <span>SMS Notifications Sent</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Sent to {student.mobile}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {smsLogs.length > 0 ? (
                  smsLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg border border-border bg-muted/20 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <Badge variant="purple" className="text-[9px] px-1.5 py-0 font-mono">
                          {log.type}
                        </Badge>
                        <span className="text-muted-foreground text-[10px]">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed pt-1">
                        "{log.message}"
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No SMS notifications logged yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal: Collect Payment / Custom Installment Payment */}
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title="Record Installment Payment"
          description={`Record payment for ${student.firstName} ${student.lastName} (${student.studentId})`}
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Payment Amount (LKR)
              </label>
              <Input
                type="number"
                placeholder="e.g. 5000 or 10000"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Supports custom or overpayment (extra amounts automatically credit towards subsequent installments).
              </p>
            </div>

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

            {/* Custom Next Due Date */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Next Installment Due Date (Optional)
              </label>
              <Input
                type="date"
                value={customNextDueDate}
                onChange={(e) => setCustomNextDueDate(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                If the student makes a custom or advance payment, you can adjust the subsequent installment due date right here.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Reference / Note (Optional)
              </label>
              <Input
                placeholder="e.g. Cheque #49102, Card slip"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsPayModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => recordPaymentMutation.mutate()}
                disabled={recordPaymentMutation.isPending || !payAmount || Number(payAmount) <= 0}
              >
                {recordPaymentMutation.isPending ? 'Processing...' : 'Confirm Payment & Send SMS'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
