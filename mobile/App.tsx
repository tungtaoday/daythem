import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation';
import { E2EGallery } from './src/e2e/Gallery';
import { initNotifications } from './src/notifications/engine';

// Chế độ E2E (Playwright): render gallery component thay vì app đầy đủ.
const E2E = process.env.EXPO_PUBLIC_E2E === '1';

export default function App() {
  useEffect(() => { if (!E2E) initNotifications(); }, []);
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {E2E ? <E2EGallery /> : <AppNavigator />}
    </SafeAreaProvider>
  );
}
