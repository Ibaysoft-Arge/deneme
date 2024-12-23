// src/app/service/todo.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
    providedIn: 'root',
})
export class TodoService {
    private apiUrl = environment.baseappurl + '/api/todos';

    constructor(private http: HttpClient) { }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    getTodos(statu?: string, tag?: string, onemDerecesi?: string, atananUserID?: string): Observable<any> {
        const headers = this.getAuthHeaders();
        let params: any = {};

        if (statu) params.statu = statu;
        if (tag) params.tag = tag;
        if (onemDerecesi) params.onemDerecesi = onemDerecesi;
        if (atananUserID) params.atananUserID = atananUserID;

        return this.http.get(`${this.apiUrl}`, { headers, params });
    }

    addTodo( todoData: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}`, {...todoData }, { headers });
    }

    updateTodoById(todoId: string, todoData: any): Observable<any> {
        const token = localStorage.getItem('token');
        const headers = this.getAuthHeaders();
    
        return this.http.put(`${this.apiUrl}/${todoId}`, { ...todoData }, { headers });
    }

    deleteTodo(id: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.delete(`${this.apiUrl}/${id}`, { headers });
    }

    getPersonal(): Observable<any> {
        const headers = this.getAuthHeaders();
        let params: any = {};
        
        return this.http.get(`${environment.baseappurl}/api/auth/getPersonal`, { headers });
    }
}
