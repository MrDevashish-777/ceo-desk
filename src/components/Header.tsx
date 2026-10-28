import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Settings as SettingsIcon, Plus } from 'lucide-react-native';
import { triggerHaptic } from '../utils/haptics';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenSettings?: () => void;
  onQuickAdd?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenSettings,
  onQuickAdd,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.borderSubtle }]}>
      <View style={styles.brandRow}>
        <Image
          source={require('../../assets/favicon.png')}
          style={[styles.brandEmblem, { borderColor: colors.border }]}
        />
        <View style={styles.textContainer}>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.accent }]}>
              {subtitle.toUpperCase()}
            </Text>
          ) : null}
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        {onQuickAdd && (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.accentMuted, borderColor: colors.accent }]}
            onPress={() => {
              triggerHaptic('medium');
              onQuickAdd();
            }}
            activeOpacity={0.7}
            accessibilityLabel="Quick capture"
          >
            <Plus size={18} color={colors.accent} strokeWidth={2.4} />
          </TouchableOpacity>
        )}

        {onOpenSettings && (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
            onPress={() => {
              triggerHaptic('light');
              onOpenSettings();
            }}
            activeOpacity={0.7}
            accessibilityLabel="Settings"
          >
            <SettingsIcon size={18} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandEmblem: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  subtitle: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
