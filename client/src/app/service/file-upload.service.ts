import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environment';
import { Meal } from '../model/meals';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  readonly baseUrl: string = `${environment.apiUrl}files`;

  constructor(private http: HttpClient) { }

  postFile(file: any) {
    const formData = new FormData();
    formData.append('file', file);
  
    return this.http.post<any>(this.baseUrl, formData);
  }
}
