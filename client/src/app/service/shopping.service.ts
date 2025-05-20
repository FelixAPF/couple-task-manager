import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environment';
import { TaskList, TaskListRequest } from '../model/task-list';
import { Assignee } from '../model/task-period';
import { ShoppingItem, Store } from '../model/shopping-item';

@Injectable({
  providedIn: 'root'
})
export class ShoppingService {
  readonly baseUrl: string = `${environment.apiUrl}shopping-list`;
  constructor(private http: HttpClient) { }


  retrieveShoppingItem(id: number): Observable<ShoppingItem> {
    return this.http.get<ShoppingItem>(`${this.baseUrl}/${id}`);
  }

  retrieveShoppingList(): Observable<ShoppingItem[]> {
    return this.http.get<ShoppingItem[]>(this.baseUrl);
  }
  retrieveShoppingListNotBought(): Observable<ShoppingItem[]> {
    return this.http.get<ShoppingItem[]>(`${this.baseUrl}/not-bought`);
  }

  addShoppingItem(taskList: ShoppingItem): Observable<ShoppingItem>{
    return this.http.post<ShoppingItem>(this.baseUrl, taskList);
  }

  deleteShoppingItem(shoppingItemId: number): Observable<ShoppingItem>{
    return this.http.delete<ShoppingItem>(`${this.baseUrl}/${shoppingItemId}`);
  }

  updateShoppingItem(shoppingItem: ShoppingItem): Observable<ShoppingItem>{
    return this.http.put<ShoppingItem>(`${this.baseUrl}/${shoppingItem.id}`, shoppingItem);
  }

  listNameSuggestions(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/name/suggestions`)
  }

  updateQuantity(id: number, quantity: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/quantity`, quantity);
  }

  static shoppingListSuggestionsEndPoint(){
    return `${environment.apiUrl}shopping-list/name/suggestions`;
  }

  static shoppingListUpdateQuantityEndpoint(){
    return `${environment.apiUrl}shopping-list`
  }

  getStoreEnumValues(): Store[] {
    return Object.values(Store); // Return array of enum values
  }
}
