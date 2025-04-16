import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environment';
import { Recipe } from '../model/recipes';

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
}
