import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('chat_rooms')
export class ChatRoom {
  @PrimaryColumn({ length: 120 })
  id: string;

  @Column({ length: 50 })
  type: string; // 'group' | 'project' | 'direct'

  @Column({ length: 200 })
  name: string;

  // Stored as comma-separated user ID strings
  @Column('simple-array')
  memberIds: string[];

  @CreateDateColumn()
  createdAt: Date;
}
