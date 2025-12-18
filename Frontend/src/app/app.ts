import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { MobileMenu } from './components/mobile-menu/mobile-menu';
import { LayoutService } from './services/layout.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, MobileMenu],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Sri Vanaja Jewellery');
  layoutService = inject(LayoutService);
}
