import { TestBed } from '@angular/core/testing';
import { BrandCarousel } from './brand-carousel';
import { Brand } from '../../../core/models';

function makeBrand(id: string): Brand {
  return { id, name: id, logoUrl: '', hasGroups: false, hasProducts: true };
}

function createComponent(brands: Brand[]) {
  const fixture = TestBed.createComponent(BrandCarousel);
  fixture.componentRef.setInput('brands', brands);
  fixture.detectChanges();
  return fixture.componentInstance;
}

describe('BrandCarousel', () => {
  it('shows the full brand list in both rows, not a partition between them', () => {
    const brands = ['a', 'b', 'c', 'd'].map(makeBrand);
    const component = createComponent(brands);

    expect(component.topRow().map((b) => b.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(component.bottomRow().map((b) => b.id).sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('offsets the bottom row by half the list so columns never align on the same brand', () => {
    const brands = ['a', 'b', 'c', 'd'].map(makeBrand);
    const component = createComponent(brands);

    expect(component.bottomRow().map((b) => b.id)).toEqual(['c', 'd', 'a', 'b']);
    component.topRow().forEach((brand, i) => {
      expect(component.bottomRow()[i].id).not.toBe(brand.id);
    });
  });

  it('handles an odd-length list with a floor offset', () => {
    const brands = ['a', 'b', 'c'].map(makeBrand);
    const component = createComponent(brands);

    expect(component.topRow().map((b) => b.id)).toEqual(['a', 'b', 'c']);
    expect(component.bottomRow().map((b) => b.id)).toEqual(['b', 'c', 'a']);
  });

  it('handles an empty brand list without throwing', () => {
    const component = createComponent([]);

    expect(component.topRow()).toEqual([]);
    expect(component.bottomRow()).toEqual([]);
  });

  it('handles a single brand the same way in both rows', () => {
    const component = createComponent([makeBrand('solo')]);

    expect(component.topRow().map((b) => b.id)).toEqual(['solo']);
    expect(component.bottomRow().map((b) => b.id)).toEqual(['solo']);
  });
});
