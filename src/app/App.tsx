import { bootError, screen } from './state';
import { SceneDefs } from '../ui/art/FurnitureArt';
import { DialogueOverlay } from '../ui/overlays/Dialogue';
import { ModalHost } from '../ui/overlays/Modals';
import { MockAdOverlay, MockBanner } from '../ui/overlays/MockAds';
import { Toasts } from '../ui/overlays/Toasts';
import { GuestsScreen } from '../ui/screens/GuestsScreen';
import { HubScreen } from '../ui/screens/HubScreen';
import { RecipesScreen } from '../ui/screens/RecipesScreen';
import { ServiceScreen } from '../ui/screens/ServiceScreen';
import { ShopScreen } from '../ui/screens/ShopScreen';
import { SummaryScreen } from '../ui/screens/SummaryScreen';
import { LoadingScreen, TitleScreen } from '../ui/screens/TitleScreen';

function CurrentScreen() {
  switch (screen.value) {
    case 'loading':
      return <LoadingScreen error={bootError.value} />;
    case 'title':
      return <TitleScreen />;
    case 'hub':
      return <HubScreen />;
    case 'service':
      return <ServiceScreen />;
    case 'summary':
      return <SummaryScreen />;
    case 'shop':
      return <ShopScreen />;
    case 'recipes':
      return <RecipesScreen />;
    case 'guests':
      return <GuestsScreen />;
  }
}

export function App() {
  return (
    <div class="app">
      {/* Shared gradients for every piece of scene art. */}
      <svg class="svg-defs" aria-hidden="true" focusable="false">
        <SceneDefs />
      </svg>
      <CurrentScreen />
      <DialogueOverlay />
      <ModalHost />
      <Toasts />
      <MockBanner />
      <MockAdOverlay />
    </div>
  );
}
