import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { Item } from '../apps/pages/ordercomponent/item.model';

interface OrderItem {
    _id?: string;
    urunId: string;
    urunAdi: string;
    vergiliFiyat: number;
    yapildimi: string;
    miktar: number;
    items: Item[];
    partialPayment?: number;
}
@Injectable({ providedIn: 'root' })
export class OrderStateService {
  // Sipariş öğelerini tutan BehaviorSubject (UI güncellemeleri için)
  private _orderItems = new BehaviorSubject<OrderItem[]>([]);
  orderItems$ = this._orderItems.asObservable();

  // Toplam, kalan miktar, tam ödendi mi gibi durumları state'te tutabiliriz
  totalAmount: number = 0;
  sumOfPayments: number = 0;
  remainingAmount: number = 0;
  isFullyPaid: boolean = false;

  // Kupnlar
  selectedCoupons: any[] = [];

  // orderId vb bilgileri de burada tutabilirsiniz
  orderId: string = '0';
  store: string = '';
  satiskaynakid: string = '';

  // Mevcut orderItems'ı getter ile alabiliriz
  get orderItems(): OrderItem[] {
    return this._orderItems.getValue();
  }

  setOrderItems(items: OrderItem[]) {
    this._orderItems.next(items);
    this.calculateTotals();
  }

  loadOrderFromBackend(orderData: any) {
    // Backend'den gelen veriyi state'e yükler
    // örnek: orderData.urunler -> orderItems
    const items: OrderItem[] = orderData.urunler;
    this.orderId = orderData._id || '0';
    this.store = orderData.magazaKodu;
    this.satiskaynakid = orderData.satisKaynak;
    this.setOrderItems(items);

    // Kuponlar:
    if (orderData.coupons && orderData.coupons.length > 0) {
      this.selectedCoupons = orderData.coupons;
      this.calculateDiscountedTotal();
    }

    // Ödemeler
    const sumOfPayments = orderData.odemeler ? orderData.odemeler.reduce((acc: number, o: any) => acc + o.tutar, 0) : 0;
    this.sumOfPayments = sumOfPayments;
    this.calculateTotals();
  }

  calculateTotals() {
    this.totalAmount = this.calculateTotal();
    this.remainingAmount = Math.max(this.totalAmount - this.sumOfPayments, 0);
    this.isFullyPaid = (this.sumOfPayments >= this.totalAmount);
  }

  calculateTotal(): number {
    let total = 0;
    for (const item of this.orderItems) {
      const itemTotal = (item.vergiliFiyat * item.miktar) + this.calculateSubItemTotal(item.items || []);
      total += itemTotal;
    }
    return total;
  }

  calculateSubItemTotal(subItems: any[]): number {
    return subItems.reduce((total, subItem) => {
      if (!subItem.selected) return total;
      const subItemPrice = subItem.ekFiyat || 0;
      const deeperSubItemPrice = this.calculateSubItemTotal(subItem.itemDetails?.items || []);
      const urunItemPrice = this.calculateUrunItemTotal(subItem.itemDetails?.urunItems || []);
      return total + subItemPrice + deeperSubItemPrice + urunItemPrice;
    }, 0);
  }

  calculateUrunItemTotal(urunItems: any[]): number {
    return urunItems.reduce((total, ui) => {
      const uiPrice = ui.ekFiyat || 0;
      const deeperPrice = ui.urun?.items ? this.calculateSubItemTotal(ui.urun.items) : 0;
      return total + uiPrice + deeperPrice;
    }, 0);
  }

  calculateDiscountedTotal(): void {
    this.calculateTotals();
    if (!this.selectedCoupons || this.selectedCoupons.length === 0) return;

    let discountedTotal = this.totalAmount;
    for (const coupon of this.selectedCoupons) {
      if (coupon.kuponTipi === 'indirim-yuzde') {
        discountedTotal = discountedTotal * (1 - (coupon.indirimMiktari / 100));
      } else if (coupon.kuponTipi === 'indirim-tl') {
        discountedTotal = discountedTotal - coupon.indirimMiktari;
        if (discountedTotal < 0) discountedTotal = 0;
      } else if (coupon.kuponTipi === 'bedava') {
        discountedTotal = 0;
      }
    }

    this.totalAmount = discountedTotal;
    this.remainingAmount = Math.max(this.totalAmount - this.sumOfPayments, 0);
    this.isFullyPaid = (this.sumOfPayments >= this.totalAmount);
  }

  addItemToOrder(orderItem: OrderItem) {
    const items = [...this.orderItems, orderItem];
    this.setOrderItems(items);
  }

  removeItemFromOrder(index: number) {
    const items = [...this.orderItems];
    items.splice(index, 1);
    this.setOrderItems(items);
  }

  // Kupon ekleme/silme
  addCoupon(coupon: any) {
    this.selectedCoupons.push(coupon);
    this.calculateDiscountedTotal();
  }

  removeCoupon(index: number) {
    this.selectedCoupons.splice(index, 1);
    this.calculateDiscountedTotal();
  }

  // vs. diğer işlemler de buraya eklenebilir
}
