import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ReportService } from 'src/app/service/ReportService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import GLightbox from 'glightbox';

@Component({
    selector: 'app-product-sales',
    templateUrl: './product-sales.component.html'
})
export class ProductSalesComponent implements OnInit,AfterViewInit {
    @ViewChild('reportContent') reportContent!: ElementRef;

    stores: any[] = [];
    selectedStores: string[] = [];
    startDate: string = '';
    endDate: string = '';
    reportData: any = null;
    isLoading = false;

    excludedAltNames: string[] = [];
    distinctAltNames: string[] = [];
    showFilterModal = false;
    filterSelection: string[] = [];

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

        // localStorage'dan filtre bilgi yükle
        const storedFilter = localStorage.getItem('excludedAltNames');
        if (storedFilter) {
            this.excludedAltNames = JSON.parse(storedFilter);
        } else {
            this.excludedAltNames = [];
        }
    }

    applyFilter() {
        this.isLoading = true;
        const body = {
          magazaKodlari: this.selectedStores,
          startDate: this.startDate,
          endDate: this.endDate
        };

        this.reportService.getStoreProductSales(body).subscribe(response => {
          this.reportData = response;

          // Filtre uygula
          this.applyAltFilter();

          // Mağaza ve ürün sıralama
          this.reportData.stores.sort((a: any, b: any) => a.magazaAdi.localeCompare(b.magazaAdi));
          for (const store of this.reportData.stores) {
            store.products.sort((a: any, b: any) => a.urunAdi.localeCompare(b.urunAdi));
          }

          // Alt ürün isimlerini topla
          this.collectDistinctAltNames();

          this.isLoading = false;
        }, err => {
          console.error(err);
          this.isLoading = false;
        });
    }

    applyAltFilter() {
        if (!this.reportData || !this.reportData.stores) return;
        for (const store of this.reportData.stores) {
          for (const product of store.products) {
            if (product.altUrunler && product.altUrunler.length > 0) {
              product.altUrunler = product.altUrunler.filter((a: any) => !this.excludedAltNames.includes(a.altUrunAdi));
            }
          }
        }
    }

    saveFilterToLocal() {
        localStorage.setItem('excludedAltNames', JSON.stringify(this.excludedAltNames));
    }

    collectDistinctAltNames() {
        const altNamesSet = new Set<string>();
        if (this.reportData && this.reportData.stores) {
            for (const s of this.reportData.stores) {
                for (const p of s.products) {
                    if (p.altUrunler && p.altUrunler.length > 0) {
                        for (const alt of p.altUrunler) {
                            altNamesSet.add(alt.altUrunAdi);
                        }
                    }
                }
            }
        }
        this.distinctAltNames = Array.from(altNamesSet).sort();
    }

    getFilteredAltUrunler(altUrunler: any[]): any[] {
        if (!altUrunler) return [];
        return altUrunler.filter(a => !this.excludedAltNames.includes(a.altUrunAdi));
    }

    exportToExcel() {
        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(this.prepareExcelData());
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Rapor');
        XLSX.writeFile(wb, 'urun_satis_raporu.xlsx');
    }

    private prepareExcelData(): any[][] {
        const aoa: any[][] = [];
        aoa.push(['Mağaza', 'Ürün Adı', 'Toplam Miktar', 'Toplam Ciro', 'Taban Ciro', 'Alt Ürün', 'Alt Miktar', 'Alt Ciro']);

        if (this.reportData && this.reportData.stores) {
          for (const store of this.reportData.stores) {
            for (const product of store.products) {
              const filteredAlt = this.getFilteredAltUrunler(product.altUrunler);
              if (filteredAlt && filteredAlt.length > 0) {
                let first = true;
                for (const alt of filteredAlt) {
                  if (first) {
                    aoa.push([
                      store.magazaAdi,
                      product.urunAdi,
                      product.toplamMiktar,
                      product.toplamCiro,
                      product.toplamCiroBase ?? '-',
                      alt.altUrunAdi,
                      alt.altMiktar,
                      alt.altCiro
                    ]);
                    first = false;
                  } else {
                    aoa.push([
                      '',
                      '',
                      '',
                      '',
                      '',
                      alt.altUrunAdi,
                      alt.altMiktar,
                      alt.altCiro
                    ]);
                  }
                }
              } else {
                aoa.push([
                  store.magazaAdi,
                  product.urunAdi,
                  product.toplamMiktar,
                  product.toplamCiro,
                  product.toplamCiroBase ?? '-',
                  '-', '-', '-'
                ]);
              }
            }
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
            pdf.save('rapor.pdf');
        });
    }

    openFilterModal() {
        // Filtre modalini açmadan önce distinctAltNames hesaplandığından emin olun.
        // Eğer applyFilter çağrılıp veri gelmemişse distinctAltNames boş olabilir, bu normal.
        this.filterSelection = [...this.excludedAltNames];
        this.showFilterModal = true;
    }

    closeFilterModal(applyChanges: boolean) {
        if (applyChanges) {
            this.excludedAltNames = [...this.filterSelection];
            this.saveFilterToLocal();
            this.applyAltFilter(); // Mevcut veri üzerinde filtreyi uygula
        }
        this.showFilterModal = false;
    }

    ngAfterViewInit(): void {
      const lightbox = GLightbox({
          selector: '.glightbox' // Replace with your selector as needed
      });
  }
}
