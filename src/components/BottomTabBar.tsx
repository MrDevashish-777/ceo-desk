import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Sun, CheckSquare, FileText, BookOpen, BarChart3 } from 'lucide-react-native';
import { triggerHaptic } from '../utils/haptics';

export type TabName = 'Today' | 'Tasks' | 'Notes' | 'Journal' | 'Insights';

interface BottomTabBarProps {
  currentTab: TabName;
  onSelectTab: (tab: TabName) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ currentTab, onSelectTab }) => {
  const { colors } = useTheme();

  const tabs: { name: TabName; label: string; icon: React.FC<{ size: number; color: string; strokeWidth?: number }> }[] = [
    { name: 'Today', label: 'Today', icon: Sun },
    { name: 'Tasks', label: 'Tasks', icon: CheckSquare },
    { name: 'Notes', label: 'Notes', icon: FileText },
    { name: 'Journal', label: 'Journal', icon: BookOpen },
    { name: 'Insights', label: 'Insights', icon: BarChart3 },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgSecondary,
          borderTopColor: colors.borderSubtle,
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.name;
        const IconComponent = tab.icon;

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => {
              triggerHaptic('selection');
              onSelectTab(tab.name);
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconWrapper,
                isActive && {
                  backgroundColor: colors.accentMuted,
                },
              ]}
            >
              <IconComponent
                size={19}
                color={isActive ? colors.accent : colors.textMuted}
                strokeWidth={isActive ? 2.3 : 1.7}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive ? colors.accent : colors.textMuted,
                  fontWeight: isActive ? '700' : '500',
                },
              ]}
            >
              {tab.label}
            </Text>
            {isActive && <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 36,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: -0.1,
  },
  activeDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginTop: 3,
  },
});
