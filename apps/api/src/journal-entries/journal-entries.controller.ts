import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JournalEntriesService } from './journal-entries.service';
import {
  CreateJournalEntryDto,
  UpdateJournalEntryDto,
  QueryJournalEntryDto,
  JournalEntryResponseDto,
  MoodSummaryQueryDto,
  MoodSummaryResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('journal-entries')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('journal-entries')
export class JournalEntriesController {
  constructor(private readonly journalEntriesService: JournalEntriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new journal entry' })
  @ApiCreatedResponse({
    description: 'The created journal entry',
    type: JournalEntryResponseDto,
  })
  create(
    @CurrentUser('sub') userId: string,
    @Body() createJournalEntryDto: CreateJournalEntryDto,
  ) {
    return this.journalEntriesService.create(userId, createJournalEntryDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all journal entries for the authenticated user',
    description:
      'Supports pagination, filtering by mood, date range, tags, and text search.',
  })
  @ApiOkResponse({
    description: 'List of journal entries with pagination',
    type: JournalEntryResponseDto,
    isArray: true,
  })
  findAll(
    @CurrentUser('sub') userId: string,
    @Query() queryDto: QueryJournalEntryDto,
  ) {
    return this.journalEntriesService.findMany(userId, queryDto);
  }

  @Get('mood-summary')
  @ApiOperation({
    summary: 'Get mood tracking summary',
    description:
      'Returns mood distribution, average mood, and trend over time.',
  })
  @ApiOkResponse({
    description: 'Mood summary statistics',
    type: MoodSummaryResponseDto,
  })
  getMoodSummary(
    @CurrentUser('sub') userId: string,
    @Query() queryDto: MoodSummaryQueryDto,
  ) {
    return this.journalEntriesService.getMoodSummary(userId, queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific journal entry by ID' })
  @ApiParam({ name: 'id', description: 'Journal entry ID' })
  @ApiOkResponse({
    description: 'The requested journal entry',
    type: JournalEntryResponseDto,
  })
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.journalEntriesService.findByIdAndUser(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a journal entry' })
  @ApiParam({ name: 'id', description: 'Journal entry ID' })
  @ApiOkResponse({
    description: 'The updated journal entry',
    type: JournalEntryResponseDto,
  })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() updateJournalEntryDto: UpdateJournalEntryDto,
  ) {
    return this.journalEntriesService.update(id, userId, updateJournalEntryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a journal entry' })
  @ApiParam({ name: 'id', description: 'Journal entry ID' })
  @ApiOkResponse({ description: 'Journal entry successfully deleted' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.journalEntriesService.delete(id, userId);
  }
}
