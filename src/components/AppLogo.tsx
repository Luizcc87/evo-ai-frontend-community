import type { CSSProperties } from 'react';
import { useState } from 'react';
import { brandingConfig } from '@/branding/config';
import { useDarkMode } from '../hooks/useDarkMode';
import logoDark from '../assets/EVO_CRM.svg';
import logoLight from '../assets/EVO_CRM_light.svg';

interface AppLogoProps {
  className?: string;
  alt?: string;
  style?: CSSProperties;
  forceTheme?: 'dark' | 'light';
}

export function AppLogo({ className, alt = brandingConfig.appName, style, forceTheme }: AppLogoProps) {
  const { theme } = useDarkMode();
  const effectiveTheme = forceTheme ?? theme;
  const defaultSrc = effectiveTheme === 'dark' ? logoDark : logoLight;
  const isCustomLogo = brandingConfig.logoUrl !== '/logo.svg';
  const [src, setSrc] = useState(isCustomLogo ? brandingConfig.logoUrl : defaultSrc);

  return (
    <img
      src={src}
      alt={alt || brandingConfig.appName}
      className={className}
      style={style}
      onError={() => {
        if (src !== defaultSrc) setSrc(defaultSrc);
      }}
    />
  );
}
