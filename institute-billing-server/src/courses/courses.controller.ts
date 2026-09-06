import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CoursesService, CreateCourseDto } from './courses.service.js';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'List all active courses with schemes' })
  async findAll(@Query('tenantId') tenantId?: string) {
    return this.coursesService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course details by ID' })
  async findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new course with optional installment schemes' })
  async create(
    @Body() dto: CreateCourseDto,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.coursesService.create(dto, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update course details' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateCourseDto>) {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate/Archive a course' })
  async delete(@Param('id') id: string) {
    return this.coursesService.delete(id);
  }
}
