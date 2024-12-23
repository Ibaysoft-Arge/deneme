// src/app/services/order.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
    providedIn: 'root',
})
export class SiparisOlusturmaService {
    private apiUrl = `${environment.baseappurl}/api/siparisOlusturmaEkrani`;

    constructor(private http: HttpClient) {}

    // Yetkilendirme başlıklarını ayarla
    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        });
    }

    // Sipariş oluştur
    createOrder(order: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/olustur`, order, { headers });
    }

    // Siparişleri getir
    getOrders(): Observable<any[]> {
        const headers = this.getAuthHeaders();
        return this.http.get<any[]>(`${this.apiUrl}/getTumSiparisler`, { headers });
    }

    // Sipariş güncelle
    updateOrder(id: string, order: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.put(`${this.apiUrl}/siparisekraniguncelle/${id}`, order, { headers });
    }

    // Sipariş sil
    deleteOrder(id: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.delete(`${this.apiUrl}/siparisekranisil/${id}`, { headers });
    }
}
