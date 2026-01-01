import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { MobileMenu } from './components/mobile-menu/mobile-menu';
import { ToastComponent } from './components/toast/toast';
import { AlertModal } from './components/ui-custom/alert-modal/alert-modal';
import { LayoutService } from './services/layout.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, MobileMenu, ToastComponent, AlertModal],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Sri Vanaja Jewellery');
  layoutService = inject(LayoutService);
}
