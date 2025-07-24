import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, of } from "rxjs";
import { environment } from "../environment";
import { Contact } from "../model/contact";

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}contacts`;

  retrieveList(): Observable<Contact[]> {
    return this.http.get<Contact[]>(this.apiUrl);
  }

  retrieve(id: number): Observable<Contact> {
    return this.http.get<Contact>(`${this.apiUrl}/${id}`);
  }

  create(contact: Partial<Contact>): Observable<Contact> {
    return this.http.post<Contact>(this.apiUrl, contact);
  }

  update(id: number, contact: Partial<Contact>): Observable<Contact> {
    return this.http.put<Contact>(`${this.apiUrl}/${id}`, contact);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addTransaction(contactId: number, transaction: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${contactId}/transactions`, transaction);
  }
  updateTransaction(contactId: number, transactionId: number, transaction: any): Observable<any> {
    transaction.id = transactionId;
    return this.http.put(`${this.apiUrl}/${contactId}/transactions/${transactionId}`, transaction);
  }

  deleteTransaction(transactionId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/transactions/${transactionId}`);
  }
}