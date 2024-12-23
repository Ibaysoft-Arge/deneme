import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class SupportHoursService {

  private apiUrl =  environment.baseappurl+'/api/support';  // API URL'niz

  constructor(private http: HttpClient) { }

  // HTTP isteklerinde Authorization başlığını eklemek için helper method
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');  // LocalStorage'dan token'ı al
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    });
  }
   checkSupportAvailability(): Observable<any> {
    return this.http.get(this.apiUrl+'/check-working-hours', { headers: this.getHeaders() });
  }
  // Destek saatlerini almak için method
  getSupportHours(): Observable<any[]> {
    const headers = this.getHeaders();  // Authorization başlığını al
    return this.http.get<any[]>(this.apiUrl, { headers });
  }

  // Destek saati eklemek için method
  addSupportHour(supportHour: any): Observable<any> {
    const headers = this.getHeaders();  // Authorization başlığını al
    return this.http.post(this.apiUrl, supportHour, { headers });
  }

  // Destek saati güncellemek için method
  updateSupportHour(id: string, supportHour: any): Observable<any> {
    const headers = this.getHeaders();  // Authorization başlığını al
    return this.http.put(`${this.apiUrl}/${id}`, supportHour, { headers });
  }
}
