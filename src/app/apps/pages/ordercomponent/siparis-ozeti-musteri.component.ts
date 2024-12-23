import { Component, Input, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';

@Component({
    selector: 'app-siparis-ozeti-musteri',
    templateUrl: './siparis-ozeti-musteri.component.html',
})
export class SiparisOzetiMusteriComponent implements OnInit, OnDestroy {

    constructor(private changeDetectorRef: ChangeDetectorRef) { }

    @Input() orderItems: any[] = [];
    @Input() totalAmount: number = 0;
    @Input() orderSource?: string;
    @Input() orderNo?: string;

    ngOnInit() {
        // localStorage'dan verileri yükleyin
        const data = localStorage.getItem('orderData');
        if (data) {
            const parsedData = JSON.parse(data);
            this.orderItems = parsedData.orderItems;
            this.totalAmount = parsedData.totalAmount;
            // Diğer verileri atayın
        }

        // Değişiklikleri dinleyin
        window.addEventListener('storage', this.onStorageEvent.bind(this));
    }

    onStorageEvent(event: StorageEvent) {
        if (event.key === 'orderData') {
            const parsedData = JSON.parse(event.newValue || '{}');
            this.orderItems = parsedData.orderItems;
            this.totalAmount = parsedData.totalAmount;
            // Değişiklik algılamayı tetikleyin
            this.changeDetectorRef.detectChanges();
        }
    }

    ngOnDestroy() {
        window.removeEventListener('storage', this.onStorageEvent.bind(this));
    }
}
