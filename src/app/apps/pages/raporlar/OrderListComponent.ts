import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ReportService } from 'src/app/service/ReportService';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/apps/NotificationService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { OrderService } from 'src/app/service/order.service';
import { CouponService } from 'src/app/service/coupon.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html'
})
export class OrderListComponent implements OnInit {
  @ViewChild('reportContent') reportContent!: ElementRef;

  stores: any[] = [];
  selectedStore: string = '';
  selectedDate: string = ''; // Tek tarih seçimi
  selectedStatus: string = '';
  selectedSourceFilter: string = '';
  orders: any[] = [];
  filteredOrders: any[] = [];
  loading: boolean = false;
  error = '';
  uniqueSources: string[] = [];

  constructor(
    private reportService: ReportService,
    private router: Router,
    private orderService: OrderService,
    private couponService: CouponService,
    private notificationService: NotificationService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const storedMagazalar = localStorage.getItem('magazalar');
    if (storedMagazalar) {
      this.stores = JSON.parse(storedMagazalar);
    }

    // Varsayılan olarak bugünün tarihini seç
    const now = new Date();
    this.selectedDate = now.toISOString().split('T')[0];
  }

  getOrders(): void {
    if (!this.selectedDate) {
      this.error = 'Lütfen bir tarih seçiniz.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.orders = [];
    this.filteredOrders = [];

    // Seçilen günü start ve end tarih olarak backend'e gönderiyoruz
    const startDate = this.selectedDate + 'T00:00:00';
    const endDate = this.selectedDate + 'T23:59:59';

    const body = {
        store: this.selectedStore || '',
        startDate: startDate || '',
        endDate: endDate || ''
      };

    this.reportService.getSparisList(body).subscribe({
      next: (data) => {
        this.orders = data;
        this.uniqueSources = this.getUniqueSources();
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Sipariş listesi alınırken hata:', err);
        this.notificationService.showNotification(this.translate.instant('errortakingorders'), 'error', 'top-end');
        this.loading = false;
        this.error = 'Veri alınırken hata oluştu.';
      }
    });
  }

  applyFilters() {
    this.filteredOrders = this.orders.filter(order => {
      let statusMatch = true;
      let sourceMatch = true;

      if (this.selectedStatus) {
        statusMatch = order.statu === this.selectedStatus;
      }

      if (this.selectedSourceFilter) {
        sourceMatch = order.satisKaynakAdi === this.selectedSourceFilter;
      }

      return statusMatch && sourceMatch;
    });
  }

  getUniqueSources(): string[] {
    const sources = this.orders.map(o => o.satisKaynakAdi).filter(s => !!s);
    return Array.from(new Set(sources));
  }
  goToOrderDetails(order: any): void {
    // cluster bilgisini bul
    let selectedStoreData = this.stores.find(s => s._id === order.magazaKodu);
    let cluster = selectedStoreData ? selectedStoreData.cluster : null;

    // Satış kaynaklarını çek
    this.couponService.getSatisKaynaklari().subscribe((satisKaynaklari) => {
      // satisKaynaklari dizisinden order.satisKaynakId eşleşmesini bul
      const kaynak = satisKaynaklari.find((k: any) => k._id.toString() === order.satisKaynakId);

      let source = 'paket'; // varsayılan
      if (kaynak) {
        // kaynak.tur ya da kaynak üzerinde hangi alan varsa oradan source belirleyin
        // Örneğin kaynak.tur 'masa', 'paket', 'gelal' vb. değerler içeriyorsa ona göre set edebilirsiniz.
        // Eğer tur değeri direk source'a denk geliyorsa:
        source = kaynak.tip;
        // ya da eğer tur değil de kaynakAdi ile maplemek istiyorsanız:
        // source = kaynak.kaynakAdi || 'paket';
      }

      // id parametresi
      let idParam = order.orderNo; // ihtiyaca göre değiştirin

      const queryParams: any = {
        source: source,
        store: order.magazaKodu,
        id: idParam,
        cluster: cluster,
        orderId: order.orderId,
        orderStatus: order.statu,
        orderDate: order.siparisTarihi,
        ekran: 'siparisListesi'
        // Eğer masaId gerekliyse ve order.masaId varsa ekleyebilirsiniz:
        // masaId: order.masaId
      };

      // State ile order bilgilerini de gönderebilirsiniz
      this.router.navigate(['/apps/order'], { queryParams, state: { orderInfo: order } });
    });
  }



  calculateTotalPrice(): number {
    return this.filteredOrders.reduce((acc, cur) => acc + (cur.toplamVergiliFiyat || 0), 0);
  }

  exportToExcel() {
    const aoa = this.prepareExcelData();
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(aoa);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SiparisListesi');
    XLSX.writeFile(wb, 'siparis_listesi.xlsx');
  }

  private prepareExcelData(): any[][] {
    const aoa: any[][] = [];
    // Başlıklar
    aoa.push(['Mağaza', 'Sipariş No', 'Sipariş Tarihi', 'Müşteri Adı', 'Masa Adı', 'Satış Kaynağı', 'Durum', 'Tutar (Vergili)']);

    // Siparişler
    for (const order of this.filteredOrders) {
      aoa.push([
        order.magazaAdi,
        order.orderNo,
        order.siparisTarihi,
        order.musteriAdi || '-',
        order.masaAdi || '-',
        order.satisKaynakAdi || '-',
        order.statu || '-',
        order.toplamVergiliFiyat
      ]);
    }

    return aoa;
  }

  exportAsPDFfromHTML() {
    const element = this.reportContent.nativeElement;
    html2canvas(element, { scale: 2 }).then((canvas: HTMLCanvasElement) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('siparis_listesi.pdf');
    });
  }

}
