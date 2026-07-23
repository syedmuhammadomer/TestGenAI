import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './chat-message.entity';
import { ChatRoom } from './chat-room.entity';

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

export interface SerializedRoom {
  id: string;
  type: string;
  name: string;
  memberIds: string[];
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly msgRepo: Repository<ChatMessage>,
    @InjectRepository(ChatRoom)
    private readonly roomRepo: Repository<ChatRoom>,
  ) {}

  async save(roomId: string, senderId: string, senderName: string, text: string): Promise<SerializedMessage> {
    const msg = this.msgRepo.create({ roomId, senderId, senderName, text });
    const saved = await this.msgRepo.save(msg);
    return this.serialize(saved);
  }

  async getHistory(roomId: string, limit = 100): Promise<SerializedMessage[]> {
    const msgs = await this.msgRepo.find({
      where: { roomId },
      order: { createdAt: 'ASC' },
      take: limit,
    });
    return msgs.map((m) => this.serialize(m));
  }

  async createRoom(id: string, type: string, name: string, memberIds: string[]): Promise<SerializedRoom> {
    const existing = await this.roomRepo.findOne({ where: { id } });
    if (existing) return this.serializeRoom(existing);
    const room = this.roomRepo.create({ id, type, name, memberIds });
    const saved = await this.roomRepo.save(room);
    return this.serializeRoom(saved);
  }

  async getUserRooms(userId: string): Promise<SerializedRoom[]> {
    const rooms = await this.roomRepo.find({ order: { createdAt: 'DESC' } });
    return rooms
      .filter((r) => r.memberIds.includes(userId))
      .map((r) => this.serializeRoom(r));
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

  private serializeRoom(r: ChatRoom): SerializedRoom {
    return { id: r.id, type: r.type, name: r.name, memberIds: r.memberIds };
  }
}
