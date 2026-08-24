import { Component, input } from '@angular/core';
import { Brand } from '../../../core/models';

@Component({
  selector: 'app-brand-carousel',
  templateUrl: './brand-carousel.html',
  styleUrl: './brand-carousel.scss',
})
export class BrandCarousel {
  readonly brands = input.required<Brand[]>();
}
