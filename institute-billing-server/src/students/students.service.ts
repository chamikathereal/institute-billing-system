import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service.js';
import { TenantsService } from '../tenants/tenants.service.js';

export class CreateStudentDto {
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

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private tenantsService: TenantsService,
  ) {}

  async generateNextStudentId(tenantId: string): Promise<string> {
    const prefixSetting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: 'student_id_prefix' } },
    });
    const prefix = prefixSetting ? prefixSetting.value : 'NFA';

    const nextNumberSetting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: 'student_id_next_number' } },
    });
    let nextNum = nextNumberSetting ? parseInt(nextNumberSetting.value, 10) : 1;

    let generatedId = `${prefix}-${String(nextNum).padStart(6, '0')}`;
    let exists = await this.prisma.student.findFirst({
      where: { tenantId, studentId: generatedId },
    });

    while (exists) {
      nextNum += 1;
      generatedId = `${prefix}-${String(nextNum).padStart(6, '0')}`;
      exists = await this.prisma.student.findFirst({
        where: { tenantId, studentId: generatedId },
      });
    }

    await this.prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: 'student_id_next_number' } },
      update: { value: String(nextNum + 1) },
      create: { tenantId, key: 'student_id_next_number', value: String(nextNum + 1) },
    });

    return generatedId;
  }

  async create(dto: CreateStudentDto, tenantId?: string) {
    const tenant = await this.tenantsService.resolveTenant(tenantId);

    if (!dto.firstName || !dto.mobile) {
      throw new BadRequestException('First Name and Mobile Number are required.');
    }

    const studentId = await this.generateNextStudentId(tenant.id);

    return this.prisma.student.create({
      data: {
        tenantId: tenant.id,
        studentId,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName?.trim() || null,
        mobile: dto.mobile.trim(),
        email: dto.email?.trim() || null,
        nic: dto.nic?.trim() || null,
        address: dto.address?.trim() || null,
        age: dto.age ? Number(dto.age) : null,
        notes: dto.notes || null,
      },
    });
  }

  async findAll(params: { search?: string; tenantId?: string; page?: number; limit?: number }) {
    const tenant = await this.tenantsService.resolveTenant(params.tenantId);

    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { tenantId: tenant.id };

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { studentId: { contains: q } },
        { nic: { contains: q } },
        { mobile: { contains: q } },
        { email: { contains: q } },
        { firstName: { contains: q } },
        { lastName: { contains: q } },
      ];
    }

    const [total, students] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        include: {
          enrollments: {
            include: {
              course: true,
              invoice: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(idOrStudentId: string) {
    const student = await this.prisma.student.findFirst({
      where: {
        OR: [{ id: idOrStudentId }, { studentId: idOrStudentId }],
      },
      include: {
        enrollments: {
          include: {
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
          },
        },
        invoices: {
          include: {
            payments: {
              orderBy: { paidAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          include: {
            installment: true,
            invoice: true,
          },
          orderBy: { paidAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student '${idOrStudentId}' not found.`);
    }

    const smsLogs = await this.prisma.smsLog.findMany({
      where: {
        tenantId: student.tenantId,
        recipientMobile: student.mobile,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      ...student,
      smsLogs,
    };
  }

  async update(id: string, dto: Partial<CreateStudentDto>) {
    await this.findOne(id);

    return this.prisma.student.update({
      where: { id },
      data: {
        ...(dto.firstName && { firstName: dto.firstName.trim() }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName?.trim() || null }),
        ...(dto.mobile && { mobile: dto.mobile.trim() }),
        ...(dto.email !== undefined && { email: dto.email?.trim() || null }),
        ...(dto.nic !== undefined && { nic: dto.nic?.trim() || null }),
        ...(dto.address !== undefined && { address: dto.address?.trim() || null }),
        ...(dto.age !== undefined && { age: dto.age ? Number(dto.age) : null }),
        ...(dto.notes !== undefined && { notes: dto.notes || null }),
      },
    });
  }
}
