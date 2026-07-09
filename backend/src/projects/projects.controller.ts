import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateUserStoryDto } from './dto/create-user-story.dto';
import { UpdateUserStoryDto } from './dto/update-user-story.dto';
import { ProjectsService } from './projects.service';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'srs');
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}
const allowedMimeTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const fileFilter = (_req, file, callback) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
    return;
  }
  callback(new BadRequestException('Only PDF and DOCX files are supported. Please convert legacy .doc files to .docx or PDF.'), false);
};

const storage = diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, UPLOAD_DIR);
  },
  filename: (_req, file, callback) => {
    const timestamp = Date.now();
    const name = file.originalname.replace(/\s+/g, '-');
    callback(null, `${timestamp}-${name}`);
  },
});

@ApiTags('projects')
@Controller('api/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Upload an SRS document to create a new project' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        projectName: { type: 'string', example: 'New Platform' },
        srsDocument: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['projectName', 'srsDocument'],
    },
  })
  @ApiResponse({ status: 201, description: 'Project queued for AI processing' })
  @ApiResponse({ status: 400, description: 'Invalid inputs or wrong file type' })
  @UseInterceptors(
    FileInterceptor('srsDocument', {
      storage,
      fileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async createProject(@Body() body: CreateProjectDto, @UploadedFile() file: Express.Multer.File) {
    if (file == null) {
      throw new BadRequestException('SRS document is required');
    }
    const project = await this.projectsService.createProject(body.projectName, file.path);
    return {
      message: 'Project queued for processing',
      projectId: project.id,
      status: project.status,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List processed projects' })
  @ApiResponse({ status: 200, description: 'Project list' })
  async listProjects() {
    return this.projectsService.listProjects();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project with AI results' })
  @ApiResponse({ status: 200, description: 'Project returned' })
  async getProject(@Param('id', ParseIntPipe) id: number) {
    const project = await this.projectsService.getProject(id);
    if (project == null) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  @Get(':projectId/user-stories')
  @ApiOperation({ summary: 'List user stories for a project' })
  async listUserStories(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.projectsService.listUserStories(projectId);
  }

  @Get(':projectId/user-stories/:storyId')
  @ApiOperation({ summary: 'Get a single user story by project' })
  async getUserStory(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('storyId', ParseIntPipe) storyId: number,
  ) {
    return this.projectsService.getUserStory(projectId, storyId);
  }

  @Post(':projectId/user-stories')
  @ApiOperation({ summary: 'Create a user story for a project' })
  async createUserStory(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() body: CreateUserStoryDto,
  ) {
    return this.projectsService.createUserStory(projectId, body);
  }

  @Patch(':projectId/user-stories/:storyId')
  @ApiOperation({ summary: 'Update a user story for a project' })
  async updateUserStory(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('storyId', ParseIntPipe) storyId: number,
    @Body() body: UpdateUserStoryDto,
  ) {
    return this.projectsService.updateUserStory(projectId, storyId, body);
  }

  @Delete(':projectId/user-stories/:storyId')
  @ApiOperation({ summary: 'Delete a user story from a project' })
  async deleteUserStory(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('storyId', ParseIntPipe) storyId: number,
  ) {
    await this.projectsService.deleteUserStory(projectId, storyId);
    return { message: 'User story deleted successfully' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project and its AI output' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  async deleteProject(@Param('id', ParseIntPipe) id: number) {
    await this.projectsService.deleteProject(id);
    return { message: 'Project deleted successfully' };
  }

  @Post(':id/user-stories')
  @ApiOperation({ summary: 'Manually add a user story to a project' })
  @ApiResponse({ status: 201, description: 'User story created' })
  async createUserStory(@Param('id', ParseIntPipe) id: number, @Body() body: CreateUserStoryDto) {
    return this.projectsService.createUserStory(id, body);
  }

  @Patch(':id/user-stories/:storyId')
  @ApiOperation({ summary: 'Update a user story' })
  @ApiResponse({ status: 200, description: 'User story updated' })
  async updateUserStory(
    @Param('id', ParseIntPipe) id: number,
    @Param('storyId', ParseIntPipe) storyId: number,
    @Body() body: UpdateUserStoryDto,
  ) {
    return this.projectsService.updateUserStory(id, storyId, body);
  }

  @Delete(':id/user-stories/:storyId')
  @ApiOperation({ summary: 'Delete a user story' })
  @ApiResponse({ status: 200, description: 'User story deleted' })
  async deleteUserStory(@Param('id', ParseIntPipe) id: number, @Param('storyId', ParseIntPipe) storyId: number) {
    await this.projectsService.deleteUserStory(id, storyId);
    return { message: 'User story deleted successfully' };
  }
}
