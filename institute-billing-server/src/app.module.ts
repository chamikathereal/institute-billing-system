import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './prisma/prisma.module.js';
import { TenantsModule } from './tenants/tenants.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { CoursesModule } from './courses/courses.module.js';
import { DiscountsModule } from './discounts/discounts.module.js';
import { StudentsModule } from './students/students.module.js';
import { EnrollmentsModule } from './enrollments/enrollments.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { InvoicesModule } from './invoices/invoices.module.js';
import { SmsModule } from './sms/sms.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { PublicPortalModule } from './public-portal/public-portal.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    TenantsModule,
    SettingsModule,
    CoursesModule,
    DiscountsModule,
    StudentsModule,
    EnrollmentsModule,
    PaymentsModule,
    InvoicesModule,
    SmsModule,
    ReportsModule,
    PublicPortalModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
