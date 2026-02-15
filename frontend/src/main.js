import { mount } from 'svelte';
import App from './App.svelte';
import { initI18n } from './lib/i18n/index.js';

initI18n();

const app = mount(App, {
  target: document.getElementById('app'),
});

export default app;
