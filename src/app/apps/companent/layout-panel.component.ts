import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector:'app-layout-panel',
  template:`
    <div>
      <h4>Yerleşim Paneli</h4>
      <p>Seçili alanlar: {{ printFieldsLabels(config.fields) }}</p>

      <!-- Gerçek kullanımda drag&drop ile sıralama veya kolon ekleme yapılır -->
    </div>
  `
})
export class LayoutPanelComponent {
  @Input() config:any;
  @Output() configChange=new EventEmitter<any>();

  printFieldsLabels(fields: any[]): string {
    return fields?.map((f:any) => f.label).join(', ') || '';
  }
}
