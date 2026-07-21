import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { TeamService } from './team.service';

@ApiTags('team')
@UseGuards(JwtAuthGuard)
@Controller('api/team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  @ApiOperation({ summary: 'Get team management dashboard data' })
  async getDashboard(@Req() req: AuthenticatedRequest) {
    return this.teamService.getDashboard(req.user!.id);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a new team member' })
  async inviteMember(@Req() req: AuthenticatedRequest, @Body() body: InviteTeamMemberDto) {
    return this.teamService.inviteMember(req.user!.id, body);
  }

  @Patch('members/:id')
  @ApiOperation({ summary: 'Update a team member' })
  async updateMember(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTeamMemberDto,
  ) {
    return this.teamService.updateMember(req.user!.id, id, body);
  }

  @Delete('members/:id')
  @ApiOperation({ summary: 'Delete a team member' })
  async deleteMember(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    await this.teamService.deleteMember(req.user!.id, id);
    return { message: 'Team member deleted successfully' };
  }
}
