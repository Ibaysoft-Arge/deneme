import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ReportService } from 'src/app/service/ReportService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { NotificationService } from '../../NotificationService';

@Component({
    selector: 'app-daily-end-history',
    templateUrl: './daily-end-history.component.html'
})
export class DailyEndHistoryComponent implements OnInit {
    @ViewChild('reportContent') reportContent!: ElementRef;

    stores: any[] = [];
    selectedStore: string = '';
    startDate: string = '';
    endDate: string = '';
    reports: any[] = [];
    isLoading = false;
    error = '';
    userRole: any;

    constructor(private reportService: ReportService,private notificationService:NotificationService) { }

    ngOnInit(): void {
        this.userRole = localStorage.getItem('role');
        const storedMagazalar = localStorage.getItem('magazalar');
        if (storedMagazalar) {
            this.stores = JSON.parse(storedMagazalar);
        }
        const now = new Date();
        this.startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        this.endDate = now.toISOString().split('T')[0];

        if (this.stores.length > 0) {
            this.selectedStore = this.stores[0]._id;
        }
    }

    getHistory() {
        if (!this.selectedStore) {
            this.error = "Lütfen mağaza seçiniz.";
            return;
        }
        this.isLoading = true;
        this.error = '';
        this.reports = [];
        this.reportService.getDailyEndHistory(this.selectedStore, this.startDate, this.endDate).subscribe({
            next: (res) => {
                this.isLoading = false;
                this.reports = res;
            },
            error: (err) => {
                this.isLoading = false;
                this.error = 'Veri alınırken hata oluştu.';
                console.error(err);
            }
        });
    }

    findStoreName(id: string): string {
        const found = this.stores.find(s => s._id === id);
        return found ? found.magazaAdi : id;
    }

    exportToExcel() {
        const aoa = this.prepareExcelData();
        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(aoa);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'GunSonuRaporGecmisi');
        XLSX.writeFile(wb, 'gun_sonu_rapor_gecmisi.xlsx');
    }

    private prepareExcelData(): any[][] {
        const aoa: any[][] = [];
        // Başlıklar
        aoa.push(['Mağaza', 'Tarih', 'Ödeme Tipi', 'Beklenen', 'Sayılmış', 'Fark']);

        // Raporlar
        for (const report of this.reports) {
            const storeName = this.findStoreName(report.storeId);
            // İlk satırda ilk ödeme tipi sonuçları
            if (report.results && report.results.length > 0) {
                // İlk result
                let firstRow = [
                    storeName,
                    report.date,
                    report.results[0].odemeTipi?.odemeAdi || 'N/A',
                    report.results[0].expectedAmount,
                    report.results[0].countedAmount,
                    report.results[0].difference
                ];
                aoa.push(firstRow);
                // Diğer sonuçlar
                for (let i = 1; i < report.results.length; i++) {
                    const r = report.results[i];
                    aoa.push([
                        '', // Mağaza aynı, boş bırakabiliriz
                        '', // Tarih aynı, boş
                        r.odemeTipi?.odemeAdi || 'N/A',
                        r.expectedAmount,
                        r.countedAmount,
                        r.difference
                    ]);
                }
            } else {
                // Hiç result yoksa bile bir satır atabiliriz
                aoa.push([storeName, report.date, '-', 0, 0, 0]);
            }
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
            pdf.save('gun_sonu_rapor_gecmisi.pdf');
        });
    }

    revertDailyEnd(report: any) {
        if (!confirm(`${report.date} tarihli gün sonunu geri almak istediğinize emin misiniz?`)) return;

        const payload = { storeId: report.storeId, date: report.date };
        this.isLoading = true;
        this.error = '';

        this.reportService.revertDailyEnd(payload).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                this.notificationService.showNotification(res.message || 'Gün sonu geri alındı.', 'success', 'bottom-right');
                // Rapor listesi yenile
                this.getHistory();
            },
            error: (err: any) => {
                this.isLoading = false;
                const errorMessage = err.error?.error || 'İşlem yapılamadı.';
                this.notificationService.showNotification(errorMessage, 'error', 'bottom-right');
            }
        });
    }
}
