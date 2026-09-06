import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service.js';
import { TenantsService } from '../tenants/tenants.service.js';
import { StudentsService } from '../students/students.service.js';
import { SmsService } from '../sms/sms.service.js';

export class NewStudentInlineDto {
  @ApiProperty()
  firstName: string;

  @ApiPropertyOptional()
  lastName?: string;

  @ApiProperty()
  mobile: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  nic?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  age?: number;

  @ApiPropertyOptional()
  notes?: string;
}

export class InitialPaymentDto {
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
}

export class CustomInstallmentItemDto {
  @ApiProperty()
  installmentNumber: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  expectedAmount: number;

  @ApiPropertyOptional()
  dueDate?: string | Date;
}

export class CreateEnrollmentDto {
  @ApiPropertyOptional()
  studentId?: string;

  @ApiPropertyOptional({ type: () => NewStudentInlineDto })
  newStudent?: NewStudentInlineDto;

  @ApiProperty()
  courseId: string;

  @ApiPropertyOptional()
  discountId?: string;

  @ApiPropertyOptional()
  customDiscountAmount?: number;

  @ApiPropertyOptional()
  discountReason?: string;

  @ApiProperty({ enum: ['FULL_PAYMENT', 'INSTALLMENT'] })
  paymentPlanType: 'FULL_PAYMENT' | 'INSTALLMENT';

  @ApiPropertyOptional()
  numberOfInstallments?: number;

  @ApiPropertyOptional()
  installmentSchemeId?: string;

  @ApiPropertyOptional({ type: () => [CustomInstallmentItemDto] })
  customInstallments?: CustomInstallmentItemDto[];

  @ApiPropertyOptional({ type: () => InitialPaymentDto })
  initialPayment?: InitialPaymentDto;
}

@Injectable()
export class EnrollmentsService {
  constructor(
    private prisma: PrismaService,
    private tenantsService: TenantsService,
    private studentsService: StudentsService,
    private smsService: SmsService,
  ) {}

