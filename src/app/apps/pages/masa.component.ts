import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { debounceTime, Subject } from 'rxjs';
import { MasaService } from 'src/app/service/masa.service';
import { SocketService } from 'src/app/service/socket.service';
import { slideDownUp, toggleAnimation } from 'src/app/shared/animations';
import 'intro.js/introjs.css';
import { IntroJs } from 'intro.js/src/intro';
import introJs from 'intro.js';
import GLightbox from 'glightbox';

@Component({
  selector: 'app-masa',
  templateUrl: './masa.component.html',
  animations: [toggleAnimation, slideDownUp],
})
export class MasaComponent implements OnInit, AfterViewInit {
  intro!: IntroJs;
  private intervalId: any;

  masalar: any[] = [];
  adisyonlar: any[] = []; // Adisyon listesi verileri

  // Örnek alan isimleri (backend'den de geliyor olabilir, getTableAreas ile güncelleniyor)
  alanlar: string[] = ['Salon', 'Salon 2', 'Teras', 'Bahçe'];

  // Varsayılan olarak 'Salon'
  selectedArea: string = 'Salon';

  selectedStores: string[] = [];
  selectedStore: string = '';
  selectedcluster: string | null = null;

  newArea = '';

  // Socket’ten gelen masa güncellemelerini debounce ile işlemek için Subject
  private tableUpdateSubject = new Subject<any>();

  // Kullanıcı rolü (login’de localStorage’a kaydettiğinizi varsayıyoruz)
  userRole = localStorage.getItem('role');

  // Hem masalar hem de currentOrder bilgisi olan masalar
  masalarWithOrders: any[] = [];

  // Adisyon total
  toplamTutar: number = 0;

  // Modal referansları
  @ViewChild('tableModal') tableModal!: any;
  @ViewChild('addAreaModal') addAreaModal!: any;

  // Yeni masa eklerken kullanılan model
  newTable = {
    currentGuests: null,
    tableName: '',
    tableArea: '',
    position: { x: 0, y: 0 }
  };

  // Tüm mağazalar
  stores: any[] = [];
  tables: any[] = [];

