import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ReportConfig } from '../model/report-config';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';


@Injectable({providedIn:'root'})
export class ReportDataService {
  constructor(private http: HttpClient) {}
  private apiUrl = environment.baseappurl + '/api/orderRoutes'; // Backend URL
  getReportData(config: ReportConfig): Observable<ReportConfig> {
    const headers = this.getAuthHeaders();
    return this.http.post<ReportConfig>(`${this.apiUrl}/report/dynamic`, config);
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}
