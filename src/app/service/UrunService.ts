import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class UrunService {

    private apiUrl = environment.baseappurl + '/api/urun';
    private apiUrlkategori = environment.baseappurl + '/api/urunKategoriRoutes';


  constructor(private http: HttpClient) { }
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
  getUrunler(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/urunget`,{headers});
  }

  getUrunById(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/urunget/${id}`,{headers});
  }
  getUrunByOrderId(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/urungetOrder/${id}`,{headers});
  }
  addUrun(urun: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/urunadd`, urun,{headers});
  }

  updateUrun(id: string, urun: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/urunupdate/${id}`, urun,{headers});
  }
  searchUruns(searchTerm: string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('search', searchTerm);
    return this.http.get<any[]>(`${this.apiUrl}/searchuruns`, { headers,params });
  }
  deleteUrun(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrl}/urundelete/${id}`,{headers});
  }


  getKategoriler(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrlkategori}/urunkategori/get`, { headers });
  }

  addKategori(kategori: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrlkategori}/urunkategori/add`, kategori, { headers });
  }


  // Belirli bir kategoriye ait alt kategorileri yüklemek için yöntem
  getAltKategorilerByKategoriId(kategoriId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrlkategori}/urunaltkategori/getByKategori/${kategoriId}`, { headers });
  }

   // Alt kategori ekleme servisi
   addAltKategori(altKategori: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrlkategori}/urunaltkategori/add`, altKategori, { headers });
  }

}