  async generateNextInvoiceNumber(tenantId: string): Promise<string> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: 'invoice_prefix' } },
    });
    const prefix = setting ? setting.value : 'INV-2026';

    const count = await this.prisma.invoice.count({ where: { tenantId } });
    const num = count + 1;
    return `${prefix}-${String(num).padStart(6, '0')}`;
  }

  async generateNextReceiptNumber(tenantId: string): Promise<string> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: 'receipt_prefix' } },
    });
    const prefix = setting ? setting.value : 'REC-2026';

    const count = await this.prisma.payment.count({ where: { tenantId } });
    const num = count + 1;
    return `${prefix}-${String(num).padStart(6, '0')}`;
  }

  async enroll(dto: CreateEnrollmentDto, tenantId?: string) {
    const tenant = await this.tenantsService.resolveTenant(tenantId);

    let studentId = dto.studentId;
    let studentRecord: any;

    if (!studentId && dto.newStudent) {
      studentRecord = await this.studentsService.create(dto.newStudent, tenant.id);
      studentId = studentRecord.id;
    } else if (studentId) {
      studentRecord = await this.prisma.student.findFirst({
        where: {
          tenantId: tenant.id,
          OR: [{ id: studentId }, { studentId: studentId }],
        },
      });
      if (!studentRecord) {
        throw new NotFoundException(`Student '${studentId}' not found.`);
      }
      studentId = studentRecord.id;
    } else {
      throw new BadRequestException('Either studentId or newStudent details must be provided.');
    }

    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
      include: { schemes: true },
    });
    if (!course) {
      throw new NotFoundException('Course not found.');
    }

    const basePrice = Number(course.basePrice);
    let discountAmount = 0;
    let discountName = 'Discount';
    let discountReason = dto.discountReason || '';

    if (dto.discountId) {
      const discount = await this.prisma.discount.findUnique({
        where: { id: dto.discountId },
      });
      if (discount && discount.isActive) {
        discountName = discount.name;
        if (!discountReason && discount.reason) discountReason = discount.reason;
        if (discount.type === 'PERCENTAGE') {
          discountAmount = (basePrice * Number(discount.value)) / 100;
        } else {
          discountAmount = Number(discount.value);
        }
      }
    } else if (dto.customDiscountAmount && dto.customDiscountAmount > 0) {
      discountAmount = dto.customDiscountAmount;
      discountName = 'Custom Course Discount';
    }

    if (discountAmount > basePrice) {
      discountAmount = basePrice;
    }

    const finalPrice = Math.max(0, basePrice - discountAmount);

    const result = await this.prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.create({
        data: {
          tenantId: tenant.id,
          studentId: studentRecord.id,
          courseId: course.id,
          originalPrice: basePrice,
          discountTotal: discountAmount,
          finalPrice,
          paymentPlanType: dto.paymentPlanType,
          status: 'ACTIVE',
        },
      });

      if (discountAmount > 0) {
        await tx.enrollmentDiscount.create({
          data: {
            enrollmentId: enrollment.id,
            discountId: dto.discountId || null,
            name: discountName,
            amount: discountAmount,
            reason: discountReason,
          },
        });
      }

      const invoiceNumber = await this.generateNextInvoiceNumber(tenant.id);
      const initialPaid = dto.initialPayment ? Number(dto.initialPayment.amount) : 0;
      const balance = Math.max(0, finalPrice - initialPaid);

      const invoice = await tx.invoice.create({
        data: {
          tenantId: tenant.id,
          invoiceNumber,
          enrollmentId: enrollment.id,
          studentId: studentRecord.id,
          subtotal: basePrice,
          discountTotal: discountAmount,
          totalAmount: finalPrice,
          paidAmount: initialPaid,
          balance,
          status: balance === 0 ? 'PAID' : initialPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
        },
      });

      const isFullPayment = dto.paymentPlanType === 'FULL_PAYMENT';
      const numInstallments = isFullPayment ? 1 : (dto.numberOfInstallments || 3);

      const paymentPlan = await tx.paymentPlan.create({
        data: {
          enrollmentId: enrollment.id,
          type: dto.paymentPlanType,
          totalAmount: finalPrice,
          numberOfInstallments: numInstallments,
        },
      });

      const now = new Date();
      let createdInstallments: any[] = [];

      if (isFullPayment) {
        const inst = await tx.installment.create({
          data: {
            paymentPlanId: paymentPlan.id,
            installmentNumber: 1,
            title: 'Full Course Payment',
            expectedAmount: finalPrice,
            paidAmount: initialPaid >= finalPrice ? finalPrice : initialPaid,
            dueDate: null,
            status: initialPaid >= finalPrice ? 'PAID' : 'PENDING',
            paidAt: initialPaid >= finalPrice ? now : null,
          },
        });
        createdInstallments.push(inst);
      } else {
        if (dto.customInstallments && dto.customInstallments.length > 0) {
          for (const item of dto.customInstallments) {
            const inst = await tx.installment.create({
              data: {
                paymentPlanId: paymentPlan.id,
                installmentNumber: item.installmentNumber,
                title: item.title,
                expectedAmount: item.expectedAmount,
                paidAmount: 0,
                dueDate: item.dueDate ? new Date(item.dueDate) : null,
                status: 'PENDING',
              },
            });
            createdInstallments.push(inst);
          }
        } else {
          let schemeBreakdown: any[] = [];
          if (dto.installmentSchemeId) {
            const scheme = course.schemes.find((s) => s.id === dto.installmentSchemeId);
            if (scheme) schemeBreakdown = JSON.parse(scheme.breakdownJson);
          } else if (course.schemes.length > 0) {
            schemeBreakdown = JSON.parse(course.schemes[0].breakdownJson);
          }

          if (schemeBreakdown.length > 0) {
            const schemeTotal = schemeBreakdown.reduce((acc, curr) => acc + Number(curr.amount), 0);
            const ratio = schemeTotal > 0 ? finalPrice / schemeTotal : 1;

            for (const [idx, step] of schemeBreakdown.entries()) {
              const expectedAmount = Math.round(Number(step.amount) * ratio);
              const days = step.daysAfterEnrollment || idx * 30;
              const dueDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

              const inst = await tx.installment.create({
                data: {
                  paymentPlanId: paymentPlan.id,
                  installmentNumber: idx + 1,
                  title: step.title || `Installment #${idx + 1}`,
                  expectedAmount,
                  paidAmount: 0,
                  dueDate: idx === 0 ? now : dueDate,
                  status: 'PENDING',
                },
              });
              createdInstallments.push(inst);
            }
          } else {
            const partAmount = Math.round(finalPrice / numInstallments);
            let remaining = finalPrice;

            for (let i = 1; i <= numInstallments; i++) {
              const amount = i === numInstallments ? remaining : partAmount;
              remaining -= amount;
              const dueDate = new Date(now.getTime() + (i - 1) * 30 * 24 * 60 * 60 * 1000);

              const inst = await tx.installment.create({
                data: {
                  paymentPlanId: paymentPlan.id,
                  installmentNumber: i,
                  title: i === 1 ? '1st Installment (Enrollment)' : `Installment #${i}`,
                  expectedAmount: amount,
                  paidAmount: 0,
                  dueDate: i === 1 ? now : dueDate,
                  status: 'PENDING',
                },
              });
              createdInstallments.push(inst);
            }
          }
        }
      }

      let paymentRecord = null;
      if (dto.initialPayment && initialPaid > 0) {
        const paymentNumber = await this.generateNextReceiptNumber(tenant.id);

        let allocRemaining = initialPaid;
        let primaryInstallmentId: string | null = null;

        for (const inst of createdInstallments) {
          if (allocRemaining <= 0) break;
          const instExpected = Number(inst.expectedAmount);
          const apply = Math.min(allocRemaining, instExpected);

          if (!primaryInstallmentId) primaryInstallmentId = inst.id;

          await tx.installment.update({
            where: { id: inst.id },
            data: {
              paidAmount: apply,
              status: apply >= instExpected ? 'PAID' : 'PARTIALLY_PAID',
              paidAt: now,
            },
          });

          allocRemaining -= apply;
        }

        paymentRecord = await tx.payment.create({
          data: {
            tenantId: tenant.id,
            paymentNumber,
            invoiceId: invoice.id,
            studentId: studentRecord.id,
            enrollmentId: enrollment.id,
            installmentId: primaryInstallmentId,
            amount: initialPaid,
            method: dto.initialPayment.method || 'CASH',
            reference: dto.initialPayment.reference || 'INITIAL-REGISTRATION',
            receivedBy: dto.initialPayment.receivedBy || 'System Admin',
            notes: dto.initialPayment.notes || 'Initial course payment at registration',
          },
        });
      }

      return {
        enrollment,
        invoice,
        paymentPlan,
        payment: paymentRecord,
        student: studentRecord,
        course,
      };
    });

    try {
      const discountMsg =
        discountAmount > 0
          ? ` with LKR ${discountAmount.toLocaleString()} discount (${discountName}). Final Fee: LKR ${finalPrice.toLocaleString()}`
          : ` Course Fee: LKR ${finalPrice.toLocaleString()}`;

      const paymentMsg = result.payment
        ? ` Paid: LKR ${Number(result.payment.amount).toLocaleString()}. Remaining Balance: LKR ${Number(result.invoice.balance).toLocaleString()}. Receipt: ${result.payment.paymentNumber}.`
        : ` Outstanding Balance: LKR ${finalPrice.toLocaleString()}.`;

      const smsText = `Dear ${studentRecord.firstName}, welcome to ${tenant.name}! You are enrolled in ${course.name}${discountMsg}.${paymentMsg} Student ID: ${studentRecord.studentId}.`;

      await this.smsService.sendSms({
        tenantId: tenant.id,
        recipientMobile: studentRecord.mobile,
        recipientName: `${studentRecord.firstName} ${studentRecord.lastName || ''}`.trim(),
        message: smsText,
        type: 'ENROLLMENT_CONFIRMATION',
        metadata: {
          studentId: studentRecord.studentId,
          enrollmentId: result.enrollment.id,
          invoiceNumber: result.invoice.invoiceNumber,
          paymentNumber: result.payment?.paymentNumber,
        },
      });
    } catch (err) {
      console.error('Failed to send enrollment SMS:', err);
    }

    return result;
  }

  async findOne(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        student: true,
        course: true,
        discounts: true,
        invoice: true,
        paymentPlan: {
          include: {
            installments: {
              orderBy: { installmentNumber: 'asc' },
            },
          },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
        },
      },
    });

    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }
}
