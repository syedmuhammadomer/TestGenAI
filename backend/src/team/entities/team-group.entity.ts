import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('team_groups')
export class TeamGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  /** Optional link to a specific project */
  @Column({ nullable: true })
  projectId?: number;

  /** Project name snapshot (denormalized for display) */
  @Column({ nullable: true })
  projectName?: string;

  @CreateDateColumn()
  createdAt: Date;
}
