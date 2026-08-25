import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export const SITE_URL = 'https://www.ento-web.example.com'; // TODO: reemplazar con el dominio real de producción

export interface SeoData {
  title: string;
  description: string;
  path: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  update(data: SeoData): void {
    const url = `${SITE_URL}${data.path}`;
    this.title.setTitle(data.title);
    this.meta.updateTag({ name: 'description', content: data.description });
    this.meta.updateTag({ property: 'og:title', content: data.title });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.setCanonical(url);
  }

  private setCanonical(url: string): void {
    // La URL canónica ignora los query params de filtro (?brand=, ?group=, ?q=) a
    // propósito: todas esas variantes de /productos deben canonicalizar a la misma
    // página base para evitar contenido duplicado ante los buscadores.
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  setJsonLd(id: string, json: unknown): void {
    const existing = this.document.getElementById(id);
    existing?.remove();

    const script = this.document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.text = JSON.stringify(json);
    this.document.head.appendChild(script);
  }
}
