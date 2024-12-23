import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector:'app-field-panel',
  template:`
    <div>
      <h4>Mevcut Alanlar</h4>
      <ul>
        <li *ngFor="let f of availableFields" (click)="selectField(f)">{{f.label}}</li>
      </ul>
    </div>
  `
})
export class FieldPanelComponent {
  @Input() availableFields:any[]=[];
  @Output() fieldSelected=new EventEmitter<any>();

  selectField(field:any) {
    this.fieldSelected.emit(field);
  }
}
