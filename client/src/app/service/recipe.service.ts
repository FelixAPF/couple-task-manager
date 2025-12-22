import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environment';
import { Recipe } from '../model/recipes';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  readonly baseUrl: string = `${environment.apiUrl}recipes`;

  constructor(private http: HttpClient) { }
  
  getAllRecipes() {
    return this.http.get<Recipe[]>(`${this.baseUrl}`);
  }
  getRecipeById(id: number) {
    return this.http.get<Recipe>(`${this.baseUrl}/${id}`);
  }
  addRecipe(recipe: Recipe) {
    return this.http.post<Recipe>(`${this.baseUrl}`, recipe);
  }
  updateRecipe(recipe: Recipe) {
    return this.http.put<Recipe>(`${this.baseUrl}/${recipe.id}`, recipe);
  }
  deleteRecipe(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  randomRecipe(){
    return this.http.get<Recipe>(RecipeService.randomRecipeEndpoint());
  }
  
  smartImport(file: File): Observable<Recipe> {
    const formData = new FormData();
    formData.append('file', file);
    
    // This calls the POST /api/recipe/smart-import endpoint we created in the Controller
    return this.http.post<Recipe>(`${this.baseUrl}/smart-import`, formData);
  }

  smartImportUrl(url: string): Observable<Recipe> {
    return this.http.post<Recipe>(`${this.baseUrl}/smart-import-url`, { url });
  }

  static randomRecipeEndpoint(){
    return `${environment.apiUrl}recipes/random`;
  }
}
