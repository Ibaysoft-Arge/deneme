import { TitleCasePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ReportService } from 'src/app/service/ReportService';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.html',
})
export class AnalyticsComponent {
    getSource(arg0: any,_t191: any) {
        throw new Error('Method not implemented.');
    }
    hasSource(arg0: any,_t191: any): any {
        throw new Error('Method not implemented.');
    }

    store: any;
    revenueChart: any;
    uniqueVisitor: any;
    salesByCategory: any;
    dailySales: any;
    totalOrders: any;
    recentOrders: any;
    dailyStoreRevenues: any;
    totalCiro: any;
    ciroByType: any;
    selectedStore: any[] = [];
    selectedStores: string[] = [];
    stores: any[] = [];  // Mağazaların listesi
    reportType: 'yearly' | 'monthly' | 'range' = 'monthly';
    year: number = new Date().getFullYear();
    startDate: string | null = null;
    endDate: string | null = null;
    isLoading = true;
    storeSourcesData: any[] = []; // Gelen veriyi tutacağımız alan
    distinctKaynaklar: any;

    constructor(
        public storeData: Store<any>,
        private reportService: ReportService,
        private titleCasePipe: TitleCasePipe
    ) {
        this.initStore();
        this.isLoading = false;
        this.setDefaultDates();
    }

    getFoundSource(s: any, k: string) {
        return s.sources?.find((src: any) => src.kaynakAdi === k);
    }

