// src/app/service/paket.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
    providedIn: 'root',
})
export class GetirService {
    private apiUrl = environment.baseappurl + '/api/getir';

    constructor(private http: HttpClient) { }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    getGetirEntegrasyonBilgileri(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/getirBilgi`, { headers });
    }

    updateGetirEntegrasyon(entegrasyonBilgileri: any): Observable<any> {
        const body = { entegrasyonBilgileri };
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/updateGetirBilgileri`, body, { headers });
    }

    addGetirBilgileri(addGetirBilgileri: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/addGetirBilgi`, addGetirBilgileri, { headers });
    }

    // Çalışma saatlerini getir
    getGetirCalismaSaatleri(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/workingHours`, { headers });
    }

    // Çalışma saatlerini güncelle
    updateGetirCalismaSaatleri(restaurantWorkingHours: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.put(`${this.apiUrl}/workingHours`, { restaurantWorkingHours }, { headers });
    }

    // Yeni çalışma saati ekle
    addGetirCalismaSaatleri(restaurantWorkingHours: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/workingHours`, restaurantWorkingHours , { headers });
    }


}
