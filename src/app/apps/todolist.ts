import { Component, ViewChild } from '@angular/core';
import { toggleAnimation } from 'src/app/shared/animations';
import { NgxCustomModalComponent } from 'ngx-custom-modal';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TodoService } from 'src/app/service/todo.service.js';
import { catchError, of } from 'rxjs';
import { NotificationService } from './NotificationService';
import { TranslateService } from '@ngx-translate/core';

@Component({
    templateUrl: './todolist.html',
    animations: [toggleAnimation],
})
export class TodolistComponent {
    constructor(public fb: FormBuilder,
        private todoService: TodoService,
        private notificationService: NotificationService,
        private translate: TranslateService,

    ) { }
    @ViewChild('addTaskModal') addTaskModal!: NgxCustomModalComponent;
    @ViewChild('viewTaskModal') viewTaskModal!: NgxCustomModalComponent;

    defaultParams = {
        id: "",
        title: "",
        aciklama: "",
        tag: "",
        onemDerecesi: "",
        olusturanUserID: "1",
        atananUserID: ["1"],
        statu: "",
        olusturmaTarihi: new Date(),
        guncellemeTarihi: new Date(),
        hedefTarihi: new Date(),
    };

    selectedTab = "";
    isShowTaskMenu = false;

    allTodos = [
        {
            id: "",
            title: "",
            aciklama: "",
            tag: "",
            onemDerecesi: "",
            olusturanUserID: "1",
            atananUserID: [
                "1"
            ],
            statu: "",
            olusturmaTarihi: new Date(),  // Tarih olarak saklamak için Date kullanıyoruz
            guncellemeTarihi: new Date(),  // Tarih olarak saklamak için Date kullanıyoruz
            hedefTarihi: "",
        }
    ];

    params!: FormGroup;

    filteredTasks: any = [];
    pagedTasks: any = [];
    searchTask = '';
    selectedTask: any = this.defaultParams;
    isPriorityMenu: any = null;
    isTagMenu: any = null;
    allPersonal: any = [];

    userRole: any;

    pager = {
        currentPage: 1,
        totalPages: 0,
        pageSize: 10,
        startIndex: 0,
        endIndex: 0,
    };

    editorOptions = {
        toolbar: [[{ header: [1, 2, false] }], ['bold', 'italic', 'underline', 'link'], [{ list: 'ordered' }, { list: 'bullet' }], ['clean']],
    };

    ngOnInit() {
        this.searchTasks();
        this.getAllTodos();
        this.initForm();
        this.getPersonal();
        this.userRole = localStorage.getItem('role');
    }

    initForm() {
        this.params = this.fb.group({
            id: [null],
            title: ['', Validators.required],
            aciklama: [''],
            atananUserID: [[]],
            tag: [''],
            onemDerecesi: [''],
            statu: ['Yeni Açıldı'], // Default value
            hedefTarihi: [''],
        });
    }

    formatDateTime(date: Date | string | null): string {
        if (!date) return ''; // Eğer tarih null veya boşsa, boş döner

        const localDate = new Date(date);

        // Yerel saat dilimine göre tarih hesaplama (getTimezoneOffset kullanarak)
        const offset = localDate.getTimezoneOffset();
        localDate.setMinutes(localDate.getMinutes() - offset);

        // Date objesinin yerel formatta uygun şekilde döndürülmesi
        return localDate.toISOString().slice(0, 16); // 'yyyy-MM-ddTHH:mm' formatına dönüştür
    }

    // Method to get the number of tasks assigned to the current user
    getAssignedTasksCount(): number {
        const userId = localStorage.getItem('userid');
        if (!userId) return 0;

        // Count how many tasks are assigned to the user for 'Bana Atanan'
        const assignedTasks = this.allTodos.filter((task) =>
            Array.isArray(task.atananUserID)
                ? task.atananUserID.includes(userId)
                : task.atananUserID === userId
        );
        return assignedTasks.length;
    }

