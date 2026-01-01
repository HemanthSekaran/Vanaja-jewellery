import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../../services/alert.service';

@Component({
    selector: 'app-alert-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    @if (state().isOpen) {
      <!-- Backdrop -->
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
        
        <!-- Modal Card -->
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 scale-100 animate-in zoom-in-95" role="dialog" aria-modal="true">
          
          <!-- Icon Header -->
          <div class="p-6 flex justify-center pb-0">
             @switch (state().type) {
                @case ('success') {
                  <div class="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-bounce-short">
                     <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                }
                @case ('error') {
                   <div class="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center animate-shake">
                     <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                   </div>
                }
                @case ('warning') {
                   <div class="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
                     <svg class="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                   </div>
                }
                @case ('confirm') {
                   <div class="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                     <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                   </div>
                }
             }
          </div>

          <!-- Content -->
          <div class="p-6 text-center">
            <h3 class="text-2xl font-bold text-gray-900 mb-2">{{ state().title }}</h3>
            <p class="text-gray-500 text-lg leading-relaxed">{{ state().message }}</p>
          </div>

          <!-- Actions -->
          <div class="p-6 pt-0 flex gap-3 justify-center">
            @if (state().type === 'confirm') {
               <button 
                (click)="onCancel()"
                class="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all duration-200"
              >
                {{ state().cancelLabel || 'Cancel' }}
              </button>
            }
            
            <button 
              (click)="onConfirm()"
              [class]="confirmButtonClass"
            >
              {{ state().confirmLabel || 'OK' }}
            </button>
          </div>

        </div>
      </div>
    }
  `,
    styles: [`
    @keyframes bounce-short {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    .animate-bounce-short {
      animation: bounce-short 0.5s ease-in-out;
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    .animate-shake {
      animation: shake 0.4s ease-in-out;
    }
  `]
})
export class AlertModal {
    alertService = inject(AlertService);
    state = this.alertService.alertState;

    get confirmButtonClass(): string {
        const base = "px-8 py-2.5 rounded-xl font-semibold text-white shadow-lg focus:ring-4 transition-all duration-200 transform active:scale-95";
        switch (this.state().type) {
            case 'error': return `${base} bg-red-600 hover:bg-red-700 focus:ring-red-200 shadow-red-200`;
            case 'warning': return `${base} bg-amber-600 hover:bg-amber-700 focus:ring-amber-200 shadow-amber-200`;
            case 'success': return `${base} bg-green-600 hover:bg-green-700 focus:ring-green-200 shadow-green-200`;
            default: return `${base} bg-blue-600 hover:bg-blue-700 focus:ring-blue-200 shadow-blue-200`;
        }
    }

    onConfirm() {
        this.alertService.close(true);
    }

    onCancel() {
        this.alertService.close(false);
    }
}
