import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ReportService } from 'src/app/service/ReportService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-verimlilik',
  templateUrl: './verimlilik.component.html'
})
export class VerimlilikComponent implements OnInit {
  @ViewChild('reportContent') reportContent!: ElementRef;

  stores: any[] = [];
  selectedStore: string = '';
  startDate: string = '';
  endDate: string = '';
  results: any[] = [];
  isLoading = false;

  // Gruplanmış veri yapısı
  groupedData: { [kategori: string]: { [altKategori: string]: any[] } } = {};

  constructor(private reportService: ReportService) {}

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

  get selectedStoreName(): string {
    const store = this.stores.find(s => s._id === this.selectedStore);
    return store ? store.magazaAdi : '';
  }

  applyFilter() {
    if (!this.selectedStore || !this.startDate || !this.endDate) {
      return;
    }
    this.isLoading = true;

    const body = {
      store: this.selectedStore,
      startDate: this.startDate,
      endDate: this.endDate
    };

    this.reportService.getVerimlilik(body).subscribe(response => {
      this.results = response;
      this.groupByCategoryAndSubcategory();
      this.isLoading = false;
    }, err => {
      console.error(err);
      this.isLoading = false;
    });
  }

  groupByCategoryAndSubcategory() {
    this.groupedData = {};

    for (const item of this.results) {
      const kategori = item.kategori || 'Kategori Yok';
      const altKategori = item.altKategori || 'Alt Kategori Yok';

      if (!this.groupedData[kategori]) {
        this.groupedData[kategori] = {};
      }

      if (!this.groupedData[kategori][altKategori]) {
        this.groupedData[kategori][altKategori] = [];
      }

      this.groupedData[kategori][altKategori].push(item);
    }
  }

  exportToExcel() {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.results);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Verimlilik Raporu');
    XLSX.writeFile(wb, 'verimlilik_raporu.xlsx');
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
      pdf.save('verimlilik_raporu.pdf');
    });
  }
}