    setDefaultDates() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-based
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0); // Ayın son günü

        this.startDate = start.toISOString().split('T')[0];
        this.endDate = end.toISOString().split('T')[0];
    }

    fetchStoreSources(selectedStoreIds: any): void {
        const body: any = {
            magazaKodlari: selectedStoreIds,
            startDate: this.startDate,
            endDate: this.endDate
        };

        this.reportService.getStoreSources(body).subscribe((res: any) => {
            this.storeSourcesData = res.stores || [];

            const allSources = this.storeSourcesData.flatMap(s => s.sources || []);
            this.distinctKaynaklar = [...new Set(allSources.map(src => src.kaynakAdi))];
        });
    }
    ngOnInit(): void {
        this.fetchReport();
    }

    async initStore() {
        this.storeData
            .select((d) => d.index)
            .subscribe((d) => {
                const hasChangeTheme = this.store?.theme !== d?.theme;
                const hasChangeLayout = this.store?.layout !== d?.layout;
                const hasChangeMenu = this.store?.menu !== d?.menu;
                const hasChangeSidebar = this.store?.sidebar !== d?.sidebar;

                this.store = d;

                if (hasChangeTheme || hasChangeLayout || hasChangeMenu || hasChangeSidebar) {
                    if (this.isLoading || hasChangeTheme) {
                        this.initCharts();
                    } else {
                        setTimeout(() => {
                            this.initCharts();
                        }, 300);
                    }
                }
            });

        this.loadMagazalar();
    }

    loadMagazalar() {
        const storedMagazalar = localStorage.getItem('magazalar');
        if (storedMagazalar) {
            this.stores = JSON.parse(storedMagazalar);
        } else {
            this.stores = [];
        }
    }

    onStoresChange(selected: string[]) {
        this.selectedStores = selected;
        this.fetchReport();
    }

    fetchReport(): void {
        let body: any = {};
        body.reportTypes = [this.reportType];

        if (this.reportType === 'yearly' || this.reportType === 'monthly') {
            body.year = this.year;
        } else if (this.reportType === 'range') {
            body.startDate = this.startDate ? this.startDate.toString() : '2024-01-01';
            body.endDate = this.endDate ? this.endDate.toString() : '2024-12-31';
        }

        let selectedStoreIds = this.selectedStores && this.selectedStores.length > 0
            ? this.selectedStores
            : this.stores.map(store => store._id);

        body.magazaKodlari = selectedStoreIds;

        this.reportService.getRevenueReport(body).subscribe((data) => {
            if (this.reportType === 'range') {
                const dates = data.map((item: any) => {
                    const y = item.year;
                    const m = item.month.toString().padStart(2, '0');
                    const d = item.day.toString().padStart(2, '0');
                    return `${y}-${m}-${d}`;
                });
                const ciroValues = data.map((item: any) => item.toplamCiro);

                if (!this.revenueChart) {
                    this.initCharts();
                }
                this.revenueChart = {
                    ...this.revenueChart,
                    series: [
                        { name: 'Income', data: ciroValues },
                    ],
                    xaxis: {
                        ...this.revenueChart.xaxis,
                        categories: dates
                    }
                };
            } else if (this.reportType === 'yearly') {
                const years = data.map((item: any) => item.year);
                const ciroValues = data.map((item: any) => item.toplamCiro);

                this.revenueChart = {
                    chart: {
                        type: 'line',
                        height: 325
                    },
                    series: [
                        { name: 'Income', data: ciroValues },
                    ],
                    xaxis: {
                        categories: years
                    },
                };
            } else if (this.reportType === 'monthly') {
                const months = data.map((item: any) => `${item.year}-${item.month}`);
                const ciroValues = data.map((item: any) => item.toplamCiro);

                this.revenueChart = {
                    chart: {
                        type: 'line',
                        height: 325
                    },
                    series: [
                        { name: 'Income', data: ciroValues },
                    ],
                    xaxis: {
                        categories: months
                    },
                };
            }

            this.fetchTopProducts(this.reportType, selectedStoreIds, this.year, this.startDate, this.endDate);
            this.fetchDailyComparison();
            this.fetchLastOrderComparison();
            this.fetchDailyStoreRevenue();
            this.fetchStoreSources(selectedStoreIds);
        });

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startDatenew = sevenDaysAgo.toISOString().split('T')[0];
        const endDatenew = now.toISOString().split('T')[0];

        body.startDate = startDatenew ? startDatenew.toString() : '2024-01-01';
        body.endDate = endDatenew ? endDatenew.toString() : '2024-12-31';
        body.reportTypes = ['range'];

        this.reportService.getRevenueReport(body).subscribe((data) => {
            const dates = data.map((item: any) => {
                const y = item.year;
                const m = String(item.month).padStart(2, '0');
                const d = String(item.day).padStart(2, '0');
                return `${y}-${m}-${d}`;
            });

            const ciroValues = data.map((item: any) => item.toplamCiro);

            this.dailySales = {
                ...this.dailySales,
                series: [{ name: 'Daily Sales', data: ciroValues }],
                xaxis: {
                    ...this.dailySales.xaxis,
                    categories: dates
                }
            };
        });
    }

    fetchTopProducts(reportType: 'yearly' | 'monthly' | 'range', magazaKodlari: string[], year?: number, startDate?: string | null, endDate?: string | null): void {
        let body: any = {
            reportTypes: [reportType],
            magazaKodlari: magazaKodlari
        };

        if (reportType === 'yearly' || reportType === 'monthly') {
            body.year = year;
        } else if (reportType === 'range') {
            body.startDate = startDate ? startDate.toString() : '2024-01-01';
            body.endDate = endDate ? endDate.toString() : '2024-12-31';
        }

        this.reportService.getTopProducts({ body }).subscribe((topProducts) => {
            const labels = topProducts.map((p: any) => this.titleCasePipe.transform(p.urunAdi));
            const series = topProducts.map((p: any) => p.toplamSatis);

            this.salesByCategory = {
                ...this.salesByCategory,
                series: series,
                labels: labels
            };
        });
    }

    fetchDailyComparison(): void {
        const magazaKodlari = this.selectedStores && this.selectedStores.length > 0
            ? this.selectedStores
            : this.stores.map(store => store._id);

        this.reportService.getDailyOrdersComparison({ magazaKodlari }).subscribe((response: any) => {
            const { todaysData, lastWeekData } = response;

            const hours = Array.from({ length: 24 }, (_, i) => i);
            const todayValues = hours.map(h => {
                const entry = todaysData.find((d: any) => d._id === h);
                return entry ? entry.totalOrders : 0;
            });
            const lastWeekValues = hours.map(h => {
                const entry = lastWeekData.find((d: any) => d._id === h);
                return entry ? entry.totalOrders : 0;
            });

            this.totalOrders = {
                ...this.totalOrders,
                series: [
                    { name: 'Today', data: todayValues },
                    { name: 'Last Week', data: lastWeekValues }
                ],
                xaxis: {
                    ...this.totalOrders.xaxis,
                    categories: hours.map(h => h.toString().padStart(2, '0') + ':00')
                },
            };
        });
    }

    fetchLastOrderComparison(): void {
        const magazaKodlari = this.selectedStores && this.selectedStores.length > 0
            ? this.selectedStores
            : this.stores.map(store => store._id);

        this.reportService.getLastOrders({ magazaKodlari }).subscribe((response: any) => {
            console.log(response);
            this.recentOrders = response;
        });
    }

    fetchDailyStoreRevenue(): void {
        const magazaKodlari = this.selectedStores && this.selectedStores.length > 0
            ? this.selectedStores
            : this.stores.map(store => store._id);

        this.reportService.getDailyStoreRevenue({ magazaKodlari }).subscribe((response: any) => {
            console.log(response);
            this.dailyStoreRevenues = response.orders;
            this.totalCiro = response.toplamCiro;
            this.ciroByType = response.ciroByType;
        });
    }

    initCharts() {
        const isDark = this.store.theme === 'dark' || this.store.isDarkMode ? true : false;
        const isRtl = this.store.rtlClass === 'rtl' ? true : false;

        this.revenueChart = {
            chart: { type: 'line', height: 325 },
            series: [],
            xaxis: { categories: [] },
            // Aşağıda tüm sayısal değerler için 2 ondalıklı format ekliyoruz
            yaxis: {
                labels: {
                    formatter: (val: number) => val.toFixed(2)
                }
            },
            tooltip: {
                y: {
                    formatter: (val: number) => val.toFixed(2)
                }
            },
            dataLabels: {
                formatter: (val: number) => val.toFixed(2)
            }
        };

        this.salesByCategory = {
            chart: { type: 'donut', height: 460 },
            series: [],
            labels: [],
            yaxis: {
                labels: {
                    formatter: (val: number) => val.toFixed(2)
                }
            },
            tooltip: {
                y: {
                    formatter: (val: number) => val.toFixed(2)
                }
            },
            dataLabels: {
                formatter: (val: number) => val.toFixed(2)
            }
        };

        this.dailySales = {
            chart: { type: 'bar', height: 160 },
            series: [],
            xaxis: { categories: [] },
            yaxis: {
                labels: {
                    formatter: (val: number) => val.toFixed(2)
                }
            },
            tooltip: {
                y: {
                    formatter: (val: number) => val.toFixed(2)
                }
            },
            dataLabels: {
                formatter: (val: number) => val.toFixed(2)
            }
        };

        this.totalOrders = {
            chart: { type: 'bar', height: 360 },
            series: [],
            xaxis: { categories: [] },
            yaxis: {
                labels: {
                    formatter: (val: number) => val.toFixed(2)
                }
            },
            tooltip: {
                y: {
                    formatter: (val: number) => val.toFixed(2)
                }
            },
            dataLabels: {
                formatter: (val: number) => val.toFixed(2)
            }
        };

        // Bu şekilde tüm grafiklerde sayısal değerler 2 ondalık hane ile gösterilecek.
    }
}
