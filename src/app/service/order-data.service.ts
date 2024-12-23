// order-data.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class OrderDataService {
  private orderDataSubject = new BehaviorSubject<any>(null);
  orderData$ = this.orderDataSubject.asObservable();

  setOrderData(data: any) {
    this.orderDataSubject.next(data);
  }

  getOrderData() {
    return this.orderDataSubject.getValue();
  }
}
