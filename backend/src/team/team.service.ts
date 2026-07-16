import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from '../auth/email.service';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { TeamActivity } from './entities/team-activity.entity';
import { DEFAULT_MODULES_BY_ROLE, MemberRole, ModuleKey, TeamMember, TeamMemberStatus } from './entities/team-member.entity';

@Injectable()
export class TeamService implements OnModuleInit {
  constructor(
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
    @InjectRepository(TeamActivity)
    private readonly teamActivityRepository: Repository<TeamActivity>,
    private readonly emailService: EmailService,
  ) {}

  async onModuleInit() {
    await this.seedIfEmpty();
  }

  async getDashboard() {
    const members = await this.teamMemberRepository.find({ order: { createdAt: 'ASC' } });
    const activities = await this.teamActivityRepository.find({ order: { createdAt: 'DESC' }, take: 8 });
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

  async inviteMember(dto: InviteTeamMemberDto) {
    const existing = await this.teamMemberRepository.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new BadRequestException('A team member with this email already exists.');
    }

    // Use provided modules or fall back to role defaults
    const modules: ModuleKey[] =
      dto.modules && dto.modules.length > 0
        ? (dto.modules as ModuleKey[])
        : DEFAULT_MODULES_BY_ROLE[dto.role];

    const member = this.teamMemberRepository.create({
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
      saved.fullName,
      `invited as ${this.roleLabel(saved.role)}${saved.project ? ` on ${saved.project}` : ''}`,
      'Just now',
    );

    try {
      await this.emailService.sendTeamInviteEmail({
        email: saved.email,
        fullName: saved.fullName,
        role: this.roleLabel(saved.role),
        team: saved.team,
        project: saved.project,
      });
    } catch {
      // Email failure is non-fatal; the record is already saved
    }

    return saved;
  }

  async updateMember(id: number, dto: UpdateTeamMemberDto) {
    const member = await this.teamMemberRepository.findOne({ where: { id } });
    if (!member) throw new NotFoundException('Team member not found');

    if (dto.fullName !== undefined) member.fullName = dto.fullName.trim();
    if (dto.role !== undefined) {
      member.role = dto.role;
      // When role changes and no explicit modules provided, reset to role defaults
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
    await this.logActivity(updated.fullName, 'profile updated', 'Just now');
    return updated;
  }

  async deleteMember(id: number) {
    const member = await this.teamMemberRepository.findOne({ where: { id } });
    if (!member) throw new NotFoundException('Team member not found');
    await this.teamMemberRepository.remove(member);
    await this.logActivity(member.fullName, 'removed from the workspace', 'Just now');
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

  private async logActivity(actor: string, action: string, timeLabel: string) {
    const entry = this.teamActivityRepository.create({ actor, action, timeLabel });
    await this.teamActivityRepository.save(entry);
  }

  private async seedIfEmpty() {
    const count = await this.teamMemberRepository.count();
    if (count > 0) return;

    const members = this.teamMemberRepository.create([
      {
        fullName: 'Dana Holloway',
        email: 'dana@project.ai',
        role: MemberRole.QAEngineer,
        team: 'Quality Ops',
        project: 'Banking App',
        testCases: 312,
        modules: DEFAULT_MODULES_BY_ROLE[MemberRole.QAEngineer],
        sendCopy: true,
        addWelcomeNote: true,
        status: TeamMemberStatus.Online,
        lastActive: '2 mins ago',
      },
      {
        fullName: 'Maya Brooks',
        email: 'maya@project.ai',
        role: MemberRole.PM,
        team: 'Quality Ops',
        project: 'Banking App',
        testCases: 244,
        modules: DEFAULT_MODULES_BY_ROLE[MemberRole.PM],
        sendCopy: true,
        addWelcomeNote: true,
        status: TeamMemberStatus.Online,
        lastActive: '18 mins ago',
      },
      {
        fullName: 'Marcus Li',
        email: 'marcus@project.ai',
        role: MemberRole.QAEngineer,
        team: 'Quality Ops',
        project: 'Healthcare Portal',
        testCases: 198,
        modules: DEFAULT_MODULES_BY_ROLE[MemberRole.QAEngineer],
        sendCopy: true,
        addWelcomeNote: true,
        status: TeamMemberStatus.Online,
        lastActive: '12 mins ago',
      },
      {
        fullName: 'Priya Singh',
        email: 'priya@project.ai',
        role: MemberRole.Developer,
        team: 'Automation Guild',
        project: 'Inventory Portal',
        testCases: 176,
        modules: DEFAULT_MODULES_BY_ROLE[MemberRole.Developer],
        sendCopy: false,
        addWelcomeNote: true,
        status: TeamMemberStatus.Offline,
        lastActive: '1 hour ago',
      },
    ]);
    await this.teamMemberRepository.save(members);

    await this.teamActivityRepository.save(
      this.teamActivityRepository.create([
        { actor: 'Dana Holloway', action: 'pushed 12 regression tests to Banking App', timeLabel: '2 minutes ago' },
        { actor: 'Maya Brooks', action: 'approved backlog priorities for Banking App sprint', timeLabel: '18 minutes ago' },
        { actor: 'Marcus Li', action: 'validated automation pipeline for Healthcare', timeLabel: '40 minutes ago' },
        { actor: 'Priya Singh', action: 'shared coverage report for Inventory portal', timeLabel: '2 hours ago' },
      ]),
    );
  }
}
