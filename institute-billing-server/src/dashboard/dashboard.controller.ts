import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service.js';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard KPIs, recent payments, and upcoming due installments' })
  async getStats(@Query('tenantId') tenantId?: string) {
    return this.dashboardService.getStats(tenantId);
  }
}
