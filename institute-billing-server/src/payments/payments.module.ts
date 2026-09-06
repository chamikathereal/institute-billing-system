import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { PaymentsController } from './payments.controller.js';
import { SmsModule } from '../sms/sms.module.js';

@Module({
  imports: [SmsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
