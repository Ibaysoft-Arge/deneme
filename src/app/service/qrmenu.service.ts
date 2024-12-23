// src/app/service/paket.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
    providedIn: 'root', // Bu şekilde service'i kök modülde sağlayabiliriz
})
export class QRMenuService {
    private apiUrl = environment.baseappurl + '/api/qrmenuayarlar'; // API URL'sini buraya ekleyin

    constructor(private http: HttpClient) { }

    // Yetkilendirme başlıklarını ayarla
    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    getAcikMiByUserID(userID: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/get/${userID}`, { headers });
    }

    getAcikMiByMagazaID(magazaID: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/get/${magazaID}`, { headers });
    }

    updateAcikMi(magazaID: string, acikMi: boolean): Observable<any> {
        const headers = this.getAuthHeaders();
        const body = { magazaID, acikMi };
        return this.http.put(`${this.apiUrl}/update/${magazaID}`, body, { headers });
    }

    addAyar(magazaID: string, acikMi: boolean, link: string): Observable<any> {
        const body = { magazaID, acikMi, link };
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/add`, body, { headers });
    }

}