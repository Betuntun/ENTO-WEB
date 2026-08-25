import { Component, computed, input } from '@angular/core';
import { Brand } from '../../../core/models';

@Component({
  selector: 'app-brand-carousel',
  templateUrl: './brand-carousel.html',
  styleUrl: './brand-carousel.scss',
})
export class BrandCarousel {
  readonly brands = input.required<Brand[]>();

  readonly topRow = computed(() => {
    const half = Math.ceil(this.brands().length / 2);
    return this.brands().slice(0, half);
  });

  readonly bottomRow = computed(() => {
    const half = Math.ceil(this.brands().length / 2);
    return this.brands().slice(half);
  });
}
