// Use Expo's streaming-capable fetch for @google/generative-ai
import { fetch as expoFetch } from 'expo/fetch';
globalThis.fetch = expoFetch as any;

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
