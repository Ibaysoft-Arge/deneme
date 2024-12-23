import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
    providedIn: 'root'
})
export class OdemeTipiService {
    private apiUrl = environment.baseappurl + '/api/odemetipi';

    constructor(private http: HttpClient) { }

    // Yetkilendirme başlıklarını ayarla
    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    // Yeni Satış Kaynak ekle
    addOdemeTipi(menu: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/add`, menu, { headers });
    }

    //   // Kullanıcıya ait Satış Kaynak getir
    //   getSatisKaynakByUser(userId: string): Observable<any> {
    //     const headers = this.getAuthHeaders();
    //     return this.http.get(`${this.apiUrl}/getByUser`, { headers, params: { userId } });
    //   }

    // Tüm Satış kaynaklarını getir
    getOdemeTipi(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/get`, { headers });
    }

    getOdemeTipleriBySatisKaynak(satiskaynakid:string): Observable<any[]> {
        const headers = this.getAuthHeaders();
        const params = new HttpParams().set('satiskaynakId', satiskaynakid);
        return this.http.get<any[]>(`${this.apiUrl}/getBySatisKaynak`, { headers,params });
      }

    // Satış Kaynak güncelle
    updateOdemeTipi(id: string, menu: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.put(`${this.apiUrl}/update/${id}`, menu, { headers });
    }

    // Satış Kaynak sil
    deleteOdemeTipi(id: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.delete(`${this.apiUrl}/delete/${id}`, { headers });
    }
}
