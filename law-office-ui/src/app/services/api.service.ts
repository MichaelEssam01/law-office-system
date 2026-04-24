import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiUrl = 'https://localhost:xxxx/api';

  constructor(private http: HttpClient) { }

  getTest() {
    return this.http.get(`${this.apiUrl}/test`);
  }
}