import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service.js';
import { TenantsService } from '../tenants/tenants.service.js';
import { SmsService } from '../sms/sms.service.js';

export class RecordPaymentDto {
  @ApiProperty()
  studentId: string;

  @ApiProperty()
  enrollmentId: string;

  @ApiPropertyOptional()
  installmentId?: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: ['CASH', 'CARD', 'BANK_TRANSFER', 'ONLINE'] })
  method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'ONLINE';

  @ApiPropertyOptional()
  reference?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  receivedBy?: string;

  @ApiPropertyOptional()
  customNextDueDate?: string | Date;
}

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private tenantsService: TenantsService,
    private smsService: SmsService,
  ) {}

  async generateNextReceiptNumber(tenantId: string): Promise<string> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: 'receipt_prefix' } },
    });
    const prefix = setting ? setting.value : 'REC-2026';

    const count = await this.prisma.payment.count({ where: { tenantId } });
    const num = count + 1;
    return `${prefix}-${String(num).padStart(6, '0')}`;
  }

  async getStudentPendingInstallments(studentIdOrKeyword: string, tenantId?: string) {
    const tenant = await this.tenantsService.resolveTenant(tenantId);
    const q = studentIdOrKeyword.trim();

    const student = await this.prisma.student.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [
          { id: q },
          { studentId: q },
          { nic: q },
          { mobile: q },
          { email: q },
          { firstName: { contains: q } },
        ],
      },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            course: true,
            invoice: true,
            paymentPlan: {
              include: {
                installments: {
                  orderBy: { installmentNumber: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`No student found matching '${studentIdOrKeyword}'.`);
    }

    return student;
  }

  async recordPayment(dto: RecordPaymentDto, tenantId?: string) {
    const tenant = await this.tenantsService.resolveTenant(tenantId);

    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero.');
    }

    let student: any = null;
    let enrollment: any = null;

    if (dto.enrollmentId) {
      enrollment = await this.prisma.enrollment.findUnique({
        where: { id: dto.enrollmentId },
        include: {
          student: true,
          course: true,
          invoice: true,
          paymentPlan: {
            include: {
              installments: {
                orderBy: { installmentNumber: 'asc' },
              },
            },
          },
        },
      });
      if (enrollment) {
        student = enrollment.student;
      }
    }

    if (!student && dto.studentId) {
      student = await this.prisma.student.findFirst({
        where: {
          tenantId: tenant.id,
          OR: [{ id: dto.studentId }, { studentId: dto.studentId }],
        },
        include: {
          enrollments: {
            orderBy: { createdAt: 'desc' },
            include: {
              course: true,
              invoice: true,
              paymentPlan: {
                include: {
                  installments: {
                    orderBy: { installmentNumber: 'asc' },
                  },
                },
              },
            },
          },
        },
      });

      if (student && !enrollment && student.enrollments?.length > 0) {
        enrollment = student.enrollments[0];
      }
    }

    if (!student) {
      throw new NotFoundException('Student not found.');
    }

    if (!enrollment || !enrollment.invoice) {
      throw new NotFoundException('Enrollment or Invoice not found for this student.');
    }

    const invoice = enrollment.invoice;
    const now = new Date();
    const paymentAmount = Number(dto.amount);
    const paymentNumber = await this.generateNextReceiptNumber(tenant.id);

    const result = await this.prisma.$transaction(async (tx) => {
      let remainingToAllocate = paymentAmount;
      const allInstallments = enrollment.paymentPlan?.installments || [];
      const updatedInstallments: any[] = [];

      let startIndex = 0;
      if (dto.installmentId) {
        const foundIdx = allInstallments.findIndex((i: any) => i.id === dto.installmentId);
        if (foundIdx !== -1) startIndex = foundIdx;
      } else {
        const firstUnpaid = allInstallments.findIndex(
          (i: any) => i.status === 'PENDING' || i.status === 'PARTIALLY_PAID',
        );
        if (firstUnpaid !== -1) startIndex = firstUnpaid;
      }

      for (let idx = startIndex; idx < allInstallments.length; idx++) {
        if (remainingToAllocate <= 0) break;

        const inst = allInstallments[idx];
        const expected = Number(inst.expectedAmount);
        const alreadyPaid = Number(inst.paidAmount);
        const needed = Math.max(0, expected - alreadyPaid);

        const allocateToThis = Math.min(remainingToAllocate, needed);
        const newPaidTotal = alreadyPaid + allocateToThis;
        const isFullyPaid = newPaidTotal >= expected;

        remainingToAllocate -= allocateToThis;

        const updated = await tx.installment.update({
          where: { id: inst.id },
          data: {
            paidAmount: newPaidTotal,
            status: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
            paidAt: isFullyPaid ? now : inst.paidAt,
          },
        });
        updatedInstallments.push(updated);

        if (
          isFullyPaid &&
          dto.customNextDueDate &&
          idx + 1 < allInstallments.length
        ) {
          const nextInst = allInstallments[idx + 1];
          await tx.installment.update({
            where: { id: nextInst.id },
            data: {
              dueDate: new Date(dto.customNextDueDate),
            },
          });
        }
      }

      const newInvoicePaid = Number(invoice.paidAmount) + paymentAmount;
      const totalAmount = Number(invoice.totalAmount);
      const newBalance = Math.max(0, totalAmount - newInvoicePaid);
      const newStatus =
        newBalance === 0
          ? 'PAID'
          : newInvoicePaid > 0
          ? 'PARTIALLY_PAID'
          : 'UNPAID';

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newInvoicePaid,
          balance: newBalance,
          status: newStatus,
        },
      });

      const payment = await tx.payment.create({
        data: {
          tenantId: tenant.id,
          paymentNumber,
          invoiceId: invoice.id,
          studentId: student.id,
          enrollmentId: enrollment.id,
          installmentId: dto.installmentId || (updatedInstallments[0]?.id ?? null),
          amount: paymentAmount,
          method: dto.method,
          reference: dto.reference || null,
          notes: dto.notes || null,
          receivedBy: dto.receivedBy || 'Staff',
          paidAt: now,
        },
      });

      return {
        payment,
        invoice: updatedInvoice,
        updatedInstallments,
      };
    });

    try {
      const smsMessage = `Payment Received: LKR ${paymentAmount.toLocaleString()} for ${enrollment.course.name}. Receipt: ${result.payment.paymentNumber}. Remaining Balance: LKR ${Number(result.invoice.balance).toLocaleString()}. Thank you, ${tenant.name}!`;

      await this.smsService.sendSms({
        tenantId: tenant.id,
        recipientMobile: student.mobile,
        recipientName: `${student.firstName} ${student.lastName || ''}`.trim(),
        message: smsMessage,
        type: 'PAYMENT_RECEIPT',
        metadata: {
          paymentId: result.payment.id,
          paymentNumber: result.payment.paymentNumber,
          studentId: student.studentId,
          amount: paymentAmount,
          balance: result.invoice.balance,
        },
      });
    } catch (smsErr) {
      console.error('Failed to dispatch payment SMS:', smsErr);
    }

    return result;
  }

  async findAll(params: {
    tenantId?: string;
    studentId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const tenant = await this.tenantsService.resolveTenant(params.tenantId);

    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId: tenant.id };
    if (params.studentId) where.studentId = params.studentId;
    if (params.startDate || params.endDate) {
      where.paidAt = {};
      if (params.startDate) where.paidAt.gte = new Date(params.startDate);
      if (params.endDate) where.paidAt.lte = new Date(params.endDate);
    }

    const [total, payments] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        include: {
          student: true,
          enrollment: { include: { course: true } },
          installment: true,
          invoice: true,
        },
        orderBy: { paidAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        student: true,
        enrollment: { include: { course: true } },
        installment: true,
        invoice: true,
      },
    });
    if (!payment) throw new NotFoundException('Payment receipt not found');
    return payment;
  }
}
