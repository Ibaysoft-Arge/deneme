import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { SharedModule } from "../../../../shared.module";
import { IconModule } from "../../../shared/icon/icon.module";

@Component({
    selector: 'app-siparis-ozeti',
    templateUrl: './siparis-ozeti.component.html',
})
export class SiparisOzetiComponent {

    @Input() orderItems: any[] = [];
    @Input() totalAmount: number = 0;

    @Input() orderSource?: string; // Kaynak
    @Input() tableInfo?: { tableName: string; tableNumber?: number }; // Masa Bilgisi
    @Input() customerInfo?: { name: string }; // Müşteri Bilgisi
    @Input() pickupInfo?: { method: string }; // Teslim Bilgisi
    @Input() orderDate?: string; // Sipariş Tarihi
    @Input() orderTime?: string; // Sipariş Saati
    @Input() orderNo?: string; // Sipariş Numarası
    @Input() orderUname?: string; // Adisyonu Açan Kullanıcı
    @Input() isFullyPaid: boolean = false;
    @Output() removeItem = new EventEmitter<number>();
    @Output() applyDiscount = new EventEmitter<any>();
    @Output() OnaylaOrder = new EventEmitter<any>();
    @Output() OdemeAlOrder = new EventEmitter<any>();

    @Output() EditOrderItem = new EventEmitter<{ item: any; index: number }>();

    getItemName(detail: any): { name: string; isExcluded: boolean } {
        if (detail.istenmeyen === true) {
            return { name: detail.item?.urunAdi || detail.itemDetails?.urunAdi || '', isExcluded: true };
        }
        return { name: detail.itemDetails?.urunAdi || detail.urun?.urunAdi || '', isExcluded: false };
    }



    getItemNameUrun(detail: any){
        console.log(detail);
       return detail.urun?.urunAdi || '';
    }
    onRemoveItem(index: number): void {
        this.removeItem.emit(index);
    }

    onApplyDiscount(item: any): void {
        this.applyDiscount.emit(item);
    }
    onOdemeAlOrder(item: any): void {
        this.OdemeAlOrder.emit(item);
    }


    onEditOrderItem(item: any, index: number): void {
        this.EditOrderItem.emit({ item, index });
    }

    onOnaylaOrder(orderItems: any): void {
        this.OnaylaOrder.emit(orderItems);
    }
    get displayName(): string {
        return this.customerInfo?.name ?? this.getMaskedCustomerName();
      }
    getMaskedCustomerName(): string {
        if (!this.customerInfo || !this.customerInfo.name) {
            return '';
        }
        const [firstName, lastName] = this.customerInfo.name.split(' ');
        if (!lastName) {
            return firstName;
        }
        return `${firstName} ${lastName.charAt(0)}***`;
    }
}