    getAllTodos() {
        this.todoService.getTodos().pipe(
            catchError((error) => {
                console.error('Data fetch failed', error);
                this.notificationService.showNotification(this.translate.instant("couldnotfetchpermissions"), 'danger', 'top-end');

                return of(null);
            })
        ).subscribe(response => {
            if (response) {
                this.allTodos = response;
                this.tabChanged('Yeni Açıldı');
                // this.statusMessages['permission'].error = null; // Updated to bracket notation
            }
        });
    }

    getPersonal() {
        this.todoService.getPersonal().pipe(
            catchError((error) => {
                console.error('Data fetch failed', error);
                this.notificationService.showNotification(this.translate.instant("couldnotfetchpermissions"), 'danger', 'top-end');

                return of(null);
            })
        ).subscribe(response => {
            if (response) {
                this.allPersonal = response;
                // this.statusMessages['permission'].error = null; // Updated to bracket notation
            }
        });
    }

    searchTasks(isResetPage = true) {
        if (isResetPage) {
            this.pager.currentPage = 1;
        }

        let res = this.allTodos;  // Başlangıç olarak tüm veriyi res'e ata

        const userId = localStorage.getItem('userid');

        switch (this.selectedTab) {
            case 'Bana Atanan':
                if (userId) {
                    res = res.filter((d) => Array.isArray(d.atananUserID)
                        ? d.atananUserID.includes(userId)
                        : d.atananUserID === userId);
                }
                break;
            case 'Tamamlandı':
            case 'Yeni Açıldı':
            case 'Test':
            case 'İptal Edildi':
                res = res.filter((d) => d.statu === this.selectedTab);
                break;
            case 'Hata':
            case 'Geliştirme':
            case 'İyileştirme':
                res = res.filter((d) => d.tag === this.selectedTab);
                break;
            case 'Düşük':
            case 'Orta':
            case 'Yüksek':
                res = res.filter((d) => d.onemDerecesi === this.selectedTab);
                break;
            default:
                res = res.filter((d) => d.statu != 'İptal Edildi');
                break;
        }

        // Son arama filtresi
        if (this.searchTask) {
            res = res.filter((d) => d.title?.toLowerCase().includes(this.searchTask.toLowerCase()));
        }

        this.filteredTasks = res;
        this.getPager();
    }


    getPager() {
        setTimeout(() => {
            if (this.filteredTasks.length) {
                this.pager.totalPages = this.pager.pageSize < 1 ? 1 : Math.ceil(this.filteredTasks.length / this.pager.pageSize);
                if (this.pager.currentPage > this.pager.totalPages) {
                    this.pager.currentPage = 1;
                }
                this.pager.startIndex = (this.pager.currentPage - 1) * this.pager.pageSize;
                this.pager.endIndex = Math.min(this.pager.startIndex + this.pager.pageSize - 1, this.filteredTasks.length - 1);
                this.pagedTasks = this.filteredTasks.slice(this.pager.startIndex, this.pager.endIndex + 1);
            } else {
                this.pagedTasks = [];
                this.pager.startIndex = -1;
                this.pager.endIndex = -1;
            }
        });
    }

    setPriority(task: any, name: string = '') {
        let item = this.filteredTasks.find((d: { id: any }) => d.id === task.id);
        item.onemDerecesi = name;
        this.saveTask();
        this.searchTasks(false);
    }

    setTag(task: any, name: string = '') {
        let item = this.filteredTasks.find((d: { id: any }) => d.id === task.id);
        item.tag = name;
        this.saveTask();
        this.searchTasks(false);
    }

    tabChanged(type: any = null) {
        this.selectedTab = type;
        this.searchTasks();
        this.isShowTaskMenu = false;
    }

    taskComplete(task: any = null) {
        let item = this.filteredTasks.find((d: { id: any }) => d.id === task.id);
        item.status = item.status === 'complete' ? '' : 'complete';
        this.searchTasks(false);
    }

    setImportant(task: any = null) {
        let item = this.filteredTasks.find((d: { id: any }) => d.id === task.id);
        item.status = item.status === 'important' ? '' : 'important';
        this.searchTasks(false);
    }

    viewTask(item: any = null) {
        this.selectedTask = item;
        setTimeout(() => {
            this.viewTaskModal.open();
        });
    }

