import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PublicPortalService {
  constructor(private prisma: PrismaService) {}

  async lookupStudent(studentIdRaw: string) {
    const studentId = studentIdRaw.trim();

    const student = await this.prisma.student.findFirst({
      where: {
        studentId: { equals: studentId },
      },
      include: {
        tenant: {
          select: {
            name: true,
            slug: true,
            tagline: true,
            logoUrl: true,
            phone: true,
            email: true,
            address: true,
            currency: true,
          },
        },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
                description: true,
                thumbnailUrl: true,
                duration: true,
              },
            },
            discounts: {
              select: {
                name: true,
                amount: true,
                reason: true,
              },
            },
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                subtotal: true,
                discountTotal: true,
                totalAmount: true,
                paidAmount: true,
                balance: true,
                status: true,
                issueDate: true,
                dueDate: true,
              },
            },
            paymentPlan: {
              select: {
                type: true,
                totalAmount: true,
                numberOfInstallments: true,
                installments: {
                  select: {
                    id: true,
                    installmentNumber: true,
                    title: true,
                    expectedAmount: true,
                    paidAmount: true,
                    dueDate: true,
                    status: true,
                    paidAt: true,
                  },
                  orderBy: { installmentNumber: 'asc' },
                },
              },
            },
            payments: {
              select: {
                id: true,
                paymentNumber: true,
                amount: true,
                method: true,
                reference: true,
                paidAt: true,
              },
              orderBy: { paidAt: 'desc' },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`No student record found for ID '${studentIdRaw}'.`);
    }

    // Return safe public student profile (excluding NIC, full address, notes)
    return {
      student: {
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
      },
      institute: student.tenant,
      enrollments: student.enrollments,
    };
  }
}
