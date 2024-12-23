import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector:'app-data-source-panel',
  template:`
    <div>
      <h4>Rapor Kaynağı Seç</h4>
      <ul>
        <li *ngFor="let rpt of availableReports" (click)="selectReport(rpt)">{{rpt.name}}</li>
      </ul>
    </div>
  `
})
export class DataSourcePanelComponent {
  @Input() availableReports:any[] = [];
  @Output() reportSelected = new EventEmitter<string>();

  selectReport(rpt:any) {
    this.reportSelected.emit(rpt.id);
  }
}
