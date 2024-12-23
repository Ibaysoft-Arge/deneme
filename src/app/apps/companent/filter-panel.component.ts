import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector:'app-filter-panel',
  template:`
    <div>
      <h4>Filtre Paneli</h4>
      <!-- Burada tarih, mağaza vs. filtreler seçilebilir -->
      <p>(Burada filtre ayarları olacak)</p>
    </div>
  `
})
export class FilterPanelComponent {
  @Input() config:any;
  @Output() configChange=new EventEmitter<any>();
}
