import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ReportService } from 'src/app/service/ReportService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
    selector: 'app-hourly-sales-by-store',
    templateUrl: './hourly-sales-by-store.component.html'
})
export class HourlySalesByStoreComponent implements OnInit {
    @ViewChild('reportContent') reportContent!: ElementRef;

    stores: any[] = [];
    selectedStores: string[] = [];
    startDate: string = '';
    endDate: string = '';
    reportData: any = null;
    isLoading = false;

    hoursArray = Array.from({length:24}, (_,i)=>i); // 0-23

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

        this.reportService.getHourlySalesByStore(body).subscribe((res: any) => {
            this.reportData = res;
            this.isLoading = false;
        }, err => {
            console.error(err);
            this.isLoading = false;
        });
    }

    getHourData(store:any, hour:number) {
        return store.data.find((d:any)=>d.hour===hour);
    }

    getStoreTotals(store:any) {
        let totalCiro=0, totalCount=0;
        for (let hData of store.data) {
            totalCiro += hData.totalCiro;
            totalCount += hData.count;
        }
        let avgBasket = totalCount>0?(totalCiro/totalCount):0;
        return {totalCiro, count:totalCount, avgBasket};
    }

    getGrandHourData(hour:number) {
        if (!this.reportData.grandTotals.hours) return null;
        return this.reportData.grandTotals.hours.find((h:any)=>h.hour===hour);
    }

    exportToExcel() {
      const aoa: any[][] = [];
      aoa.push(['Mağaza','Saat','Ciro','Fiş','Sepet Ort.']);

      if (this.reportData && this.reportData.stores) {
        for (const store of this.reportData.stores) {
          for (const d of store.data) {
            aoa.push([store.magazaAdi, d.hour+":00", d.totalCiro, d.count, d.avgBasket]);
          }
          const st = this.getStoreTotals(store);
          aoa.push([store.magazaAdi, 'Genel', st.totalCiro, st.count, st.avgBasket]);
        }

        for (const gh of this.reportData.grandTotals.hours) {
          aoa.push(['Genel', gh.hour+":00", gh.totalCiro, gh.count, gh.avgBasket]);
        }

        aoa.push(['Genel','TOPLAM', this.reportData.grandTotals.overallCiro, this.reportData.grandTotals.overallCount, this.reportData.grandTotals.overallAvgBasket]);
      }

      const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(aoa);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rapor');
      XLSX.writeFile(wb, 'saatlik_satis_magaza_bazli_raporu.xlsx');
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
            pdf.save('saatlik_satis_magaza_bazli_raporu.pdf');
        });
    }
}
