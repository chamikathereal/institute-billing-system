import { Module } from '@nestjs/common';
import { PublicPortalService } from './public-portal.service.js';
import { PublicPortalController } from './public-portal.controller.js';

@Module({
  controllers: [PublicPortalController],
  providers: [PublicPortalService],
  exports: [PublicPortalService],
})
export class PublicPortalModule {}
