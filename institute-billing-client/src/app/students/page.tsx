'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Search,
  UserPlus,
  ArrowRight,
  Phone,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/axios';

export default function StudentsDirectoryPage() {
  const [search, setSearch] = React.useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['students', search],
    queryFn: async () => {
      const res = await api.get('/students', {
        params: { search: search.trim() || undefined },
      });
      return res.data;
    },
  });

  const students = data?.data || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <span>Student Directory</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Search students by NIC, Student ID, mobile number, name, or email.
            </p>
          </div>

          <Link href="/students/register">
            <Button size="sm" className="gap-2">
              <UserPlus className="h-3.5 w-3.5" />
              <span>Register Student</span>
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            className="pl-9 bg-card"
            placeholder="Search by ID (NFA-000001), NIC, mobile, name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Students Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name & Contact</TableHead>
                  <TableHead>NIC</TableHead>
                  <TableHead>Enrolled Course</TableHead>
                  <TableHead className="text-right">Total Invoiced</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length > 0 ? (
                  students.map((student: any) => {
                    const enrollment = student.enrollments?.[0];
                    const invoice = enrollment?.invoice;
                    const total = invoice ? Number(invoice.totalAmount) : 0;
                    const paid = invoice ? Number(invoice.paidAmount) : 0;
                    const balance = invoice ? Number(invoice.balance) : 0;
                    const isPaid = balance === 0;

                    return (
                      <TableRow key={student.id} className="hover:bg-muted/40">
                        <TableCell className="font-mono font-bold text-xs text-primary">
                          {student.studentId}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-foreground text-sm">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Phone className="h-3 w-3" />
                            <span>{student.mobile}</span>
                            {student.email && <span>• {student.email}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {student.nic || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {enrollment?.course?.name ? (
                            <span className="text-xs font-medium text-foreground">
                              {enrollment.course.name}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Not enrolled</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-medium">
                          LKR {total.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          LKR {paid.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          LKR {balance.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {isPaid ? (
                            <Badge variant="success" className="text-[10px]">
                              Paid Full
                            </Badge>
                          ) : paid > 0 ? (
                            <Badge variant="warning" className="text-[10px]">
                              Partial
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px]">
                              Unpaid
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/students/${student.id}`}>
                            <Button variant="ghost" size="xs" className="gap-1 text-xs">
                              <span>Profile</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      {isLoading ? 'Loading students...' : 'No student records found.'}
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
