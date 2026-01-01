import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-toast',
    templateUrl: './toast.html',
    standalone: true
})
export class ToastComponent {
    toastService = inject(ToastService);
}
