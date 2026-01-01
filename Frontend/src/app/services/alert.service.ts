import { Injectable, signal } from '@angular/core';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface AlertState {
    isOpen: boolean;
    type: AlertType;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    resolve?: (value: boolean) => void;
}

@Injectable({
    providedIn: 'root' // Global service
})
export class AlertService {
    readonly alertState = signal<AlertState>({
        isOpen: false,
        type: 'info',
        title: '',
        message: ''
    });

    success(title: string, message: string = ''): Promise<boolean> {
        return this.show('success', title, message);
    }

    error(title: string, message: string = ''): Promise<boolean> {
        return this.show('error', title, message);
    }

    confirm(title: string, message: string, confirmLabel: string = 'Yes, I\'m sure', cancelLabel: string = 'Cancel'): Promise<boolean> {
        return this.show('confirm', title, message, confirmLabel, cancelLabel);
    }

    private show(type: AlertType, title: string, message: string, confirmLabel?: string, cancelLabel?: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.alertState.set({
                isOpen: true,
                type,
                title,
                message,
                confirmLabel,
                cancelLabel,
                resolve
            });
        });
    }

    close(result: boolean) {
        const state = this.alertState();
        if (state.resolve) {
            state.resolve(result);
        }
        this.alertState.update(s => ({ ...s, isOpen: false }));
    }
}
