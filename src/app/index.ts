import { Component, OnInit } from '@angular/core';
import { ReportService } from './service/ReportService';

@Component({
    selector: 'app-index',
    templateUrl: './index.html'
})
export class IndexComponent implements OnInit {
    selectedDate: string | null = null;
    selectedStores: string[] = [];
    stores: any[] = [];
    dailyStoreRevenues: any;
    totalCiro: any;
    ciroByType: any;
    sourceOrders: any[] = [];
    isLoadingSource = false;
    isLoading = false;
    odbData: any = null;
    hourlyData: any[] = [];
    isLoadingHourly = false;
    idealCost = 43; // Sabit ideal maliyet yüzdesi

    orderCountChart: any = {
        chart: {
            type: 'donut'
        },
        dataLabels: {
            enabled: true,
            formatter: (val: number) => val.toFixed(1) + '%'
        },
        tooltip: {
            y: {
                formatter: (val: number) => {
                    // Bu sipariş adeti ham değer. Apex val zaten ham değer verir.
                    return val + ' adet';
                }
            }
        },
        series: [],
        labels: [],
        legend: {
            show: true,
            position: 'bottom',
            fontSize: '10px',
            horizontalAlign: 'center',
            floating: false,
            labels: { colors: ['#333'] },
            onItemClick: { toggleDataSeries: true }
        },
        colors: ['#1E88E5','#D81B60','#00897B','#F4511E','#7B1FA2','#E91E63','#FFC107','#4CAF50','#90CAF9','#FFAB91','#CE93D8','#FFD54F','#A5D6A7','#FFF59D','#FFCCBC','#D1C4E9','#B39DDB','#9FA8DA','#80CBC4','#C5E1A5']
    };

    totalTaxFreeChart: any = {
        chart: {
            type: 'donut'
        },
        dataLabels: {
            enabled: true,
            formatter: (val: number) => val.toFixed(1) + '%'
        },
        tooltip: {
            y: {
                formatter: (val: number) => {
                    // Ciroyu TL olarak göster.
                    return val.toFixed(2) + ' TL';
                }
            }
        },
        series: [],
        labels: [],
        legend: {
            show: true,
            position: 'bottom',
            fontSize: '10px',
            horizontalAlign: 'center',
            floating: false,
            labels: { colors: ['#333'] },
            onItemClick: { toggleDataSeries: true }
        },
        colors: ['#1E88E5','#D81B60','#00897B','#F4511E','#7B1FA2','#E91E63','#FFC107','#4CAF50','#90CAF9','#FFAB91','#CE93D8','#FFD54F','#A5D6A7','#FFF59D','#FFCCBC','#D1C4E9','#B39DDB','#9FA8DA','#80CBC4','#C5E1A5']
    };

    hourlyOrdersChart: any = {
        chart: {
            type: 'bar',
            height: 200
        },
        xaxis: {
            categories: [] as string[]
        },
        series: [
            {
                name: 'Sipariş',
                data: [] as number[]
            }
        ]
    };

    hourlyRevenueChart: any = {
        chart: {
            type: 'line',
            height: 200
        },
        xaxis: {
            categories: [] as string[]
        },
        series: [
            {
                name: 'Ciro',
                data: [] as number[]
            }
        ],
        tooltip: {
            y: {
                formatter: (val:number) => val.toFixed(2) + ' TL'
            }
        }
    };

    constructor(private reportService: ReportService) {
        const today = new Date();
        this.selectedDate = today.toISOString().split('T')[0];
        this.loadMagazalar();
    }

    ngOnInit(): void {}

    loadMagazalar() {
        const storedMagazalar = localStorage.getItem('magazalar');
        if (storedMagazalar) {
            this.stores = JSON.parse(storedMagazalar);
            this.fetchOdbData();
        } else {
            this.stores = [];
        }
    }

    fetchOdbData() {
        if (!this.selectedDate) {
            alert('Please select a date.');
            return;
        }

        this.isLoading = true;
        this.odbData = null;

        const selectedStoreIds = this.selectedStores && this.selectedStores.length > 0
            ? this.selectedStores
            : this.stores.map(s => s._id);

        const body = {
            date: this.selectedDate,
            storeId: selectedStoreIds
        };

        this.reportService.getOdbData(body).subscribe({
            next: (data: any) => {
                this.isLoading = false;
                this.odbData = data;
                this.fetchSourceOrders();
                this.fetchHourlyData();
                this.fetchDailyStoreRevenue();
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
                this.odbData = null;
                alert('Error fetching ODB data');
            }
        });
    }

    fetchSourceOrders() {
        this.isLoadingSource = true;
        const selectedStoreIds = this.selectedStores && this.selectedStores.length > 0
            ? this.selectedStores
            : this.stores.map(s => s._id);
        const body = {
            date: this.selectedDate,
            magazaKodlari: selectedStoreIds
        };
        this.reportService.getSourceOrders(body).subscribe({
            next: (data) => {
                this.isLoadingSource = false;
                this.sourceOrders = data || [];
                this.updatePieCharts();
            },
            error: (err) => {
                console.error(err);
                this.isLoadingSource = false;
                this.sourceOrders = [];
            }
        });
    }

    fetchDailyStoreRevenue(): void {
        const selectedStoreIds = this.selectedStores && this.selectedStores.length > 0
            ? this.selectedStores
            : this.stores.map(s => s._id);

        const body = {
            date: this.selectedDate,
            magazaKodlari:selectedStoreIds
        };

        this.reportService.getDailyStoreRevenueDate(body).subscribe((response: any) => {
            this.dailyStoreRevenues = response.orders;
            this.totalCiro = response.toplamCiro;
            this.ciroByType = response.ciroByType;
        });
    }

    updatePieCharts() {
        const labels = this.sourceOrders.map(s => s.kaynakAdi || 'N/A');
        const orderCounts = this.sourceOrders.map(s => s.orderCount);
        const taxFreeValues = this.sourceOrders.map(s => s.totalTaxFree);

        // Series'e ham değerleri ver
        this.orderCountChart.labels = labels;
        this.orderCountChart.series = orderCounts;

        this.totalTaxFreeChart.labels = labels;
        this.totalTaxFreeChart.series = taxFreeValues;
    }

    fetchHourlyData() {
        this.isLoadingHourly = true;
        const selectedStoreIds = this.selectedStores && this.selectedStores.length > 0 ? this.selectedStores : this.stores.map(s => s._id);
        const body = {
            date: this.selectedDate,
            magazaKodlari: selectedStoreIds
        };

        this.reportService.getHourlyData(body).subscribe({
            next: (data: any[]) => {
                this.isLoadingHourly = false;
                // Filtrele: Sıfır değerli saatleri gösterme
                this.hourlyData = data.filter(d => d.orders > 0 || d.revenue > 0);
                this.updateHourlyCharts();
            },
            error: (err) => {
                console.error(err);
                this.isLoadingHourly = false;
                this.hourlyData = [];
            }
        });
    }

    updateHourlyCharts() {
        const hours = this.hourlyData.map(d => d.hour.toString().padStart(2,'0') + ':00');
        const orders = this.hourlyData.map(d => d.orders);
        const revenue = this.hourlyData.map(d => d.revenue);

        this.hourlyOrdersChart.xaxis.categories = hours;
        this.hourlyOrdersChart.series = [{
            name: 'Sipariş',
            data: orders
        }];

        this.hourlyRevenueChart.xaxis.categories = hours;
        this.hourlyRevenueChart.series = [{
            name: 'Ciro',
            data: revenue
        }];
    }
}
