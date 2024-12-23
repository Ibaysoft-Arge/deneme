import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ReportService } from 'src/app/service/ReportService';
import { SkuService } from 'src/app/service/sku.service';


@Component({
  selector: 'app-stock-movements',
  templateUrl: './stock-movements.component.html'
})
export class StockMovementsComponent implements OnInit {
  @ViewChild('reportContent') reportContent!: ElementRef;

  stores: any[] = [];
  selectedStore: string = '';
  startDate: string = '';
  endDate: string = '';
  skuList: any[] = [];
  selectedSKU: any = null; // { skuKod: '...', urunAdi: '...' }
  reportData: any = null;
  isLoading = false;
  error = '';

  constructor(private reportService: ReportService,
              private skuService: SkuService) { }

  ngOnInit() {
    const storedMagazalar = localStorage.getItem('magazalar');
    if (storedMagazalar) {
      this.stores = JSON.parse(storedMagazalar);
    }

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.startDate = firstDay.toISOString().split('T')[0];
    this.endDate = lastDay.toISOString().split('T')[0];
  }

  // SKU arama fonksiyonu
  searchSKU(term: string) {
    if (!term) return;
    console.log("Arama terimi:", term);
    this.skuService.searchSkus(term).subscribe(data => {
      this.skuList = data;
    });
  }

  applyFilter() {
    console.log(this.selectedSKU);
    if (!this.selectedSKU || !this.startDate || !this.endDate) {
      this.error = "Lütfen SKU ve tarih aralığı seçiniz.";
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.reportData = null;

    // Burada skuCode olarak selectedSKU.skuKod'u gönderiyoruz.
    const params = {
        skuId: this.selectedSKU,
      startDate: this.startDate,
      endDate: this.endDate
    };

    this.reportService.getStockMovements(params).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.reportData = res;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'Veri alınırken hata oluştu.';
        console.error(err);
      }
    });
  }

  exportToExcel() {
    const aoa: any[][] = [];
    aoa.push(['Tarih', 'Evrak Tipi', 'Stok Adı', 'Giriş', 'Çıkış', 'Meblağ']);

    if (this.reportData && this.reportData.results) {
      for (const r of this.reportData.results) {
        aoa.push([
          r.tarihNew ? new Date(r.tarihNew).toLocaleString() : '',
          r.evrakTipName || '',
          r.stokName || '',
          r.giris || 0,
          r.cikis || 0,
          r.meblag || 0
        ]);
      }
      aoa.push(['Genel Toplam', '', '', this.reportData.totals.totalGiris, this.reportData.totals.totalCikis, this.reportData.totals.totalMeblag]);
    }

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(aoa);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rapor');
    XLSX.writeFile(wb, 'stok_hareketleri_raporu.xlsx');
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
      pdf.save('stok_hareketleri_raporu.pdf');
    });
  }
}
