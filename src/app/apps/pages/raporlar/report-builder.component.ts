import { Component, OnInit } from '@angular/core';
import { ReportService } from 'src/app/service/ReportService';

@Component({
  selector: 'app-report-builder',
  templateUrl: './report-builder.component.html',
})
export class ReportBuilderComponent implements OnInit {
  availableReports = [
    {key:'productSales', label:'Ürün Satış Raporu'},
    {key:'storeRevenue', label:'Mağaza Ciro Raporu'},
    // ... diğer rapor tipleri
  ];
  availableFields: {key:string; label:string}[] = [];
  stores:any[] = [];
  selectedReportType: string|null = null;
  selectedStores: string[] = [];
  config: any = {
    reportType:'',
    fields: [],
    filters: {},
    layout: {}
  };
  reportData: any;

  constructor(private reportService: ReportService) {}

  ngOnInit() {
    const storedMagazalar = localStorage.getItem('magazalar');
    if (storedMagazalar) {
        this.stores = JSON.parse(storedMagazalar);
    }

    const savedConfig = localStorage.getItem('reportConfig');
    if (savedConfig) {
      this.config = JSON.parse(savedConfig);
    }
  }

  onReportSelected(reportType: string) {
    this.selectedReportType = reportType;
    this.config.reportType = reportType;
    this.reportService.getReportDefinition(reportType).subscribe(def => {
      this.availableFields = def.fields;
    });
  }

  onStoreChange() {
    this.config.filters = this.config.filters || {};
    this.config.filters.magazaKodlari = this.selectedStores;
  }

  onFieldSelected(field:any) {
    if (!this.config.fields.find((f:any)=>f.key===field.key)) {
      this.config.fields.push(field);
      this.saveReport();
    }
  }

  removeField(field:any) {
    const index = this.config.fields.findIndex((f:any) => f.key === field.key);
    if (index !== -1) {
      this.config.fields.splice(index, 1);
      this.saveReport();
    }
  }

  runReport() {
    this.reportService.runReport(this.config).subscribe(data=>{
      this.reportData = data;
    });
  }

  saveReport() {
    localStorage.setItem('reportConfig', JSON.stringify(this.config));
  }

  printFieldsLabels(fields: any[] | null | undefined): string {
    if (!fields || fields.length === 0) return '';
    return fields.map(f => f.label).join(', ');
  }
}
