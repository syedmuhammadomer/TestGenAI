import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MeetingParticipant } from './meeting-participant.entity';

@Entity('meetings')
export class Meeting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  projectId?: number;

  @Column({ nullable: true })
  sprintId?: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ default: 'custom' })
  type: string;

  @Column({ type: 'timestamptz' })
  startDatetime: Date;

  @Column({ type: 'timestamptz' })
  endDatetime: Date;

  @Column({ default: 'UTC' })
  timezone: string;

  @Column({ nullable: true })
  meetingLink?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ default: 'medium' })
  priority: string;

  @Column()
  createdBy: number;

  @Column({ default: 'upcoming' })
  status: string;

  @Column({ nullable: true })
  repeatType?: string;

  @Column({ nullable: true })
  reminderMinutes?: number;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => MeetingParticipant, (p) => p.meeting, { cascade: true, eager: true })
  participants: MeetingParticipant[];
}
