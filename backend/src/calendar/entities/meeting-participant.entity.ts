import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Meeting } from './meeting.entity';

@Entity('meeting_participants')
export class MeetingParticipant {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Meeting, (m) => m.participants, { onDelete: 'CASCADE' })
  meeting: Meeting;

  @Column()
  userId: number;

  @Column({ nullable: true })
  userEmail?: string;

  @Column({ nullable: true })
  userName?: string;

  @Column({ default: 'pending' })
  attendanceStatus: string;

  @Column({ default: false })
  notificationSent: boolean;

  @Column({ nullable: true, type: 'timestamptz' })
  joinedAt?: Date;
}
