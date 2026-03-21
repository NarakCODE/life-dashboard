import { Injectable } from '@nestjs/common';
import { JournalEntriesRepository } from './journal-entries.repository';
import { JournalEntryDocument } from './schemas/journal-entry.schema';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';

@Injectable()
export class JournalEntriesService {
  constructor(private readonly journalEntriesRepo: JournalEntriesRepository) {}

  // TODO: Implement service methods
  // async findById(id: string): Promise<JournalEntryDocument>
  // async findByUserId(userId: string): Promise<JournalEntryDocument[]>
  // async search(userId: string, query: string): Promise<JournalEntryDocument[]>
  // async create(dto: CreateJournalEntryDto, userId: string): Promise<JournalEntryDocument>
  // async update(id: string, dto: Partial<CreateJournalEntryDto>): Promise<JournalEntryDocument>
  // async delete(id: string): Promise<void>
}
