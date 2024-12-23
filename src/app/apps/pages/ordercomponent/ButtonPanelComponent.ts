import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-button-panel',
    templateUrl: './button-panel.component.html',
})
export class ButtonPanelComponent {
    @Input() source!: string;
    @Input() id!: string;
    @Input() cluster!: string;
    @Input() store!: string;
    @Input() siparisListesi!: string;
    @Output() customerOrderWindowRequested = new EventEmitter<void>();
    @Output() hesapFisiRequest = new EventEmitter<void>();
    @Output() kuponRequest = new EventEmitter<void>();
    constructor(private router: Router) { }
    get useSecondScreen(): boolean {
        return localStorage.getItem('useSecondScreen') === 'true';
    }
    navigateBack(): void {

        //console.log('siparisListesi', this.siparisListesi);
        if (this.siparisListesi) {
           // console.log('siparisListesi2', this.siparisListesi);
            this.router.navigate([`/apps/siparisList`], {
                queryParams: {
                    source: this.source,
                    id: this.id,
                    cluster: this.cluster,
                    store: this.store
                }
            });
        }
        else{


        this.router.navigate([`/apps/${this.source}`], {
            queryParams: {
                source: this.source,
                id: this.id,
                cluster: this.cluster,
                store: this.store
            }
        });
    }
    }

    onOpenCustomerOrderWindow() {
        this.customerOrderWindowRequested.emit();
    }

    onHesapFisiRequest() {
        this.hesapFisiRequest.emit();
    }

    onKuponRequest() {
        this.kuponRequest.emit();
    }
    // Diğer buton işlevleri...
}
