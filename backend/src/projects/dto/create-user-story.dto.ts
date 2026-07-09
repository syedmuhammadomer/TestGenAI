import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserStoryDto {
  @ApiProperty({ description: 'Who the story is for', example: 'Registered member', required: false })
  @IsOptional()
  @IsString()
  actor?: string;

  @ApiProperty({ description: 'What the actor wants to accomplish', example: 'search the catalog by title' })
  @IsNotEmpty({ message: 'Goal must not be empty' })
  @IsString()
  goal: string;

  @ApiProperty({ description: 'Why the actor wants this', example: 'so I can find books quickly', required: false })
  @IsOptional()
  @IsString()
  benefit?: string;

  @ApiProperty({ description: 'Acceptance criteria', required: false })
  @IsOptional()
  @IsString()
  acceptanceCriteria?: string;
}
