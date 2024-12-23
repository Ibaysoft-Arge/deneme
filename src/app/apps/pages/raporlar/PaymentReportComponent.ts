import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ReportService } from 'src/app/service/ReportService';

@Component({
    selector: 'app-payment-report',
    templateUrl: './payment-report.component.html'
})
export class PaymentReportComponent implements OnInit {
    @ViewChild('reportContent') reportContent!: ElementRef;

    stores: any[] = [];
    selectedStores: string[] = [];
    startDate: string = '';
    endDate: string = '';
    paymentData: any[] = [];
    distinctPayments: string[] = [];
    isLoading = false;
    grandTotals: any = {
      totalCiro: 0,
      totalFis: 0,
      averageBasket: 0,
      sources: {}
    };

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

    applyFilter() {
        this.isLoading = true;
        const body: any = {
            magazaKodlari: this.selectedStores,
            startDate: this.startDate,
            endDate: this.endDate
        };

        this.reportService.getPaymentTypeReport(body).subscribe((res: any) => {
            this.paymentData = res.stores || [];

            // Eğer backend `toplamCiro` göndermemişse, payments üzerinden hesaplayalım.
            this.paymentData.forEach((store: any) => {
                if (typeof store.toplamCiro === 'undefined' || store.toplamCiro === null) {
                    let calculatedCiro = 0;
                    let totalFis = 0;
                    if (store.payments && store.payments.length > 0) {
                        store.payments.forEach((p: any) => {
                            calculatedCiro += p.toplamCiro || 0;
                            totalFis += p.fisAdeti || 0;
                        });
                    }
                    store.toplamCiro = calculatedCiro;
                    store.totalFis = store.totalFis || totalFis; // Eğer totalFis de gelmiyorsa hesaplanabilir.
                    // averageBasket veya diğer alanlar da gerekiyorsa benzer şekilde hesaplanabilir.
                }
            });

            this.paymentData.sort((a: any, b: any) => b.toplamCiro - a.toplamCiro);

            const allPayments = this.paymentData.flatMap(s => s.payments || []);
            this.distinctPayments = [...new Set(allPayments.map((p: any) => p.odemeTipiAdi))];

            this.calculateGrandTotals();
            this.isLoading = false;
        }, err => {
            console.error(err);
            this.isLoading = false;
        });
    }

    getFoundPayment(store: any, paymentType: string) {
        if (!store.payments) return null;
        return store.payments.find((p: any) => p.odemeTipiAdi === paymentType);
    }

    calculateGrandTotals() {
      let totalCiro = 0;
      let totalFis = 0;
      let sourcesMap: any = {};

      for (const s of this.paymentData) {
        totalCiro += s.toplamCiro || 0;
        totalFis += s.totalFis || 0;
        for (const p of this.distinctPayments) {
          const found = this.getFoundPayment(s, p);
          if (!sourcesMap[p]) sourcesMap[p] = {toplamCiro:0, fisAdeti:0};
          if (found) {
            sourcesMap[p].toplamCiro += found.toplamCiro;
            sourcesMap[p].fisAdeti += found.fisAdeti;
          }
        }
      }

      const avgBasket = totalFis > 0 ? (totalCiro / totalFis) : 0;

      this.grandTotals = {
        totalCiro: totalCiro,
        totalFis: totalFis,
        averageBasket: avgBasket,
        sources: sourcesMap
      };
    }

    exportToExcel() {
        const aoa: any[][] = [];
        let header1 = ['#', 'Mağaza', 'Toplam Ciro'];
        // Tip, Toplam Fiş, Sepet Ort. gibi sütunlar gerekmediği için kaldırıldı.
        for (const p of this.distinctPayments) {
            header1.push(p, '');
        }

        // İkinci satır başlıklar
        let header2 = ['', '', ''];
        for (const p of this.distinctPayments) {
            header2.push('Ciro', 'Fiş');
        }

        aoa.push(header1);
        aoa.push(header2);

        let rowIndex = 1;
        for (const s of this.paymentData) {
          let row = [
              rowIndex++,
              s.magazaAdi,
              s.toplamCiro
          ];

          for (const p of this.distinctPayments) {
              const found = this.getFoundPayment(s, p);
              if (found) {
                  row.push(found.toplamCiro, found.fisAdeti);
              } else {
                  row.push(0, 0);
              }
          }
          aoa.push(row);
        }

        // Genel toplam satırı
        let totalRow = ['Genel Toplam', '-', this.grandTotals.totalCiro];
        for (const p of this.distinctPayments) {
          const src = this.grandTotals.sources[p] || {toplamCiro:0, fisAdeti:0};
          totalRow.push(src.toplamCiro, src.fisAdeti);
        }
        aoa.push(totalRow);

        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(aoa);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Rapor');
        XLSX.writeFile(wb, 'magaza_odeme_bazli_rapor.xlsx');
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
            pdf.save('magaza_odeme_bazli_rapor.pdf');
        });
    }
}
