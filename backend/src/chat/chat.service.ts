import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './chat-message.entity';

function formatDate(d: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export interface SerializedMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  text: string;
  time: string;
  date: string;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly repo: Repository<ChatMessage>,
  ) {}

  async save(roomId: string, senderId: string, senderName: string, text: string): Promise<SerializedMessage> {
    const msg = this.repo.create({ roomId, senderId, senderName, text });
    const saved = await this.repo.save(msg);
    return this.serialize(saved);
  }

  async getHistory(roomId: string, limit = 100): Promise<SerializedMessage[]> {
    const msgs = await this.repo.find({
      where: { roomId },
      order: { createdAt: 'ASC' },
      take: limit,
    });
    return msgs.map((m) => this.serialize(m));
  }

  private serialize(m: ChatMessage): SerializedMessage {
    const d = new Date(m.createdAt);
    return {
      id: String(m.id),
      roomId: m.roomId,
      senderId: m.senderId,
      senderName: m.senderName,
      text: m.text,
      time: formatTime(d),
      date: formatDate(d),
    };
  }
}
