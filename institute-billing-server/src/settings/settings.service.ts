import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TenantsService } from '../tenants/tenants.service.js';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private tenantsService: TenantsService,
  ) {}

  async getSettings(tenantId?: string) {
    const tenant = await this.tenantsService.resolveTenant(tenantId);

    const settingsList = await this.prisma.setting.findMany({
      where: { tenantId: tenant.id },
    });

    const settingsMap: Record<string, string> = {};
    for (const item of settingsList) {
      settingsMap[item.key] = item.value;
    }

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        tagline: tenant.tagline,
        logoUrl: tenant.logoUrl,
        phone: tenant.phone,
        email: tenant.email,
        address: tenant.address,
        currency: tenant.currency,
      },
      settings: settingsMap,
    };
  }

  async updateSettings(updates: Record<string, string>, tenantId?: string) {
    const tenant = await this.tenantsService.resolveTenant(tenantId);

    for (const [key, value] of Object.entries(updates)) {
      await this.prisma.setting.upsert({
        where: {
          tenantId_key: { tenantId: tenant.id, key },
        },
        update: { value: String(value) },
        create: {
          tenantId: tenant.id,
          key,
          value: String(value),
        },
      });
    }

    // Sync branding into Tenant record if provided
    const tenantUpdates: any = {};
    if (updates['institute_name']) tenantUpdates.name = updates['institute_name'];
    if (updates['institute_tagline']) tenantUpdates.tagline = updates['institute_tagline'];
    if (updates['logo_url']) tenantUpdates.logoUrl = updates['logo_url'];
    if (updates['institute_phone']) tenantUpdates.phone = updates['institute_phone'];
    if (updates['institute_email']) tenantUpdates.email = updates['institute_email'];
    if (updates['institute_address']) tenantUpdates.address = updates['institute_address'];
    if (updates['currency_symbol']) tenantUpdates.currency = updates['currency_symbol'];

    if (Object.keys(tenantUpdates).length > 0) {
      await this.tenantsService.updateTenant(tenant.id, tenantUpdates);
    }

    return this.getSettings(tenant.id);
  }
}
