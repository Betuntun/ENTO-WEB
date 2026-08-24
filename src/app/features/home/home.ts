import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { BrandCarousel } from '../../shared/components/brand-carousel/brand-carousel';

interface FeaturedBrandSection {
  brandId: string;
  brandName: string;
}

const FEATURED_BRANDS: FeaturedBrandSection[] = [
  { brandId: 'chardon', brandName: 'Chardón' },
  { brandId: 'weidmann', brandName: 'Weidmann' },
  { brandId: 'abb', brandName: 'ABB' },
];

@Component({
  selector: 'app-home',
  imports: [ProductCard, BrandCarousel],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly router = inject(Router);
  protected readonly data = inject(DataService);

  protected readonly featuredBrands = FEATURED_BRANDS.map((section) => ({
    ...section,
    products: this.data.featuredByBrand(section.brandId, 4),
  }));

  goToBrand(brandId: string): void {
    this.router.navigate(['/productos'], { queryParams: { brand: brandId } });
  }
}
