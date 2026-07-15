import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
  change: number;
  changePercent: number;
}

export interface ForexRatesResponse {
  base: string;
  timestamp: string;
  rates: CurrencyRate[];
}

export interface ConvertResponse {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
}

@Injectable({ providedIn: 'root' })
export class ForexService {
  private apiUrl = `${environment.apiUrl}/forex`;

  constructor(private http: HttpClient) {}

  getRates(base: string = 'GTQ'): Observable<ForexRatesResponse> {
    return this.http.get<ForexRatesResponse>(`${this.apiUrl}/rates`, { params: { base } });
  }

  convert(from: string, to: string, amount: number): Observable<ConvertResponse> {
    return this.http.post<ConvertResponse>(`${this.apiUrl}/convert`, { from, to, amount });
  }
}
