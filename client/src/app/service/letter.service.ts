import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';
import { Letter, CreateLetterDto } from '../model/letter';

@Injectable({
  providedIn: 'root'
})
export class LetterService {
  private apiUrl = `${environment.apiUrl}letters`;

  constructor(private http: HttpClient) { }

  getUnopenedLetters(): Observable<Letter[]> {
    return this.http.get<Letter[]>(`${this.apiUrl}/unopened`);
  }

  getOpenedLetters(): Observable<Letter[]> {
    return this.http.get<Letter[]>(`${this.apiUrl}/opened`);
  }

  getLetter(id: number): Observable<Letter> {
    return this.http.get<Letter>(`${this.apiUrl}/${id}`);
  }

  createLetter(dto: CreateLetterDto): Observable<Letter> {
    console.log(dto);
    return this.http.post<Letter>(this.apiUrl, dto);
  }

  replyLetter(id: number, selectedOption: string): Observable<Letter> {
    return this.http.post<Letter>(`${this.apiUrl}/${id}/reply`, { selectedOption });
  }

  deleteLetter(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
