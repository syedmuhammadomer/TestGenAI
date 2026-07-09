import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Project } from './project.entity';

@Entity('project_user_stories')
export class UserStory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  actor?: string;

  @Column({ type: 'text' })
  goal: string;

  @Column({ type: 'text', nullable: true })
  benefit?: string;

  @Column({ type: 'text', nullable: true })
  acceptanceCriteria?: string;

  @Column({ type: 'varchar', default: 'manual' })
  source: 'ai' | 'manual';

  @ManyToOne(() => Project, (project) => project.userStories, { onDelete: 'CASCADE' })
  project: Project;
}
