import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ReportService } from 'src/app/service/ReportService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
    selector: 'app-store-source-report',
    templateUrl: './store-source-report.component.html'
})
export class StoreSourceReportComponent implements OnInit {
    @ViewChild('reportContent') reportContent!: ElementRef;

    stores: any[] = [];
    selectedStores: string[] = [];
    startDate: string = '';
    endDate: string = '';
    storeSourcesData: any[] = [];
    distinctKaynaklar: string[] = [];
    isLoading = false;
    grandTotals: any = {
      totalCiro: 0,
      totalFis: 0,
      averageBasket: 0,
      sources: {}
    };
    tipGroups: any[] = []; // tip bazlı gruplar

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
        const body: any = {
            magazaKodlari: this.selectedStores,
            startDate: this.startDate,
            endDate: this.endDate
        };

        this.reportService.getStoreSources(body).subscribe((res: any) => {
            this.storeSourcesData = res.stores || [];
            // Sıralama: toplamCiro desc
            this.storeSourcesData.sort((a: any, b: any) => b.toplamCiro - a.toplamCiro);

            const allSources = this.storeSourcesData.flatMap(s => s.sources || []);
            this.distinctKaynaklar = [...new Set(allSources.map(src => src.kaynakAdi))];

            this.calculateGrandTotals();
            this.groupByTip();
            this.isLoading = false;
        }, err => {
            console.error(err);
            this.isLoading = false;
        });
    }

    getFoundSource(store: any, kaynakAdi: string) {
        if (!store.sources) return null;
        return store.sources.find((src: any) => src.kaynakAdi === kaynakAdi);
    }

    calculateGrandTotals() {
      let totalCiro = 0;
      let totalFis = 0;
      let sourcesMap: any = {};

      for (const s of this.storeSourcesData) {
        totalCiro += s.toplamCiro;
        totalFis += s.toplamFis;
        for (const k of this.distinctKaynaklar) {
          const found = this.getFoundSource(s, k);
          if (!sourcesMap[k]) sourcesMap[k] = {toplamCiro:0, fisAdeti:0};
          if (found) {
            sourcesMap[k].toplamCiro += found.toplamCiro;
            sourcesMap[k].fisAdeti += found.fisAdeti;
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

    groupByTip() {
      const groupsMap: any = {};
      for (const s of this.storeSourcesData) {
        const t = s.tip || 'Belirsiz';
        if (!groupsMap[t]) groupsMap[t] = [];
        groupsMap[t].push(s);
      }

      this.tipGroups = [];
      for (const tip in groupsMap) {
        const data = groupsMap[tip];
        const subtotal = this.calculateSubTotals(data);
        this.tipGroups.push({ tip, data, subtotal });
      }
    }

    calculateSubTotals(data: any[]) {
      let totalCiro = 0;
      let totalFis = 0;
      let sourcesMap: any = {};

      for (const s of data) {
        totalCiro += s.toplamCiro;
        totalFis += s.toplamFis;

        for (const k of this.distinctKaynaklar) {
          const found = this.getFoundSource(s, k);
          if (!sourcesMap[k]) sourcesMap[k] = {toplamCiro:0, fisAdeti:0};
          if (found) {
            sourcesMap[k].toplamCiro += found.toplamCiro;
            sourcesMap[k].fisAdeti += found.fisAdeti;
          }
        }
      }

      const avgBasket = totalFis > 0 ? (totalCiro / totalFis) : 0;

      return {
        totalCiro: totalCiro,
        totalFis: totalFis,
        averageBasket: avgBasket,
        sources: sourcesMap
      };
    }

    getTipRowClass(tip: string) {
      // Burada tip'e göre farklı renkler verilebilir.
      // Örneğin tip=="masa" ise yeşil arka plan, paket ise kırmızı arka plan.
      if (tip === 'masa') return 'bg-green-100';
      if (tip === 'paket') return 'bg-red-100';
      return 'bg-blue-100';
    }

    exportToExcel() {
        const aoa: any[][] = [];

        // Başlıklar
        let header1 = ['#', 'Mağaza', 'Tip', 'Toplam Ciro', 'Toplam Fiş', 'Sepet Ort.'];
        for (const k of this.distinctKaynaklar) {
            header1.push(k, '');
        }
        let header2 = ['', '', '', '', '', ''];
        for (const k of this.distinctKaynaklar) {
            header2.push('Ciro', 'Fiş');
        }

        aoa.push(header1);
        aoa.push(header2);

        let rowIndex = 1;
        for (const group of this.tipGroups) {
          // Grupların verileri
          for (const s of group.data) {
            let row = [
                rowIndex++,
                s.magazaAdi,
                s.tip,
                s.toplamCiro,
                s.toplamFis,
                s.sepetOrt
            ];

            for (const k of this.distinctKaynaklar) {
                const found = this.getFoundSource(s, k);
                if (found) {
                    row.push(found.toplamCiro, found.fisAdeti);
                } else {
                    row.push(0, 0);
                }
            }
            aoa.push(row);
          }

          // Alt toplam satırı
          let subtotalRow = ['Alt Toplam ('+group.tip+')', '-', group.tip, group.subtotal.totalCiro, group.subtotal.totalFis, group.subtotal.averageBasket];
          for (const k of this.distinctKaynaklar) {
            const src = group.subtotal.sources[k] || {toplamCiro:0, fisAdeti:0};
            subtotalRow.push(src.toplamCiro, src.fisAdeti);
          }
          aoa.push(subtotalRow);
        }

        // Genel toplam satırı
        let totalRow = ['Genel Toplam', '-', '-', this.grandTotals.totalCiro, this.grandTotals.totalFis, this.grandTotals.averageBasket];
        for (const k of this.distinctKaynaklar) {
          const src = this.grandTotals.sources[k] || {toplamCiro:0, fisAdeti:0};
          totalRow.push(src.toplamCiro, src.fisAdeti);
        }
        aoa.push(totalRow);

        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(aoa);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Rapor');
        XLSX.writeFile(wb, 'magaza_kaynak_bazli_rapor.xlsx');
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
            pdf.save('magaza_kaynak_bazli_rapor.pdf');
        });
    }
}
