import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { SeoService, SITE_URL } from '../../core/services/seo.service';
import { Product } from '../../core/models';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { ProductModal } from '../../shared/components/product-modal/product-modal';
import { BrandCarousel } from '../../shared/components/brand-carousel/brand-carousel';

const FEATURED_BRAND_IDS = ['chardon', 'weidmann', 'abb'];

const HERO_DESCRIPTION =
  'Accesorios y aislantes para equipos de media y baja tensión. Soluciones confiables que garantizan seguridad, rendimiento y durabilidad en cada instalación.';

@Component({
  selector: 'app-home',
  imports: [ProductCard, ProductModal, BrandCarousel],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  protected readonly data = inject(DataService);

  protected readonly selectedProduct = signal<Product | null>(null);

  protected readonly featuredBrands = computed(() =>
    FEATURED_BRAND_IDS.map((brandId) => ({
      brandId,
      brand: this.data.brands().find((b) => b.id === brandId),
      products: this.data.featuredByBrand(brandId, 4)(),
    })),
  );

  constructor() {
    this.seo.update({
      title: 'ENTO — Aislantes e Ingeniería | Accesorios para media y baja tensión',
      description: HERO_DESCRIPTION,
      path: '/',
    });

    this.seo.setJsonLd('ld-organization', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'ENTO Aislantes e Ingeniería',
      url: SITE_URL,
      telephone: '+52 33 1013 9492',
      email: 'ventas@aislanteseingenieria.com',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Colón 1020, Col. Moderna',
        postalCode: '44190',
        addressLocality: 'Guadalajara',
        addressRegion: 'Jalisco',
        addressCountry: 'MX',
      },
    });

    effect(() => {
      const products = this.featuredBrands().flatMap((section) => section.products);
      if (products.length === 0) {
        return;
      }
      this.seo.setJsonLd(
        'ld-featured-products',
        products.map((product) => ({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          image: `${SITE_URL}${product.imageUrl}`,
          brand: { '@type': 'Brand', name: product.brandId },
        })),
      );
    });
  }

  goToBrand(brandId: string): void {
    this.router.navigate(['/productos'], { queryParams: { brand: brandId } });
  }

  openProduct(product: Product): void {
    this.selectedProduct.set(product);
  }

  closeProduct(): void {
    this.selectedProduct.set(null);
  }
}
