import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';
import { Procedure } from '../model/procedure';

@Injectable({
  providedIn: 'root'
})
export class ProcedureService {
  private apiUrl = `${environment.apiUrl}api/procedures`;

  constructor(private http: HttpClient) {}

  getProcedures(): Observable<Procedure[]> {
    return this.http.get<Procedure[]>(this.apiUrl);
  }

  createProcedure(procedure: Procedure): Observable<Procedure> {
    return this.http.post<Procedure>(this.apiUrl, procedure);
  }

  updateProcedure(id: number, procedure: Procedure): Observable<Procedure> {
    return this.http.put<Procedure>(`${this.apiUrl}/${id}`, procedure);
  }

  deleteProcedure(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}