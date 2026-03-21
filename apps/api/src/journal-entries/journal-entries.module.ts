import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  JournalEntry,
  JournalEntrySchema,
} from './schemas/journal-entry.schema';
import { JournalEntriesRepository } from './journal-entries.repository';
import { JournalEntriesService } from './journal-entries.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JournalEntry.name, schema: JournalEntrySchema },
    ]),
  ],
  providers: [JournalEntriesRepository, JournalEntriesService],
  exports: [JournalEntriesService, JournalEntriesRepository],
})
export class JournalEntriesModule {}
