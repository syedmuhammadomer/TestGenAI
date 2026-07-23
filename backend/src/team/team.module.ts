import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from '../auth/email.service';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { TeamActivity } from './entities/team-activity.entity';
import { TeamGroup } from './entities/team-group.entity';
import { TeamMember } from './entities/team-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TeamMember, TeamActivity, TeamGroup])],
  controllers: [TeamController],
  providers: [TeamService, EmailService],
  exports: [TeamService],
})
export class TeamModule {}
