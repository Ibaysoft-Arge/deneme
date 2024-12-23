import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class MasaService {
  private apiUrl = environment.baseappurl + '/api/table';

  constructor(private http: HttpClient) { }
  // Yetkilendirme başlıklarını ayarla
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
  getMasalar(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/getTables`, { headers });
  }

  getMasalarByArea(tableArea: string, magaza: string): Observable<any[]> {

    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/getTablesWithStatus`, { headers, params: { tableArea, magaza } });
  }

  getMasalarByAreabyid(id: string): Observable<any[]> {

    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/getTablesWithStatusbyid`, { headers, params: { id } });
  }
  getTableAreas(magaza: string): Observable<any[]> {

    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/getTableAreas`, { headers, params: { magaza } });
  }

  getMasalarByMagaza(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/getTablesByMagaza/${id}`, { headers });
  }

  addTable(tableData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/addTable`, tableData, { headers });
  }

}
