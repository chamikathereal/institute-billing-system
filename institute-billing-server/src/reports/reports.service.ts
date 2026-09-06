import { Injectable } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service.js';
import { TenantsService } from '../tenants/tenants.service.js';

export class ReportFilterDto {
  @ApiPropertyOptional()
  tenantId?: string;

  @ApiPropertyOptional()
  startDate?: string;

  @ApiPropertyOptional()
  endDate?: string;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional()
  courseId?: string;

  @ApiPropertyOptional()
  paymentMethod?: string;

  @ApiPropertyOptional()
  search?: string;

  @ApiPropertyOptional()
  page?: number;

  @ApiPropertyOptional()
  limit?: number;
}

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private tenantsService: TenantsService,
  ) {}

  async getReports(filters: ReportFilterDto) {
    const tenant = await this.tenantsService.resolveTenant(filters.tenantId);

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = { tenantId: tenant.id };

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (filters.courseId && filters.courseId !== 'ALL') {
      where.enrollment = { courseId: filters.courseId };
    }

    if (filters.paymentMethod && filters.paymentMethod !== 'ALL') {
      where.payments = {
        some: { method: filters.paymentMethod },
      };
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { invoiceNumber: { contains: q } },
        { student: { firstName: { contains: q } } },
        { student: { lastName: { contains: q } } },
        { student: { studentId: { contains: q } } },
        { student: { nic: { contains: q } } },
        { student: { mobile: { contains: q } } },
      ];
    }

    const [totalCount, items, allMatchingInvoices] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        include: {
          student: true,
          enrollment: {
            include: {
              course: true,
              discounts: true,
              paymentPlan: {
                include: {
                  installments: true,
                },
              },
            },
          },
          payments: {
            orderBy: { paidAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.invoice.findMany({
        where,
        select: {
          totalAmount: true,
          paidAmount: true,
          balance: true,
          discountTotal: true,
          studentId: true,
        },
      }),
    ]);

    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalDiscounts = 0;
    const uniqueStudents = new Set<string>();

    for (const inv of allMatchingInvoices) {
      totalInvoiced += Number(inv.totalAmount);
      totalCollected += Number(inv.paidAmount);
      totalOutstanding += Number(inv.balance);
      totalDiscounts += Number(inv.discountTotal);
      uniqueStudents.add(inv.studentId);
    }

    return {
      items,
      summary: {
        totalInvoiced,
        totalCollected,
        totalOutstanding,
        totalDiscounts,
        totalInvoicesCount: totalCount,
        uniqueStudentsCount: uniqueStudents.size,
      },
      pagination: {
        totalCount,
        currentPage: page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }
}
