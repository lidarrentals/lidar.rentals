import { useState, useEffect } from 'react';

export interface Route {
  path: string;
  params: Record<string, string>;
}

export function useRouter(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash());

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route;
}

export function navigate(path: string): void {
  window.location.hash = path;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function parseHash(): Route {
  const hash = window.location.hash.slice(1) || '/';
  return { path: hash, params: {} };
}

export function matchRoute(
  route: Route,
  pattern: string
): Record<string, string> | null {
  const hashParts = route.path.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);

  if (hashParts.length !== patternParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(hashParts[i]);
    } else if (patternParts[i] !== hashParts[i]) {
      return null;
    }
  }
  return params;
}
