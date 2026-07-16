import { IsArray, IsBoolean, IsEmail, IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { MemberRole } from '../entities/team-member.entity';

export class InviteTeamMemberDto {
  @IsString()
  @MaxLength(120)
  fullName: string;

  @IsEmail()
  email: string;

  @IsEnum(MemberRole)
  role: MemberRole;

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
  @IsBoolean()
  sendCopy?: boolean;

  @IsOptional()
  @IsBoolean()
  addWelcomeNote?: boolean;
}
