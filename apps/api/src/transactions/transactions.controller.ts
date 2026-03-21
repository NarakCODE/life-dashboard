import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a transaction' })
  @ApiCreatedResponse({ description: 'The created transaction object' })
  create(
    @CurrentUser('sub') userId: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(userId, createTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get transactions with pagination and filters' })
  @ApiOkResponse({
    description: 'The list of matching transactions and pagination data',
  })
  findAll(
    @CurrentUser('sub') userId: string,
    @Query() queryTransactionDto: QueryTransactionDto,
  ) {
    return this.transactionsService.findMany(userId, queryTransactionDto);
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Get a transaction summary for the current filters',
  })
  @ApiOkResponse({ description: 'Income, expense, net and grouped totals' })
  getSummary(
    @CurrentUser('sub') userId: string,
    @Query() queryTransactionDto: QueryTransactionDto,
  ) {
    return this.transactionsService.getSummary(userId, queryTransactionDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific transaction by ID' })
  @ApiOkResponse({ description: 'The requested transaction' })
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.transactionsService.findByIdAndUser(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiOkResponse({ description: 'The updated transaction' })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, userId, updateTransactionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiOkResponse({ description: 'Transaction successfully deleted' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.transactionsService.delete(id, userId);
  }
}
