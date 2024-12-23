import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class NotificationMsgService {
  private socket: Socket;
  private apiUrl = environment.baseappurl+'/api/notification';
  constructor( private http: HttpClient) {

    // Backend sunucusunun URL'sini yazın
    this.socket = io(environment.baseappurl);
  }

  // Bildirimleri dinleyen bir metod
  getNotifications(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('newNotification', (notification) => {
        observer.next(notification);
      });
    });
  }
  getMessages(): Observable<any> {
    return new Observable(observer => {
        this.socket.on('newMessage', (message) => {
          console.log(message);
            observer.next(message);
        });
    });
}


  // Bildirim gönderimi
  sendNotification(notification: any): void {
    this.socket.emit('sendNotification', notification);
  }

  // Bildirim Ekleme
  addNotification(senderUserId: string, receiverUserId: string, profileImage: string, message: string): Observable<any> {
    const body = { senderUserId, receiverUserId, profileImage, message };
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    });

    return this.http.post(`${this.apiUrl}/addNotification`, body, { headers });
  }

  // Bildirimleri Listeleme
  listNotifications(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

   // return this.http.put(`${this.apiUrl}/updateRole/${roleId}`, body, { headers });
    return this.http.get(`${this.apiUrl}/listNotifications`, { headers });
  }

  // Belirli bir bildirimi okundu olarak işaretleme
  markAsRead(id: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.put(`${this.apiUrl}/markAsRead/${id}`, {}, { headers });
  }
  addNotificationAll(notification: { message: string }): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(`${this.apiUrl}/sendToAll`, notification, { headers });
  }
  // Bildirim Silme
  deleteNotification(id: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete(`${this.apiUrl}/deleteNotification/${id}`, { headers });
  }


}
