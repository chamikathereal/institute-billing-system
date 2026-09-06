import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportsService, ReportFilterDto } from './reports.service.js';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Generate comprehensive filtered and paginated billing reports' })
  async getReports(
    @Query('tenantId') tenantId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('courseId') courseId?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.getReports({
      tenantId,
      startDate,
      endDate,
      status,
      courseId,
      paymentMethod,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }
}
