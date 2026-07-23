import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum MemberRole {
  CompanyAdmin = 'company_admin',
  PM = 'pm',
  QAEngineer = 'qa_engineer',
  Developer = 'developer',
  Designer = 'designer',
  BA = 'ba',
  Viewer = 'viewer',
}

export enum TeamMemberStatus {
  Online = 'online',
  Offline = 'offline',
  Invited = 'invited',
}

export const ALL_MODULES = [
  'dashboard',
  'projects',
  'backlogs',
  'user_stories',
  'test_manager',
  'rtm',
  'documents',
  'analytics',
  'team',
  'calendar',
  'settings',
  'billing',
] as const;

export type ModuleKey = (typeof ALL_MODULES)[number];

export const DEFAULT_MODULES_BY_ROLE: Record<MemberRole, ModuleKey[]> = {
  [MemberRole.CompanyAdmin]: [...ALL_MODULES],
  [MemberRole.PM]: ['dashboard', 'projects', 'backlogs', 'user_stories', 'test_manager', 'rtm', 'documents', 'analytics', 'team', 'calendar', 'settings'],
  [MemberRole.QAEngineer]: ['dashboard', 'projects', 'backlogs', 'test_manager', 'rtm', 'analytics', 'calendar', 'settings'],
  [MemberRole.Developer]: ['dashboard', 'projects', 'backlogs', 'user_stories', 'calendar', 'settings'],
  [MemberRole.Designer]: ['dashboard', 'projects', 'documents', 'calendar', 'settings'],
  [MemberRole.BA]: ['dashboard', 'projects', 'user_stories', 'rtm', 'documents', 'analytics', 'calendar', 'settings'],
  [MemberRole.Viewer]: ['dashboard', 'projects', 'calendar', 'settings'],
};

@Entity('team_members')
export class TeamMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId?: number;

  @Column()
  fullName: string;

  @Column()
  email: string;

  @Column({ type: 'enum', enum: MemberRole, default: MemberRole.Viewer })
  role: MemberRole;

  @Column({ nullable: true })
  team?: string;

  @Column({ nullable: true })
  project?: string;

  @Column({ default: 0 })
  testCases: number;

  @Column({ type: 'jsonb', default: () => "'[\"dashboard\",\"projects\",\"settings\"]'" })
  modules: ModuleKey[];

  @Column({ default: false })
  sendCopy: boolean;

  @Column({ default: false })
  addWelcomeNote: boolean;

  @Column({
    type: 'enum',
    enum: TeamMemberStatus,
    default: TeamMemberStatus.Offline,
  })
  status: TeamMemberStatus;

  @Column({ nullable: true })
  lastActive?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
