/**
 * Image Processor POC
 * @format
 */

import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GalleryScreen} from './src/screens/GalleryScreen';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <GalleryScreen />
    </SafeAreaProvider>
  );
}

export default App;
