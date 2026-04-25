import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: true,
})
export class WorkflowGateway {
  @WebSocketServer()
  server: Server;

  emitStepUpdate(data: any) {
    this.server.emit('step.update', data);
  }

  emitRunUpdate(data: any) {
    this.server.emit('run.update', data);
  }
}
