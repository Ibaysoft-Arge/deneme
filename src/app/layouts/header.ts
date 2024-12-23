import { Component } from '@angular/core';
import { toggleAnimation } from 'src/app/shared/animations';
import { Store } from '@ngrx/store';
import { Router, NavigationEnd } from '@angular/router';
import { AppService } from '../service/app.service';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { PaketService } from '../service/paket.service';
import { NotificationMsgService } from '../service/Notification.Service ';
import { NotificationService } from '../apps/NotificationService';
import { SocketService } from '../service/socket.service';
import { ChatService } from '../service/chat.service';
import { Socket } from 'socket.io-client';
import { SupportHoursService } from '../service/supportHoursService';
import { UserService } from '../service/user.service';

@Component({
    selector: 'header',
    templateUrl: './header.html',
    animations: [toggleAnimation],
})

export class HeaderComponent {
    store: any;
    search = false;
    userAvatar: any; // Avatar için değişken
    userPaketbilgisi: any; // Avatar için değişken
    userid: any;
    userName: any; // Kullanıcı adı için değişken
    userEmail: any; // E-posta için değişken
    userRole: any;
    modulesData: any[] = [];
    modulesDataEk: any[] = [];
    isLiveChatOpen = false;
    liveChatMessages: any[] = [];
    liveChatMessage: string = '';
    searchQuery: string = ''; // Başlangıçta boş bir değer atayın
    searchQueryinpu: string = '';
    filteredPages: { name: string; kod: string }[] = []; // Arama sonuçları için bir dizi
    notifications: any[] = [];
    specialDataList: any[] = []; // Servisten çektiğiniz veriler burada tutulacak
    selectedData: any = null;
    private socket!: Socket;

    constructor(
        public translate: TranslateService,
        public storeData: Store<any>,
        public router: Router,
        private appSetting: AppService,
        private sanitizer: DomSanitizer,
        private paketService: PaketService,
        private userservice:UserService,
        private notificationService: NotificationMsgService,
        private ntfService: NotificationService,
        private socketService: SocketService, private chatService: ChatService,
        private supportHoursService: SupportHoursService

    ) {
        this.userRole = localStorage.getItem('role') || '';
        this.initStore();
        this.initLiveChat();
    }
    async initStore() {
        this.storeData
            .select((d) => d.index)
            .subscribe((d) => {
                this.store = d;
            });
        this.getSayfalar();
    }

