// Polyfills for ReadableStream (needed for @google/generative-ai streaming)
// Temporarily disabled to debug expo-updates build error
// import 'react-native-polyfill-globals/src/readable-stream';

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
