import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TenantsService } from '../tenants/tenants.service.js';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private tenantsService: TenantsService,
  ) {}

  async findAll(params: {
    tenantId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const tenant = await this.tenantsService.resolveTenant(params.tenantId);

    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId: tenant.id };
    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { invoiceNumber: { contains: q } },
        { student: { firstName: { contains: q } } },
        { student: { lastName: { contains: q } } },
        { student: { studentId: { contains: q } } },
        { student: { mobile: { contains: q } } },
      ];
    }

    const [total, invoices] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        include: {
          student: true,
          enrollment: {
            include: {
              course: true,
              discounts: true,
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
    ]);

    return {
      data: invoices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(idOrInvoiceNumber: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        OR: [{ id: idOrInvoiceNumber }, { invoiceNumber: idOrInvoiceNumber }],
      },
      include: {
        tenant: true,
        student: true,
        enrollment: {
          include: {
            course: true,
            discounts: true,
            paymentPlan: {
              include: {
                installments: {
                  orderBy: { installmentNumber: 'asc' },
                },
              },
            },
          },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
        },
      },
    });

    if (!invoice) throw new NotFoundException(`Invoice '${idOrInvoiceNumber}' not found`);
    return invoice;
  }
}
