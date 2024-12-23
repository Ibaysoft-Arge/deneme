import { Component, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxCustomModalComponent } from 'ngx-custom-modal';
import { FullCalendarComponent } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Store } from '@ngrx/store';
import { ReservationService } from 'src/app/service/reservation.service';
import { catchError, of } from 'rxjs';
import { NotificationService } from 'src/app/apps/NotificationService';
import { MagazaService } from 'src/app/service/magaza.service';
import { MasaService } from 'src/app/service/masa.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-calendar',
    templateUrl: './calendar.html',
})
export class CalendarComponent implements OnInit {
    @ViewChild('isAddEventModal') isAddEventModal!: NgxCustomModalComponent;
    @ViewChild('calendar') calendar!: FullCalendarComponent;

    isLoading = true;
    params!: FormGroup;
    tables: any[] = [];
    events: any = [];
    calendarOptions: any;
    selectedTableID: string = '';
    selectedTableCapacity: number = 1;
    magazalar: any[] = [];
    selectedMagazaId: string = '';


    constructor(
        private fb: FormBuilder,
        private storeData: Store<any>,
        private reservationService: ReservationService,
        private notificationService: NotificationService,
        private magazaService: MagazaService,
        private masaService: MasaService,
        private translate: TranslateService,

    ) { }

    ngOnInit() {
        this.initForm(); // Formu başlat
        this.initCalendar();
        this.getMagazalar();
    }

    initForm() {
        const today = new Date(); // Bugünün tarih ve saatini al
        const isoDate = today.toISOString().split('T')[0]; // YYYY-MM-DD formatında bugünün tarihi
        const time = today.toTimeString().split(' ')[0]; // HH:mm:ss formatında bugünün saati

        this.params = this.fb.group({
            id: [null], // Varsayılan olarak null
            title: [''],
            reservationDate: [isoDate, Validators.required], // Bugün tarihi
            startTime: [time, Validators.required], // Şu anki saat
            reservationDateEnd: [isoDate, Validators.required], // Varsayılan olarak bugünün tarihi
            endTime: [time], // Varsayılan olarak şu anki saat
            notes: [''],
            clientCount: [0, [Validators.min(1), Validators.max(this.selectedTableCapacity)]], // Kişi sayısı için validator
            type: ['primary'],
            table: ['', Validators.required],
            status: [''],
            magaza: ['', Validators.required], // Magaza form kontrolü
        });
    }

