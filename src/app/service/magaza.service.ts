import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class MagazaService {
  private apiUrl = environment.baseappurl + '/api';

  constructor(private http: HttpClient) { }


  // Yetkilendirme başlıklarını ayarla
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getMagazalarim(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/magaza/get`, { headers });
  }

  getLokasyonList(magazaId:string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/lokasyon/magaza/${magazaId}`, { headers });
  }

  searchLokasyon(query: string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/lokasyon/search?query=${query}`, { headers });
  }


  getIller(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/lokasyon/iller` , { headers });
  }

  getIlceler(il: string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    // Örn: /ilceler/İstanbul
    return this.http.get<any[]>(`${this.apiUrl}/lokasyon/ilceler/${encodeURIComponent(il)}`, { headers });
  }

  getMahalleler(il: string, ilce: string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    // /mahalleler/İstanbul/Kadıköy
    return this.http.get<any[]>(`${this.apiUrl}/lokasyon/mahalleler/${encodeURIComponent(il)}/${encodeURIComponent(ilce)}`, { headers });
  }

  getYollar(il: string, ilce: string, mahalle: string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    // /yollar/İstanbul/Kadıköy/Fenerbahçe
    return this.http.get<any[]>(`${this.apiUrl}/lokasyon/yollar/${encodeURIComponent(il)}/${encodeURIComponent(ilce)}/${encodeURIComponent(mahalle)}`, { headers });
  }

  // Excel dosyasını backend'e import için gönderen fonksiyon
  importLokasyonExcel(formData: any): Observable<any> {

    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/lokasyon/import`, formData, { headers });
  }
  getMagazalarimWithQR(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/magaza/getWithQR`, { headers });
  }

  getClusterByMagazaID(magazaid: string, userID: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/magaza/cluster`, { magazaid });
  }

  getMagazalarByClusterID(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/magaza/getMagazaByCluster/${id}`, { headers });
  }

  addMagaza(magaza: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/magaza/add`, magaza, { headers });
  }

  updateMagaza(id: string, magaza: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/magaza/update/${id}`, magaza, { headers });
  }

  deleteMagaza(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/magaza/delete/${id}`, { headers });
  }
}
