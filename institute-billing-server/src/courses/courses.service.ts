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

  async findAll(tenantId?: string) {
    const tenant = await this.tenantsService.resolveTenant(tenantId);

    return this.prisma.course.findMany({
      where: { tenantId: tenant.id, status: 'ACTIVE' },
      include: {
        schemes: true,
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
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

  async create(dto: CreateCourseDto, tenantId?: string) {
    const tenant = await this.tenantsService.resolveTenant(tenantId);

    let code = dto.code;
    if (!code) {
      const count = await this.prisma.course.count({ where: { tenantId: tenant.id } });
      code = `CRS-${String(count + 1).padStart(3, '0')}`;
    }

    const thumbnail = dto.thumbnailUrl?.trim() || DEFAULT_COURSE_THUMBNAIL;

    return this.prisma.course.create({
      data: {
        tenantId: tenant.id,
        code,
        name: dto.name,
        description: dto.description || '',
        thumbnailUrl: thumbnail,
        basePrice: dto.basePrice,
        duration: dto.duration || '',
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
        ...(dto.duration !== undefined && { duration: dto.duration }),
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
