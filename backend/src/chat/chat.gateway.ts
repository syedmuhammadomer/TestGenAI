import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService, SerializedRoom } from './chat.service';

interface SendMessagePayload {
  roomId: string;
  text: string;
  senderName: string;
  senderId: string;
}

interface CreateRoomPayload {
  id: string;
  type: string;
  name: string;
  memberIds: string[];
}

interface JoinDmsPayload {
  myId: string;
  memberIds: string[];
}

@WebSocketGateway({
  cors: {
    origin: (_origin: string, callback: (err: Error | null, allow?: boolean) => void) => callback(null, true),
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // userId -> Set of socketIds (to notify offline users when they reconnect)
  private userSockets = new Map<string, Set<string>>();

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId as string | undefined;
    if (userId) {
      if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
      this.userSockets.get(userId)!.add(client.id);
      client.data.userId = userId;
    }
    // Always join General
    void client.join('c-general');
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (userId) {
      this.userSockets.get(userId)?.delete(client.id);
    }
  }

  /** Join all DM rooms for this user given their team members */
  @SubscribeMessage('join_dms')
  async handleJoinDms(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinDmsPayload,
  ) {
    for (const memberId of payload.memberIds) {
      const roomId = dmRoomId(payload.myId, memberId);
      await client.join(roomId);
    }
  }

  /** Fetch persisted group/project rooms for this user and auto-join */
  @SubscribeMessage('join_group_rooms')
  async handleJoinGroupRooms(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string },
  ) {
    const rooms = await this.chatService.getUserRooms(payload.userId);
    for (const room of rooms) {
      await client.join(room.id);
    }
    client.emit('group_rooms', rooms);
  }

  /** Create a persisted group/project room and notify all members */
  @SubscribeMessage('create_group_room')
  async handleCreateGroupRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CreateRoomPayload,
  ) {
    const room: SerializedRoom = await this.chatService.createRoom(
      payload.id,
      payload.type,
      payload.name,
      payload.memberIds,
    );

    // Join creator immediately
    await client.join(room.id);

    // Notify + join all online members
    for (const memberId of room.memberIds) {
      const sockets = this.userSockets.get(memberId);
      if (!sockets) continue;
      for (const socketId of sockets) {
        if (socketId === client.id) continue;
        this.server.to(socketId).emit('new_room', room);
        const memberSocket = this.server.sockets.sockets.get(socketId);
        if (memberSocket) await memberSocket.join(room.id);
      }
    }

    client.emit('room_created', room);
  }

  @SubscribeMessage('join_room')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    await client.join(payload.roomId);
    const history = await this.chatService.getHistory(payload.roomId);
    client.emit('room_history', history);
  }

  @SubscribeMessage('leave_room')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    client.leave(payload.roomId);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() _client: Socket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    const msg = await this.chatService.save(
      payload.roomId,
      payload.senderId,
      payload.senderName,
      payload.text,
    );
    this.server.to(payload.roomId).emit('new_message', msg);
  }
}

/** Deterministic room ID for a DM between two users */
function dmRoomId(a: string, b: string): string {
  return `dm-${[a, b].sort().join('-')}`;
}
