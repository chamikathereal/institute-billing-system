import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SettingsService } from './settings.service.js';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current system and institute branding settings' })
  async getSettings(@Query('tenantId') tenantId?: string) {
    return this.settingsService.getSettings(tenantId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update dynamic system and institute branding settings' })
  async updateSettings(
    @Body() updates: Record<string, string>,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.settingsService.updateSettings(updates, tenantId);
  }
}
