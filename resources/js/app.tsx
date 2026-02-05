import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { Toaster } from 'sonner';

const appName = import.meta.env.VITE_APP_NAME || 'Hospital Management System';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx')
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <>
                <App {...props} />
                <Toaster
                    position="bottom-center"
                    toastOptions={{
                        style: {
                            color: 'hsl(var(--foreground))',
                            fontSize: '14px',
                            background: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            width: 'fit-content',
                            maxWidth: '420px',
                            padding: '12px 16px',
                        },
                    }}
                />
            </>
        );
    },
    progress: {
        color: 'hsl(var(--primary))',
    },
});
