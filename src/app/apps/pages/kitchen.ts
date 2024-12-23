import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { OrderService } from 'src/app/service/order.service';
import { SocketService } from 'src/app/service/socket.service';
import GLightbox from 'glightbox';

@Component({
  selector: 'app-kitchen',
  templateUrl: './kitchen.component.html',
})
export class KitchenComponent implements OnInit, OnDestroy,AfterViewInit {
  kitchenItems: any[] = [];
  stores: any[] = [];  // Mağazalar listesi
  selectedStore: string = '';

  constructor(
    private kitchenService: OrderService,
    private socketService: SocketService
  ) {}

  loadStores(): void {
    const storedMagazalar = localStorage.getItem('magazalar');
    if (storedMagazalar) {
      this.stores = JSON.parse(storedMagazalar);

      // Daha önce seçilen mağaza var mı?
      const previouslySelectedStore = localStorage.getItem('selectedStore');
      if (previouslySelectedStore && this.stores.some(s => s._id === previouslySelectedStore)) {
        this.selectedStore = previouslySelectedStore;
      } else if (this.stores.length > 0) {
        this.selectedStore = this.stores[0]._id;
      }

      this.onStoreChange(this.selectedStore);
    } else {
      this.stores = [];
    }
  }

  onStoreChange(storeId: string): void {
    this.selectedStore = storeId;
    localStorage.setItem('selectedStore', this.selectedStore);
    this.loadKitchenItems();

    // Seçilen mağaza odasına katıl
    this.socketService.joinStore(this.selectedStore);
  }

  ngOnInit(): void {
    this.loadStores();

    // orderUpdated eventini dinle
    this.socketService.onOrderUpdate((data: any) => {
      console.log('Order updated event received:', data);
      // Güncel mutfak öğelerini yükle
      this.loadKitchenItems();
    });
  }

  ngOnDestroy(): void {
    // Burada spesifik olarak socket bağlantısını kapatmaya gerek yok.
    // Uygulamanın genel yaşam döngüsünde SocketService genelde tek bir bağlantıyı yönetir.
    // İsterseniz SocketService'de bir disconnect metodu tanımlayıp çağırabilirsiniz.
  }

  getTimeDifference(dateString: string): string {
    if (!dateString) return '-';

    const orderTime = new Date(dateString).getTime();
    const currentTime = new Date().getTime();
    const timeDifference = currentTime - orderTime;

    const seconds = Math.floor(timeDifference / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes} dk ${remainingSeconds} sn`;
  }

  loadKitchenItems(): void {
    if (!this.selectedStore) return; // Bir mağaza seçilmemişse

    this.kitchenService.getKitchenItems(this.selectedStore).subscribe({
      next: (items) => {
        this.kitchenItems = items;
      },
      error: (err) => {
        console.error('Mutfak ürünleri yüklenirken hata:', err);
      }
    });
  }

  markAsDone(orderId: string, urunId: string): void {
    this.kitchenService.updateItemStatus(orderId, urunId, 'yapildi').subscribe(
      (response) => {
        console.log(`Ürün yapıldı olarak işaretlendi: ${orderId}, ${urunId}`);
        this.loadKitchenItems();
      },
      (error) => {
        console.error('Ürün durumu güncellenirken hata:', error);
      }
    );
  }
  ngAfterViewInit(): void {
    const lightbox = GLightbox({
        selector: '.glightbox' // Replace with your selector as needed
    });
}
}
