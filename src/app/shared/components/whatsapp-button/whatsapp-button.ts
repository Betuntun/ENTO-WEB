import { Component } from '@angular/core';

const PHONE = '523310139492';
const MESSAGE = 'Hola, quiero cotizar un producto de ENTO';

@Component({
  selector: 'app-whatsapp-button',
  templateUrl: './whatsapp-button.html',
  styleUrl: './whatsapp-button.scss',
})
export class WhatsappButton {
  readonly href = `https://wa.me/${PHONE}?text=${encodeURIComponent(MESSAGE)}`;
}
