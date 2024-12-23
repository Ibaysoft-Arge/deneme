// cluster.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class ClusterService {
  private apiUrl =  environment.baseappurl +'/api/cluster'; // API URL'sini ayarlayın

  constructor(private http: HttpClient) {}

    // Yetkilendirme başlıklarını ayarla
    private getAuthHeaders(): HttpHeaders {
      const token = localStorage.getItem('token');
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });
    }

  getClusters(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/get`,{headers});
  }

  addCluster(cluster: { ad: string }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/add`, cluster, { headers });
  }
}
