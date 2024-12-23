import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-report-table',
  template: `
    <table class="table-auto w-full text-sm border-collapse">
      <thead>
        <tr class="border-b">
          <th *ngFor="let f of fields" class="p-2 text-left">{{f.label}}</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let row of data" class="border-b hover:bg-gray-100">
          <td *ngFor="let f of fields" class="p-2">{{row[f.key]}}</td>
        </tr>
      </tbody>
    </table>
  `
})
export class ReportTableComponent {
  @Input() data:any[]=[];
  @Input() fields: {key:string; label:string}[] = [];
}
