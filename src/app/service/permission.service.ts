// src/app/service/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EMPTY, Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
// import jwt_decode from 'jwt-decode';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
    providedIn: 'root',
})
export class PermissionService {
    private apiUrl = environment.baseappurl + '/api/admin';
    private apiUrlnew = environment.baseappurl + '/api';
    permissions: any[] = [];
    selectedPermissions: string[] = []; // Stores selected permission IDs

    constructor(private http: HttpClient) { }

    ngOnInit(): void {
        this.getPermissions().subscribe();
    }

    // Yetkilendirme başlıklarını ayarla
    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    addPermission(name: string, description: string): Observable<any> {
        const body = { name, description };
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/addPermission`, body, { headers });
    }

    updateRole(roleId: string, permissions: string[]): Observable<any> {
        const body = { permissions };
        const headers = this.getAuthHeaders();
        // Update the HTTP method to PUT and add roleId to the endpoint URL
        return this.http.put(`${this.apiUrl}/updateRole/${roleId}`, body, { headers });
    }

    updateUsersByPaketId(paketId: string): Observable<any> {
        const headers = this.getAuthHeaders();
        // Backend API endpoint'ine uygun şekilde PUT isteği gönderiyoruz.
        return this.http.put(`${this.apiUrlnew}/paket/updateUsersByPaketId/${paketId}`, {}, { headers });
    }

    getPermissions(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/getPermissions`, { headers }).pipe(
            tap((response: any) => {
                if (response) {
                    // Gelen veriden avatar ve kullaniciAdi'yi al ve localStorage'a kaydet

                }
            })
        );
    }

    getRoles(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/getRoles`, { headers }).pipe(
            tap((response: any) => {
                if (response) {
                    // Gelen veriden avatar ve kullaniciAdi'yi al ve localStorage'a kaydet

                }
            })
        );
    }

    onPermissionChange(event: any, permissionId: string): void {
        if (event.target.checked) {
            // Add selected permission ID
            this.selectedPermissions.push(permissionId);
        } else {
            // Remove unselected permission ID
            this.selectedPermissions = this.selectedPermissions.filter(id => id !== permissionId);
        }
    }

    addRole(name: string, permissions: string[]): Observable<any> {
        const body = { name, permissions };
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/addRole`, body, { headers });
    }
}
