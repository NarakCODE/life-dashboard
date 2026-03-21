import { Injectable, NotFoundException } from '@nestjs/common';
import { JournalEntriesRepository } from './journal-entries.repository';
import {
  JournalEntryDocument,
  MoodLabels,
} from './schemas/journal-entry.schema';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto';
import { QueryJournalEntryDto } from './dto/query-journal-entry.dto';
import {
  MoodSummaryQueryDto,
  MoodSummaryResponseDto,
} from './dto/mood-summary.dto';

@Injectable()
export class JournalEntriesService {
  constructor(private readonly journalEntriesRepo: JournalEntriesRepository) {}

  /**
   * Create a new journal entry
   */
  async create(
    userId: string,
    dto: CreateJournalEntryDto,
  ): Promise<JournalEntryDocument> {
    return this.journalEntriesRepo.create(userId, dto);
  }

  /**
   * Find entry by ID (user-scoped)
   */
  async findByIdAndUser(
    id: string,
    userId: string,
  ): Promise<JournalEntryDocument> {
    const entry = await this.journalEntriesRepo.findByIdAndUser(id, userId);
    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }
    return entry;
  }

  /**
   * Find entries with pagination and filters
   */
  async findMany(
    userId: string,
    query: QueryJournalEntryDto,
  ): Promise<{ items: JournalEntryDocument[]; total: number }> {
    return this.journalEntriesRepo.findWithPaginationAndFilters(userId, query);
  }

  /**
   * Update entry (user-scoped)
   */
  async update(
    id: string,
    userId: string,
    dto: UpdateJournalEntryDto,
  ): Promise<JournalEntryDocument> {
    const entry = await this.journalEntriesRepo.updateByIdAndUser(
      id,
      userId,
      dto,
    );
    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }
    return entry;
  }

  /**
   * Delete entry (user-scoped)
   */
  async delete(id: string, userId: string): Promise<void> {
    const deleted = await this.journalEntriesRepo.deleteByIdAndUser(id, userId);
    if (!deleted) {
      throw new NotFoundException('Journal entry not found');
    }
  }

  /**
   * Get mood summary for a user
   */
  async getMoodSummary(
    userId: string,
    query: MoodSummaryQueryDto,
  ): Promise<MoodSummaryResponseDto> {
    const dateFrom = query.dateFrom;
    const dateTo = query.dateTo;

    // Get summary data
    const summary = await this.journalEntriesRepo.getMoodSummary(
      userId,
      dateFrom,
      dateTo,
    );

    // Get trend data
    const trend = await this.journalEntriesRepo.getMoodTrend(
      userId,
      dateFrom,
      dateTo,
    );

    // Calculate mood distribution with percentages and labels
    const moodDistribution = summary.moodDistribution.map((item) => ({
      mood: item.mood,
      label: MoodLabels[item.mood],
      count: item.count,
      percentage:
        summary.entriesWithMood > 0
          ? Math.round((item.count / summary.entriesWithMood) * 100 * 10) / 10
          : 0,
    }));

    // Determine period dates
    const periodStart =
      dateFrom || (trend.length > 0 ? new Date(trend[0].date) : new Date());
    const periodEnd =
      dateTo ||
      (trend.length > 0 ? new Date(trend[trend.length - 1].date) : new Date());

    return {
      totalEntries: summary.totalEntries,
      entriesWithMood: summary.entriesWithMood,
      averageMood: summary.averageMood,
      moodDistribution,
      trend,
      periodStart,
      periodEnd,
    };
  }
}
