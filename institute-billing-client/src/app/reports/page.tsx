'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Search,
  Filter,
  Calendar,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  FileText,
  Users,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/axios';

export default function ReportsPage() {
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [status, setStatus] = React.useState('ALL');
  const [courseId, setCourseId] = React.useState('ALL');
  const [paymentMethod, setPaymentMethod] = React.useState('ALL');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);

  // Fetch courses for dropdown
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await api.get('/courses');
      return res.data;
    },
  });

  // Query reports with backend pagination & filtering
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', startDate, endDate, status, courseId, paymentMethod, search, page],
    queryFn: async () => {
      const res = await api.get('/reports', {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          status: status !== 'ALL' ? status : undefined,
          courseId: courseId !== 'ALL' ? courseId : undefined,
          paymentMethod: paymentMethod !== 'ALL' ? paymentMethod : undefined,
          search: search.trim() || undefined,
          page,
          limit: 10,
        },
      });
      return res.data;
    },
  });

  const summary = reportData?.summary || {
    totalInvoiced: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    totalDiscounts: 0,
    totalInvoicesCount: 0,
    uniqueStudentsCount: 0,
  };

  const pagination = reportData?.pagination || {
    totalCount: 0,
    currentPage: 1,
    limit: 10,
    totalPages: 1,
  };

  const items = reportData?.items || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span>Billing & Financial Reports</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Backend-paginated reports with multidimensional filtering by date range, payment status, student, and course.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              <span>Print Report</span>
            </Button>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <span>Report Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Date range */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">From Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">To Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 text-xs"
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Status</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PAID">Paid</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                  <option value="UNPAID">Unpaid</option>
                </select>
              </div>

              {/* Course */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Course</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={courseId}
                  onChange={(e) => {
                    setCourseId(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="ALL">All Courses</option>
                  {courses.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Payment Method</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="ALL">All Methods</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
            </div>

            {/* Keyword Search */}
            <div className="pt-2 border-t border-border flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  className="pl-9 h-9 text-xs bg-card"
                  placeholder="Filter by student name, Student ID, NIC, or invoice #..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              {(startDate || endDate || status !== 'ALL' || courseId !== 'ALL' || paymentMethod !== 'ALL' || search) && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setStatus('ALL');
                    setCourseId('ALL');
                    setPaymentMethod('ALL');
                    setSearch('');
                    setPage(1);
                  }}
                  className="text-xs"
                >
                  Reset Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">
                Invoiced Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold font-mono">
                LKR {summary.totalInvoiced.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Across filtered records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">
                Revenue Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                LKR {summary.totalCollected.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Paid settlements</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">
                Outstanding Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                LKR {summary.totalOutstanding.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Receivable from students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">
                Discounts Awarded
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                LKR {summary.totalDiscounts.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {summary.uniqueStudentsCount} unique students
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Results Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total Fee</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Methods</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length > 0 ? (
                  items.map((item: any) => {
                    const student = item.student;
                    const course = item.enrollment?.course;
                    const methods = Array.from(
                      new Set((item.payments || []).map((p: any) => p.method))
                    );

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono font-bold text-xs text-primary">
                          <Link href={`/invoices/${item.id}`} className="hover:underline">
                            {item.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-xs">
                            {student?.firstName} {student?.lastName}
                          </div>
                          <div className="text-[11px] font-mono text-muted-foreground">
                            {student?.studentId}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{course?.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(item.issueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-medium">
                          LKR {Number(item.totalAmount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          LKR {Number(item.paidAmount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          LKR {Number(item.balance).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.status === 'PAID'
                                ? 'success'
                                : item.status === 'PARTIALLY_PAID'
                                ? 'warning'
                                : 'destructive'
                            }
                            className="text-[10px]"
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {methods.length > 0 ? (
                              methods.map((m: any) => (
                                <Badge key={m} variant="outline" className="text-[9px] px-1 py-0">
                                  {m}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-[10px] text-muted-foreground">None</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground text-xs">
                      {isLoading ? 'Generating report...' : 'No records match the selected filters.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <div>
                Showing page <span className="font-bold text-foreground">{pagination.currentPage}</span> of{' '}
                <span className="font-bold text-foreground">{pagination.totalPages}</span> ({pagination.totalCount} records)
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
