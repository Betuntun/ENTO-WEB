import { Component, computed, inject, input, output } from '@angular/core';
import { Product } from '../../../core/models';
import { DataService } from '../../../core/services/data.service';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  private readonly data = inject(DataService);

  readonly product = input.required<Product>();
  readonly activated = output<Product>();

  readonly brandName = computed(
    () => this.data.brands().find((b) => b.id === this.product().brandId)?.name ?? '',
  );
}