  constructor(
    private masaService: MasaService,
    private translate: TranslateService,
    private socketservis: SocketService,
    public router: Router,
    private routegelen: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  // =============== TUTORIAL (intro.js) ===============
  startIntro(): void {
    this.intro = introJs();
    this.intro.setOptions({
      steps: [
        {
          element: '#step1',
          intro: 'Buradan masalarınızı görebilir ve yönetebilirsiniz.',
          position: 'bottom'
        },
        {
          element: '#step2',
          intro: 'Adisyonlarınızı buradan kontrol edebilirsiniz.',
          position: 'right'
        },
        {
          element: '#step3',
          intro: 'Mağaza ve alan seçimi burada yapılır.',
          position: 'left'
        }
      ],
      showButtons: true,
      showBullets: false,
      showStepNumbers: true,
      doneLabel: 'Tur Tamamlandı',
      nextLabel: 'İleri',
      prevLabel: 'Geri'
    });

    this.intro.onexit(() => {
      // Kullanıcı turu "Biliyorum" diyerek geçerse
      console.log('Kullanıcı turu tamamlamadan çıktı.');
      this.markTourAsCompleted();
    });

    this.intro.oncomplete(() => {
      // Kullanıcı turu tamamladı
      console.log('Kullanıcı turu tamamladı.');
      this.markTourAsCompleted();
    });

    this.intro.start();
  }

  markTourAsCompleted(): void {
    localStorage.setItem('masaTourCompleted', 'true');
  }
  // ===================================================

  ngOnInit(): void {
    // 1) localStorage’ta daha önce kaydedilmiş “selectedStore” ve “selectedArea” var mı?
    const storedStore = localStorage.getItem('selectedStore');
    const storedArea = localStorage.getItem('selectedArea');

    if (storedStore) {
      this.selectedStore = storedStore; // localStorage'tan gelen store
    }
    if (storedArea) {
      this.selectedArea = storedArea;   // localStorage'tan gelen area
    }

    // Query param okuma (eğer URL’den geliyorsa)
    this.loadParametre();

    // Socket’ten gelecek masa güncellemelerini 500ms debounce ile dinle
    this.tableUpdateSubject
      .pipe(debounceTime(500))
      .subscribe(data => {
        this.processTableUpdates(data);
      });

    // Masa güncelleme event’i
    this.socketservis.onTableUpdate((data) => {
      if (data.magaza === this.selectedStore) {
        this.tableUpdateSubject.next(data);
      }
    });

    // Introjs turunu daha önce tamamlanmamışsa başlat
    const tourCompleted = localStorage.getItem('masaTourCompleted');
    if (!tourCompleted) {
      // this.startIntro();  // Açmak isterseniz yorum satırından çıkarın
    }

    // Alan listesini backend’den getir
    this.getTableAreas();

    // Otomatik update
    this.startAutoUpdate();
  }

  // Socket'ten gelen masa verisini API'den tekrar çekip masalar dizisini günceller
  processTableUpdates(data: any): void {
    const index = this.masalar.findIndex(masa => masa._id === data._id);

    if (index !== -1) {
      // Güncellenen masa bilgilerini API'den al
      this.masaService.getMasalarByAreabyid(data._id).subscribe(
        (updatedTableApiResponse: any) => {
          const updatedTable = Array.isArray(updatedTableApiResponse)
            ? updatedTableApiResponse[0]
            : updatedTableApiResponse;

          // Mevcut masalar içinde güncelle
          this.masalar[index] = {
            ...this.masalar[index],
            ...updatedTable
          };

          // masalarWithOrders listesini güncelle
          const orderIndex = this.masalarWithOrders.findIndex(masa => masa._id === data._id);
          if (updatedTable.currentOrder !== null) {
            if (orderIndex !== -1) {
              // Mevcut masayı güncelle
              this.masalarWithOrders[orderIndex] = {
                ...this.masalarWithOrders[orderIndex],
                ...updatedTable
              };
            } else {
              // Yeni ekle
              this.masalarWithOrders.push(updatedTable);
            }
          } else if (orderIndex !== -1) {
            // currentOrder null ise masayı listeden çıkar
            this.masalarWithOrders.splice(orderIndex, 1);
          }

          // toplam tutar
          this.toplamTutar = this.masalarWithOrders.reduce(
            (total, masa) => total + masa.currentOrder.toplamVergisizFiyat,
            0
          );

          this.cdr.detectChanges();
        },
        (error) => {
          console.error('Masa bilgisi alınamadı:', error);
        }
      );
    } else {
      console.warn(`Güncellenmek istenen masa bulunamadı: ${data._id}`);
    }
  }

  // Örnek: adisyondan order detayına gitme
  goToOrderDetails(adisyon: any): void {
    const satisKaynakId = adisyon.satisKaynak?._id || null;
    const source = adisyon.satisKaynak?.kaynakAdi || 'masa';
    const orderId = adisyon._id;
    const magazaKodu = this.selectedStore;
    const cluster = this.selectedcluster;
    const orderDate = adisyon.siparisTarihi;
    const customerId = adisyon.musteri?._id || '';

    const queryParams: any = {
      source: source,
      store: magazaKodu,
      cluster: cluster,
      orderId: orderId,
      orderStatus: adisyon.statu || 'siparisOlusturuldu',
      orderDate: orderDate
    };
    if (customerId) {
      queryParams.customerId = customerId;
    }

    this.router.navigate(['/apps/order'], {
      queryParams,
      state: { orderInfo: adisyon }
    });
  }

  openOrder(table: any, source: string, id: string, cluster: string, store: string): void {
    if (table.currentOrder) {
      // Eğer mevcut bir order varsa
      const orderInfo = {
        ...table.currentOrder,
        masaId: table._id
      };
      this.navigateToOrder(source, id, cluster, store, orderInfo);
    } else {
      // Yeni order
      const orderInfo = {
        masaId: table._id,
        cuverUcreti: 0,
        kisiSayisi: 0,
        orderId: null,
        orderStatus: 'new',
        orderDate: new Date().toISOString()
      };

      const currentOrdere = {
        masaAdi: table.tableName,
        orderNo: 0,
        musteriBilgisi: { ad: '', soyad: '' },
        siparisTarihi: new Date().toISOString(),
        kullaniciAdi: localStorage.getItem('kullaniciAdi'),
      };
      const orderInfoYeni = {
        ...currentOrdere,
        masaId: table._id
      };

      this.navigateToOrder(source, id, cluster, store, orderInfoYeni);
    }
  }

  navigateToOrder(source: string, id: string, cluster: string, store: string, orderInfo?: any): void {
    console.log(orderInfo);
    const queryParams: any = { source, id, cluster, store };

    if (orderInfo) {
      queryParams.orderId = orderInfo._id;
      queryParams.orderStatus = orderInfo.statu;
      queryParams.orderDate = orderInfo.siparisTarihi;
      queryParams.masaId = orderInfo.masaId;
      queryParams.cuverUcreti = orderInfo.cuverUcreti;
      queryParams.kisiSayisi = orderInfo.kisiSayisi;
    }

    this.router.navigate(['/apps/order'], {
      queryParams,
      state: { orderInfo }
    });
  }

  // Modal aç/kapa
  openAddAreaModal() {
    this.newArea = '';
    this.addAreaModal.open();
  }

  addTable() {
    const tableData = {
      ...this.newTable,
      magaza: this.selectedStore
    };
    this.masaService.addTable(tableData).subscribe(
      (response) => {
        console.log('Masa başarıyla eklendi:', response);
        this.tableModal.close();
        this.getTableAreas(this.selectedStore);
      },
      (error) => {
        console.error('Masa eklenemedi:', error);
      }
    );
  }

  addArea() {
    if (this.newArea && !this.alanlar.includes(this.newArea)) {
      this.alanlar.unshift(this.newArea);
      this.newTable.tableArea = this.newArea;
    }
    this.addAreaModal.close();
  }

  // localStorage'taki mağazalar listesini yükler, ama seçili store vs. değiştirmeden
  loadMagazalarbychangesiz(): void {
    const storedMagazalar = localStorage.getItem('magazalar');
    if (storedMagazalar) {
      this.stores = JSON.parse(storedMagazalar);
    } else {
      this.stores = [];
    }
  }

  // localStorage'ta 'magazalar' varsa,
  // eğer selectedStore yok veya geçersizse ilk mağazayı seçili yap
  loadMagazalar(): void {
    const storedMagazalar = localStorage.getItem('magazalar');
    if (storedMagazalar) {
      this.stores = JSON.parse(storedMagazalar);

      if (this.stores.length > 0) {
        // Eğer localStorage’taki storeId bu listede yoksa fallback yap
        const storeExists = this.stores.find(s => s._id === this.selectedStore);
        if (!storeExists) {
          // Geçersiz bir store seçiliyse veya hiç yoksa ilkini al
          this.selectedStore = this.stores[0]._id;
          this.selectedcluster = this.stores[0].cluster;
        } else {
          // Varsa, cluster'ı güncelle
          const foundStore = this.stores.find(s => s._id === this.selectedStore);
          if (foundStore) {
            this.selectedcluster = foundStore.cluster;
          }
        }
        this.onStoreChange(this.selectedStore);
      }
      // Adisyonları da al
      this.getAdisyonlar();
    } else {
      this.stores = [];
    }
  }

  // URL query param varsa onlarla store/cluster ayarla, yoksa default load
  loadParametre(): void {
    this.routegelen.queryParams.subscribe(params => {
      if (params['source'] && params['id'] && params['cluster'] && params['store']) {
        console.log('Gelen Query Parametreleri:', params);

        this.selectedStore = params['store'];
        this.selectedcluster = params['cluster'];

        this.loadMagazalarbychangesiz();
        this.onStoreChange(this.selectedStore);
        this.getAdisyonlar();
      } else {
        console.log('Query parametreleri bulunamadı, varsayılan işlem başlatılıyor.');
        this.loadMagazalar();
      }
    });
  }

  // Mağaza değiştiğinde
  onStoreChange(storeId: string): void {
    this.selectedStore = storeId;
    console.log('selectedStore:', this.selectedStore);

    const selectedStoreData = this.stores.find(store => store._id === storeId);
    if (selectedStoreData) {
      this.selectedcluster = selectedStoreData.cluster;
    } else {
      this.selectedcluster = null;
    }

    // Socket join
    this.socketservis.joinStore(storeId);

    // Bu mağazaya bağlı alanları getir
    this.getTableAreas(storeId);

    // Seçimi localStorage’a yaz
    localStorage.setItem('selectedStore', storeId);
  }

  // Alanları backend’den getiriyoruz.
  // Burada "Eğer this.selectedArea yoksa veya bu alanlar dizisi içinde yoksa" ilk elemana set ediyoruz.
  getTableAreas(magaza?: string): void {
    this.masaService.getTableAreas(this.selectedStore).subscribe((data: any) => {
      this.alanlar = data || [];

      // Eğer localStorage’tan gelen (veya şu anki) selectedArea bu dizide yoksa fallback
      if (!this.selectedArea || !this.alanlar.includes(this.selectedArea)) {
        this.selectedArea = this.alanlar.length > 0 ? this.alanlar[0] : '';
      }

      this.getMasalar();
    });
  }

  // Seçili alan + seçili mağazaya göre masaları çek
  getMasalar(): void {
    this.masaService.getMasalarByArea(this.selectedArea, this.selectedStore).subscribe((data: any) => {
      if (Array.isArray(data)) {
        this.masalar = data;
        this.masalarWithOrders = this.masalar.filter((masa: any) => masa.currentOrder !== null);
        this.toplamTutar = this.masalarWithOrders.reduce(
          (total, masa) => total + masa.currentOrder.toplamVergiliFiyat,
          0
        );
      } else {
        this.masalar = [];
        this.masalarWithOrders = [];
        this.toplamTutar = 0;
      }
      this.cdr.detectChanges();
    });
  }

  // Basit adisyon datası
  getAdisyonlar(): void {
    // Normalde backend'den çekebilirsiniz
    this.adisyonlar = [
      { salonAdi: 'Salon 8', saat: '17:43', tutar: 156 },
      { salonAdi: 'Salon 10', saat: '17:25', tutar: 269 },
    ];
    this.toplamTutar = this.adisyonlar.reduce((acc, curr) => acc + curr.tutar, 0);
  }

  // Kullanıcı bir alan seçtiğinde masaları çekip localStorage’a kaydediyor
  selectArea(alan: string): void {
    this.selectedArea = alan;
    this.getMasalar();
    localStorage.setItem('selectedArea', alan);
  }

  // Masa class'ını status'e göre belirleyen helper
  getMasaClass(status: string): string {
    switch (status) {
      case 'occupied':  return 'bg-red-600';
      case 'available': return 'bg-gray-500';
      case 'reserved':  return 'bg-yellow-600';
      case 'bill_paid': return 'bg-blue-600';
      default:          return 'bg-gray-500';
    }
  }

  // 1 dk’da bir detectChanges
  startAutoUpdate(): void {
    this.intervalId = setInterval(() => {
      this.cdr.detectChanges();
    }, 60000);
  }

  // Örnek: “8 dk 30 sn” formatında sipariş süresi göstermek için
  getTimeDifference(orderDate: string): string {
    const orderTime = new Date(orderDate).getTime();
    const currentTime = new Date().getTime();
    const timeDifference = currentTime - orderTime;

    const seconds = Math.floor(timeDifference / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes} dk ${remainingSeconds} sn`;
  }

  ngAfterViewInit(): void {
    const lightbox = GLightbox({
      selector: '.glightbox'
    });
  }
}
