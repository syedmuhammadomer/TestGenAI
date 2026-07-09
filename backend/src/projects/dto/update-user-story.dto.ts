import { PartialType } from '@nestjs/swagger';
import { CreateUserStoryDto } from './create-user-story.dto';

export class UpdateUserStoryDto extends PartialType(CreateUserStoryDto) {}
