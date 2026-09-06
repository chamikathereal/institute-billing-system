import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DiscountsService, CreateDiscountDto } from './discounts.service.js';

@ApiTags('Discounts')
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Get()
  @ApiOperation({ summary: 'List all active dynamic discounts' })
  async findAll(@Query('tenantId') tenantId?: string) {
    return this.discountsService.findAll(tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new dynamic discount' })
  async create(
    @Body() dto: CreateDiscountDto,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.discountsService.create(dto, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing discount' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateDiscountDto> & { isActive?: boolean },
  ) {
    return this.discountsService.update(id, dto);
  }
}
