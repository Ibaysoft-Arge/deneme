import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
})
export class AppComponent {
    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private titleService: Title,
        private translate: TranslateService,
    ) {
        this.translate.setDefaultLang('en');
        this.router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                map(() => this.activatedRoute),
                map((route) => {
                    while (route.firstChild) route = route.firstChild;
                    return route;
                }),
                filter((route) => route.outlet === 'primary'),
                switchMap((route) => {
                    return route.data.pipe(
                        map((routeData: any) => {
                            const title = routeData['title'];
                            return { title };
                        }),
                    );
                }),
                tap((data: any) => {
                    let title = data.title;
                    title = (title ? title + ' | ' : '') + ' 360restoran.com';
                    this.titleService.setTitle(title);
                }),
            )
            .subscribe();
    }
}
