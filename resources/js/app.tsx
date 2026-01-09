import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { LaravelReactI18nProvider } from 'laravel-react-i18n';
import { ThemeProvider } from '@/components/theme-provider';

const appName = import.meta.env.VITE_APP_NAME || 'acephalus';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx')
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        // Get locale from Inertia props or HTML lang attribute or default to 'en'
        const locale = (props.initialPage.props as { locale?: string }).locale 
            ?? document.documentElement.lang 
            ?? 'en';
        
        root.render(
            <LaravelReactI18nProvider
                locale={locale}
                fallbackLocale="en"
                files={import.meta.glob('/lang/*.json')}
            >
                <ThemeProvider defaultTheme="system">
                    <App {...props} />
                </ThemeProvider>
            </LaravelReactI18nProvider>
        );
    },
    progress: {
        color: '#6366f1',
        showSpinner: true,
    },
});

