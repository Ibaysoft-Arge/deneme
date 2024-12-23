import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private currentStoreId?: string; // Hangi mağaza odasında olduğumuzu takip etmek için

  constructor() {
    this.socket = io(environment.baseappurl); // Sunucu adresinizi burada belirtin
  }
  joinStore(storeId: string): void {
    // Eğer daha önce bir mağazaya katıldıysak ondan ayrıl
    if (this.currentStoreId && this.currentStoreId !== storeId) {
      this.leaveStore(this.currentStoreId);
    }

    this.socket.emit('joinStore', storeId);
    console.log(`Mağaza ${storeId} için odaya katıldınız.`);
    this.currentStoreId = storeId;
  }
  getSocket(): Socket {
    return this.socket;
  }

  leaveStore(storeId: string): void {
    // Soketten ayrılmak için özel bir emit gerekebilir.
    // Eğer sunucuya 'leaveStore' benzeri bir event tanımlarsanız:
    this.socket.emit('leaveStore', storeId);
    console.log(`Mağaza ${storeId} odasından ayrıldınız.`);

    if (this.currentStoreId === storeId) {
      this.currentStoreId = undefined;
    }
  }

  onTableUpdate(callback: (data: any) => void): void {
    this.socket.on('tableUpdated', callback);
  }

  onOrderUpdate(callback: (data: any) => void): void {
    this.socket.on('orderUpdated', callback);
  }
}
