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
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';

@Injectable()
export class JournalEntriesService {
  constructor(private readonly journalEntriesRepo: JournalEntriesRepository) {}

  /**
   * Create a new journal entry
   */
  async create(
    workspace: WorkspaceRequestContext,
    dto: CreateJournalEntryDto,
  ): Promise<JournalEntryDocument> {
    return this.journalEntriesRepo.create(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      dto,
    );
  }

  /**
   * Find entry by ID (user-scoped)
   */
  async findByIdAndUser(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<JournalEntryDocument> {
    const entry = await this.journalEntriesRepo.findByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }
    return entry;
  }

  /**
   * Find entries with pagination and filters
   */
  async findMany(
    workspace: WorkspaceRequestContext,
    query: QueryJournalEntryDto,
  ): Promise<{ items: JournalEntryDocument[]; total: number }> {
    return this.journalEntriesRepo.findWithPaginationAndFilters(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      query,
    );
  }

  /**
   * Update entry (user-scoped)
   */
  async update(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: UpdateJournalEntryDto,
  ): Promise<JournalEntryDocument> {
    const entry = await this.journalEntriesRepo.updateByIdAndUser(
      id,
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
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
  async delete(id: string, workspace: WorkspaceRequestContext): Promise<void> {
    const deleted = await this.journalEntriesRepo.deleteByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!deleted) {
      throw new NotFoundException('Journal entry not found');
    }
  }

  /**
   * Get mood summary for a user
   */
  async getMoodSummary(
    workspace: WorkspaceRequestContext,
    query: MoodSummaryQueryDto,
  ): Promise<MoodSummaryResponseDto> {
    const dateFrom = query.dateFrom;
    const dateTo = query.dateTo;

    // Get summary data
    const summary = await this.journalEntriesRepo.getMoodSummary(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      dateFrom,
      dateTo,
    );

    // Get trend data
    const trend = await this.journalEntriesRepo.getMoodTrend(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
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
