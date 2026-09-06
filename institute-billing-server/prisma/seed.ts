import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create or ensure Default Tenant: Nimas Fashion Academy
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'nimas-fashion-academy' },
    update: {},
    create: {
      name: 'Nimas Fashion Academy',
      slug: 'nimas-fashion-academy',
      tagline: 'Excellence in Fashion & Apparel Education',
      logoUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=200&auto=format&fit=crop&q=80',
      phone: '+94 11 234 5678',
      email: 'info@nimasfashion.lk',
      address: 'No. 45, Fashion Avenue, Colombo 07, Sri Lanka',
      currency: 'LKR',
      timezone: 'Asia/Colombo',
    },
  });

  console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})`);

  // 2. Default Settings
  const settingsData = [
    { key: 'institute_name', value: 'Nimas Fashion Academy', description: 'Display name of the institute' },
    { key: 'student_id_prefix', value: 'NFA', description: 'Prefix for generated Student IDs' },
    { key: 'student_id_next_number', value: '3', description: 'Auto-increment sequence counter' },
    { key: 'invoice_prefix', value: 'INV-2026', description: 'Prefix for Invoices' },
    { key: 'receipt_prefix', value: 'REC-2026', description: 'Prefix for Payment Receipts' },
    { key: 'currency_symbol', value: 'LKR', description: 'Currency symbol' },
    { key: 'reminder_days_before_due', value: '7', description: 'Days before installment due date to trigger reminder SMS' },
    { key: 'mock_sms_enabled', value: 'true', description: 'Log SMS notifications without actual telco gateway' },
    { key: 'institute_phone', value: '+94 11 234 5678', description: 'Institute contact phone number' },
    { key: 'institute_email', value: 'info@nimasfashion.lk', description: 'Institute email' },
    { key: 'institute_address', value: 'No. 45, Fashion Avenue, Colombo 07, Sri Lanka', description: 'Campus physical address' },
    { key: 'institute_tagline', value: 'Excellence in Fashion & Apparel Education', description: 'Branding tagline' },
  ];

  for (const s of settingsData) {
    await prisma.setting.upsert({
      where: { tenantId_key: { tenantId: tenant.id, key: s.key } },
      update: { value: s.value },
      create: { tenantId: tenant.id, key: s.key, value: s.value, description: s.description },
    });
  }

  // 3. Admin User
  const passwordHash = await bcrypt.hash('AdminPassword@123', 10);
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@nimasfashion.lk' } },
    update: { passwordHash },
    create: {
      tenantId: tenant.id,
      name: 'Nimas Admin',
      email: 'admin@nimasfashion.lk',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  // 4. Dynamic Discounts
  const discount1 = await prisma.discount.create({
    data: {
      tenantId: tenant.id,
      name: 'Previous Student Discount',
      code: 'RETURNING5K',
      type: 'FIXED',
      value: 5000.0,
      reason: 'Loyalty discount for alumni enrolling in further specializations',
      isActive: true,
    },
  });

  const discount2 = await prisma.discount.create({
    data: {
      tenantId: tenant.id,
      name: 'Early Bird Promotion (10%)',
      code: 'EARLYBIRD10',
      type: 'PERCENTAGE',
      value: 10.0,
      reason: '10% discount for early registration before term starts',
      isActive: true,
    },
  });

  // 5. Courses
  const course1 = await prisma.course.create({
    data: {
      tenantId: tenant.id,
      code: 'NFA-FD01',
      name: 'Fashion Design Diploma',
      description: 'Comprehensive 6-month diploma covering haute couture, pattern drafting, garment construction, and modern trend forecasting.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1537832816519-689ad163238b?w=600&auto=format&fit=crop&q=80',
      basePrice: 25000.0,
      duration: '6 Months',
      status: 'ACTIVE',
      schemes: {
        create: {
          name: 'Standard 3-Part Scheme',
          numberOfInstallments: 3,
          isDefault: true,
          breakdownJson: JSON.stringify([
            { step: 1, title: '1st Installment (Registration)', amount: 10000, daysAfterEnrollment: 0 },
            { step: 2, title: '2nd Installment', amount: 7500, daysAfterEnrollment: 30 },
            { step: 3, title: '3rd Installment (Final)', amount: 7500, daysAfterEnrollment: 60 },
          ]),
        },
      },
    },
  });

  const course2 = await prisma.course.create({
    data: {
      tenantId: tenant.id,
      code: 'NFA-PM02',
      name: 'Advanced Pattern Making & Tailoring',
      description: 'Master commercial pattern cutting, precision drafting, bespoke jacket construction and tailoring techniques.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&auto=format&fit=crop&q=80',
      basePrice: 35000.0,
      duration: '4 Months',
      status: 'ACTIVE',
      schemes: {
        create: {
          name: '4-Part Flexible Scheme',
          numberOfInstallments: 4,
          isDefault: true,
          breakdownJson: JSON.stringify([
            { step: 1, title: '1st Installment', amount: 15000, daysAfterEnrollment: 0 },
            { step: 2, title: '2nd Installment', amount: 10000, daysAfterEnrollment: 30 },
            { step: 3, title: '3rd Installment', amount: 5000, daysAfterEnrollment: 60 },
            { step: 4, title: '4th Installment', amount: 5000, daysAfterEnrollment: 90 },
          ]),
        },
      },
    },
  });

  const course3 = await prisma.course.create({
    data: {
      tenantId: tenant.id,
      code: 'NFA-BW03',
      name: 'Bridal & Evening Wear Masterclass',
      description: 'Specialized intensive on corset building, luxury hand embroidery, delicate lace handling, and bridal gown creation.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80',
      basePrice: 50000.0,
      duration: '3 Months',
      status: 'ACTIVE',
      schemes: {
        create: {
          name: '2-Part Scheme',
          numberOfInstallments: 2,
          isDefault: true,
          breakdownJson: JSON.stringify([
            { step: 1, title: '1st Installment', amount: 30000, daysAfterEnrollment: 0 },
            { step: 2, title: '2nd Installment', amount: 20000, daysAfterEnrollment: 30 },
          ]),
        },
      },
    },
  });

  // 6. Seed Student 1: Sanduni Fernando (Installment Plan with Previous Student Discount)
  const student1 = await prisma.student.create({
    data: {
      tenantId: tenant.id,
      studentId: 'NFA-000001',
      firstName: 'Sanduni',
      lastName: 'Fernando',
      mobile: '0771234567',
      email: 'sanduni.f@gmail.com',
      nic: '200065412345',
      age: 24,
      address: '42 Lake View, Kandy, Sri Lanka',
      notes: 'Completed Introductory Dressmaking in 2024.',
    },
  });

  // Enrollment 1: 25,000 LKR - 5,000 LKR discount = 20,000 LKR
  const enrollment1 = await prisma.enrollment.create({
    data: {
      tenantId: tenant.id,
      studentId: student1.id,
      courseId: course1.id,
      originalPrice: 25000.0,
      discountTotal: 5000.0,
      finalPrice: 20000.0,
      paymentPlanType: 'INSTALLMENT',
      status: 'ACTIVE',
      discounts: {
        create: {
          discountId: discount1.id,
          name: discount1.name,
          amount: 5000.0,
          reason: 'Returning student loyalty discount',
        },
      },
    },
  });

  // Invoice 1
  const invoice1 = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      invoiceNumber: 'INV-2026-000001',
      enrollmentId: enrollment1.id,
      studentId: student1.id,
      subtotal: 25000.0,
      discountTotal: 5000.0,
      totalAmount: 20000.0,
      paidAmount: 10000.0,
      balance: 10000.0,
      status: 'PARTIALLY_PAID',
    },
  });

  // Payment Plan 1: 3 installments (10k, 5k, 5k)
  const now = new Date();
  const due2 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const due3 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const paymentPlan1 = await prisma.paymentPlan.create({
    data: {
      enrollmentId: enrollment1.id,
      type: 'INSTALLMENT',
      totalAmount: 20000.0,
      numberOfInstallments: 3,
      installments: {
        create: [
          {
            installmentNumber: 1,
            title: '1st Installment (Registration)',
            expectedAmount: 10000.0,
            paidAmount: 10000.0,
            dueDate: now,
            status: 'PAID',
            paidAt: now,
          },
          {
            installmentNumber: 2,
            title: '2nd Installment',
            expectedAmount: 5000.0,
            paidAmount: 0.0,
            dueDate: due2,
            status: 'PENDING',
          },
          {
            installmentNumber: 3,
            title: '3rd Installment (Final)',
            expectedAmount: 5000.0,
            paidAmount: 0.0,
            dueDate: due3,
            status: 'PENDING',
          },
        ],
      },
    },
    include: { installments: true },
  });

  const inst1 = paymentPlan1.installments.find((i) => i.installmentNumber === 1);

  // Payment 1 for Student 1
  await prisma.payment.create({
    data: {
      tenantId: tenant.id,
      paymentNumber: 'REC-2026-000001',
      invoiceId: invoice1.id,
      studentId: student1.id,
      enrollmentId: enrollment1.id,
      installmentId: inst1?.id,
      amount: 10000.0,
      method: 'CASH',
      reference: 'REG-INITIAL-CASH',
      receivedBy: 'Admin Nimas',
      notes: 'Initial registration payment for Fashion Design Diploma',
    },
  });

  // SMS Log 1
  await prisma.smsLog.create({
    data: {
      tenantId: tenant.id,
      recipientMobile: student1.mobile,
      recipientName: `${student1.firstName} ${student1.lastName}`,
      message: `Dear Sanduni, payment of LKR 10,000 received for Fashion Design Diploma. Balance: LKR 10,000. Receipt: REC-2026-000001. Thank you, Nimas Fashion Academy.`,
      type: 'PAYMENT_RECEIPT',
      status: 'SENT_MOCK',
    },
  });

  // 7. Seed Student 2: Kasun Jayawardena (Full Payment Plan)
  const student2 = await prisma.student.create({
    data: {
      tenantId: tenant.id,
      studentId: 'NFA-000002',
      firstName: 'Kasun',
      lastName: 'Jayawardena',
      mobile: '0719876543',
      email: 'kasun.j@gmail.com',
      nic: '199834512789',
      age: 26,
      address: '15 Havelock Road, Colombo 05, Sri Lanka',
    },
  });

  const enrollment2 = await prisma.enrollment.create({
    data: {
      tenantId: tenant.id,
      studentId: student2.id,
      courseId: course2.id,
      originalPrice: 35000.0,
      discountTotal: 0.0,
      finalPrice: 35000.0,
      paymentPlanType: 'FULL_PAYMENT',
      status: 'ACTIVE',
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      invoiceNumber: 'INV-2026-000002',
      enrollmentId: enrollment2.id,
      studentId: student2.id,
      subtotal: 35000.0,
      discountTotal: 0.0,
      totalAmount: 35000.0,
      paidAmount: 35000.0,
      balance: 0.0,
      status: 'PAID',
    },
  });

  await prisma.paymentPlan.create({
    data: {
      enrollmentId: enrollment2.id,
      type: 'FULL_PAYMENT',
      totalAmount: 35000.0,
      numberOfInstallments: 1,
      installments: {
        create: [
          {
            installmentNumber: 1,
            title: 'Full Payment Settlement',
            expectedAmount: 35000.0,
            paidAmount: 35000.0,
            dueDate: null, // Full payment has no due date!
            status: 'PAID',
            paidAt: now,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      tenantId: tenant.id,
      paymentNumber: 'REC-2026-000002',
      invoiceId: invoice2.id,
      studentId: student2.id,
      enrollmentId: enrollment2.id,
      amount: 35000.0,
      method: 'CARD',
      reference: 'VISA-AUTH-894102',
      receivedBy: 'Admin Nimas',
      notes: 'Full payment via Visa card',
    },
  });

  await prisma.smsLog.create({
    data: {
      tenantId: tenant.id,
      recipientMobile: student2.mobile,
      recipientName: `${student2.firstName} ${student2.lastName}`,
      message: `Dear Kasun, full course settlement of LKR 35,000 received for Advanced Pattern Making & Tailoring. Course balance is LKR 0. Receipt: REC-2026-000002. Welcome to Nimas Fashion Academy!`,
      type: 'PAYMENT_RECEIPT',
      status: 'SENT_MOCK',
    },
  });

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
