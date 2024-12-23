import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ReportService } from 'src/app/service/ReportService';
import { NotificationService } from 'src/app/apps/NotificationService';
import * as L from 'leaflet';
import 'leaflet.heat';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-region-sales-report',
  templateUrl: './region-sales-report.component.html',
})
export class RegionSalesReportComponent implements OnInit, AfterViewInit {
  stores: any[] = [];
  selectedStores: string[] = [];
  startDate: string = '';
  endDate: string = '';
  regionSalesData: any[] = [];
  loading: boolean = false;
  error: string = '';
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private map!: L.Map; // Harita referansı

  constructor(
    private reportService: ReportService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
    private translate:TranslateService
  ) { }

  ngOnInit(): void {
    const storedMagazalar = localStorage.getItem('magazalar');
    if (storedMagazalar) {
      this.stores = JSON.parse(storedMagazalar);
    }

    // Varsayılan olarak bugünün tarihi başlangıç ve bitiş tarihi olarak ayarlanıyor
    const now = new Date();
    this.startDate = now.toISOString().split('T')[0];
    this.endDate = now.toISOString().split('T')[0];
  }

  ngAfterViewInit(): void {
    // Haritayı oluştur
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [39.925533, 32.866287],
      zoom: 6
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  async geocodeAndAddHeatmap() {
    const heatPoints: [number, number, number][] = [];

    for (const item of this.regionSalesData) {
      try {
        const coords = await this.geocodeAddressWithFallbacks(item);
        const weight = item.count || 1;
        heatPoints.push([coords.lat, coords.lon, weight]);
      } catch (error) {
        console.warn('Adres çözümlenemedi (tüm kademeler denendi):', error);
      }
    }

    this.clearMarkers();

    const heatLayer = (L as any).heatLayer(heatPoints, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
    }).addTo(this.map);

    if (heatPoints.length > 0) {
      const latLngs = heatPoints.map(p => L.latLng(p[0], p[1]));
      const bounds = L.latLngBounds(latLngs);
      this.map.fitBounds(bounds);
    }
  }

  async geocodeAndAddMarkers() {
    const markers: L.Marker[] = [];

    for (const item of this.regionSalesData) {
      try {
        const coords = await this.geocodeAddressWithFallbacks(item);
        const marker = L.marker([coords.lat, coords.lon]).addTo(this.map);
        marker.bindPopup(`
          <div>
            <strong>${(item.yolAdi ? item.yolAdi + ', ' : '')}${(item.mahalle ? item.mahalle + ', ' : '')}${(item.ilce ? item.ilce + ', ' : '')}${item.il || ''}</strong><br>
            Count: ${item.count}<br>
            Total Amount: ${item.totalAmount}
          </div>
        `);
        markers.push(marker);
      } catch (error) {
        console.warn('Adres çözümlenemedi (tüm kademeler denendi):', error);
      }
    }

    const latLngs = markers.map(m => m.getLatLng());
    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      this.map.fitBounds(bounds);
    }
  }
  getReport(): void {
    if (this.selectedStores.length === 0) {
      this.error = 'Lütfen en az bir mağaza seçiniz.';
      return;
    }
    if (!this.startDate || !this.endDate) {
      this.error = 'Lütfen başlangıç ve bitiş tarihlerini seçiniz.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.regionSalesData = [];

    const body = {
      magazaKodlari: this.selectedStores,
      startDate: this.startDate,
      endDate: this.endDate
    };

    this.reportService.getRegionSales(body).subscribe({
      next: (data) => {
        this.regionSalesData = data;
        this.loading = false;

        this.clearMarkers();
        this.geocodeAndAddMarkers();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Region sales raporu alınırken hata:', err);
        this.notificationService.showNotification(this.translate.instant('errorretrievingdata'), 'error', 'top-end');
        this.loading = false;
        this.error = 'Veri alınırken hata oluştu.';
      }
    });
  }

  clearMarkers(): void {
    // Sadece Marker olan layerları kaldır
    this.map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        this.map.removeLayer(layer);
      }
    });
  }

  geocodeAddress(address: string): Promise<{ lat: number, lon: number }> {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    return fetch(url)
      .then(res => res.json())
      .then((data: any) => {
        if (data && data.length > 0) {
          return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        } else {
          throw new Error('Adres bulunamadı');
        }
      });
  }


  async geocodeAddressWithFallbacks(item: any): Promise<{ lat: number; lon: number }> {
    // Adres bileşenlerini item'dan alalım
    const il = item.il || '';
    const ilce = item.ilce || '';
    const mahalle = item.mahalle || '';
    const yolAdi = item.yolAdi || '';

    // Kademeli adres denemeleri
    const addressVariants = [
      // Tam adres: yolAdi, mahalle, ilce, il, Turkey
      [yolAdi, mahalle, ilce, il, 'Turkey'].filter(v => v).join(', '),
      // Mahalleyi dışarıda bırakarak: yolAdi, ilce, il, Turkey
      [yolAdi, ilce, il, 'Turkey'].filter(v => v).join(', '),
      // Yol Adı yoksa: mahalle, ilce, il, Turkey
      [mahalle, ilce, il, 'Turkey'].filter(v => v).join(', '),
      // Mahalle yoksa sadece ilce, il, Turkey
      [ilce, il, 'Turkey'].filter(v => v).join(', '),
      // İl ve Turkey
      [il, 'Turkey'].filter(v => v).join(', ')
    ];

    for (const addr of addressVariants) {
      if (!addr || addr === 'Turkey') continue; // Boş veya sadece 'Turkey' kalmışsa atla
      try {
        const coords = await this.geocodeAddress(addr);
        return coords; // Başarılı olduğunda hemen return
      } catch (error) {
        // Bu varyant olmadı, sıradaki varyanta geç
      }
    }
    // Hiçbiri başarılı olamadıysa hata fırlat
    throw new Error('Adres çözümlenemedi');
  }


}