    initCalendar() {
        this.calendarOptions = {
            plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
            },
            editable: true,
            selectable: true,
            eventClick: (eventClickInfo: any) => this.editEvent(eventClickInfo),
            select: (selectionInfo: any) => this.editDate(selectionInfo),
        };
    }

    getTables(id: string) {
        this.masaService.getMasalarByMagaza(id).subscribe(response => {
            this.tables = response || [];
            if (this.tables.length > 0) {
                this.selectedTableCapacity = this.tables[0].currentGuests || 1;
            }
        });
    }

    getMagazalar() {
        this.magazaService.getMagazalarim().subscribe(response => {
            this.magazalar = response || [];
            if (this.magazalar.length > 0) {
                this.getTables(this.magazalar[0]._id); // İlk mağazaya ait tabloları al
                this.getEvents(this.magazalar[0]._id); // İlk mağazaya ait etkinlikleri al
            }
            this.selectedMagazaId = this.magazalar[0]._id;
        });
        this.clearForm();

    }

    onTableChange() {
        const selectedTableId = this.params.value.table;
        const selectedTable = this.tables.find(table => table._id === selectedTableId);

        if (selectedTable) {
            // Seçilen masanın kapasitesini al
            this.selectedTableCapacity = selectedTable.capacity || 1; // Masa kapasitesini al
            this.selectedTableCapacity = selectedTable.currentGuests || this.selectedTableCapacity; // Eğer currentGuests varsa, kapasiteyi ona göre belirle

            // clientCount için maksimum değeri güncelle
            this.params.get('clientCount')?.setValidators([
                Validators.min(1),
                Validators.max(this.selectedTableCapacity)
            ]);
            this.params.get('clientCount')?.updateValueAndValidity(); // Validasyonları güncelle
        }
    }

    // Mağaza değişimi sonrası yapılacak işlem
    onMagazaChange() {
        console.log("Seçilen Mağaza ID'si: ", this.selectedMagazaId);
    
        // Mevcut tablolar ve etkinlikleri temizle
        this.tables = [];
        this.events = [];
        if (this.calendar) {
            this.calendar.getApi().removeAllEvents(); 
        }
    
        // Yeni mağazanın tablolarını ve etkinliklerini getir
        this.getTables(this.selectedMagazaId);
        this.getEvents(this.selectedMagazaId);
    
        // Formu varsayılan değerlerle sıfırla
        const today = new Date();
        const isoDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const time = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
    
        this.params.reset({
            id: null,
            title: '',
            reservationDate: isoDate,
            startTime: time,
            reservationDateEnd: isoDate,
            endTime: time,
            notes: '',
            clientCount: 1,
            type: 'primary',
            table: '',
            status: 'pending',
            magaza: this.selectedMagazaId,
        });
    }
    

    getEvents(id: String) {
        this.reservationService.getReservationsByMagaza(id).pipe(

            catchError((error) => {
                console.error('Ödeme Tipi silme hatası:', error);
                if (error?.error?.message && error.error.message.includes('Bu mağazaya ait rezervasyon bulunamadı.')) {
                    this.notificationService.showNotification(
                        this.translate.instant("Bu mağazaya ait rezervasyon bulunamadı"),
                        'error',
                        'top-end'
                    );
                } else {
                    this.notificationService.showNotification('Etkinlikler alınamadı', 'danger', 'top-end');

                }
                return of(null); // Hata durumunda boş değer döndür
            })



        ).subscribe((response: any) => {
            this.events = response.map((reservation: any) => ({
                id: reservation._id,
                title: reservation.table.tableName,
                start: `${reservation.reservationDate.split('T')[0]}T${reservation.startTime}`,
                end: `${reservation.reservationDate.split('T')[0]}T${reservation.endTime}`,
                className: this.getClassName(reservation.status),
                description: reservation.notes || '',
                table: reservation.table
            }));
            this.calendarOptions.events = this.events;
        });
    }

    private getClassName(status: string): string {
        switch (status) {
            case 'pending': return 'primary';
            case 'confirmed': return 'success';
            case 'cancelled': return 'danger';
            default: return 'primary';
        }
    }

    addReservation(reservationData: any) {
        this.reservationService.addReservation(reservationData).pipe(
            catchError(error => {
                this.notificationService.showNotification('Rezervasyon kaydedilemedi', 'danger', 'top-end');
                return of(null);
            })
        ).subscribe(response => {
            if (response) {
                this.notificationService.showNotification('Rezervasyon eklendi', 'success', 'top-end');
                this.isAddEventModal.close();
                this.params.reset();
                this.getEvents(this.selectedMagazaId);
            }
        });
    }

    updateReservation(reservationData: any) {
        this.reservationService.updateReservation(reservationData).pipe(
            catchError(error => {
                this.notificationService.showNotification('Rezervasyon güncellenemedi', 'danger', 'top-end');
                return of(null);
            })
        ).subscribe(response => {
            if (response) {
                this.notificationService.showNotification('Rezervasyon güncellendi', 'success', 'top-end');
                this.params.reset();
                this.isAddEventModal.close();
                this.getEvents(this.selectedMagazaId);
            }
        });
    }

    // Silme butonuna tıklanınca çağrılacak fonksiyon
    deleteReservation() {
        const eventId = this.params.value.id;

        if (!eventId) return;

        if (confirm('Are you sure you want to delete this event?')) {
            this.reservationService.deleteReservation(eventId).subscribe(
                response => {
                    this.notificationService.showNotification('Event deleted successfully', 'success', 'top-end');
                    this.isAddEventModal.close(); // Modalı kapat
                    this.params.reset(); // Formu sıfırla
                    this.getEvents(this.selectedMagazaId);
                },
                error => {
                    this.notificationService.showNotification('Error deleting event', 'danger', 'top-end');
                }
            );
        }
    }

    addOrUpdateReservation() {
        const reservationData = { ...this.params.value, magaza: this.selectedMagazaId };
        if (!reservationData.magaza) {
            this.notificationService.showNotification('Lütfen bir mağaza seçin', 'warning', 'top-end');
            return;
        }
        console.log(reservationData);

        if (reservationData.id) {
            this.updateReservation(reservationData);
        } else {
            this.addReservation(reservationData);
        }
    }

    editEvent(eventClickInfo: any = null) {
        const today = new Date(); // Bugünün tarihi ve saati
        const isoDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const time = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

        if (eventClickInfo) {
            const event = eventClickInfo.event;

            // Servisten gelen veriyi kullanarak formu güncelle
            const reservation = this.events.find((e: any) => e.id === event.id); // Servisteki etkinlikleri bul
            if (reservation) {
                this.params.patchValue({
                    id: reservation.id,
                    title: reservation.title,
                    reservationDate: reservation.start.split('T')[0] || isoDate,
                    startTime: reservation.start.split('T')[1] || time,
                    reservationDateEnd: reservation.end.split('T')[0] || isoDate,
                    endTime: reservation.end.split('T')[1] || time,
                    notes: reservation.description || '',
                    table: reservation.table?._id || '',
                    type: reservation.type || 'primary',
                    clientCount: reservation.clientCount || 1, // Servisten gelen clientCount değerini ekliyoruz
                    status: reservation.status || 'pending', // Servisten gelen durumu kullanıyoruz
                });
            }
        } else {
            // Eğer eventClickInfo yoksa formu varsayılan değerlerle resetle
            this.params.reset({
                id: null,
                title: '',
                reservationDate: isoDate,
                startTime: time,
                reservationDateEnd: isoDate,
                endTime: time,
                notes: '',
                clientCount: 1,
                type: 'primary',
                table: '',
                status: 'pending',
            });
        }

        // Modal'ı aç
        this.isAddEventModal.open();
    }

    editDate(selectionInfo: any) {
        this.params.patchValue({
            reservationDate: selectionInfo.startStr,
            reservationDateEnd: selectionInfo.endStr,
        });
        this.isAddEventModal.open();
    }

    clearForm() {

        const today = new Date(); // Bugünün tarih ve saatini al
        const isoDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const time = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

        this.params.reset({
            id: null,
            title: '',
            reservationDate: isoDate, // Bugün tarihi
            startTime: time, // Şu anki saat
            reservationDateEnd: isoDate, // Bugün tarihi
            endTime: time, // Şu anki saat
            notes: '',
            clientCount: 1,
            type: 'primary',
            table: '',
            status: 'pending',
            magaza: '', // Mağaza alanını sıfırla
        });

        this.selectedTableCapacity = 1; // Kapasiteyi varsayılan değere sıfırla
        this.selectedTableID = ''; // Seçilen tabloyu sıfırla
    }

}


