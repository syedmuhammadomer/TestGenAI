import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from '../auth/email.service';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { TeamActivity } from './entities/team-activity.entity';
import { TeamGroup } from './entities/team-group.entity';
import { DEFAULT_MODULES_BY_ROLE, MemberRole, ModuleKey, TeamMember, TeamMemberStatus } from './entities/team-member.entity';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
    @InjectRepository(TeamActivity)
    private readonly teamActivityRepository: Repository<TeamActivity>,
    @InjectRepository(TeamGroup)
    private readonly teamGroupRepository: Repository<TeamGroup>,
    private readonly emailService: EmailService,
  ) {}

  async createTeamGroup(userId: number, name: string, description?: string) {
    const existing = await this.teamGroupRepository.findOne({ where: { userId, name } });
    if (existing) throw new BadRequestException('A team with this name already exists.');
    const group = this.teamGroupRepository.create({ userId, name: name.trim(), description: description?.trim() });
    return this.teamGroupRepository.save(group);
  }

  async getTeamGroups(userId: number) {
    return this.teamGroupRepository.find({ where: { userId }, order: { createdAt: 'ASC' } });
  }

  async getDashboard(userId: number) {
    const members = await this.teamMemberRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
    const activities = await this.teamActivityRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 8,
    });

    const totalMembers = members.length;
    const activeNow = members.filter((m) => m.status === TeamMemberStatus.Online).length;
    const avgTestCases =
      totalMembers === 0
        ? 0
        : Math.round(members.reduce((sum, m) => sum + m.testCases, 0) / totalMembers);

    return {
      stats: { totalMembers, activeNow, avgTestCases },
      members,
      activity: activities,
    };
  }

  async inviteMember(userId: number, dto: InviteTeamMemberDto) {
    // Email must be unique within the same account
    const existing = await this.teamMemberRepository.findOne({
      where: { userId, email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new BadRequestException('A team member with this email already exists.');
    }

    const modules: ModuleKey[] =
      dto.modules && dto.modules.length > 0
        ? (dto.modules as ModuleKey[])
        : DEFAULT_MODULES_BY_ROLE[dto.role];

    const member = this.teamMemberRepository.create({
      userId,
      fullName: dto.fullName.trim(),
      email: dto.email.toLowerCase().trim(),
      role: dto.role,
      team: dto.team?.trim(),
      project: dto.project?.trim() || undefined,
      modules,
      sendCopy: dto.sendCopy ?? false,
      addWelcomeNote: dto.addWelcomeNote ?? false,
      testCases: 0,
      status: TeamMemberStatus.Invited,
      lastActive: 'Invitation sent just now',
    });

    const saved = await this.teamMemberRepository.save(member);

    await this.logActivity(
      userId,
      saved.fullName,
      `invited as ${this.roleLabel(saved.role)}${saved.project ? ` on ${saved.project}` : ''}`,
      'Just now',
    );

    this.emailService.sendTeamInviteEmail({
      email: saved.email,
      fullName: saved.fullName,
      role: this.roleLabel(saved.role),
      team: saved.team,
      project: saved.project,
    }).catch(() => { /* non-fatal */ });

    return saved;
  }

  async updateMember(userId: number, id: number, dto: UpdateTeamMemberDto) {
    const member = await this.teamMemberRepository.findOne({ where: { id, userId } });
    if (!member) throw new NotFoundException('Team member not found');

    if (dto.fullName !== undefined) member.fullName = dto.fullName.trim();
    if (dto.role !== undefined) {
      member.role = dto.role;
      if (dto.modules === undefined) {
        member.modules = DEFAULT_MODULES_BY_ROLE[dto.role];
      }
    }
    if (dto.modules !== undefined) member.modules = dto.modules as ModuleKey[];
    if (dto.team !== undefined) member.team = dto.team.trim() || undefined;
    if (dto.project !== undefined) member.project = dto.project.trim() || undefined;
    if (dto.status !== undefined) member.status = dto.status;
    if (dto.lastActive !== undefined) member.lastActive = dto.lastActive;

    const updated = await this.teamMemberRepository.save(member);
    await this.logActivity(userId, updated.fullName, 'profile updated', 'Just now');
    return updated;
  }

  async deleteMember(userId: number, id: number) {
    const member = await this.teamMemberRepository.findOne({ where: { id, userId } });
    if (!member) throw new NotFoundException('Team member not found');
    await this.teamMemberRepository.remove(member);
    await this.logActivity(userId, member.fullName, 'removed from the workspace', 'Just now');
  }

  /** Called from other modules (e.g. project events) to log activity for a user's team feed */
  async logActivityForUser(userId: number, actor: string, action: string, timeLabel: string) {
    await this.logActivity(userId, actor, action, timeLabel);
  }

  private roleLabel(role: MemberRole): string {
    const labels: Record<MemberRole, string> = {
      [MemberRole.CompanyAdmin]: 'Company Admin',
      [MemberRole.PM]: 'Project Manager',
      [MemberRole.QAEngineer]: 'QA Engineer',
      [MemberRole.Developer]: 'Developer',
      [MemberRole.Designer]: 'Designer',
      [MemberRole.BA]: 'Business Analyst',
      [MemberRole.Viewer]: 'Viewer',
    };
    return labels[role] ?? role;
  }

  private async logActivity(userId: number, actor: string, action: string, timeLabel: string) {
    const entry = this.teamActivityRepository.create({ userId, actor, action, timeLabel });
    await this.teamActivityRepository.save(entry);
  }
}
