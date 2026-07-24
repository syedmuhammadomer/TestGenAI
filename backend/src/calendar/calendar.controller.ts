import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CalendarService } from './calendar.service';
import { CreateMeetingDto, UpdateAttendanceDto, UpdateMeetingDto } from './dto/create-meeting.dto';

@ApiTags('calendar')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller('api/calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('meetings')
  @ApiOperation({ summary: 'List meetings accessible to the current user' })
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('projectId') projectId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.calendarService.findAll(req.user!.id, {
      projectId: projectId ? Number(projectId) : undefined,
      type,
      status,
      from,
      to,
    });
  }

  @Get('meetings/upcoming')
  @ApiOperation({ summary: 'Get upcoming meetings for dashboard widget' })
  async getUpcoming(@Req() req: AuthenticatedRequest, @Query('limit') limit?: string) {
    return this.calendarService.getUpcoming(req.user!.id, limit ? Number(limit) : 5);
  }

  @Get('meetings/:id')
  @ApiOperation({ summary: 'Get a specific meeting' })
  async findOne(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.calendarService.findOne(id, req.user!.id);
  }

  @Post('meetings')
  @ApiOperation({ summary: 'Create a meeting (PM, BA, Company Admin only)' })
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateMeetingDto) {
    return this.calendarService.create(dto, req.user!.id, req.user!.role, req.user!.email);
  }

  @Patch('meetings/:id')
  @ApiOperation({ summary: 'Update a meeting (PM, BA, Company Admin only)' })
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMeetingDto,
  ) {
    return this.calendarService.update(id, dto, req.user!.id, req.user!.role, req.user!.email);
  }

  @Delete('meetings/:id')
  @ApiOperation({ summary: 'Delete a meeting (PM, BA, Company Admin only)' })
  async remove(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    await this.calendarService.remove(id, req.user!.id, req.user!.role, req.user!.email);
    return { message: 'Meeting deleted' };
  }

  @Get('projects/:projectId/meetings')
  @ApiOperation({ summary: 'Get all meetings for a project' })
  async getByProject(
    @Req() req: AuthenticatedRequest,
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    return this.calendarService.getByProject(projectId, req.user!.id);
  }

  @Patch('meetings/:id/attendance')
  @ApiOperation({ summary: 'Update your attendance status for a meeting' })
  async updateAttendance(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.calendarService.updateAttendance(id, req.user!.id, dto.status);
  }
}
