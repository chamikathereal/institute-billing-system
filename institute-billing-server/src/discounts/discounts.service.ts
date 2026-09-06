import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service.js';
import { TenantsService } from '../tenants/tenants.service.js';

export class CreateDiscountDto {
  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  code?: string;

  @ApiProperty({ enum: ['FIXED', 'PERCENTAGE'] })
  type: 'FIXED' | 'PERCENTAGE';

  @ApiProperty()
  value: number;

  @ApiPropertyOptional()
  reason?: string;
}

@Injectable()
export class DiscountsService {
  constructor(
    private prisma: PrismaService,
    private tenantsService: TenantsService,
  ) {}

  async findAll(tenantId?: string) {
    const tenant = await this.tenantsService.resolveTenant(tenantId);

    return this.prisma.discount.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateDiscountDto, tenantId?: string) {
    const tenant = await this.tenantsService.resolveTenant(tenantId);

    return this.prisma.discount.create({
      data: {
        tenantId: tenant.id,
        name: dto.name,
        code: dto.code || dto.name.toUpperCase().replace(/\s+/g, '_').slice(0, 12),
        type: dto.type,
        value: dto.value,
        reason: dto.reason || '',
        isActive: true,
      },
    });
  }

  async update(id: string, dto: Partial<CreateDiscountDto> & { isActive?: boolean }) {
    const discount = await this.prisma.discount.findUnique({ where: { id } });
    if (!discount) throw new NotFoundException('Discount not found');

    return this.prisma.discount.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.type && { type: dto.type }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.reason !== undefined && { reason: dto.reason }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }
}
