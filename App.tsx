import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { JournalProvider } from './src/storage/JournalContext';
import { CheckinProvider } from './src/storage/CheckinContext';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { SyncProvider } from './src/sync/SyncContext';
import AppNavigator, { navigationRef } from './src/navigation/AppNavigator';
import DataLossWarningModal from './src/components/DataLossWarningModal';

/** T50: renders the one-time blocking modal on top of the navigator, driven by AuthContext. */
function AnonWarningGate() {
  const { showAnonWarningModal, dismissAnonWarningModal } = useAuth();

  async function handleAcknowledge() {
    await dismissAnonWarningModal();
  }

  async function handleLinkEmailNow() {
    await dismissAnonWarningModal();
    if (navigationRef.isReady()) {
      navigationRef.navigate('Settings');
    }
  }

  return (
    <DataLossWarningModal
      visible={showAnonWarningModal}
      onAcknowledge={handleAcknowledge}
      onLinkEmailNow={handleLinkEmailNow}
    />
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <JournalProvider>
            <CheckinProvider>
              <SyncProvider>
                <AppNavigator />
                <AnonWarningGate />
                <StatusBar style="auto" />
              </SyncProvider>
            </CheckinProvider>
          </JournalProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
