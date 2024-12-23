import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { toggleAnimation } from 'src/app/shared/animations';
import { ReportService } from 'src/app/service/ReportService'; // Backend service

@Component({
    templateUrl: './finance.html',
    animations: [toggleAnimation],
})
export class FinanceComponent implements OnInit {
    store: any;
    isLoading = false;

    // Filtreler
    periodType: 'daily' | 'monthly' = 'daily'; // daily veya monthly
    selectedDate: string | null = null;
    startDate: string | null = null;
    endDate: string | null = null;
    stores: any[] = [];
    selectedStores: string[] = [];

    storeRevenues: any[] = [];
    toplamCiro: number = 0;

    maxCiroStore: any;
    minCiroStore: any;

    ciroChart: any = {
        chart: {
            type: 'donut'
        },
        colors: ['#1E88E5','#D81B60','#00897B','#F4511E','#7B1FA2','#E91E63','#FFC107','#4CAF50'],
        dataLabels: {
          enabled: true,
          formatter: (val: number) => {
            return val.toFixed(1) + '%';
          }
        },
        legend: {
          show: true,
          position: 'bottom',
          fontSize: '10px',
          horizontalAlign: 'center',
          floating: false,
          labels: { colors: ['#333'] },
          onItemClick: { toggleDataSeries: true }
        },
        series: [],
        labels: []
    };

    constructor(
        private storeData: Store<any>,
        private reportService: ReportService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        const today = new Date();
        this.selectedDate = today.toISOString().split('T')[0];
        this.loadMagazalar();
    }

    loadMagazalar() {
        const storedMagazalar = localStorage.getItem('magazalar');
        if (storedMagazalar) {
            this.stores = JSON.parse(storedMagazalar);
            this.fetchData();
        } else {
            this.stores = [];
        }
    }


    onPeriodTypeChange(newVal: 'daily' | 'monthly') {
        this.periodType = newVal;
        if (this.periodType === 'monthly') {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            this.startDate = firstDay.toISOString().split('T')[0];
            this.endDate = lastDay.toISOString().split('T')[0];
        }
        this.fetchData();
    }
    fetchData() {
        if (this.periodType === 'daily' && !this.selectedDate) {
            alert('Lütfen tarih seçiniz.');
            return;
        }
        if (this.periodType === 'monthly' && (!this.startDate || !this.endDate)) {
            alert('Lütfen başlangıç ve bitiş tarihi seçiniz.');
            return;
        }

        this.isLoading = true;
        this.storeRevenues = [];
        this.toplamCiro = 0;

        const selectedStoreIds = this.selectedStores && this.selectedStores.length > 0
            ? this.selectedStores
            : this.stores.map(s => s._id);

        const body: any = {
            periodType: this.periodType,
            magazaKodlari: selectedStoreIds
        };

        if (this.periodType === 'daily') {
            body.date = this.selectedDate;
        } else {
            body.startDate = this.startDate;
            body.endDate = this.endDate;
        }

        let observable$;
        if (this.periodType === 'daily') {
            observable$ = this.reportService.getDailyStoreRevenueDateOdeme(body);
        } else {
            observable$ = this.reportService.getMonthlyStoreRevenue(body);
        }

        observable$.subscribe({
            next: (response: any) => {
                this.isLoading = false;

                // Gelen veri yapısı: response.results ve response.toplamCiro
                this.storeRevenues = response.results || [];
                this.toplamCiro = response.toplamCiro || 0;

                if (this.storeRevenues.length > 0) {
                    this.maxCiroStore = this.storeRevenues.reduce((prev, curr) => curr.toplamCiro > prev.toplamCiro ? curr : prev);
                    this.minCiroStore = this.storeRevenues.reduce((prev, curr) => curr.toplamCiro < prev.toplamCiro ? curr : prev);
                }

                // Grafik için label ve series oluştur
                const labels = this.storeRevenues.map(item => item.odemeTipiBilgi?.odemeAdi || 'N/A');
                const values = this.storeRevenues.map(item => item.toplamCiro);

                this.ciroChart.labels = labels;
                this.ciroChart.series = values;

                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
                alert('Veri çekilirken hata oluştu.');
            }
        });
    }
}
