import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-alturun-hierarchy',
  template: `
    <li>
      <span>{{ node.urunAdi }}</span>
      <!-- Eğer cikartilanlar varsa onları üstü çizili kırmızı göster -->
      <ul *ngIf="node.cikartilanlar && node.cikartilanlar.length > 0" class="list-disc ml-5 space-y-1">
        <li *ngFor="let c of node.cikartilanlar" class="text-red-500 line-through">{{ c }}</li>
      </ul>

      <!-- Çocukları varsa onları da aynı bileşenle göster -->
      <ul *ngIf="node.children && node.children.length > 0" class="list-disc ml-5 space-y-1">
        <ng-container *ngFor="let child of node.children">
          <app-alturun-hierarchy [node]="child"></app-alturun-hierarchy>
        </ng-container>
      </ul>
    </li>
  `
})
export class AltUrunHierarchyComponent {
  @Input() node: any;
}
