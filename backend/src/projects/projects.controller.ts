import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard, AuthenticatedRequest } from '../auth/guards/jwt-auth.guard';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateUserStoryDto } from './dto/create-user-story.dto';
import { UpdateUserStoryDto } from './dto/update-user-story.dto';
import { ProjectsService } from './projects.service';

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

@ApiTags('projects')
@UseGuards(JwtAuthGuard)
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
      storage: memoryStorage(),
      fileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async createProject(@Req() req: AuthenticatedRequest, @Body() body: CreateProjectDto, @UploadedFile() file: Express.Multer.File) {
    if (file == null) {
      throw new BadRequestException('SRS document is required');
    }
    // Extract text immediately from the in-memory buffer — no disk write needed.
    // This means the text is persisted in the DB and survives container restarts.
    const extractedText = await this.projectsService.extractTextFromBuffer(file.buffer, file.originalname);
    const project = await this.projectsService.createProject(body.projectName, extractedText, req.user!.id);
    return {
      message: 'Project queued for processing',
      projectId: project.id,
      status: project.status,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List processed projects' })
  @ApiResponse({ status: 200, description: 'Project list' })
  async listProjects(@Req() req: AuthenticatedRequest) {
    return this.projectsService.listProjects(req.user!.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project with AI results' })
  @ApiResponse({ status: 200, description: 'Project returned' })
  async getProject(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    const project = await this.projectsService.getProject(id, req.user!.id);
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
    @Req() req: AuthenticatedRequest,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() body: CreateUserStoryDto,
  ) {
    return this.projectsService.createUserStory(projectId, body, req.user!.id);
  }

  @Patch(':projectId/user-stories/:storyId')
  @ApiOperation({ summary: 'Update a user story for a project' })
  async updateUserStory(
    @Req() req: AuthenticatedRequest,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('storyId', ParseIntPipe) storyId: number,
    @Body() body: UpdateUserStoryDto,
  ) {
    return this.projectsService.updateUserStory(projectId, storyId, body, req.user!.id);
  }

  @Delete(':projectId/user-stories/:storyId')
  @ApiOperation({ summary: 'Delete a user story from a project' })
  async deleteUserStory(
    @Req() req: AuthenticatedRequest,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('storyId', ParseIntPipe) storyId: number,
  ) {
    await this.projectsService.deleteUserStory(projectId, storyId, req.user!.id);
    return { message: 'User story deleted successfully' };
  }

  @Post(':id/reprocess')
  @ApiOperation({ summary: 'Re-queue a failed or completed project for AI reprocessing' })
  async reprocessProject(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.projectsService.reprocessProject(id, req.user!.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project and its AI output' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  async deleteProject(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    await this.projectsService.deleteProject(id, req.user!.id);
    return { message: 'Project deleted successfully' };
  }
}
