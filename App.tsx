import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  AppState,
  AppStateStatus,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { getDatabase } from './src/db/database';
import { Header } from './src/components/Header';
import { BottomTabBar, TabName } from './src/components/BottomTabBar';
import { QuickActionModal } from './src/components/QuickActionModal';
import { SettingsModal } from './src/components/SettingsModal';
import { AppLockModal } from './src/components/AppLockModal';
import { isLockEnabled } from './src/utils/security';

// Screens
import { TodayScreen } from './src/screens/TodayScreen';
import { TasksScreen } from './src/screens/TasksScreen';
import { NotesScreen } from './src/screens/NotesScreen';
import { JournalScreen } from './src/screens/JournalScreen';
import { InsightsScreen } from './src/screens/InsightsScreen';

const MainApp: React.FC = () => {
  const { colors, isDark } = useTheme();

  const [currentTab, setCurrentTab] = useState<TabName>('Today');
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const appState = useRef(AppState.currentState);

  // Initialize DB and Check Lock on launch
  useEffect(() => {
    try {
      getDatabase();
    } catch (e) {
      console.warn('DB Init error:', e);
    }

    const checkLockOnLaunch = async () => {
      const lockActive = await isLockEnabled();
      if (lockActive) {
        setIsLocked(true);
      }
    };
    checkLockOnLaunch();
  }, []);

  // Handle auto-lock on app backgrounding
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async (nextAppState: AppStateStatus) => {
        if (
          appState.current?.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          const lockActive = await isLockEnabled();
          if (lockActive) {
            setIsLocked(true);
          }
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const triggerGlobalRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const formattedHeaderDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const getScreenTitle = () => {
    switch (currentTab) {
      case 'Today':
        return 'Today';
      case 'Tasks':
        return 'Tasks';
      case 'Notes':
        return 'Notes';
      case 'Journal':
        return 'Journal';
      case 'Insights':
        return 'Insights';
      default:
        return 'CEO Desk';
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Persistent App Header */}
      <Header
        title={getScreenTitle()}
        subtitle={currentTab === 'Today' ? formattedHeaderDate : undefined}
        onOpenSettings={() => setSettingsVisible(true)}
        onQuickAdd={() => setQuickAddVisible(true)}
      />

      {/* Screen Body */}
      <View style={styles.body} key={refreshKey}>
        {currentTab === 'Today' && (
          <TodayScreen
            onNavigateToTasks={() => setCurrentTab('Tasks')}
            onNavigateToNotes={() => setCurrentTab('Notes')}
            onOpenQuickAdd={() => setQuickAddVisible(true)}
          />
        )}
        {currentTab === 'Tasks' && <TasksScreen />}
        {currentTab === 'Notes' && <NotesScreen />}
        {currentTab === 'Journal' && <JournalScreen />}
        {currentTab === 'Insights' && <InsightsScreen />}
      </View>

      {/* Bottom Tabs */}
      <BottomTabBar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Global Quick Action Bottom Sheet */}
      <QuickActionModal
        visible={quickAddVisible}
        onClose={() => setQuickAddVisible(false)}
        onRefresh={triggerGlobalRefresh}
      />

      {/* Preferences & Backup Modal */}
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onDataRestored={triggerGlobalRefresh}
      />

      {/* Biometric & PIN Security Gate */}
      <AppLockModal visible={isLocked} onUnlocked={() => setIsLocked(false)} />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider initialMode="dark">
        <MainApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  body: {
    flex: 1,
  },
});
