import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProductModal } from './product-modal';
import { Brand, Product } from '../../../core/models';

const BRANDS: Brand[] = [{ id: 'weidmann', name: 'Weidmann', logoUrl: '', hasGroups: false, hasProducts: true }];
const PRODUCT: Product = { id: 'p1', name: 'Aislante', brandId: 'weidmann', groupIds: [], imageUrl: '/img.png' };

async function createComponent(product: Product) {
  TestBed.configureTestingModule({
    imports: [ProductModal],
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });

  const httpMock = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(ProductModal);
  fixture.componentRef.setInput('product', product);
  fixture.detectChanges();

  httpMock.expectOne('/data/products.json').flush([]);
  httpMock.expectOne('/data/brands.json').flush(BRANDS);
  httpMock.expectOne('/data/groups.json').flush([]);
  await fixture.whenStable();
  fixture.detectChanges();

  return fixture;
}

describe('ProductModal', () => {
  it('resolves the brand name from the product', async () => {
    const fixture = await createComponent(PRODUCT);
    expect(fixture.componentInstance.brandName()).toBe('Weidmann');
  });

  it('emits closed when close() is called', async () => {
    const fixture = await createComponent(PRODUCT);
    let closed = false;
    fixture.componentInstance.closed.subscribe(() => (closed = true));

    fixture.componentInstance.close();

    expect(closed).toBe(true);
  });

  it('emits closed when the Escape key is pressed', async () => {
    const fixture = await createComponent(PRODUCT);
    let closed = false;
    fixture.componentInstance.closed.subscribe(() => (closed = true));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(closed).toBe(true);
  });

  it('emits closed when the backdrop dismiss button is clicked', async () => {
    const fixture = await createComponent(PRODUCT);
    let closed = false;
    fixture.componentInstance.closed.subscribe(() => (closed = true));

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.product-modal-backdrop__dismiss')!
      .click();

    expect(closed).toBe(true);
  });

  it('renders product image, name and dialog role for accessibility', async () => {
    const fixture = await createComponent(PRODUCT);
    const root = fixture.nativeElement as HTMLElement;
    const dialog = root.querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe('Aislante');
    expect(root.querySelector('img')!.alt).toBe('Aislante');
  });
});
