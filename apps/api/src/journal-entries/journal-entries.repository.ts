import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JournalEntry, JournalEntryDocument } from './schemas/journal-entry.schema';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';

/**
 * Encapsulates all Mongoose queries for JournalEntries (arch-use-repository-pattern).
 */
@Injectable()
export class JournalEntriesRepository {
  constructor(
    @InjectModel(JournalEntry.name) private readonly journalEntryModel: Model<JournalEntryDocument>,
  ) {}

  // TODO: Implement repository methods
  // async findById(id: string | Types.ObjectId): Promise<JournalEntryDocument | null>
  // async findByUserId(userId: string | Types.ObjectId): Promise<JournalEntryDocument[]>
  // async search(userId: string, query: string): Promise<JournalEntryDocument[]>
  // async create(dto: CreateJournalEntryDto, userId: string): Promise<JournalEntryDocument>
  // async update(id: string, dto: Partial<CreateJournalEntryDto>): Promise<JournalEntryDocument | null>
  // async delete(id: string): Promise<void>
}
