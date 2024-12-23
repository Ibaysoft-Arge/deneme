import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { toggleAnimation } from 'src/app/shared/animations';
import { NgScrollbar } from 'ngx-scrollbar';
import { Store } from '@ngrx/store';
import { ChatService } from '../service/chat.service';
import { SocketService } from '../service/socket.service'; // Yeni eklenen servis
import { NotificationMsgService } from '../service/Notification.Service ';
import { UserService } from '../service/user.service';

@Component({
    templateUrl: './chat.html',
    animations: [toggleAnimation],
})
export class ChatComponent {
    constructor(public storeData: Store<any>, private chatService: ChatService,
        private userservice: UserService
        , private socketService: SocketService, private cdr: ChangeDetectorRef,

    ) { }
    enableSound = true;

    selectedConversation: any;
    waitingForSupportUsers: any[] = [];  // Destek bekleyen kullanıcılar
    inProgressUsers: any[] = [];
    userid: string = '';
    store: any;
    userName: any; // Kullanıcı adı için değişken
    users: any[] = [];
    selectedUser: any;
    textMessage: string = '';
    messages: any[] = [];
    @ViewChild('scrollable') scrollable!: NgScrollbar;
    isShowUserChat = false;
    isShowChatMenu = false;
    loginUser = {
        id: 0,
        name: 'Alon Smith',
        path: 'profile-34.jpeg',
        designation: 'Software Developer',
    };
    searchUser = '';
    ngOnInit() {
        this.userid = localStorage.getItem('userid') || '';
        //   console.log('Current userid:', this.userid); // Kimliği konsola yazdırın
        this.userName = localStorage.getItem('kullaniciAdi') || '';
        this.initStore();
        this.getActiveConversations();
        // const socket = this.socketService.getSocket();
        // socket.on('newMessage', (message: any) => {
        //     console.log("Mesaj geldi: " + JSON.stringify(message));
        //     // Gelen mesajın, şu an aktif olarak seçili olan kullanıcıya ait olup olmadığını kontrol edelim
        //     if (this.selectedUser && message.conversationId === this.selectedUser.conversationId) {
        //         this.messages.push(message);
        //     }
        // });
    }
    endChat() {


        const message = {
            conversationId: this.selectedUser.conversationId,
            messageText: "Görüşme Destek Tarafından Sonlandırıldı.",
            senderName: this.userName,  // Kullanıcı adı burada
            senderId: {
                _id: this.userid,
                kullaniciAdi: this.userName
            }
        }


        // Mesajı gönder
        this.chatService.sendMessageDestek(message).subscribe((data: any) => {
            // Mesaj gönderildikten sonra işlemler
            // this.messages.push({
            //     ...message,
            //     status: 'sent'
            // });
            this.scrollToBottom();
            this.textMessage = '';
            this.messages = [];// Mesaj kutusunu temizle
        });

        // Backend'e de konuşma sonlandırma isteği gönderilebilir
        this.chatService.endConversation(this.selectedUser.conversationId).subscribe(
            (response) => {
                console.log("Konuşma sonlandırıldı", response);
            },
            (error) => {
                console.error("Konuşma sonlandırma hatası", error);
            }
        );
    }

    async initStore() {
        const socket = this.socketService.getSocket();

        socket.on('newMessage', (message: any) => {
            //  console.log("Yeni mesaj geldi2:", message);
            this.getActiveConversations();
            // Eğer mesajın göndericisi kullanıcıysa (mesaj size aitse), mesajı listeye eklemeyin
            if (message.senderId._id === this.userid) {
                return;
            }


            // Eğer kullanıcı seçilmişse ve mesajın conversationId'si ile eşleşiyorsa
            if (this.selectedUser && message.conversationId === this.selectedUser.conversationId) {
                if (!this.messages.some((existingMessage: any) => existingMessage._id === message._id)) {

                    this.markMessageAsRead(message._id);
                    this.messages.push(message);
                    //   this.getActiveConversations();
                    this.cdr.detectChanges();
                }
            } else if (!this.selectedUser) {
                // Eğer kullanıcı seçilmemişse, gelen mesajları tüm kullanıcılara ekleyin
                if (!this.messages.some((existingMessage: any) => existingMessage._id === message._id)) {

                    this.messages.push(message);
                    // this.getActiveConversations();
                    this.cdr.detectChanges();
                }
            }

            // Eğer sohbet açıkken mesaj geliyorsa ekranı kaydırın
            if (this.isShowUserChat && message.conversationId === this.selectedUser?.conversationId) {
                this.scrollToBottom();
            }
        });
    }


