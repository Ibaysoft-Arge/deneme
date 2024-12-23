import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class SayimService {
  private apiUrl = environment.baseappurl + '/api/sayim';

  constructor(private http: HttpClient) {}

  // Yetkilendirme başlıklarını ayarla
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  addSayim(sayim: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/create`, sayim, { headers });
  }

  getSayim(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/getSayim`, { headers });
  }

  getSayimFilter(sayim: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/filter`, sayim, { headers });
  }

  getSayimDetail(sayimID: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/getSayimDetail`, { headers, params: { sayimID }} );
  }

  deleteSayim(sayimID: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/delete`, { headers, params: { sayimID }} );
  }

  updateSayimStatu(sayimID: string, statu: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const body = { statu };
    return this.http.put(`${this.apiUrl}/updateStatus`, body, { headers, params: { sayimID }} );
  }

  updateDetail(sayimID: string, skuId: string, sayimMiktari: number): Observable<any> {
    const headers = this.getAuthHeaders();
    const body = { sayimID, skuId, sayimMiktari };
    return this.http.put(`${this.apiUrl}/updateDetail`, body, { headers } );
  }
}
