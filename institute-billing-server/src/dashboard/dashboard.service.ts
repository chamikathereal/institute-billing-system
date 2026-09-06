import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TenantsService } from '../tenants/tenants.service.js';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private tenantsService: TenantsService,
  ) {}

  async getStats(tenantId?: string) {
    const tenant = await this.tenantsService.resolveTenant(tenantId);

    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalStudents,
      invoices,
      payments,
      recentPayments,
      upcomingInstallments,
      overdueInstallmentsCount,
      courses,
    ] = await Promise.all([
      this.prisma.student.count({ where: { tenantId: tenant.id } }),
      this.prisma.invoice.findMany({
        where: { tenantId: tenant.id },
        select: { totalAmount: true, paidAmount: true, balance: true, status: true },
      }),
      this.prisma.payment.findMany({
        where: { tenantId: tenant.id },
        select: { amount: true },
      }),
      this.prisma.payment.findMany({
        where: { tenantId: tenant.id },
        include: {
          student: true,
          enrollment: { include: { course: true } },
          installment: true,
        },
        orderBy: { paidAt: 'desc' },
        take: 6,
      }),
      this.prisma.installment.findMany({
        where: {
          status: { in: ['PENDING', 'PARTIALLY_PAID'] },
          dueDate: {
            not: null,
            lte: sevenDaysLater,
          },
          paymentPlan: {
            enrollment: { tenantId: tenant.id },
          },
        },
        include: {
          paymentPlan: {
            include: {
              enrollment: {
                include: {
                  student: true,
                  course: true,
                },
              },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
        take: 6,
      }),
      this.prisma.installment.count({
        where: {
          status: { in: ['PENDING', 'PARTIALLY_PAID'] },
          dueDate: {
            not: null,
            lt: now,
          },
          paymentPlan: {
            enrollment: { tenantId: tenant.id },
          },
        },
      }),
      this.prisma.course.findMany({
        where: { tenantId: tenant.id, status: 'ACTIVE' },
        include: {
          _count: { select: { enrollments: true } },
        },
      }),
    ]);

    let totalInvoiced = 0;
    let totalOutstanding = 0;
    for (const inv of invoices) {
      totalInvoiced += Number(inv.totalAmount);
      totalOutstanding += Number(inv.balance);
    }

    const totalCollected = payments.reduce((acc, curr) => acc + Number(curr.amount), 0);

    return {
      kpis: {
        totalStudents,
        totalInvoiced,
        totalCollected,
        totalOutstanding,
        overdueCount: overdueInstallmentsCount,
      },
      recentPayments,
      upcomingInstallments: upcomingInstallments.map((inst) => ({
        id: inst.id,
        installmentNumber: inst.installmentNumber,
        title: inst.title,
        expectedAmount: Number(inst.expectedAmount),
        paidAmount: Number(inst.paidAmount),
        balance: Number(inst.expectedAmount) - Number(inst.paidAmount),
        dueDate: inst.dueDate,
        isOverdue: inst.dueDate ? new Date(inst.dueDate) < now : false,
        student: {
          id: inst.paymentPlan.enrollment.student.id,
          studentId: inst.paymentPlan.enrollment.student.studentId,
          name: `${inst.paymentPlan.enrollment.student.firstName} ${inst.paymentPlan.enrollment.student.lastName || ''}`.trim(),
          mobile: inst.paymentPlan.enrollment.student.mobile,
        },
        course: {
          id: inst.paymentPlan.enrollment.course.id,
          name: inst.paymentPlan.enrollment.course.name,
        },
      })),
      courses: courses.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        price: Number(c.basePrice),
        enrolledCount: c._count.enrollments,
      })),
    };
  }
}
