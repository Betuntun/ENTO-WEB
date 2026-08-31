import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { SeoService, SITE_URL } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeoService);
    document = TestBed.inject(DOCUMENT);
    document.querySelector('link[rel="canonical"]')?.remove();
  });

  it('sets title and meta tags', () => {
    service.update({ title: 'Título', description: 'Descripción', path: '/ruta' });

    const title = TestBed.inject(Title);
    const meta = TestBed.inject(Meta);
    expect(title.getTitle()).toBe('Título');
    expect(meta.getTag('name="description"')?.content).toBe('Descripción');
    expect(meta.getTag('property="og:title"')?.content).toBe('Título');
    expect(meta.getTag('property="og:description"')?.content).toBe('Descripción');
    expect(meta.getTag('property="og:url"')?.content).toBe(`${SITE_URL}/ruta`);
    expect(meta.getTag('property="og:type"')?.content).toBe('website');
  });

  it('creates a canonical link on first update', () => {
    service.update({ title: 't', description: 'd', path: '/productos' });

    const link = document.querySelector('link[rel="canonical"]');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe(`${SITE_URL}/productos`);
  });

  it('reuses the same canonical link and overwrites its href on subsequent updates', () => {
    service.update({ title: 't', description: 'd', path: '/productos' });
    service.update({ title: 't2', description: 'd2', path: '/productos?brand=chardon' });

    const links = document.querySelectorAll('link[rel="canonical"]');
    expect(links.length).toBe(1);
    expect(links[0].getAttribute('href')).toBe(`${SITE_URL}/productos?brand=chardon`);
  });

  it('injects a JSON-LD script tag with the given id and serialized content', () => {
    service.setJsonLd('ld-test', { '@type': 'Organization', name: 'ENTO' });

    const script = document.getElementById('ld-test') as HTMLScriptElement | null;
    expect(script).toBeTruthy();
    expect(script?.type).toBe('application/ld+json');
    expect(JSON.parse(script!.text)).toEqual({ '@type': 'Organization', name: 'ENTO' });
  });

  it('replaces an existing JSON-LD script with the same id instead of duplicating it', () => {
    service.setJsonLd('ld-test', { a: 1 });
    service.setJsonLd('ld-test', { a: 2 });

    const scripts = document.querySelectorAll('#ld-test');
    expect(scripts.length).toBe(1);
    expect(JSON.parse((scripts[0] as HTMLScriptElement).text)).toEqual({ a: 2 });
  });
});
