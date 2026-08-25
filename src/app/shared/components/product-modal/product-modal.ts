import { Component, HostListener, computed, inject, input, output } from '@angular/core';
import { Product } from '../../../core/models';
import { DataService } from '../../../core/services/data.service';

@Component({
  selector: 'app-product-modal',
  templateUrl: './product-modal.html',
  styleUrl: './product-modal.scss',
})
export class ProductModal {
  private readonly data = inject(DataService);

  readonly product = input.required<Product>();
  readonly closed = output<void>();

  readonly brandName = computed(
    () => this.data.brands().find((b) => b.id === this.product().brandId)?.name ?? '',
  );

  close(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}
