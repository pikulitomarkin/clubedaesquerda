import { Injectable, Logger } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import type { IncomingMessage } from "node:http";
import WebSocket, { WebSocketServer as WsServer } from "ws";
import Redis from "ioredis";
import { ChatsService } from "../chats/chats.service";
import { SendMessageDto } from "../chats/dto/send-message.dto";

type AuthenticatedClient = WebSocket & { userId?: string };

const REALTIME_CHANNEL = "realtime:events";

// Ponto único de entrada WebSocket da API. Autentica a conexão via JWT
// (query string ?token=..., já que o browser não permite headers
// customizados em conexões WS) e mantém um registro local
// userId -> sockets abertos nesta instância do processo.
//
// Fanout entre múltiplas instâncias da API acontece via Redis Pub/Sub:
// notifyUsers() publica {userIds, event, payload} no canal
// REALTIME_CHANNEL; toda instância está inscrita e entrega localmente
// apenas aos usuários que tem conectados. Isso evita broadcast para
// todo mundo (o que vazaria eventos privados, como popup de match, para
// usuários que não deveriam vê-los) e funciona com N instâncias atrás
// de um load balancer. Ver docs/contexto.md § "Entrega em tempo real".
@Injectable()
@WebSocketGateway({ path: "/ws" })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: WsServer;

  private readonly localSockets = new Map<string, Set<AuthenticatedClient>>();
  private readonly publisher = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
  private readonly subscriber = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

  constructor(
    private readonly jwt: JwtService,
    private readonly chatsService: ChatsService,
  ) {
    this.subscriber.subscribe(REALTIME_CHANNEL);
    this.subscriber.on("message", (_channel, raw) => {
      try {
        const { userIds, event, payload } = JSON.parse(raw) as {
          userIds: string[];
          event: string;
          payload: unknown;
        };
        this.dispatchLocal(userIds, event, payload);
      } catch (err) {
        this.logger.error("Mensagem inválida no canal de realtime", err as Error);
      }
    });
  }

  async handleConnection(client: AuthenticatedClient, req: IncomingMessage) {
    const token = new URL(req.url ?? "", "http://localhost").searchParams.get("token");

    try {
      const decoded = await this.jwt.verifyAsync<{ sub: string }>(token ?? "");
      client.userId = decoded.sub;
      this.addLocalSocket(decoded.sub, client);
    } catch {
      client.close(4001, "Unauthorized");
    }
  }

  handleDisconnect(client: AuthenticatedClient) {
    if (client.userId) this.removeLocalSocket(client.userId, client);
  }

  // Não retorna o payload para o adapter enviar de volta ao remetente —
  // a entrega (inclusive para quem enviou) já acontece via notifyUsers,
  // que publica no canal Redis e chega a todos os participantes,
  // remetente incluso, através do fluxo único de dispatchLocal.
  @SubscribeMessage("send_message")
  async handleSendMessage(@ConnectedSocket() client: AuthenticatedClient, @MessageBody() dto: SendMessageDto) {
    if (!client.userId) return;

    const { message, participantIds } = await this.chatsService.sendMessage(client.userId, dto);
    await this.notifyUsers(participantIds, "chat:message", message);
  }

  // Chamado por outros módulos (matches, friendships) para notificar
  // usuários específicos, funcionando entre múltiplas instâncias via
  // Redis — nunca use server.emit() diretamente para eventos privados.
  async notifyUsers(userIds: string[], event: string, payload: unknown) {
    await this.publisher.publish(REALTIME_CHANNEL, JSON.stringify({ userIds, event, payload }));
  }

  private addLocalSocket(userId: string, socket: AuthenticatedClient) {
    if (!this.localSockets.has(userId)) this.localSockets.set(userId, new Set());
    this.localSockets.get(userId)!.add(socket);
  }

  private removeLocalSocket(userId: string, socket: AuthenticatedClient) {
    this.localSockets.get(userId)?.delete(socket);
  }

  private dispatchLocal(userIds: string[], event: string, payload: unknown) {
    const message = JSON.stringify({ event, payload });
    for (const userId of userIds) {
      const sockets = this.localSockets.get(userId);
      if (!sockets) continue;
      for (const socket of sockets) {
        if (socket.readyState === WebSocket.OPEN) socket.send(message);
      }
    }
  }
}
