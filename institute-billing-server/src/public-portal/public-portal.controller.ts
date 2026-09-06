import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PublicPortalService } from './public-portal.service.js';

@ApiTags('Public Student Portal')
@Controller('public')
export class PublicPortalController {
  constructor(private readonly portalService: PublicPortalService) {}

  @Get('student-lookup/:studentId')
  @ApiOperation({ summary: 'Global public student lookup by student ID without a password' })
  async lookupStudent(@Param('studentId') studentId: string) {
    return this.portalService.lookupStudent(studentId);
  }
}
