// src/app/services/coupon.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';


@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private apiUrl = environment.baseappurl + '/api/coupon/coupon';

  constructor(private http: HttpClient) { }

   // Yetkilendirme başlıklarını ayarla
   private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Tüm kuponları getir
  getCoupons(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/getByUser`, { headers });
  }

  // Yeni kupon ekle
  addCoupon(coupon: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/add`, coupon, { headers });
  }

  // Kupon güncelle
  updateCoupon(id: string, coupon: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/update/${id}`, coupon, { headers });
  }

  // Kupon sil
  deleteCoupon(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/delete/${id}`, { headers });
  }

  // Satış Kaynakları getirme
  getSatisKaynaklari(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${environment.baseappurl}/api/satiskaynak/get`, { headers });
  }

  // Ödeme Tipleri getirme
  getOdemeTipleri(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${environment.baseappurl}/api/odemetipi/get`, { headers });
  }


  getCouponByCode(code: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('code', code);
    return this.http.get<any>(`${this.apiUrl}/getByCode`, { headers, params });
  }

  // Belirli bir kuponu arama ile getir
  searchCoupons(searchTerm: string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('search', searchTerm);
    return this.http.get<any[]>(`${this.apiUrl}/search`, { headers, params });
  }
}
