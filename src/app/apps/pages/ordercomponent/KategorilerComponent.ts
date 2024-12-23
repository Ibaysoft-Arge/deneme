import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-kategoriler',
  templateUrl: './kategoriler.component.html',
})
export class KategorilerComponent {
  @Input() categories: { kategoriId: string; kategoriAdi: string }[] = [];
  @Input() selectedCategory: { kategoriId: string; kategoriAdi: string } | null = null;

  @Output() categorySelected = new EventEmitter<{ kategoriId: string; kategoriAdi: string }>();

  selectCategory(category: { kategoriId: string; kategoriAdi: string }): void {
    this.categorySelected.emit(category);
  }
}
