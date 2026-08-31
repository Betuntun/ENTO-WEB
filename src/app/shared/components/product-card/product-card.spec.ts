import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProductCard } from './product-card';
import { Brand, Product } from '../../../core/models';

const BRANDS: Brand[] = [{ id: 'abb', name: 'ABB', logoUrl: '', hasGroups: false, hasProducts: true }];
const PRODUCT: Product = { id: 'p1', name: 'Boquilla', brandId: 'abb', groupIds: [], imageUrl: '/img.png' };

async function createComponent(product: Product) {
  TestBed.configureTestingModule({
    imports: [ProductCard],
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });

  const httpMock = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(ProductCard);
  fixture.componentRef.setInput('product', product);
  fixture.detectChanges();

  httpMock.expectOne('/data/products.json').flush([]);
  httpMock.expectOne('/data/brands.json').flush(BRANDS);
  httpMock.expectOne('/data/groups.json').flush([]);
  await fixture.whenStable();
  fixture.detectChanges();

  return fixture;
}

describe('ProductCard', () => {
  it('resolves the brand name from the product brandId via DataService', async () => {
    const fixture = await createComponent(PRODUCT);
    expect(fixture.componentInstance.brandName()).toBe('ABB');
  });

  it('falls back to an empty string when the brand cannot be found', async () => {
    const fixture = await createComponent({ ...PRODUCT, brandId: 'unknown' });
    expect(fixture.componentInstance.brandName()).toBe('');
  });

  it('emits activated with the product on click', async () => {
    const fixture = await createComponent(PRODUCT);
    const emitted: Product[] = [];
    fixture.componentInstance.activated.subscribe((p) => emitted.push(p));

    (fixture.nativeElement as HTMLElement).querySelector('.product-card')!.dispatchEvent(
      new Event('click', { bubbles: true }),
    );

    expect(emitted).toEqual([PRODUCT]);
  });

  it('renders the product image with alt text and lazy loading', async () => {
    const fixture = await createComponent(PRODUCT);
    const img = (fixture.nativeElement as HTMLElement).querySelector('img')!;
    expect(img.src).toContain('/img.png');
    expect(img.alt).toBe('Boquilla');
    expect(img.getAttribute('loading')).toBe('lazy');
  });
});
