import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
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

  addReservation(reservation: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/reservationRoutes/add`, reservation, { headers });
  }

  updateReservation(reservations: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/reservationRoutes/update/${reservations.id}`, reservations, { headers });
  }

  getTable(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/table/getTables`, { headers });
  }

  getReservations(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/reservationRoutes/getAll`, { headers });
  }

  getReservationsByMagaza(id: String): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/reservationRoutes/getByMagazaId/${id}`, { headers });
  }

  deleteReservation(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/reservationRoutes/delete/${id}`, { headers });
  }

}