    addEditTask(task: any = null) {
        this.isShowTaskMenu = false;
        this.addTaskModal.open();
        this.initForm();

        if (task) {
            this.params.patchValue({
                id: task._id,
                title: task.title,
                aciklama: task.aciklama,
                atananUserID: task.atananUserID,
                tag: task.tag,
                onemDerecesi: task.onemDerecesi,
                statu: task.statu,
                hedefTarihi: task.hedefTarihi

            });

        }

    }

    deleteTask(task: any, type: string = '') {
        if (type === 'delete') {
            console.log(task._id);
            this.todoService.deleteTodo(task._id).subscribe({
                next: () => {
                    this.allTodos = this.allTodos.map((d: any) => (d.id === task._id ? { ...d, ...task } : d));
                    this.searchTasks();
                    this.notificationService.showNotification(this.translate.instant('Task has been deleted successfully.'), 'success', 'top-end');
                    this.getAllTodos();

                },
                error: (error) => {
                    console.error('Failed to delete task', error);
                    this.notificationService.showNotification(this.translate.instant('Failed to deleted task.'), 'danger', 'top-end');

                },
            });
        }
        if (type === 'deletePermanent') {
            this.allTodos = this.allTodos.filter((d: any) => d.id != task.id);
        } else if (type === 'restore') {
            let currtask = this.allTodos.find((d: any) => d.id === task.id);
            currtask!.statu = '';
        }
        this.searchTasks(false);
    }

    saveTask() {
        if (this.params.invalid) {
            this.notificationService.showNotification(this.translate.instant('Title is required.'), 'danger', 'top-end');
            return;
        }
        // Hedef Tarih'in formatını düzenleyin

        console.log(this.params.value);

        const taskData = this.params.value;
        const isUpdate = Boolean(taskData.id);

        if (taskData.hedefTarihi) {
            taskData.hedefTarihi = this.formatDateTime(new Date(taskData.hedefTarihi));
        }


        if (isUpdate) {
            this.todoService.updateTodoById(taskData.id, taskData).subscribe({
                next: () => {
                    this.allTodos = this.allTodos.map((d: any) => (d.id === taskData.id ? { ...d, ...taskData } : d));
                    this.searchTasks();
                    this.notificationService.showNotification(this.translate.instant('Task has been updated successfully.'), 'success', 'top-end');
                    this.getAllTodos();
                },
                error: (error) => {
                    console.error('Failed to update task', error);
                    this.notificationService.showNotification(this.translate.instant('Failed to update task.'), 'danger', 'top-end');
                },
            });

        } else {
            this.todoService.addTodo(taskData).subscribe({
                next: (response) => {
                    const newTask = { ...taskData, id: response.id };
                    this.allTodos.unshift(newTask);
                    this.searchTasks();
                    this.notificationService.showNotification(this.translate.instant('Task has been saved successfully..'), 'success', 'top-end');
                    this.getAllTodos();
                },
                error: (error) => {
                    console.error('Failed to add task', error);
                    this.notificationService.showNotification(this.translate.instant('Failed to add task.'), 'danger', 'top-end');
                },
            });
        }
        this.addTaskModal.close();
    }


    setDiscriptionText(event: any) {
        this.params.patchValue({ aciklama: event.text });
    }

    getTasksLength(type: string) {
        return this.allTodos.filter((task) => task.statu == type).length;
    }

    getRemainingTime(targetDate: Date): string {
        if (!targetDate) return '';

        const now = new Date();
        const diffTime = new Date(targetDate).getTime() - now.getTime();

        // If the target date is in the past, return "Expired" or "Deadline passed"
        if (diffTime < 0) {
            return 'Expired';
        }

        const days = Math.floor(diffTime / (1000 * 3600 * 24));
        const hours = Math.floor((diffTime % (1000 * 3600 * 24)) / (1000 * 3600));

        if (days > 0) {
            return `${days} days left`;
        } else if (hours > 0) {
            return `${hours} hours left`;
        } else {
            return `Less than 1 hour left`;
        }
    }


}