    ngOnInit() {

        this.setActiveDropdown();
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                this.setActiveDropdown();
            }
        });

        this.userAvatar = localStorage.getItem('avatar');
        this.userPaketbilgisi = localStorage.getItem('paketAdi');
        this.userName = localStorage.getItem('kullaniciAdi');
        this.userEmail = localStorage.getItem('email');

        this.userid = localStorage.getItem('userid');
        this.loadNotifications();
        this.notificationService.getNotifications().subscribe((notification) => {
            this.ntfService.showNotification(notification.message, 'info', 'top-end');
            //  this.notifications.push(notification);
            this.loadNotifications();
        });

        console.log('User role:', this.userRole);
        this.socket = this.socketService.getSocket();
        this.socket.on('newNotification', (notification: any) => {
            this.ntfService.showNotification(notification.message, 'info', 'top-end');
            this.loadNotifications();
        });

        this.loadUserList();
    }

    isWaitingForSupport(): boolean {
        return this.liveChatMessages.length > 0 && !this.liveChatMessages.some(msg => !msg.isUser);
    }
    toggleFullScreen(): void {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Tam ekran yapılamadı: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    onDataChange(event: any) {
        this.selectedData = event.target.value;
        // Seçili değer değiştiğinde yapmak istediğiniz işlemler
        console.log('Seçilen değer:', this.selectedData);


        this.userservice.updateParentUser(this.selectedData).subscribe({
            next: (data) => {

                localStorage.removeItem('token');
                localStorage.removeItem('avatar');
                localStorage.removeItem('email');
                localStorage.removeItem('kullaniciAdi');
                console.log("token kaldırıldı.");
                // Kullanıcıyı login sayfasına yönlendir
                this.router.navigate(['./auth/cover-login']).then(() => {
                    // Geçmişi güncelle, böylece geri butonuyla login sayfasına dönemez
                    history.pushState(null, '', location.href);
                });

            },
            error: (err) => {
              console.error('Veri alınırken hata oluştu:', err);
            }
          });


    }
    toggleLiveChat() {
        this.supportHoursService.checkSupportAvailability().subscribe(
            (response: any) => {
                if (response.message === 'Canlı destek aktif.') {
                    this.isLiveChatOpen = !this.isLiveChatOpen; // Sohbeti aç
                } else {
                    alert('Canlı destek şu anda aktif değil.');
                }
            },
            (error) => {
                console.error('Canlı destek durumu kontrol edilirken hata oluştu:', error);
                alert('Canlı destek şu anda aktif değil.');
            }
        );
    }
    // header.ts

    initLiveChat() {
        this.userid = localStorage.getItem('userid');
        this.chatService.startConversation().subscribe((data: any) => {
            if (data.msg && data.msg === "Aktif konuşma bulunamadı.") {
                // Aktif konuşma yoksa kullanıcıyı bilgilendir
                // alert('Aktif bir konuşma bulunamadı.');
            } else {
                // Aktif bir konuşma varsa, conversationId'yi al
                this.currentConversationId = data.conversationId;
                this.loadMessages();
            }
        });

        // Socket bağlantısını başlatın
        this.socket = this.socketService.getSocket();

        // Yeni gelen mesajları dinleyin
        this.socket.on('newMessage', (message: any) => {
            // console.log("Yeni gelen mesaj:", message);

            //  console.log("this.currentConversationId="+this.currentConversationId);
            if (this.currentConversationId == '') {
                this.chatService.startConversation().subscribe((data: any) => {
                    if (data.msg && data.msg === "Aktif konuşma bulunamadı.") {
                        // Aktif konuşma yoksa kullanıcıyı bilgilendir
                        // alert('Aktif bir konuşma bulunamadı.');
                    } else {
                        // Aktif bir konuşma varsa, conversationId'yi al
                        this.currentConversationId = data.conversationId;
                        if (message.conversationId === this.currentConversationId) {
                            // Mesajı doğru şekilde işleyelim
                            this.liveChatMessages.push({
                                text: message.messageText,
                                isUser: message.isUser,  // Kullanıcı mı destek mi kontrolü
                                senderName: message.senderName, // Gönderenin adı
                                createdAt: message.createdAt,
                                conversationId: message.conversationId,
                                messageId: message.messageId
                            });

                            // İlk destek mesajı geldiğinde "Waiting for support" mesajını kaldırıyoruz
                            this.liveChatMessages = this.liveChatMessages.filter(msg => !msg.isSystem);
                            this.playNotificationSound();
                            this.scrollToBottom();
                        }
                    }
                });
            }
            else {

                this.chatService.startConversation().subscribe((data: any) => {
                    if (data.msg && data.msg === "Aktif konuşma bulunamadı.") {
                        if (message.conversationId === this.currentConversationId) {
                            // Mesajı doğru şekilde işleyelim
                            this.liveChatMessages.push({
                                text: message.messageText,
                                isUser: message.isUser,  // Kullanıcı mı destek mi kontrolü
                                senderName: message.senderName, // Gönderenin adı
                                createdAt: message.createdAt,
                                conversationId: message.conversationId,
                                messageId: message.messageId
                            });

                            // İlk destek mesajı geldiğinde "Waiting for support" mesajını kaldırıyoruz
                            this.liveChatMessages = this.liveChatMessages.filter(msg => !msg.isSystem);
                            this.playNotificationSound();
                            this.scrollToBottom();
                        }
                    } else {
                        // Aktif bir konuşma varsa, conversationId'yi al
                        this.currentConversationId = data.conversationId;
                        if (message.conversationId === this.currentConversationId) {
                            // Mesajı doğru şekilde işleyelim
                            this.liveChatMessages.push({
                                text: message.messageText,
                                isUser: message.isUser,  // Kullanıcı mı destek mi kontrolü
                                senderName: message.senderName, // Gönderenin adı
                                createdAt: message.createdAt,
                                conversationId: message.conversationId,
                                messageId: message.messageId
                            });

                            // İlk destek mesajı geldiğinde "Waiting for support" mesajını kaldırıyoruz
                            this.liveChatMessages = this.liveChatMessages.filter(msg => !msg.isSystem);
                            this.playNotificationSound();
                            this.scrollToBottom();
                        }
                    }
                });
            }
        });
    }




    scrollToBottom() {
        // Chat penceresinin elementini seçiyoruz
        const chatBox = document.getElementById('chatBox');

        // Eğer chatBox varsa, scrollTop ile kaydırma işlemi yapıyoruz
        if (chatBox) {
            setTimeout(() => {
                chatBox.scrollTop = chatBox.scrollHeight;  // Sohbet penceresinin en altına kaydır
            }, 100);  // Mesajın kaydedilmesinin ardından biraz gecikme ile kaydırma
        }

    }
    loadMessages() {
        // API üzerinden sohbetin mesajlarını yükleyin
        this.chatService.getMessages(this.currentConversationId).subscribe((response: any) => {
            // Mesajları iterasyonla geçiyoruz
            this.liveChatMessages = response.messages.map((message: any) => {
                return {
                    text: message.messageText,
                    isUser: message.senderId._id === this.userid, // Eğer mesaj kullanıcıdan geldiyse isUser true, aksi takdirde false
                    senderName: message.senderId.kullaniciAdi,    // Kullanıcı adı
                    createdAt: message.createdAt,                 // Mesaj zamanı
                    conversationId: message.conversationId,       // Konuşma ID'si
                    messageId: message._id                        // Mesaj ID'si
                };
            });
            this.scrollToBottom();
        });
    }

    playNotificationSound() {
        const audio = new Audio('assets/sounds/new_message.mp3');
        audio.load();
        audio.play().catch((error) => {
            console.error('Ses çalma hatası:', error);
        });
    }
    sendLiveChatMessage() {
        if (this.liveChatMessage.trim() !== '') {
            const message = {
                conversationId: this.currentConversationId,  // Active conversation ID
                messageText: this.liveChatMessage,
                senderName: this.userName
            };

            // Mesajı API'ye gönder
            this.chatService.sendMessage(message).subscribe((data: any) => {
                // Kullanıcı tarafından gönderilen mesajı kendi ekranına ekleyin
                // this.liveChatMessages.push({
                //     text: this.liveChatMessage,
                //     isUser: true,
                //     senderName: this.userName,  // Kullanıcı adı "You"
                //     createdAt: new Date(),  // Şu anki zamanı ekleyin
                //     conversationId: this.currentConversationId,
                //     messageId: data.message._id || 'temp-' + new Date().getTime()  // API'den dönen mesaj ID'si
                // });

                this.liveChatMessage = '';  // Mesaj kutusunu temizleyin




                // Eğer destek tarafından henüz mesaj gelmediyse "Waiting for support" mesajını ekleyin
                if (!this.liveChatMessages.some(msg => !msg.isUser)) {
                    this.liveChatMessages.push({ text: 'Waiting for support', isUser: false, isSystem: true });
                }

                this.scrollToBottom();  // Sayfanın en altına kaydır
            });
        }
    }



    getTimeAgo(date: string): string {
        const messageDate = new Date(date);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);

        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60,
            second: 1
        };

        for (const [unit, value] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / value);
            if (interval > 0) {
                return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
            }
        }
        return 'just now';
    }
    currentConversationId: string = '';
    loadNotifications(): void {
        this.notifications = [];
        this.notificationService.listNotifications().subscribe({
            next: (response) => {
                if (response.notifications && response.notifications.length > 0) {
                    this.notifications = response.notifications;
                } else {
                    console.warn('Bildiriminiz bulunmamaktadır.');
                    this.notifications = []; // Bildirim olmadığında bile listede bir hata olmaması için boş bir dizi atayın.
                }
            },
            error: (error) => {
                if (error.status !== 404) {  // Eğer 404 değilse hata göster
                    console.error('Bildirimler alınırken hata oluştu:', error);

                }

            }
        });
    }
    loadUserList(): void {

        if (this.userRole === 'admin' || this.userRole === 'Destek' || this.userRole === 'arge') {
            // Servisten verileri çek
            this.userservice.getUsersAllMain().subscribe({
              next: (data) => {
                this.specialDataList = data;
                // Varsayılan seçili değer atayabilirsiniz
                if (this.specialDataList.length > 0) {
                  this.selectedData = this.specialDataList[0];
                }

                const parentUser = localStorage.getItem('parentUser');
                if (parentUser) {
                  this.selectedData = parentUser; // Bu değer, select içerisindeki [value]="{{item._id}}" ile eşleşirse otomatik seçili gelir.
                }

              },
              error: (err) => {
                console.error('Veri alınırken hata oluştu:', err);
              }
            });
          }

    }
    markAsRead(notificationId: string): void {
        this.notificationService.markAsRead(notificationId).subscribe({
            next: () => {
                this.loadNotifications(); // Güncellenmiş bildirimleri yeniden yükle
            },
            error: (error) => {
                console.error('Bildirim okundu olarak işaretlenemedi:', error);
            }
        });
    }
    deleteNotification(notificationId: string): void {
        this.notificationService.deleteNotification(notificationId).subscribe({
            next: () => {
                this.loadNotifications(); // Güncellenmiş listeyi yeniden yükle
            },
            error: (error) => {
                console.error('Bildirim silinemedi:', error);
            }
        });
    }


    navigateToLockScreen() {
        // İlk olarak Lock Screen’e yönlendir
        this.router.navigate(['/auth/boxed-lockscreen']).then(() => {
            // Yönlendirme başarılı olduğunda tarayıcı geçmişini güncelle
            history.pushState(null, '', '/auth/boxed-lockscreen');
            history.pushState(null, '', '/auth/boxed-lockscreen'); // İkinci kez çağrılır
            window.addEventListener('popstate', () => {
                history.pushState(null, '', '/auth/boxed-lockscreen');
            });
        });
    }


    setActiveDropdown() {
        const selector = document.querySelector('ul.horizontal-menu a[routerLink="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const all: any = document.querySelectorAll('ul.horizontal-menu .nav-link.active');
            for (let i = 0; i < all.length; i++) {
                all[0]?.classList.remove('active');
            }
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link');
                if (ele) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele?.classList.add('active');
                    });
                }
            }
        }
    }

    removeNotification(value: string) {
        this.notifications = this.notifications.filter((d) => d.id !== value);
        this.deleteNotification(value);
    }


    changeLanguage(item: any) {
        this.translate.use(item.code);
        this.appSetting.toggleLanguage(item);
        if (this.store.locale?.toLowerCase() === 'ae') {
            this.storeData.dispatch({ type: 'toggleRTL', payload: 'rtl' });
        } else {
            this.storeData.dispatch({ type: 'toggleRTL', payload: 'ltr' });
        }
        window.location.reload();
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('avatar');
        localStorage.removeItem('email');
        localStorage.removeItem('kullaniciAdi');
        console.log("token kaldırıldı.");
        // Kullanıcıyı login sayfasına yönlendir
        this.router.navigate(['./auth/cover-login']).then(() => {
            // Geçmişi güncelle, böylece geri butonuyla login sayfasına dönemez
            history.pushState(null, '', location.href);
        });

        // Kullanıcı logout olduğunda geri butonunu devre dışı bırak
        window.onpopstate = (event) => {
            // Kullanıcı login sayfasında geri tuşuna bastığında
            // mevcut sayfada kalması için tekrar aynı durumu ekle
            event.preventDefault(); // Geri gitmeyi engelle
            history.pushState(null, '', location.href); // Mevcut sayfada kal
        };

        // Geri tuşuna basılmasını tamamen engellemek için
        window.addEventListener('popstate', (event) => {
            window.history.pushState(null, '');
        });
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
    filterModules(): void {
        const query = this.searchQueryinpu?.toLowerCase() || ''; // Kullanıcıdan gelen sorguyu küçük harfe çeviriyoruz
        this.filteredPages = []; // Filtreleme sonuçlarını sıfırlıyoruz

        // console.log('Arama sorgusu:', query); // Gelen sorguyu kontrol edin

        if (query) {
            // Modülleri filtrele
            //    console.log('Modüller:', this.modulesData); // Gelen modül verilerini loglayın
            this.modulesData.forEach((module: any) => {
                //    console.log('İşlenen modül:', module.modul?.name || 'Modül adı yok');
                if (module.altModuller?.length) {
                    module.altModuller.forEach((altModule: any) => {
                        // console.log('Alt modül:', altModule.altModul?.name || 'Alt modül adı yok');
                        if (altModule.sayfalar?.length) {
                            altModule.sayfalar.forEach((page: any) => {
                                //  console.log('Sayfa adı:', page.name); // Sayfa adını loglayın
                                if (page.name.toLowerCase().includes(query)) {
                                    //   console.log('Filtreye uyan sayfa:', page.name); // Filtreye uyan sayfa
                                    this.filteredPages.push({ name: page.name, kod: page.kod });
                                }
                            });
                        } else {
                            //   console.log('Alt modülde sayfa yok:', altModule.altModul?.name || 'Alt modül adı yok');
                        }
                    });
                } else {
                    // console.log('Modülde alt modül yok:', module.modul?.name || 'Modül adı yok');
                }
            });

            // Ek modülleri filtrele
            //   console.log('Ek Modüller:', this.modulesDataEk); // Ek modül verilerini loglayın
            this.modulesDataEk.forEach((ekModule: any) => {
                //   console.log('İşlenen ek modül:', ekModule.modul?.name || 'Ek modül adı yok');
                if (ekModule.altModuller?.length) {
                    ekModule.altModuller.forEach((altModule: any) => {
                        //       console.log('Ek alt modül:', altModule.altModul?.name || 'Ek alt modül adı yok');
                        if (altModule.sayfalar?.length) {
                            altModule.sayfalar.forEach((page: any) => {
                                //    console.log('Ek modül sayfa adı:', page.name); // Ek sayfa adını loglayın
                                if (page.name.toLowerCase().includes(query)) {
                                    //       console.log('Ek modül filtreye uyan sayfa:', page.name); // Filtreye uyan sayfa
                                    this.filteredPages.push({ name: page.name, kod: page.kod });
                                }
                            });
                        } else {
                            console.log('Ek alt modülde sayfa yok:', altModule.altModul?.name || 'Ek alt modül adı yok');
                        }
                    });
                } else {
                    console.log('Ek modülde alt modül yok:', ekModule.modul?.name || 'Ek modül adı yok');
                }
            });
        }

        console.log('Filtrelenen sayfalar:', this.filteredPages); // Filtrelenen sayfaları kontrol edin
    }



    onSearchQueryChanged(): void {
        this.filterModules();
    }

    selectPage(page: any): void {
        this.router.navigate(['/apps/' + page.kod]);
        this.searchQueryinpu = ''; // Arama kutusunu temizle
        this.filteredPages = []; // Sonuçları temizle
    }



}
