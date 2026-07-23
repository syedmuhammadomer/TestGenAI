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
import { ChatService } from './chat.service';

interface SendMessagePayload {
  roomId: string;
  text: string;
  senderName: string;
  senderId: string;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`[Chat] connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Chat] disconnected: ${client.id}`);
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
    // Broadcast to everyone in the room (including sender so all tabs stay in sync)
    this.server.to(payload.roomId).emit('new_message', msg);
  }
}
