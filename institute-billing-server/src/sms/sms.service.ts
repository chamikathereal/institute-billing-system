import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TenantsService } from '../tenants/tenants.service.js';

export class SendSmsParams {
  tenantId: string;
  recipientMobile: string;
  recipientName?: string;
  message: string;
  type: 'PAYMENT_RECEIPT' | 'INSTALLMENT_REMINDER' | 'ENROLLMENT_CONFIRMATION' | 'GENERAL';
  metadata?: Record<string, any>;
}

@Injectable()
export class SmsService {
  constructor(
    private prisma: PrismaService,
    private tenantsService: TenantsService,
  ) {}

  async sendSms(params: SendSmsParams) {
    const log = await this.prisma.smsLog.create({
      data: {
        tenantId: params.tenantId,
        recipientMobile: params.recipientMobile,
        recipientName: params.recipientName,
        message: params.message,
        type: params.type,
        status: 'SENT_MOCK',
        metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });

    console.log(`📱 [MOCK SMS SENT] To: ${params.recipientMobile} (${params.recipientName || 'Student'}) | Type: ${params.type}`);
    console.log(`   Message: "${params.message}"`);

    return {
      success: true,
      logId: log.id,
      mock: true,
      recipientMobile: params.recipientMobile,
      message: params.message,
    };
  }

  async getLogs(tenantId?: string, page = 1, limit = 20) {
    const tenant = await this.tenantsService.resolveTenant(tenantId);
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      this.prisma.smsLog.count({ where: { tenantId: tenant.id } }),
      this.prisma.smsLog.findMany({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async triggerDueReminders(tenantId?: string) {
    const tenant = await this.tenantsService.resolveTenant(tenantId);

    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId: tenant.id, key: 'reminder_days_before_due' } },
    });
    const reminderDays = setting ? parseInt(setting.value, 10) || 7 : 7;

    const now = new Date();
    const futureLimit = new Date(now.getTime() + reminderDays * 24 * 60 * 60 * 1000);

    const dueInstallments = await this.prisma.installment.findMany({
      where: {
        status: { in: ['PENDING', 'PARTIALLY_PAID'] },
        dueDate: {
          not: null,
          lte: futureLimit,
        },
        paymentPlan: {
          enrollment: {
            tenantId: tenant.id,
          },
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
    });

    const sentReminders = [];

    for (const inst of dueInstallments) {
      const student = inst.paymentPlan.enrollment.student;
      const course = inst.paymentPlan.enrollment.course;
      const remainingAmount = Number(inst.expectedAmount) - Number(inst.paidAmount);
      const dueDateStr = inst.dueDate ? new Date(inst.dueDate).toLocaleDateString() : 'soon';

      const message = `Reminder from ${tenant.name}: Installment #${inst.installmentNumber} of LKR ${remainingAmount.toLocaleString()} for ${course.name} is due on ${dueDateStr}. Please settle on time.`;

      const result = await this.sendSms({
        tenantId: tenant.id,
        recipientMobile: student.mobile,
        recipientName: `${student.firstName} ${student.lastName || ''}`.trim(),
        message,
        type: 'INSTALLMENT_REMINDER',
        metadata: {
          installmentId: inst.id,
          studentId: student.studentId,
          dueDate: inst.dueDate,
          amount: remainingAmount,
        },
      });

      sentReminders.push({
        studentId: student.studentId,
        studentName: `${student.firstName} ${student.lastName || ''}`.trim(),
        mobile: student.mobile,
        installment: inst.installmentNumber,
        amount: remainingAmount,
        dueDate: inst.dueDate,
        smsLogId: result.logId,
      });
    }

    return {
      reminderDaysConfigured: reminderDays,
      processedCount: dueInstallments.length,
      sentCount: sentReminders.length,
      reminders: sentReminders,
    };
  }
}
