import { useState, useEffect } from 'react';

// Centralized route listener that cleans up query parameters attached by Stripe
export function getCleanCurrentRoute(): string {
    if (typeof window === 'undefined') return '/';

    // Grab the raw hash path (e.g., "#/checkout?success=true")
    let hash = window.location.hash || '#/';

    // Remove the front '#' character
    hash = hash.replace(/^#/, '');

    // Slice away any trailing query arguments or question marks attached by Stripe
    const questionMarkIndex = hash.indexOf('?');
    if (questionMarkIndex !== -1) {
        hash = hash.substring(0, questionMarkIndex);
    }

    return hash || '/';
}

// Bypasses the 404 error by matching the clean path cleanly
export function matchRoute(currentRoute: string, targetRoute: string): boolean {
    const cleanCurrent = currentRoute.startsWith('/') ? currentRoute : `/${currentRoute}`;
    const cleanTarget = targetRoute.startsWith('/') ? targetRoute : `/${targetRoute}`;
    return cleanCurrent === cleanTarget;
}

export function navigate(to: string) {
    window.location.hash = to.startsWith('/') ? to : `/${to}`;
}

export function useCurrentRoute() {
    const [route, setRoute] = useState(getCleanCurrentRoute());

    useEffect(() => {
        const handleHashChange = () => {
            setRoute(getCleanCurrentRoute());
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    return route;
}

// FIX: This alias connects App.tsx to the correct hook and unfreezes the site
export { useCurrentRoute as useRouter };
