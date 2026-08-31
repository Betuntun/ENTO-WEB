import { TestBed } from '@angular/core/testing';
import { WhatsappButton } from './whatsapp-button';

describe('WhatsappButton', () => {
  it('builds a wa.me link with the phone number and a URL-encoded default message', () => {
    const fixture = TestBed.createComponent(WhatsappButton);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.href).toBe(
      'https://wa.me/523310139492?text=Hola%2C%20quiero%20cotizar%20un%20producto%20de%20ENTO',
    );
  });

  it('renders the link with target=_blank and rel=noopener for safe external navigation', () => {
    const fixture = TestBed.createComponent(WhatsappButton);
    fixture.detectChanges();

    const anchor = (fixture.nativeElement as HTMLElement).querySelector('a')!;
    expect(anchor.getAttribute('target')).toBe('_blank');
    expect(anchor.getAttribute('rel')).toBe('noopener');
    expect(anchor.getAttribute('href')).toBe(fixture.componentInstance.href);
  });
});
