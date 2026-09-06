'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Search,
  Printer,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/axios';

export default function InvoicesListPage() {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', search, statusFilter],
    queryFn: async () => {
      const res = await api.get('/invoices', {
        params: {
          search: search.trim() || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        },
      });
      return res.data;
    },
  });

  const invoices = data?.data || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <span>Invoices & Official Receipts</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Browse, filter, and print student invoices and payment history.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              className="pl-9 bg-card"
              placeholder="Search by invoice #, student name, or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {['ALL', 'PAID', 'PARTIALLY_PAID', 'UNPAID'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                  statusFilter === st
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                {st === 'ALL' ? 'All Invoices' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Total Invoiced</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length > 0 ? (
                  invoices.map((inv: any) => {
                    const student = inv.student;
                    const course = inv.enrollment?.course;
                    const subtotal = Number(inv.subtotal);
                    const discount = Number(inv.discountTotal);
                    const total = Number(inv.totalAmount);
                    const paid = Number(inv.paidAmount);
                    const balance = Number(inv.balance);

                    return (
                      <TableRow key={inv.id} className="hover:bg-muted/40">
                        <TableCell className="font-mono font-bold text-xs text-primary">
                          {inv.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-foreground text-sm">
                            {student?.firstName} {student?.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {student?.studentId}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          {course?.name}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          LKR {subtotal.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-emerald-600 dark:text-emerald-400">
                          {discount > 0 ? `- LKR ${discount.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-xs text-foreground">
                          LKR {total.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                          LKR {paid.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                          LKR {balance.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              inv.status === 'PAID'
                                ? 'success'
                                : inv.status === 'PARTIALLY_PAID'
                                ? 'warning'
                                : 'destructive'
                            }
                            className="text-[10px]"
                          >
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/invoices/${inv.id}`}>
                            <Button variant="outline" size="xs" className="gap-1.5 text-xs">
                              <Printer className="h-3 w-3" />
                              <span>View / Print</span>
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                      {isLoading ? 'Loading invoices...' : 'No invoices found matching criteria.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
