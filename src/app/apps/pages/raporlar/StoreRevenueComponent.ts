// store-revenue.component.ts

import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ReportService } from 'src/app/service/ReportService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-store-revenue',
  templateUrl: './store-revenue.component.html'
})
export class StoreRevenueComponent implements OnInit {
  @ViewChild('reportContent') reportContent!: ElementRef;

  stores: any[] = [];
  selectedStores: string[] = [];
  startDate: string = '';
  endDate: string = '';
  reportData: any = null;
  isLoading = false;

  constructor(private reportService: ReportService) { }

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

  applyFilter() {
    this.isLoading = true;
    const body = {
      magazaKodlari: this.selectedStores,
      startDate: this.startDate,
      endDate: this.endDate
    };

    this.reportService.getStoreRevenue(body).subscribe(response => {
      this.reportData = response;
      // Mağaza adına göre sıralama
      this.reportData.stores.sort((a: any, b: any) => a.magazaAdi.localeCompare(b.magazaAdi));
      this.isLoading = false;
    }, err => {
      console.error(err);
      this.isLoading = false;
    });
  }

  exportToExcel() {
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(this.prepareExcelData());
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rapor');
    XLSX.writeFile(wb, 'magaza_ciro_raporu.xlsx');
  }

  private prepareExcelData(): any[][] {
    const aoa: any[][] = [];
    aoa.push(['Mağaza', 'Tür', 'Fiş Adeti', 'Toplam Vergili Ciro', 'Toplam Vergisiz Ciro', 'Sepet Ort.']);

    if (this.reportData && this.reportData.stores) {
      for (const store of this.reportData.stores) {
        aoa.push([
          store.magazaAdi,
          store.tur,
          store.totalOrders,
          store.totalCiro,
          store.totalTaxFreeCiro,
          store.averageBasket.toFixed(2)
        ]);
      }
      aoa.push([
        'Genel Toplam',
        '-',
        this.reportData.grandTotals.totalOrders,
        this.reportData.grandTotals.totalCiro,
        this.reportData.grandTotals.totalTaxFreeCiro,
        this.reportData.grandTotals.averageBasket.toFixed(2)
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
      pdf.save('magaza_ciro_raporu.pdf');
    });
  }

}
