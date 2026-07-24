import { ForbiddenException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { Meeting } from './entities/meeting.entity';
import { MeetingParticipant } from './entities/meeting-participant.entity';
import { CreateMeetingDto, UpdateMeetingDto } from './dto/create-meeting.dto';
import { MemberRole, TeamMember } from '../team/entities/team-member.entity';

const CALENDAR_MANAGER_ROLES: MemberRole[] = [MemberRole.CompanyAdmin, MemberRole.PM, MemberRole.BA];

@Injectable()
export class CalendarService implements OnModuleInit {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepo: Repository<Meeting>,
    @InjectRepository(MeetingParticipant)
    private readonly participantRepo: Repository<MeetingParticipant>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepo: Repository<TeamMember>,
  ) {}

  /**
   * Returns true if the user can create/edit/delete meetings.
   * Company admins (user.role === 'admin') always can.
   * For 'member' users, we check their TeamMember role.
   */
  private async canManage(userId: number, userRole: string, userEmail: string): Promise<boolean> {
    if (userRole === 'admin') return true;
    const member = await this.teamMemberRepo.findOne({ where: { email: userEmail } });
    if (!member) return true; // self-registered user treated as admin
    return CALENDAR_MANAGER_ROLES.includes(member.role);
  }

  /** Auto-update meeting statuses every minute */
  onModuleInit() {
    setInterval(() => void this.syncMeetingStatuses(), 60_000);
    // Run once at startup
    void this.syncMeetingStatuses();
  }

  private async syncMeetingStatuses() {
    try {
      const now = new Date();
      // Upcoming → In Progress
      await this.meetingRepo
        .createQueryBuilder()
        .update(Meeting)
        .set({ status: 'in_progress' })
        .where('status = :s AND "startDatetime" <= :now AND "endDatetime" > :now', { s: 'upcoming', now })
        .execute();
      // In Progress / Upcoming → Completed
      await this.meetingRepo
        .createQueryBuilder()
        .update(Meeting)
        .set({ status: 'completed' })
        .where('status IN (:...statuses) AND "endDatetime" <= :now', {
          statuses: ['upcoming', 'in_progress'],
          now,
        })
        .execute();
    } catch (err) {
      this.logger.warn(`Status sync failed: ${err}`);
    }
  }

  async findAll(
    userId: number,
    filters?: {
      projectId?: number;
      type?: string;
      status?: string;
      from?: string;
      to?: string;
    },
  ): Promise<Meeting[]> {
    const qb = this.meetingRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.participants', 'p')
      .where(
        '(m.createdBy = :uid OR p.userId = :uid)',
        { uid: userId },
      );

    if (filters?.projectId) {
      qb.andWhere('m.projectId = :pid', { pid: filters.projectId });
    }
    if (filters?.type) {
      qb.andWhere('m.type = :type', { type: filters.type });
    }
    if (filters?.status) {
      qb.andWhere('m.status = :status', { status: filters.status });
    }
    if (filters?.from) {
      qb.andWhere('m.startDatetime >= :from', { from: filters.from });
    }
    if (filters?.to) {
      qb.andWhere('m.startDatetime <= :to', { to: filters.to });
    }

    return qb.orderBy('m.startDatetime', 'ASC').getMany();
  }

  async findOne(id: number, userId: number): Promise<Meeting> {
    const meeting = await this.meetingRepo.findOne({
      where: { id },
      relations: ['participants'],
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    return meeting;
  }

  async create(dto: CreateMeetingDto, userId: number, userRole: string, userEmail: string): Promise<Meeting> {
    if (!(await this.canManage(userId, userRole, userEmail))) {
      throw new ForbiddenException('Only Company Admin, Project Manager, or Business Analyst can schedule meetings');
    }
    const meeting = this.meetingRepo.create({
      title: dto.title,
      description: dto.description,
      projectId: dto.projectId,
      sprintId: dto.sprintId,
      type: dto.type ?? 'custom',
      startDatetime: new Date(dto.startDatetime),
      endDatetime: new Date(dto.endDatetime),
      timezone: dto.timezone ?? 'UTC',
      meetingLink: dto.meetingLink,
      location: dto.location,
      priority: dto.priority ?? 'medium',
      repeatType: dto.repeatType,
      reminderMinutes: dto.reminderMinutes,
      notes: dto.notes,
      createdBy: userId,
      status: 'upcoming',
    });

    const saved = await this.meetingRepo.save(meeting);

    if (dto.participants && dto.participants.length > 0) {
      const participants = dto.participants.map((p) =>
        this.participantRepo.create({
          meeting: saved,
          userId: p.userId,
          userEmail: p.userEmail,
          userName: p.userName,
          attendanceStatus: 'pending',
        }),
      );
      await this.participantRepo.save(participants);
    }

    return this.meetingRepo.findOne({ where: { id: saved.id }, relations: ['participants'] }) as Promise<Meeting>;
  }

  async update(id: number, dto: UpdateMeetingDto, userId: number, userRole: string, userEmail: string): Promise<Meeting> {
    if (!(await this.canManage(userId, userRole, userEmail))) {
      throw new ForbiddenException('Only Company Admin, Project Manager, or Business Analyst can edit meetings');
    }
    const meeting = await this.meetingRepo.findOne({ where: { id }, relations: ['participants'] });
    if (!meeting) throw new NotFoundException('Meeting not found');

    Object.assign(meeting, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.projectId !== undefined && { projectId: dto.projectId }),
      ...(dto.sprintId !== undefined && { sprintId: dto.sprintId }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.startDatetime !== undefined && { startDatetime: new Date(dto.startDatetime) }),
      ...(dto.endDatetime !== undefined && { endDatetime: new Date(dto.endDatetime) }),
      ...(dto.timezone !== undefined && { timezone: dto.timezone }),
      ...(dto.meetingLink !== undefined && { meetingLink: dto.meetingLink }),
      ...(dto.location !== undefined && { location: dto.location }),
      ...(dto.priority !== undefined && { priority: dto.priority }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.repeatType !== undefined && { repeatType: dto.repeatType }),
      ...(dto.reminderMinutes !== undefined && { reminderMinutes: dto.reminderMinutes }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    });

    await this.meetingRepo.save(meeting);

    if (dto.participants !== undefined) {
      await this.participantRepo.delete({ meeting: { id } });
      if (dto.participants.length > 0) {
        const participants = dto.participants.map((p) =>
          this.participantRepo.create({
            meeting: { id } as Meeting,
            userId: p.userId,
            userEmail: p.userEmail,
            userName: p.userName,
            attendanceStatus: 'pending',
          }),
        );
        await this.participantRepo.save(participants);
      }
    }

    return this.meetingRepo.findOne({ where: { id }, relations: ['participants'] }) as Promise<Meeting>;
  }

  async remove(id: number, userId: number, userRole: string, userEmail: string): Promise<void> {
    if (!(await this.canManage(userId, userRole, userEmail))) {
      throw new ForbiddenException('Only Company Admin, Project Manager, or Business Analyst can delete meetings');
    }
    const meeting = await this.meetingRepo.findOne({ where: { id } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    await this.meetingRepo.remove(meeting);
  }

  async getUpcoming(userId: number, limit = 5): Promise<Meeting[]> {
    const now = new Date();
    return this.meetingRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.participants', 'p')
      .where('(m.createdBy = :uid OR p.userId = :uid)', { uid: userId })
      .andWhere('m.startDatetime >= :now', { now })
      .andWhere('m.status != :cancelled', { cancelled: 'cancelled' })
      .orderBy('m.startDatetime', 'ASC')
      .take(limit)
      .getMany();
  }

  async getByProject(projectId: number, userId: number): Promise<Meeting[]> {
    return this.meetingRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.participants', 'p')
      .where('m.projectId = :pid', { pid: projectId })
      .andWhere('(m.createdBy = :uid OR p.userId = :uid)', { uid: userId })
      .orderBy('m.startDatetime', 'ASC')
      .getMany();
  }

  async updateAttendance(meetingId: number, userId: number, status: string): Promise<MeetingParticipant> {
    let participant = await this.participantRepo.findOne({
      where: { meeting: { id: meetingId }, userId },
    });
    if (!participant) {
      throw new NotFoundException('You are not a participant of this meeting');
    }
    participant.attendanceStatus = status;
    if (status === 'present' || status === 'late') {
      participant.joinedAt = new Date();
    }
    return this.participantRepo.save(participant);
  }
}
