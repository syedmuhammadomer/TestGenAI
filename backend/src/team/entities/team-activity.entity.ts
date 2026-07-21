import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('team_activities')
export class TeamActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId?: number;

  @Column()
  actor: string;

  @Column({ type: 'text' })
  action: string;

  @Column()
  timeLabel: string;

  @CreateDateColumn()
  createdAt: Date;
}
