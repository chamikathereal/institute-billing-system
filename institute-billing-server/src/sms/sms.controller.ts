import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SmsService } from './sms.service.js';

@ApiTags('SMS Notifications')
@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Get paginated SMS notification logs' })
  async getLogs(
    @Query('tenantId') tenantId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.smsService.getLogs(
      tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('trigger-reminders')
  @ApiOperation({ summary: 'Trigger upcoming installment due date SMS reminders' })
  async triggerDueReminders(@Query('tenantId') tenantId?: string) {
    return this.smsService.triggerDueReminders(tenantId);
  }
}
