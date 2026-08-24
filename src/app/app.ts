import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './shared/components/header/header';
import { Footer } from './shared/components/footer/footer';
import { WhatsappButton } from './shared/components/whatsapp-button/whatsapp-button';

@Component({
  imports: [RouterOutlet, Header, Footer, WhatsappButton],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
