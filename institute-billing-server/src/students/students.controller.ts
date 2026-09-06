import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StudentsService, CreateStudentDto } from './students.service.js';

@ApiTags('Students')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @ApiOperation({ summary: 'Search and list students (by NIC, Student ID, mobile, name, email)' })
  async findAll(
    @Query('search') search?: string,
    @Query('tenantId') tenantId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.studentsService.findAll({
      search,
      tenantId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dedicated student profile with enrollments, invoices, and payments' })
  async findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new student with auto-generated ID' })
  async create(
    @Body() dto: CreateStudentDto,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.studentsService.create(dto, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update student details' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateStudentDto>) {
    return this.studentsService.update(id, dto);
  }
}
