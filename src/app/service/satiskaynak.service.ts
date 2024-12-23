import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class SatisKaynakService {
  private apiUrl = environment.baseappurl + '/api/satiskaynak';

  constructor(private http: HttpClient) {}

  // Yetkilendirme başlıklarını ayarla
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Yeni Satış Kaynak ekle
  addSatisKaynak(menu: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/add`, menu, { headers });
  }

  // Kullanıcıya ait Satış Kaynak getir
  getSatisKaynakByUser(userId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/getByUser`, { headers, params: { userId } });
  }

  // Tüm Satış kaynaklarını getir
  getSatisKaynak(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/get`, { headers });
  }

  // Satış Kaynak güncelle
  updateSatisKaynak(id: string, menu: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/update/${id}`, menu, { headers });
  }

  // Satış Kaynak sil
  deleteSatisKaynak(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/delete/${id}`, { headers });
  }
}
