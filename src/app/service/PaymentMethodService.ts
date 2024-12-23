import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class PaymentMethodService {
  private apiUrl = environment.baseappurl + '/api/paymentMethod';

  constructor(private http: HttpClient) { }

  // Yetkilendirme başlıklarını ayarla
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Yeni bir ödeme yöntemi eklemek için kullanılacak servis
  addPaymentMethod(paymentMethod: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/add`, paymentMethod, { headers });
  }

  deletePaymentMethod(paymentMethodId: string) {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/delete/${paymentMethodId}`, { headers });
  }

  // Mevcut bir ödeme yöntemini güncellemek için kullanılacak servis
  updatePaymentMethod(id: string, paymentMethod: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/update/${id}`, paymentMethod, { headers });
  }

  // Kullanıcının tüm ödeme yöntemlerini listelemek için kullanılacak servis
  getPaymentMethods(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/list`, { headers });
  }
}
