import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EnrollmentsService, CreateEnrollmentDto } from './enrollments.service.js';

@ApiTags('Enrollments')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Enroll a student into a course with dynamic discount, invoice, installment plan, and initial payment' })
  async enroll(
    @Body() dto: CreateEnrollmentDto,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.enrollmentsService.enroll(dto, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get enrollment details by ID' })
  async findOne(@Param('id') id: string) {
    return this.enrollmentsService.findOne(id);
  }
}
