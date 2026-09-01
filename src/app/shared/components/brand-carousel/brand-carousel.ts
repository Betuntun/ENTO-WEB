import { Component, computed, input } from '@angular/core';
import { Brand } from '../../../core/models';

@Component({
  selector: 'app-brand-carousel',
  templateUrl: './brand-carousel.html',
  styleUrl: './brand-carousel.scss',
})
export class BrandCarousel {
  readonly brands = input.required<Brand[]>();

  // Ambas filas muestran el set completo de marcas (no una partición entre
  // ellas) — cada fila anima en su propia dirección, pero todas las marcas
  // deben verse tanto arriba como abajo.
  readonly topRow = computed(() => this.brands());
  readonly bottomRow = computed(() => this.brands());
}
