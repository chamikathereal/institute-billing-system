import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Tenant } from '@prisma/client';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async getDefaultTenant(): Promise<Tenant> {
    let tenant = await this.prisma.tenant.findFirst({
      where: { slug: 'nimas-fashion-academy' },
    });
    if (!tenant) {
      tenant = await this.prisma.tenant.findFirst();
    }
    if (!tenant) {
      throw new NotFoundException('Default tenant not found in database.');
    }
    return tenant;
  }

  async resolveTenant(tenantId?: string): Promise<Tenant> {
    if (tenantId) {
      const tenant = await this.prisma.tenant.findFirst({
        where: {
          OR: [{ id: tenantId }, { slug: tenantId }],
        },
      });
      if (tenant) return tenant;
    }
    return this.getDefaultTenant();
  }

  async getTenantByIdOrSlug(idOrSlug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });
  }

  async updateTenant(tenantId: string, data: {
    name?: string;
    tagline?: string;
    logoUrl?: string;
    phone?: string;
    email?: string;
    address?: string;
    currency?: string;
  }): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data,
    });
  }
}
