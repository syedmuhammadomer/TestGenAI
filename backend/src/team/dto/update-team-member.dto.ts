import { IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { MemberRole, TeamMemberStatus } from '../entities/team-member.entity';

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsEnum(MemberRole)
  role?: MemberRole;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  team?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  project?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modules?: string[];

  @IsOptional()
  @IsEnum(TeamMemberStatus)
  status?: TeamMemberStatus;

  @IsOptional()
  @IsString()
  lastActive?: string;
}
