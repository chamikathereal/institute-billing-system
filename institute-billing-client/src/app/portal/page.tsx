'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Globe,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  Printer,
  GraduationCap,
  Sparkles,
  CreditCard,
  FileText,
  AlertCircle,
  Building,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/axios';

export default function PublicStudentPortalPage() {
  const [studentIdInput, setStudentIdInput] = React.useState('');
  const [queriedId, setQueriedId] = React.useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-lookup', queriedId],
    queryFn: async () => {
      if (!queriedId.trim()) return null;
      const res = await api.get(`/public/student-lookup/${encodeURIComponent(queriedId.trim())}`);
      return res.data;
    },
    enabled: !!queriedId.trim(),
    retry: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentIdInput.trim()) {
      setQueriedId(studentIdInput.trim());
    }
  };

  const student = data?.student;
  const institute = data?.institute;
  const enrollment = data?.enrollments?.[0];
  const course = enrollment?.course;
  const invoice = enrollment?.invoice;
  const paymentPlan = enrollment?.paymentPlan;
  const installments = paymentPlan?.installments || [];
  const payments = enrollment?.payments || [];
  const discounts = enrollment?.discounts || [];

  const total = invoice ? Number(invoice.totalAmount) : 0;
  const paid = invoice ? Number(invoice.paidAmount) : 0;
  const balance = invoice ? Number(invoice.balance) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background flex flex-col">
      {/* Public Header */}
      <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
            {institute?.name?.charAt(0) || 'N'}
          </div>
          <span className="font-bold text-base tracking-tight text-foreground">
            {institute?.name || 'Nimas Fashion Academy'}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium font-mono hidden sm:inline-block">
            Student Portal
          </span>
        </div>

        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
          Admin Portal →
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Search Hero */}
        <div className="text-center space-y-3 pt-4">
          <Badge variant="outline" className="px-3 py-1 font-mono text-xs gap-1.5">
            <Globe className="h-3 w-3 text-sky-500" />
            <span>Global Student Billing Lookup (Passwordless)</span>
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Check Your Invoices & Payment Schedule
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Enter your assigned Student ID to view your course enrollment fees, installment due dates, and verified payment receipts.
          </p>

          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row max-w-md mx-auto gap-2 pt-2"
          >
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3.5 top-3 text-muted-foreground" />
              <Input
                placeholder="Enter Student ID (e.g. NFA-000001)..."
                className="pl-10 h-10 bg-card font-mono text-sm"
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                autoFocus
              />
            </div>
            <Button type="submit" className="h-10 px-6 font-semibold">
              Lookup
            </Button>
          </form>

          {/* Quick hint */}
          <div className="text-xs text-muted-foreground">
            Try sample Student ID:{' '}
            <button
              type="button"
              onClick={() => {
                setStudentIdInput('NFA-000001');
                setQueriedId('NFA-000001');
              }}
              className="text-primary underline font-mono font-semibold hover:opacity-80"
            >
              NFA-000001
            </button>{' '}
            or{' '}
            <button
              type="button"
              onClick={() => {
                setStudentIdInput('NFA-000002');
                setQueriedId('NFA-000002');
              }}
              className="text-primary underline font-mono font-semibold hover:opacity-80"
            >
              NFA-000002
            </button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Retrieving student invoice record...
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="p-6 text-center bg-card rounded-2xl border border-destructive/20 text-destructive space-y-2 max-w-md mx-auto">
            <AlertCircle className="h-8 w-8 mx-auto opacity-80" />
            <h3 className="font-bold text-base">Record Not Found</h3>
            <p className="text-xs text-muted-foreground">
              No student found matching "{queriedId}". Please ensure your Student ID matches your registration slip (e.g. NFA-000001).
            </p>
          </div>
        )}

        {/* Found Student Billing Profile */}
        {student && enrollment && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Student Welcome Card */}
            <div className="p-6 bg-card rounded-2xl border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div>
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Verified Student Profile
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
                  {student.firstName} {student.lastName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                    {student.studentId}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Enrolled at {institute?.name}
                  </span>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-border sm:pl-6">
                <div className="text-[11px] text-muted-foreground uppercase font-semibold">
                  Outstanding Balance
                </div>
                <div className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                  LKR {balance.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  Paid: LKR {paid.toLocaleString()} of {total.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Course & Invoice Breakdown */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-primary uppercase tracking-wider font-mono">
                    {course?.code}
                  </div>
                  <CardTitle className="text-lg mt-0.5">{course?.name}</CardTitle>
                  <CardDescription className="text-xs">
                    Invoice #{invoice?.invoiceNumber} • Plan: {paymentPlan?.type}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    invoice?.status === 'PAID'
                      ? 'success'
                      : invoice?.status === 'PARTIALLY_PAID'
                      ? 'warning'
                      : 'destructive'
                  }
                >
                  {invoice?.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/40 rounded-xl font-mono text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Course Fee</span>
                    <span className="font-bold text-foreground">
                      LKR {Number(invoice?.subtotal || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Discounts</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      - LKR {Number(invoice?.discountTotal || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Final Payable</span>
                    <span className="font-bold text-primary">
                      LKR {total.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Total Paid</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      LKR {paid.toLocaleString()}
                    </span>
                  </div>
                </div>

                {discounts.length > 0 && (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-xs space-y-1">
                    <div className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Loyalty / Special Discount Applied:</span>
                    </div>
                    {discounts.map((d: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-muted-foreground">
                        <span>{d.name} {d.reason && `(${d.reason})`}</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          - LKR {Number(d.amount).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Installment Payment Timetable */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Installment Payment Schedule</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Review all milestone due dates and payment statuses
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Milestone</TableHead>
                      <TableHead className="text-right">Expected</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installments.map((inst: any) => {
                      const isPaid = inst.status === 'PAID';
                      const isPartial = inst.status === 'PARTIALLY_PAID';

                      return (
                        <TableRow key={inst.id}>
                          <TableCell className="font-mono text-xs font-bold text-muted-foreground">
                            {inst.installmentNumber}
                          </TableCell>
                          <TableCell className="text-xs font-medium">{inst.title}</TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            LKR {Number(inst.expectedAmount).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            LKR {Number(inst.paidAmount).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {inst.dueDate
                              ? new Date(inst.dueDate).toLocaleDateString()
                              : 'Settlement'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={isPaid ? 'success' : isPartial ? 'warning' : 'destructive'}
                              className="text-[10px]"
                            >
                              {inst.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Verified Payment Receipts */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span>Verified Payment Receipts</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Official payments recorded by the academy
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
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
                            {new Date(p.paidAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {p.method}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                            + LKR {Number(p.amount).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-20 text-center text-xs text-muted-foreground">
                          No payments recorded yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Print Action */}
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs"
                onClick={() => window.print()}
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Payment Statement</span>
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6 text-center text-xs text-muted-foreground">
        <div>{institute?.name || 'Nimas Fashion Academy'} • Student Billing Portal</div>
        <div className="text-[11px] opacity-70 mt-0.5">
          For payment inquiries, please contact the academy administration.
        </div>
      </footer>
    </div>
  );
}
