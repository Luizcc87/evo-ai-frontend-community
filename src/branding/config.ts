const APP_NAME_PLACEHOLDER = '__APP_NAME_PLACEHOLDER__';
const APP_TITLE_PLACEHOLDER = '__APP_TITLE_PLACEHOLDER__';
const APP_LOGO_URL_PLACEHOLDER = '__APP_LOGO_URL_PLACEHOLDER__';
const APP_FAVICON_URL_PLACEHOLDER = '__APP_FAVICON_URL_PLACEHOLDER__';
const APP_DOCS_URL_PLACEHOLDER = '__APP_DOCS_URL_PLACEHOLDER__';
const APP_SUPPORT_URL_PLACEHOLDER = '__APP_SUPPORT_URL_PLACEHOLDER__';
const APP_COPYRIGHT_PLACEHOLDER = '__APP_COPYRIGHT_PLACEHOLDER__';

const DEFAULT_APP_NAME = 'Evo CRM';
const DEFAULT_LOGO_URL = '/logo.svg';
const DEFAULT_FAVICON_URL = '/favicon.svg';
const DEFAULT_DOCS_URL = 'https://docs.evolutionfoundation.com.br/';
const DEFAULT_SUPPORT_URL = 'https://api.whatsapp.com/send/?phone=553196219989&text=Ol%C3%A1%21+Preciso+de+suporte.&type=phone_number&app_absent=0';

function isPlaceholder(value: string) {
  return value.startsWith('__') && value.endsWith('_PLACEHOLDER__');
}

function runtimeValue(value: string, fallback: string) {
  return value && !isPlaceholder(value) ? value : fallback;
}

const appName = runtimeValue(APP_NAME_PLACEHOLDER, DEFAULT_APP_NAME);
const appTitle = runtimeValue(APP_TITLE_PLACEHOLDER, appName);
const logoUrl = runtimeValue(APP_LOGO_URL_PLACEHOLDER, DEFAULT_LOGO_URL);
const hasCustomLogo = logoUrl !== DEFAULT_LOGO_URL;
const faviconUrl = runtimeValue(
  APP_FAVICON_URL_PLACEHOLDER,
  hasCustomLogo ? logoUrl : DEFAULT_FAVICON_URL,
);
const docsUrl = runtimeValue(APP_DOCS_URL_PLACEHOLDER, DEFAULT_DOCS_URL);
const supportUrl = runtimeValue(APP_SUPPORT_URL_PLACEHOLDER, DEFAULT_SUPPORT_URL);
const copyrightText = runtimeValue(APP_COPYRIGHT_PLACEHOLDER, '');
const hasCustomAppName = appName !== DEFAULT_APP_NAME;

export const brandingConfig = {
  appName,
  appTitle,
  logoUrl,
  faviconUrl,
  docsUrl,
  supportUrl,
  copyrightText,
  hasCustomAppName,
  hasCustomLogo,
} as const;

export const brandingPlaceholders = {
  appName: APP_NAME_PLACEHOLDER,
  appTitle: APP_TITLE_PLACEHOLDER,
  logoUrl: APP_LOGO_URL_PLACEHOLDER,
  faviconUrl: APP_FAVICON_URL_PLACEHOLDER,
  docsUrl: APP_DOCS_URL_PLACEHOLDER,
  supportUrl: APP_SUPPORT_URL_PLACEHOLDER,
  copyrightText: APP_COPYRIGHT_PLACEHOLDER,
} as const;

export function applyBrandingFavicon(documentRef: Document = document) {
  const link =
    documentRef.querySelector<HTMLLinkElement>('link[rel="icon"]') ||
    documentRef.createElement('link');

  link.rel = 'icon';
  link.href = faviconUrl;

  if (!link.parentElement) {
    documentRef.head.appendChild(link);
  }

  if (faviconUrl === DEFAULT_FAVICON_URL) return;

  const image = new Image();
  image.onerror = () => {
    link.href = DEFAULT_FAVICON_URL;
  };
  image.src = faviconUrl;
}
