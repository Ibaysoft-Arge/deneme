// src/app/service/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EMPTY, Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs'; // of operatoru, bir Observable döndürmek için kullanılır
import { environment } from 'src/environments/environment.prod';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private apiUrl = environment.baseappurl + '/api';

    constructor(private http: HttpClient) { }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    getUserSettings(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/user-settings`, { headers });
    }

    updateUserSetting(updateSettingName: string, updateSetting: boolean): Observable<any> {
        const body = { updateSettingName, updateSetting };
        const headers = this.getAuthHeaders();
        // Kullanıcı ID'sini URL'ye ekleyin
        return this.http.put(`${this.apiUrl}/user-settings/singleSettingUpdate`, body, { headers });
    }

    getPageRoutes(pageCode: string,): Observable<any> {

        console.log(pageCode);
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/pageRoutes/sayfa/${pageCode}`, { headers });
    }
    getUsersAllMain(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/auth/getUsersAll`, { headers });
    }
    getUsers(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/auth/getUsers`, { headers });
    }

    getUsersAlt(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/auth/getAllUsersExceptCurrent`, { headers });
    }

    addUser(user: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/auth/addUser`, user, { headers });
    }

    addUserAlt(user: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/auth/addUserAlt`, user, { headers });
    }

    getUserbyId(user: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/auth/getUserByKullaniciId`, user, { headers });
    }

    getUserAvatarbyId(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/auth/getAvatarByUserId/${id}`);
    }

    updateParentUser(parentUserId: string): Observable<any> {
        const headers = this.getAuthHeaders();
        const body = { parentUserId: parentUserId }; // JSON nesnesi oluştur
        return this.http.put(`${this.apiUrl}/auth/updateParentUser`, body, { headers });
    }
    updateUser(id: string, magaza: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.put(`${this.apiUrl}/auth/updateByKullaniciId`, magaza, { headers });
    }



    updateUserByKullaniciId(userId: string, userData: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.put(`${this.apiUrl}/auth/updateAltUser`, { userId, ...userData }, { headers });
    }

    deleteUser(id: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.delete(`${this.apiUrl}/magaza/delete/${id}`, { headers });
    }

    getRoles(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/auth/getRoles`, { headers });
    }

    getMagaza(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/magaza/get`, { headers });
    }

    addRoles(magaza: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/magaza/add`, magaza, { headers });
    }
}
