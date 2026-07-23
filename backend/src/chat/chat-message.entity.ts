import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  roomId: string;

  @Column({ length: 120 })
  senderId: string;

  @Column({ length: 200 })
  senderName: string;

  @Column('text')
  text: string;

  @CreateDateColumn()
  createdAt: Date;
}
