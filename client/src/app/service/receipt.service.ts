import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environment';
import { Receipt, ReceiptItem } from '../model/receipt';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {
  readonly baseUrl: string = `${environment.apiUrl}api/receipts`;

  constructor(private http: HttpClient) { }

  analyzeReceipt(file: File): Observable<ReceiptItem[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ReceiptItem[]>(`${this.baseUrl}/analyze`, formData);
  }

  saveReceipt(receipt: Receipt): Observable<Receipt> {
    return this.http.post<Receipt>(`${this.baseUrl}`, receipt);
  }

  getAllReceipts(): Observable<Receipt[]> {
      return this.http.get<Receipt[]>(this.baseUrl);
  }

  // Add this inside ReceiptService
  updateReceipt(id: number, receipt: Receipt): Observable<Receipt> {
    return this.http.put<Receipt>(`${this.baseUrl}/${id}`, receipt);
  }
}