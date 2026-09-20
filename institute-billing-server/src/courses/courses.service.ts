import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service.js';
import { TenantsService } from '../tenants/tenants.service.js';

const DEFAULT_COURSE_THUMBNAIL =
  'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&auto=format&fit=crop&q=80';

export class CourseSchemeDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  numberOfInstallments: number;

  @ApiProperty()
  breakdownJson: any;

  @ApiPropertyOptional()
  isDefault?: boolean;
}

export class CreateCourseDto {
  @ApiPropertyOptional()
  code?: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  thumbnailUrl?: string;

  @ApiProperty()
  basePrice: number;

  @ApiPropertyOptional()
  duration?: string;

  @ApiPropertyOptional({ type: () => [CourseSchemeDto] })
  schemes?: CourseSchemeDto[];
}

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private tenantsService: TenantsService,
  ) {}

  async findAll(
    params: {
      tenantId?: string;
      page?: number;
      limit?: number;
      search?: string;
      all?: boolean;
    } = {},
  ) {
    const tenant = await this.tenantsService.resolveTenant(params.tenantId);

    const where: any = { tenantId: tenant.id, status: 'ACTIVE' };

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q } },
        { code: { contains: q } },
        { description: { contains: q } },
      ];
    }

    if (params.all) {
      const courses = await this.prisma.course.findMany({
        where,
        include: {
          schemes: true,
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return {
        data: courses,
        pagination: {
          total: courses.length,
          page: 1,
          limit: courses.length || 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 10);
    const skip = (page - 1) * limit;

    const [total, courses] = await Promise.all([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        include: {
          schemes: true,
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: courses,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        schemes: true,
        _count: { select: { enrollments: true } },
      },
    });
    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
    return course;
  }

  private formatDuration(raw?: string): string {
    if (!raw || !raw.trim()) return '';
    const trimmed = raw.trim();
    const num = parseInt(trimmed, 10);
    if (!isNaN(num) && /^\d+$/.test(trimmed)) {
      return `${num} Month${num === 1 ? '' : 's'}`;
    }
    return trimmed;
  }

  async generateNextCourseCode(tenantId?: string): Promise<string> {
    const tenant = await this.tenantsService.resolveTenant(tenantId);
    const prefixSetting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId: tenant.id, key: 'course_code_prefix' } },
    });
    const studentPrefixSetting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId: tenant.id, key: 'student_id_prefix' } },
    });
    const prefix = prefixSetting?.value || studentPrefixSetting?.value || 'NFA';

    const courses = await this.prisma.course.findMany({
      where: { tenantId: tenant.id },
      select: { code: true },
    });

    let maxNum = courses.length;
    for (const c of courses) {
      const match = c.code.match(/\d+$/);
      if (match) {
        const val = parseInt(match[0], 10);
        if (!isNaN(val) && val > maxNum) {
          maxNum = val;
        }
      }
    }

    let nextNum = maxNum + 1;
    let candidate = `${prefix}-CRS${String(nextNum).padStart(2, '0')}`;
    const existingCodes = new Set(courses.map((c) => c.code.toUpperCase()));
    while (existingCodes.has(candidate.toUpperCase())) {
      nextNum += 1;
      candidate = `${prefix}-CRS${String(nextNum).padStart(2, '0')}`;
    }

    return candidate;
  }

  async create(dto: CreateCourseDto, tenantId?: string) {
    const tenant = await this.tenantsService.resolveTenant(tenantId);

    let code = dto.code?.trim();
    if (!code) {
      code = await this.generateNextCourseCode(tenant.id);
    }

    const thumbnail = dto.thumbnailUrl?.trim() || DEFAULT_COURSE_THUMBNAIL;
    const duration = this.formatDuration(dto.duration);

    return this.prisma.course.create({
      data: {
        tenantId: tenant.id,
        code,
        name: dto.name,
        description: dto.description || '',
        thumbnailUrl: thumbnail,
        basePrice: dto.basePrice,
        duration,
        status: 'ACTIVE',
        schemes: dto.schemes && dto.schemes.length > 0
          ? {
              create: dto.schemes.map((s, idx) => ({
                name: s.name,
                numberOfInstallments: s.numberOfInstallments,
                isDefault: s.isDefault ?? idx === 0,
                breakdownJson:
                  typeof s.breakdownJson === 'string'
                    ? s.breakdownJson
                    : JSON.stringify(s.breakdownJson),
              })),
            }
          : undefined,
      },
      include: { schemes: true },
    });
  }

  async update(id: string, dto: Partial<CreateCourseDto>) {
    await this.findOne(id);

    return this.prisma.course.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.code && { code: dto.code }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.thumbnailUrl !== undefined && {
          thumbnailUrl: dto.thumbnailUrl.trim() || DEFAULT_COURSE_THUMBNAIL,
        }),
        ...(dto.basePrice !== undefined && { basePrice: dto.basePrice }),
        ...(dto.duration !== undefined && { duration: this.formatDuration(dto.duration) }),
      },
      include: { schemes: true },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.course.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }
}
