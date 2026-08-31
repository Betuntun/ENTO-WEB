import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { Header } from './header';

async function createComponent(initialUrl = '/') {
  TestBed.configureTestingModule({
    imports: [Header],
    providers: [provideRouter([{ path: '**', children: [] }])],
  });

  const router = TestBed.inject(Router);
  if (initialUrl !== '/') {
    await router.navigateByUrl(initialUrl);
  }

  const fixture = TestBed.createComponent(Header);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, router };
}

describe('Header search', () => {
  it('does not navigate on input while outside /productos', async () => {
    const { component, router } = await createComponent('/');
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.onSearchInput('boquilla');

    expect(component.searchTerm()).toBe('boquilla');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('navigates live to /productos with the query on every keystroke while already on /productos', async () => {
    const { component, router } = await createComponent('/productos');
    const navigateSpy = vi.spyOn(router, 'navigate').mockReturnValue(Promise.resolve(true));

    component.onSearchInput('boq');

    expect(navigateSpy).toHaveBeenCalledWith(['/productos'], {
      queryParams: { q: 'boq' },
      queryParamsHandling: 'merge',
    });
  });

  it('navigates with a null q param (not empty string) when the search is cleared on /productos', async () => {
    const { component, router } = await createComponent('/productos');
    const navigateSpy = vi.spyOn(router, 'navigate').mockReturnValue(Promise.resolve(true));

    component.onSearchInput('');

    expect(navigateSpy).toHaveBeenCalledWith(['/productos'], {
      queryParams: { q: null },
      queryParamsHandling: 'merge',
    });
  });

  it('does nothing on submit with an empty term while outside /productos', async () => {
    const { component, router } = await createComponent('/');
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.onSearchSubmit();

    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('navigates to /productos on submit even with an empty term while already on /productos', async () => {
    const { component, router } = await createComponent('/productos');
    const navigateSpy = vi.spyOn(router, 'navigate').mockReturnValue(Promise.resolve(true));

    component.onSearchSubmit();

    expect(navigateSpy).toHaveBeenCalledWith(['/productos'], {
      queryParams: { q: null },
      queryParamsHandling: 'merge',
    });
  });

  it('trims whitespace from the term on submit', async () => {
    const { component, router } = await createComponent('/');
    const navigateSpy = vi.spyOn(router, 'navigate').mockReturnValue(Promise.resolve(true));

    component.searchTerm.set('  boquilla  ');
    component.onSearchSubmit();

    expect(navigateSpy).toHaveBeenCalledWith(['/productos'], {
      queryParams: { q: 'boquilla' },
      queryParamsHandling: 'merge',
    });
  });
});

describe('Header isOnProductsPage', () => {
  it('is false on the home route', async () => {
    const { component } = await createComponent('/');
    expect(component.isOnProductsPage()).toBe(false);
  });

  it('is true on /productos regardless of query params', async () => {
    const { component } = await createComponent('/productos?brand=chardon&q=foo');
    expect(component.isOnProductsPage()).toBe(true);
  });
});
