import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Beneficiary {
  _id: string;
  name: string;
  accountNumber: string;
  alias: string;
  bank: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class BeneficiaryService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getBeneficiaries(): Observable<{ beneficiaries: Beneficiary[] }> {
    return this.http.get<{ beneficiaries: Beneficiary[] }>(`${this.api}/beneficiaries`);
  }

  createBeneficiary(data: { name: string; accountNumber: string; alias?: string; bank?: string }): Observable<any> {
    return this.http.post(`${this.api}/beneficiaries`, data);
  }

  updateBeneficiary(id: string, data: Partial<Beneficiary>): Observable<any> {
    return this.http.put(`${this.api}/beneficiaries/${id}`, data);
  }

  deleteBeneficiary(id: string): Observable<any> {
    return this.http.delete(`${this.api}/beneficiaries/${id}`);
  }
}
