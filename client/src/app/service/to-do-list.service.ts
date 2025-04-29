import { Injectable } from '@angular/core';
import { ToDoItem, ToDoStatus } from '../model/household';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environment';

@Injectable({
  providedIn: 'root'
})
export class ToDoListService {

  readonly baseUrl: string = `${environment.apiUrl}to-do-list`;
  
  constructor(private http: HttpClient) { }

  retrieveToDoItems() {
    return this.http.get<ToDoItem[]>(this.baseUrl);
  }

  createToDoItem(toDoItem: ToDoItem) {
    return this.http.post<ToDoItem>(this.baseUrl, toDoItem);
  }
  updateToDoItem(toDoItem: ToDoItem) {
    return this.http.put<ToDoItem>(`${this.baseUrl}/${toDoItem.id}`, toDoItem);
  }
  deleteToDoItem(toDoItemId: number) {
    return this.http.delete(`${this.baseUrl}/${toDoItemId}`);
  }
  updateToDoItemStatus(toDoItemId: number, status: ToDoStatus) {
    return this.http.put(`${this.baseUrl}/${toDoItemId}/status/${status}`, null);
  }

  rateAndCompleteToDoItem(toDoItemId: number, rating: number) {
    return this.http.put(`${this.baseUrl}/${toDoItemId}/rate/${rating}`, null);
  }

}
