import { render } from 'preact';
import '@fontsource/fredoka/latin-400.css';
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import '@fontsource/uncial-antiqua/latin-400.css';
import '@fontsource/almendra/latin-400.css';
import '@fontsource/almendra/latin-700.css';
import './styles/base.css';
import './ui/components/components.css';
import { boot } from './app/actions';
import { App } from './app/App';
import { installDebugHook } from './app/debug';

const root = document.getElementById('app')!;

async function start() {
  if (import.meta.env.DEV && location.hash === '#gallery') {
    const { Gallery } = await import('./dev/Gallery');
    render(<Gallery />, root);
    return;
  }
  if (import.meta.env.DEV && location.hash.startsWith('#art-')) {
    const { AppArt } = await import('./dev/AppArt');
    render(<AppArt kind={location.hash.slice(5)} />, root);
    return;
  }
  installDebugHook();
  render(<App />, root);
  await boot();
}

void start();
