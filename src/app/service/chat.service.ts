import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = environment.baseappurl+'/api/chat';

  constructor(private http: HttpClient) {}

  // Yetkilendirme başlıklarını ayarla
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }


  startConversation(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/start`, {}, { headers });
  }

  getActiveConversations(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/activeConversations`, {headers});
  }

  sendMessage(message: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/sendMessage`, message,{headers});
  }

  sendMessageDestek(message: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/desteksendMessage`, message,{headers});
  }

  assignSupport(conversation: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/assignSupport`, conversation,{headers});
  }

  getMessages(conversationId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/getMessages/${conversationId}`,  {headers});
  }

  markMessageAsRead(messageId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    // PUT isteğiyle, mesajı 'okundu' olarak işaretliyoruz
    return this.http.put(`${this.apiUrl}/markAsRead/${messageId}`, {}, { headers });
  }

  endConversation(conversationId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/end/${conversationId}`, {},{headers});
  }

}