    isToday(dateString: string): boolean {
        const date = new Date(dateString);
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    }

    isSameDay(dateString1: string, dateString2: string): boolean {
        const date1 = new Date(dateString1);
        const date2 = new Date(dateString2);
        return (
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        );
    }
    markMessageAsRead(messageId: string) {
        this.chatService.markMessageAsRead(messageId).subscribe(
            (response) => {
                console.log('Mesaj okundu olarak işaretlendi:', response);
                // Mesaj okundu olarak işaretlendiğinde, diziyi güncelle
                const message = this.messages.find(msg => msg._id === messageId);
                if (message) {
                    message.isRead = true;
                }
            },
            (error) => {
                console.error('Mesaj okundu olarak işaretlenemedi:', error);
            }
        );
    }
    getActiveConversations() {
        const userRole = localStorage.getItem('role'); // Rolü alıyoruz

        this.chatService.getActiveConversations().subscribe((conversations: any[]) => {
            // Destek bekleyen ve devam eden kullanıcıları filtrele
            const waitingForSupportUsers = conversations.filter(conversation => conversation.isWaitingForSupport);

             // Önceki durumla karşılaştır
        if (this.waitingForSupportUsers.length < waitingForSupportUsers.length) {
            // Yeni bir destek bekleyen kullanıcı eklenmiş, ses çal
            this.playNotificationSound();
        }
            const inProgressUsers = conversations.filter(conversation => conversation.isInProgress);

            // Eğer admin değilse yalnızca kendi üzerine aldıklarını filtrele
            const filterConversations = (conversationList: any[]) => {
                return userRole === 'admin'
                    ? conversationList
                    : conversationList.filter(conversation => conversation.supportUserId === this.userid);
            };

            // Her iki listeyi güncelle
            this.waitingForSupportUsers = filterConversations(waitingForSupportUsers).map((conversation: any) => ({
                userId: conversation.userId._id,
                name: conversation.userId.name,
                conversationId: conversation._id,
                active: conversation.isActive,
                preview: conversation.userId.kullaniciAdi,
                unreadMessagesCount: conversation.unreadMessagesCount,
                isWaitingForSupport: true,
                isInProgress: false
            }));

            this.inProgressUsers = filterConversations(inProgressUsers).map((conversation: any) => ({
                userId: conversation.userId._id,
                name: conversation.userId.name,
                conversationId: conversation._id,
                active: conversation.isActive,
                preview: conversation.userId.kullaniciAdi,
                unreadMessagesCount: conversation.unreadMessagesCount,
                isWaitingForSupport: false,
                isInProgress: true
            }));

            // Kullanıcılar listesine ekleyelim
            this.users = [...this.waitingForSupportUsers, ...this.inProgressUsers];
        });
    }

    playNotificationSound() {
        console.log('Ses çalma etkinleştirildi');
        if (this.enableSound) {
            const audio = new Audio('assets/sounds/new_message.mp3');
            audio.load();
            audio.play().catch(error => {
                console.error("Ses çalma hatası:", error);
            });
        }
    }

