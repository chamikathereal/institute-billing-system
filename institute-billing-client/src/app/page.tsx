'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  CreditCard,
  AlertTriangle,
  FileText,
  ArrowUpRight,
  UserPlus,
  Send,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/axios';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { sms, success, error } = useToast();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data;
    },
  });

  const reminderMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/sms/trigger-reminders');
      return res.data;
    },
    onSuccess: (data) => {
      sms(
        'SMS Reminders Processed',
        `Dispatched ${data.sentCount} upcoming installment reminder SMS notifications (Threshold: ${data.reminderDaysConfigured} days).`
      );
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: () => {
      error('Error', 'Failed to trigger SMS reminders.');
    },
  });

  const kpis = stats?.kpis || {
    totalStudents: 0,
    totalInvoiced: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    overdueCount: 0,
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Top Banner / Welcome */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-card via-card to-primary/5 p-6 rounded-2xl border border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Financial & Invoicing Overview
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Institute Billing Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor real-time course enrollments, installment due dates, payments, and SMS logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => reminderMutation.mutate()}
              disabled={reminderMutation.isPending}
            >
              <Send className="h-3.5 w-3.5 text-indigo-500" />
              <span>{reminderMutation.isPending ? 'Sending SMS...' : 'Trigger Due Reminders'}</span>
            </Button>

            <Link href="/students/register">
              <Button size="sm" className="gap-2">
                <UserPlus className="h-3.5 w-3.5" />
                <span>New Enrollment</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Enrolled Students
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalStudents}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered in academy courses</p>
            </CardContent>
          </Card>

          <Card className="hover:border-emerald-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Revenue Collected
              </CardTitle>
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                <CreditCard className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                LKR {Number(kpis.totalCollected).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total payments received</p>
            </CardContent>
          </Card>

          <Card className="hover:border-amber-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Outstanding Balance
              </CardTitle>
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                <FileText className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                LKR {Number(kpis.totalOutstanding).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Remaining installment balances</p>
            </CardContent>
          </Card>

          <Card className="hover:border-rose-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overdue Installments
              </CardTitle>
              <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {kpis.overdueCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Installments past due date</p>
            </CardContent>
          </Card>
        </div>

        {/* Two Columns: Upcoming Installments & Recent Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Installments Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Upcoming & Due Installments
                </CardTitle>
                <CardDescription>
                  Students scheduled to pay in the next 7 days
                </CardDescription>
              </div>
              <Link href="/payments">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  <span>Pay Terminal</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {stats?.upcomingInstallments?.length > 0 ? (
                <div className="space-y-3">
                  {stats.upcomingInstallments.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/70 hover:bg-muted/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {item.student.name}
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                            {item.student.studentId}
                          </span>
                          {item.isOverdue && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              Overdue
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{item.course.name}</span>
                          <span>•</span>
                          <span>{item.title}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono text-xs">
                            <Clock className="h-3 w-3" />
                            {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="font-semibold text-sm">
                          LKR {item.balance.toLocaleString()}
                        </span>
                        <Link href={`/payments?search=${encodeURIComponent(item.student.studentId)}`}>
                          <Button size="xs" variant="outline" className="text-[11px] h-6 px-2">
                            Collect
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500/60 mb-2" />
                  No upcoming installments due within the configured window.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Recent Payment Receipts
                </CardTitle>
                <CardDescription>
                  Latest payments recorded across the system
                </CardDescription>
              </div>
              <Link href="/invoices">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  <span>All Invoices</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {stats?.recentPayments?.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentPayments.map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/70 hover:bg-muted/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {p.student?.firstName} {p.student?.lastName}
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                            {p.paymentNumber}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {p.method}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.enrollment?.course?.name} • {new Date(p.paidAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                          +LKR {Number(p.amount).toLocaleString()}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          Receipt issued
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No payment receipts recorded yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Courses Offered Quick Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Active Academy Courses</CardTitle>
              <CardDescription>Configured courses, pricing, and active student enrollment counts</CardDescription>
            </div>
            <Link href="/courses">
              <Button variant="outline" size="sm" className="text-xs">
                Manage Courses
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats?.courses?.map((c: any) => (
                <div key={c.id} className="p-4 rounded-xl border border-border bg-card/50 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-primary font-semibold">{c.code}</span>
                    <h4 className="font-semibold text-sm text-foreground mt-0.5">{c.name}</h4>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">
                      LKR {Number(c.price).toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      {c.enrolledCount} enrolled
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
