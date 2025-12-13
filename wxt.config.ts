import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'LeadSnap - Simple Lead Capture & CRM',
    description: 'Capture leads from any website with one click. Simple CRM for freelancers.',
    version: '1.0.0',
    permissions: ['storage', 'contextMenus', 'activeTab'],
    action: {
      default_title: 'LeadSnap',
    },
    icons: {
      '16': 'icon/16.png',
      '32': 'icon/32.png',
      '48': 'icon/48.png',
      '96': 'icon/96.png',
      '128': 'icon/128.png',
    },
  },
});
