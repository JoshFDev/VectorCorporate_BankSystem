import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';
import { Observable, Subject } from 'rxjs';

export interface TransferNotification {
  fromAccount: string;
  amount: number;
  description: string;
  sourceBalance: number;
}

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;
  private transferSubject = new Subject<TransferNotification>();

  transferReceived$: Observable<TransferNotification> = this.transferSubject.asObservable();

  constructor(private auth: AuthService) {
    this.auth.ready$.subscribe((ready) => {
      if (!ready) return;
      const user = (this.auth as any).userSubject.value;
      if (user) this.connect(user.id);
      else this.disconnect();
    });
  }

  private connect(userId: string) {
    this.disconnect();
    this.socket = io(environment.apiUrl.replace('/api', ''), {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      this.socket!.emit('register', userId);
    });

    this.socket.on('transfer_received', (data: TransferNotification) => {
      this.transferSubject.next(data);
    });
  }

  private disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