    markMessagesAsRead(messages: any[]) {
        // Okunmamış mesajları işaretle
        const unreadMessages = messages.filter((message: any) => !message.isRead);

        if (unreadMessages.length > 0) {
            unreadMessages.forEach((message: any) => {
                this.chatService.markMessageAsRead(message._id).subscribe(
                    (response) => {
                        // Mesaj başarıyla okundu olarak işaretlendi
                        console.log('Mesaj okundu olarak işaretlendi', response);
                        message.isRead = true; // Frontend'de de okundu olarak işaretle
                    },
                    (error) => {
                        console.error('Mesaj okundu olarak işaretlenemedi', error);
                    }
                );
            });
        }
    }
    startChat() {

        this.assignSupportToConversation(this.selectedUser.conversationId, this.userid);

        // Sohbetin başlatıldığını UI'de belirtmek için
        this.selectedConversation.isInProgress = true;
        this.selectedConversation.isAssignedToSupport = true;
        this.selectedConversation.supportUserId = this.userid;

        // Sohbet paneline yönlendir
        this.isShowUserChat = true;



    }
    assignSupportToConversation(conversationId: string, supportUserId: string) {
        const conversation = {
            conversationId: conversationId,
            supportUserId: supportUserId
        };

        // Destek ataması için API çağrısı
        this.chatService.assignSupport(conversation).subscribe(
            (response: any) => {

                const message = {
                    conversationId: this.selectedUser.conversationId,
                    messageText: "Kullanıcı Atandı",
                    senderName: this.userName,  // Kullanıcı adı burada
                    senderId: {
                        _id: this.userid,
                        kullaniciAdi: this.userName
                    }
                }


                // Mesajı gönder
                this.chatService.sendMessageDestek(message).subscribe((data: any) => {

                  //  this.scrollToBottom();

                });

                this.getActiveConversations(); // Konuşmaları güncelle
            },
            (error) => {
                console.error('Destek atama hatası:', error);
            }
        );
    }
    selectUser(user: any) {
        this.selectedUser = user;  // Seçilen kullanıcıyı set et
        this.isShowUserChat = true;

        const userbilgi = {
            userId: user.userId

        };


        this.userservice.getUserbyId(userbilgi).subscribe((userDetails: any) => {
            this.selectedUser = { ...this.selectedUser, ...userDetails };
          //  console.log('Selected User22:', this.selectedUser);
        });
        // Sohbet mesajlarını al
        this.chatService.getMessages(user.conversationId).subscribe((data: any) => {
            this.messages = data.messages;

            this.markMessagesAsRead(this.messages);
            // // Mesajları doğru şekilde işleme
            // this.messages.forEach(message => {
            //     // Eğer mesaj kullanıcıdan geldiyse, isUser true olacak
            //     message.isUser = message.senderId._id === this.userid;  // Kullanıcı mı destek mi kontrolü
            //     // Gönderenin ismini doğru şekilde ayarlıyoruz
            //     message.senderName = message.isUser ? this.userName : message.senderName;
            // });

            this.scrollToBottom();
            //   console.log('Received messages:', this.messages);
        });

        this.scrollToBottom();
        //console.log('Selected User:', this.selectedUser);  // Debugging: selectedUser doğru şekilde güncelleniyor mu?
    }



    sendMessage() {
        if (this.textMessage.trim() !== '' && this.selectedUser) {
            const message = {
                conversationId: this.selectedUser.conversationId,
                messageText: this.textMessage,
                senderName: this.userName,  // Kullanıcı adı burada
                senderId: {
                    _id: this.userid,
                    kullaniciAdi: this.userName
                }
            };

            // Mesajı gönder
            this.chatService.sendMessageDestek(message).subscribe((data: any) => {
                // Mesaj gönderildikten sonra işlemler
                // this.messages.push({
                //     ...message,
                //     status: 'sent'
                // });
                this.scrollToBottom();
                this.textMessage = '';  // Mesaj kutusunu temizle
            });
        }
    }






    scrollToBottom() {
        if (this.isShowUserChat) {
            setTimeout(() => {
                this.scrollable.scrollTo({ bottom: 0 });
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

}
