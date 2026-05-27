import { describe, expect, it, vi } from 'vitest';
import { applyBrandingFavicon, brandingConfig, brandingPlaceholders } from './config';

describe('brandingConfig', () => {
  it('keeps approved runtime placeholders available for container replacement', () => {
    expect(brandingPlaceholders).toEqual({
      appName: '__APP_NAME_PLACEHOLDER__',
      appTitle: '__APP_TITLE_PLACEHOLDER__',
      logoUrl: '__APP_LOGO_URL_PLACEHOLDER__',
      faviconUrl: '__APP_FAVICON_URL_PLACEHOLDER__',
      docsUrl: '__APP_DOCS_URL_PLACEHOLDER__',
      supportUrl: '__APP_SUPPORT_URL_PLACEHOLDER__',
      copyrightText: '__APP_COPYRIGHT_PLACEHOLDER__',
    });
  });

  it('falls back to Evolution-compatible defaults before runtime injection', () => {
    expect(brandingConfig).toEqual({
      appName: 'Evo CRM',
      appTitle: 'Evo CRM',
      logoUrl: '/logo.svg',
      faviconUrl: '/favicon.svg',
      docsUrl: 'https://docs.evolutionfoundation.com.br/',
      supportUrl: 'https://api.whatsapp.com/send/?phone=553196219989&text=Ol%C3%A1%21+Preciso+de+suporte.&type=phone_number&app_absent=0',
      copyrightText: '',
      hasCustomAppName: false,
      hasCustomLogo: false,
    });
  });

  it('falls back to /favicon.svg when the configured favicon cannot be loaded', () => {
    const originalImage = globalThis.Image;
    const document = window.document.implementation.createHTMLDocument('branding-test');
    document.head.innerHTML = '<link rel="icon" href="/old.ico">';

    class MockImage {
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;

      set src(_value: string) {
        this.onerror?.();
      }
    }

    vi.stubGlobal('Image', MockImage);
    applyBrandingFavicon(document);

    expect(document.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe('/favicon.svg');

    vi.stubGlobal('Image', originalImage);
  });
});
