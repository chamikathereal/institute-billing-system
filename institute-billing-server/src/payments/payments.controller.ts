import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService, RecordPaymentDto } from './payments.service.js';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List recent payment receipts with optional filtering' })
  async findAll(
    @Query('tenantId') tenantId?: string,
    @Query('studentId') studentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.findAll({
      tenantId,
      studentId,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('student-pending/:keyword')
  @ApiOperation({ summary: 'Search student by NIC, Student ID, Mobile, or Email to view pending installments and record payment' })
  async getStudentPendingInstallments(
    @Param('keyword') keyword: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.paymentsService.getStudentPendingInstallments(keyword, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Record installment payment (supports exact, custom, or overpayment with next due date setting)' })
  async recordPayment(
    @Body() dto: RecordPaymentDto,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.paymentsService.recordPayment(dto, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment receipt details by ID' })
  async findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }
}
