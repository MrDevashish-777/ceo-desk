import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import {
  X,
  Moon,
  Sun,
  Smartphone,
  Shield,
  Download,
  Upload,
  Fingerprint,
  Key,
} from 'lucide-react-native';
import { exportBackup, importBackup } from '../utils/backup';
import {
  isLockEnabled,
  savePIN,
  disableLock,
  checkBiometricSupport,
} from '../utils/security';
import { triggerHaptic } from '../utils/haptics';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onDataRestored: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  onDataRestored,
}) => {
  const { themeMode, setThemeMode, colors } = useTheme();

  const [lockActive, setLockActive] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSecurityState();
    }
  }, [visible]);

  const loadSecurityState = async () => {
    const enabled = await isLockEnabled();
    setLockActive(enabled);
    const bio = await checkBiometricSupport();
    setBiometricAvailable(bio.hasHardware);
  };

  const handleToggleLock = async (value: boolean) => {
    triggerHaptic('medium');
    if (value) {
      setShowPinInput(true);
    } else {
      await disableLock();
      setLockActive(false);
      setShowPinInput(false);
      setPin('');
      Alert.alert('Security', 'App Lock has been disabled.');
    }
  };

  const handleConfirmPin = async () => {
    if (pin.length < 4) {
      Alert.alert('Invalid PIN', 'Please enter at least a 4-digit PIN.');
      return;
    }
    await savePIN(pin);
    setLockActive(true);
    setShowPinInput(false);
    setPin('');
    triggerHaptic('success');
    Alert.alert('Security Enabled', 'Your 4-digit PIN and Biometrics are now protecting CEO Desk.');
  };

  const handleExport = async () => {
    triggerHaptic('medium');
    const res = await exportBackup();
    if (res.success) {
      Alert.alert('Backup Exported', res.message);
    } else {
      Alert.alert('Export Failed', res.message);
    }
  };

  const handleImport = async () => {
    triggerHaptic('medium');
    Alert.alert(
      'Restore Backup',
      'Importing a backup will merge and update existing records. Do you wish to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed',
          onPress: async () => {
            const res = await importBackup();
            if (res.success) {
              Alert.alert('Restored', res.message);
              onDataRestored();
            } else {
              Alert.alert('Import Failed', res.message);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Preferences</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Section: Appearance */}
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>APPEARANCE</Text>
          <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <View style={styles.themeSelector}>
              {[
                { mode: 'dark', label: 'Dark Obsidian', icon: Moon },
                { mode: 'light', label: 'Nordic Light', icon: Sun },
                { mode: 'system', label: 'System Auto', icon: Smartphone },
              ].map((item) => {
                const isSelected = themeMode === item.mode;
                const IconComp = item.icon;
                return (
                  <TouchableOpacity
                    key={item.mode}
                    style={[
                      styles.themeOption,
                      isSelected && {
                        backgroundColor: colors.accentMuted,
                        borderColor: colors.accent,
                      },
                    ]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setThemeMode(item.mode as any);
                    }}
                  >
                    <IconComp
                      size={18}
                      color={isSelected ? colors.accent : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.themeLabel,
                        {
                          color: isSelected ? colors.accent : colors.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section: Security */}
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>SECURITY & PRIVACY</Text>
          <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <View style={styles.rowBetween}>
              <View style={styles.iconLabelGroup}>
                <Shield size={20} color={colors.accent} />
                <View>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>App Lock</Text>
                  <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                    Protect data with Biometrics / PIN
                  </Text>
                </View>
              </View>
              <Switch
                value={lockActive}
                onValueChange={handleToggleLock}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.bgPrimary}
              />
            </View>

            {showPinInput && (
              <View style={[styles.pinForm, { borderTopColor: colors.borderSubtle }]}>
                <Text style={[styles.pinPrompt, { color: colors.textSecondary }]}>
                  Enter a 4-digit PIN for device security:
                </Text>
                <View style={styles.pinInputRow}>
                  <TextInput
                    style={[
                      styles.pinInput,
                      {
                        backgroundColor: colors.bgElevated,
                        color: colors.textPrimary,
                        borderColor: colors.border,
                      },
                    ]}
                    keyboardType="numeric"
                    maxLength={6}
                    secureTextEntry
                    placeholder="••••"
                    placeholderTextColor={colors.textMuted}
                    value={pin}
                    onChangeText={setPin}
                  />
                  <TouchableOpacity
                    style={[styles.pinSubmitBtn, { backgroundColor: colors.accent }]}
                    onPress={handleConfirmPin}
                  >
                    <Text style={[styles.pinSubmitText, { color: colors.bgPrimary }]}>
                      Confirm
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {biometricAvailable && lockActive && (
              <View style={[styles.infoRow, { borderTopColor: colors.borderSubtle }]}>
                <Fingerprint size={16} color={colors.success} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Fingerprint / Biometric authentication active
                </Text>
              </View>
            )}
          </View>

          {/* Section: Data & Backup */}
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>DATA PORTABILITY</Text>
          <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleExport}
              activeOpacity={0.7}
            >
              <View style={styles.iconLabelGroup}>
                <Download size={20} color={colors.accent} />
                <View>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Export Backup</Text>
                  <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                    Save all data to a private JSON file
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleImport}
              activeOpacity={0.7}
            >
              <View style={styles.iconLabelGroup}>
                <Upload size={20} color={colors.accent} />
                <View>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Restore Backup</Text>
                  <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                    Restore previously exported JSON file
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer Info */}
          <View style={styles.footer}>
            <Image
              source={require('../../assets/icon.png')}
              style={[styles.footerIcon, { borderColor: colors.border }]}
            />
            <Text style={[styles.appName, { color: colors.textPrimary }]}>CEO Desk</Text>
            <Text style={[styles.version, { color: colors.textMuted }]}>
              v1.0.0 • 100% Local & Private Executive Suite
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 10,
    marginBottom: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  themeSelector: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  themeLabel: {
    fontSize: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  iconLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  pinForm: {
    padding: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  pinPrompt: {
    fontSize: 13,
  },
  pinInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pinInput: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    fontSize: 18,
    letterSpacing: 8,
    textAlign: 'center',
  },
  pinSubmitBtn: {
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinSubmitText: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderTopWidth: 1,
  },
  infoText: {
    fontSize: 12,
  },
  actionRow: {
    padding: 16,
  },
  divider: {
    height: 1,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 4,
  },
  footerIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 6,
  },
  appName: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  version: {
    fontSize: 12,
  },
});
