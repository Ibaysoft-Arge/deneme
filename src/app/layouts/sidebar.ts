import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { slideDownUp } from '../shared/animations';
import { PaketService } from '../service/paket.service';

@Component({
    selector: 'sidebar',
    templateUrl: './sidebar.html',
    animations: [slideDownUp],
})
export class SidebarComponent implements OnInit {
    store: any;
    activeDropdown: string[] = [];
    modulesData: any[] = [];
    modulesDataEk: any[] = [];
    expandedSubModules: string[] = [];
    expandedEkSubModules: string[] = [];
    userRole: any;
    constructor(
        public translate: TranslateService,
        public storeData: Store<any>,
        public router: Router,
        private paketService: PaketService
    ) {
        this.initStore();
    }

    async initStore() {
        this.storeData.select((d) => d.index).subscribe((d) => {
            this.store = d;
        });

        this.userRole = localStorage.getItem('role') || '';
    }

    ngOnInit() {
        this.getSayfalar();
        this.setActiveDropdown(); // Set the active dropdown on init
    }

    setActiveDropdown() {
        const selector = document.querySelector('.sidebar ul a[routerLink="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelector('.nav-link') || [];
                if (ele.length) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele.click();
                    });
                }
            }
        }
    }

    getSayfalar() {
        this.paketService.getSayfalarUser().subscribe(
            (response) => {
                this.modulesData = response.moduller || [];
                this.modulesDataEk = response.ekModuller || [];
            },
            (error) => {
                console.error('Sayfalar alınamadı:', error);
            }
        );
    }

    toggleMobileMenu() {
        if (window.innerWidth < 1024) {
            this.storeData.dispatch({ type: 'toggleSidebar' });
        }
    }

    toggleAccordion(id: string) {
        // Update active dropdown
        const index = this.activeDropdown.indexOf(id);
        if (index === -1) {
            this.activeDropdown.push(id); // Add to active dropdown
        } else {
            this.activeDropdown.splice(index, 1); // Remove from active dropdown
        }

        // Manage expanded submodules
        const expandedIndex = this.expandedSubModules.indexOf(id);
        if (expandedIndex === -1) {
            this.expandedSubModules.push(id);
        } else {
            this.expandedSubModules.splice(expandedIndex, 1);
        }
    }

    toggleEkAccordion(id: string) {
        const index = this.expandedEkSubModules.indexOf(id);
        if (index === -1) {
            this.expandedEkSubModules.push(id);
        } else {
            this.expandedEkSubModules.splice(index, 1);
        }
    }
}
