import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';

@Module({
  imports: [
    PrismaModule,
    TenantsModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'nfa_super_secret_institute_billing_jwt_key_2026',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
