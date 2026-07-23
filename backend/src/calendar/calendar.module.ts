import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { MeetingParticipant } from './entities/meeting-participant.entity';
import { Meeting } from './entities/meeting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Meeting, MeetingParticipant])],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
