import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class BillingAddressService {
  private apiUrl = environment.baseappurl+'/api/billing';

  constructor(private http: HttpClient) {}

  // Yeni bir adres eklemek için kullanılacak servis
  addAddress(address: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(`${this.apiUrl}/add`, address, { headers });
  }

  // Adresi güncellemek için kullanılacak servis
  updateAddress(id: string, addressData: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.put(`${this.apiUrl}/update/${id}`, addressData, { headers });
  }

  // Kullanıcının tüm adreslerini listelemek için kullanılacak servis
  getAddresses(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.apiUrl}/list`, { headers });
  }

  // Adresi silmek için kullanılacak servis
  deleteAddress(addressId: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.delete(`${this.apiUrl}/delete/${addressId}`, { headers });
  }
}
