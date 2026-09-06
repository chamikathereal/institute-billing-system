import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service.js';

@ApiTags('Invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'List invoices with filtering and pagination' })
  async findAll(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.invoicesService.findAll({
      tenantId,
      status,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice details by ID or Invoice Number' })
  async findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }
}
