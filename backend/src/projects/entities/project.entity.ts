import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Feature } from './feature.entity';
import { RtmEntry } from './rtm.entity';
import { TestCase } from './test-case.entity';
import { UserStory } from './user-story.entity';

export enum ProjectStatus {
  Queued = 'queued',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int', nullable: true })
  userId?: number;

  @Column()
  name: string;

  @Column()
  srsPath: string;

  @Column({ type: 'text', nullable: true })
  extractedText?: string;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.Queued })
  status: ProjectStatus;

  @Column({ type: 'jsonb', nullable: true })
  aiResponse?: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'text', nullable: true })
  failureReason?: string;

  @OneToMany(() => Feature, (feature) => feature.project, { cascade: true })
  features: Feature[];

  @OneToMany(() => UserStory, (userStory) => userStory.project, { cascade: true })
  userStories: UserStory[];

  @OneToMany(() => TestCase, (testCase) => testCase.project, { cascade: true })
  testCases: TestCase[];

  @OneToMany(() => RtmEntry, (rtm) => rtm.project, { cascade: true })
  rtm: RtmEntry[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
