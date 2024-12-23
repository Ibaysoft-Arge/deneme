import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';  // HTTP istekleri için
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';



@Injectable({
  providedIn: 'root'
})
export class RecipeService {

  private apiUrl = environment.baseappurl + '/api/recipe';

  constructor(private http: HttpClient) { }

  // Yetkilendirme başlıklarını ayarla
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Tüm reçeteleri getir
  getRecipes(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/recipeget`, { headers });
  }

  getRecipesserarc(searchTerm: string = ''): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/searchrecipes?search=${searchTerm}`, { headers });
  }
  // Yeni reçete ekle
  addRecipe(recipe: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/recipeadd`, recipe, { headers });
  }

  // Reçete güncelle
  updateRecipe(id: string, recipe: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/recipeupdate/${id}`, recipe, { headers });
  }

  // Reçete sil
  deleteRecipe(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/recipedelete/${id}`, { headers });
  }

  // Belirli bir reçeteyi getir
  getRecipeById(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/recipeget/${id}`, { headers });
  }

  searchRecipes(searchTerm: string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams().set('search', searchTerm);
    return this.http.get<any[]>(`${this.apiUrl}/searchrecipes`, { headers, params });
  }


}
