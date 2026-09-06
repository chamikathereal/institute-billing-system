import { Module } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service.js';
import { EnrollmentsController } from './enrollments.controller.js';
import { StudentsModule } from '../students/students.module.js';
import { SmsModule } from '../sms/sms.module.js';

@Module({
  imports: [StudentsModule, SmsModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
