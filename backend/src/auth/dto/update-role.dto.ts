import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiProperty({ description: 'New role for the user', example: 'admin', enum: ['admin', 'member'] })
  @IsIn(['admin', 'member'], { message: 'Role must be either admin or member' })
  role: 'admin' | 'member';
}
