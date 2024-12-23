import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ReportService } from 'src/app/service/ReportService';


@Component({
  selector: 'app-daily-end-report',
  templateUrl: './daily-end-report.component.html',
})
export class DailyEndReportComponent implements OnInit {
  stores: any[] = [];
  selectedStore: string = '';
  selectedDate: string = '';
  isLoading: boolean = false;

  expectedResults: {odemeTipiId:string, odemeAdi:string, expectedAmount:number}[] = [];
  countedTotals: { [key: string]: number } = {};

  message: string = '';
  error: string = '';

  constructor(private reportService: ReportService){}

  ngOnInit(): void {
    const storedMagazalar = localStorage.getItem('magazalar');
    if (storedMagazalar) {
      this.stores = JSON.parse(storedMagazalar);
    }

    // Tarih varsayılan olarak bugünün tarihi
    const today = new Date().toISOString().split('T')[0];
    this.selectedDate = today;

    // Eğer tek bir mağaza otomatik seçilecekse (eğer localStorage'da tek bir mağaza varsa):
    if (this.stores.length > 0) {
      this.selectedStore = this.stores[0].verilenmagazakodu; // varsayılan ilk mağaza
    }
  }

  getExpected() {
    if(!this.selectedStore || !this.selectedDate) {
      this.error = 'Lütfen mağaza ve tarih seçiniz.';
      return;
    }
    this.isLoading = true;
    this.message = '';
    this.error = '';
    this.reportService.getDailyEndExpected(this.selectedStore, this.selectedDate).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.expectedResults = res.results || [];
        // countedTotals varsayılan 0 veya beklenenle aynı
        this.countedTotals = {};
        this.expectedResults.forEach(r => {
          this.countedTotals[r.odemeTipiId] = r.expectedAmount;
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'Veri alınırken hata oluştu.';
        console.error(err);
      }
    });
  }

  submitReport() {
    if (this.expectedResults.length === 0) {
      this.error = 'Önce beklenen tutarları getirin.';
      return;
    }
    this.isLoading = true;
    this.error = '';
    this.message = '';
    const payload = {
      date: this.selectedDate,
      storeId: this.selectedStore,
      countedTotals: this.countedTotals
    };
    this.reportService.submitDailyEndReport(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.message = 'Gün sonu raporu başarıyla kaydedildi.';
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'Rapor kaydedilirken hata oluştu.';
        console.error(err);
      }
    });
  }

}
