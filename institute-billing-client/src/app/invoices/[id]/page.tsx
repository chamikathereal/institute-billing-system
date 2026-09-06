'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Printer, ArrowLeft, Download, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/axios';

export default function InvoicePrintViewPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params?.id as string;

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice-detail', invoiceId],
    queryFn: async () => {
      const res = await api.get(`/invoices/${invoiceId}`);
      return res.data;
    },
    enabled: !!invoiceId,
  });

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading printable invoice...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-4">
        <h2 className="text-xl font-bold">Invoice Not Found</h2>
        <Button onClick={() => router.push('/invoices')}>Back to Invoices</Button>
      </div>
    );
  }

  const tenant = invoice.tenant || settingsData?.tenant;
  const settings = settingsData?.settings || {};

  const instituteName = settings.institute_name || tenant?.name || 'Nimas Fashion Academy';
  const instituteAddress =
    settings.institute_address || tenant?.address || 'No. 45, Fashion Avenue, Colombo 07, Sri Lanka';
  const institutePhone = settings.institute_phone || tenant?.phone || '+94 11 234 5678';
  const instituteEmail = settings.institute_email || tenant?.email || 'info@nimasfashion.lk';
  const logoUrl = tenant?.logoUrl;

  const student = invoice.student;
  const enrollment = invoice.enrollment;
  const course = enrollment?.course;
  const discounts = enrollment?.discounts || [];
  const payments = invoice.payments || [];
  const installments = enrollment?.paymentPlan?.installments || [];

  const subtotal = Number(invoice.subtotal);
  const discountTotal = Number(invoice.discountTotal);
  const totalAmount = Number(invoice.totalAmount);
  const paidAmount = Number(invoice.paidAmount);
  const balance = Number(invoice.balance);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6">
      {/* Top Action Bar (Hidden on Print) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/invoices"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Invoices</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handlePrint} className="gap-2 shadow-sm font-semibold">
            <Printer className="h-4 w-4" />
            <span>Print / Save as PDF</span>
          </Button>
        </div>
      </div>

      {/* Official Invoice Sheet */}
      <div className="max-w-3xl mx-auto bg-card rounded-2xl border border-border p-8 sm:p-12 shadow-xl print:shadow-none print:border-0 print:p-0 print:m-0 text-foreground">
        {/* Header Branding */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-border pb-8">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl">
                {instituteName.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">{instituteName}</h1>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">{instituteAddress}</p>
              <div className="text-xs text-muted-foreground mt-1">
                <span>Tel: {institutePhone}</span> • <span>Email: {instituteEmail}</span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="text-xs uppercase tracking-widest font-bold text-primary font-mono">
              OFFICIAL INVOICE
            </span>
            <div className="font-mono text-xl font-extrabold tracking-tight">
              {invoice.invoiceNumber}
            </div>
            <div className="text-xs text-muted-foreground">
              Issued: {new Date(invoice.issueDate).toLocaleDateString()}
            </div>
            <Badge
              variant={
                invoice.status === 'PAID'
                  ? 'success'
                  : invoice.status === 'PARTIALLY_PAID'
                  ? 'warning'
                  : 'destructive'
              }
              className="mt-1"
            >
              {invoice.status}
            </Badge>
          </div>
        </div>

        {/* Billed To */}
        <div className="grid grid-cols-2 gap-6 py-6 border-b border-border text-xs">
          <div>
            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
              Billed To:
            </span>
            <h3 className="text-sm font-bold text-foreground mt-1">
              {student?.firstName} {student?.lastName}
            </h3>
            <p className="text-muted-foreground mt-0.5">
              Student ID:{' '}
              <span className="font-mono font-bold text-foreground">{student?.studentId}</span>
            </p>
            {student?.nic && <p className="text-muted-foreground">NIC: {student.nic}</p>}
            <p className="text-muted-foreground">Mobile: {student?.mobile}</p>
            {student?.address && <p className="text-muted-foreground">Address: {student.address}</p>}
          </div>

          <div className="text-right">
            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
              Enrollment Details:
            </span>
            <h3 className="text-sm font-bold text-foreground mt-1">{course?.name}</h3>
            <p className="text-muted-foreground mt-0.5 font-mono">Code: {course?.code}</p>
            <p className="text-muted-foreground">Plan: {enrollment?.paymentPlanType}</p>
            {invoice.dueDate && (
              <p className="text-muted-foreground">
                Next Due: {new Date(invoice.dueDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6 border-b border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                <th className="text-left py-2">Item & Description</th>
                <th className="text-right py-2">Amount (LKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              <tr>
                <td className="py-3 pr-4">
                  <div className="font-semibold text-foreground text-sm">{course?.name}</div>
                  <div className="text-muted-foreground text-[11px] font-sans mt-0.5">
                    Full curriculum, practical sessions, studio equipment access, and diploma examination.
                  </div>
                </td>
                <td className="py-3 text-right font-medium text-foreground text-sm align-top">
                  {subtotal.toLocaleString()}
                </td>
              </tr>

              {/* Explicit Discount Line Item */}
              {discounts.map((d: any) => (
                <tr key={d.id} className="text-emerald-600 dark:text-emerald-400">
                  <td className="py-2.5 pr-4">
                    <div className="font-semibold">Discount: {d.name}</div>
                    {d.reason && (
                      <div className="text-[11px] opacity-90 font-sans">{d.reason}</div>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-semibold">
                    - {Number(d.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Breakdown */}
        <div className="py-6 border-b border-border flex justify-end">
          <div className="w-64 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span>LKR {subtotal.toLocaleString()}</span>
            </div>

            {discountTotal > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Total Discount:</span>
                <span>- LKR {discountTotal.toLocaleString()}</span>
              </div>
            )}

            <div className="pt-2 border-t border-border flex justify-between font-bold text-sm text-foreground">
              <span>Final Total:</span>
              <span>LKR {totalAmount.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>Paid to Date:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                LKR {paidAmount.toLocaleString()}
              </span>
            </div>

            <div className="pt-2 border-t border-border flex justify-between font-bold text-sm text-amber-600 dark:text-amber-400">
              <span>Balance Due:</span>
              <span>LKR {balance.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Payments Made Receipts */}
        {payments.length > 0 && (
          <div className="py-6 border-b border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Payment Receipts Issued
            </h4>
            <div className="space-y-2 font-mono text-xs">
              {payments.map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg"
                >
                  <div>
                    <span className="font-bold text-foreground">{p.paymentNumber}</span>
                    <span className="text-muted-foreground ml-2">
                      via {p.method} on {new Date(p.paidAt).toLocaleDateString()}
                    </span>
                    {p.reference && (
                      <span className="text-muted-foreground text-[11px] block">
                        Ref: {p.reference}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    LKR {Number(p.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Installment Timetable on Invoice */}
        {installments.length > 1 && (
          <div className="py-6 border-b border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Installment Schedule
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
              {installments.map((inst: any) => (
                <div
                  key={inst.id}
                  className="p-2.5 rounded-lg border border-border/80 bg-card space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{inst.title}</span>
                    <Badge variant={inst.status === 'PAID' ? 'success' : 'outline'} className="text-[9px]">
                      {inst.status}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">
                    Expected: LKR {Number(inst.expectedAmount).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Due: {inst.dueDate ? new Date(inst.dueDate).toLocaleDateString() : 'Settlement'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer & Signature */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">Terms & Conditions:</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Course fees are non-refundable. Installment payments must be settled on or before the due date.
            </p>
          </div>

          <div className="text-center sm:text-right shrink-0">
            <div className="w-40 border-b border-foreground/30 mb-1" />
            <span className="text-[11px] font-mono">Authorized Signature & Stamp</span>
          </div>
        </div>
      </div>
    </div>
  );
}
