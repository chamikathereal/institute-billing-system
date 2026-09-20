import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CoursesService, CreateCourseDto } from './courses.service.js';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'List active courses with pagination and search' })
  async findAll(
    @Query('tenantId') tenantId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('all') all?: string,
  ) {
    return this.coursesService.findAll({
      tenantId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      all: all === 'true',
    });
  }

  @Get('next-code')
  @ApiOperation({ summary: 'Get next auto-generated course code' })
  async getNextCode(@Query('tenantId') tenantId?: string) {
    const code = await this.coursesService.generateNextCourseCode(tenantId);
    return { code };
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
