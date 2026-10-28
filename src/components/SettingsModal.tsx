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
  Bell,
  Lock,
  Building,
  Check,
} from 'lucide-react-native';
import { exportBackup, importBackup } from '../utils/backup';
import {
  isLockEnabled,
  savePIN,
  disableLock,
  checkBiometricSupport,
} from '../utils/security';
import { getSetting, setSetting } from '../db/queries';
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

  // Enhancement 1: Ritual Reminders
  const [morningReminder, setMorningReminder] = useState(true);
  const [eveningReminder, setEveningReminder] = useState(true);

  // Enhancement 2: Backup encryption passcode
  const [exportPasscode, setExportPasscode] = useState('');
  const [showExportPasscode, setShowExportPasscode] = useState(false);

  // Enhancement 3: Venture / Company naming
  const [customVenture, setCustomVenture] = useState('');

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    const enabled = await isLockEnabled();
    setLockActive(enabled);
    const bio = await checkBiometricSupport();
    setBiometricAvailable(bio.hasHardware);

    const mr = getSetting('reminder_morning', 'true');
    setMorningReminder(mr === 'true');
    const er = getSetting('reminder_evening', 'true');
    setEveningReminder(er === 'true');

    const venture = getSetting('custom_venture_name', '');
    setCustomVenture(venture);
  };

  const handleToggleMorning = (val: boolean) => {
    triggerHaptic('selection');
    setMorningReminder(val);
    setSetting('reminder_morning', val ? 'true' : 'false');
  };

  const handleToggleEvening = (val: boolean) => {
    triggerHaptic('selection');
    setEveningReminder(val);
    setSetting('reminder_evening', val ? 'true' : 'false');
  };

  const handleSaveVenture = () => {
    triggerHaptic('success');
    setSetting('custom_venture_name', customVenture.trim());
    Alert.alert('Venture Saved', `Primary venture set to "${customVenture.trim()}".`);
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
    const res = await exportBackup(exportPasscode ? exportPasscode.trim() : undefined);
    if (res.success) {
      Alert.alert('Backup Exported', res.message);
    } else {
      Alert.alert('Export Failed', res.message);
    }
  };

  const handleImport = async () => {
    triggerHaptic('medium');
    Alert.prompt
      ? Alert.prompt(
          'Restore Backup',
          'If this backup file is encrypted, enter the password below (or leave blank if unencrypted):',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Restore',
              onPress: async (pwd) => {
                const res = await importBackup(pwd);
                if (res.success) {
                  Alert.alert('Restored', res.message);
                  onDataRestored();
                } else {
                  Alert.alert('Import Result', res.message);
                }
              },
            },
          ]
        )
      : (async () => {
          const res = await importBackup(exportPasscode ? exportPasscode.trim() : undefined);
          if (res.success) {
            Alert.alert('Restored', res.message);
            onDataRestored();
          } else {
            Alert.alert('Import Result', res.message);
          }
        })();
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

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

          {/* Section: Ritual Reminders */}
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>EXECUTIVE RITUAL REMINDERS</Text>
          <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <View style={styles.rowBetween}>
              <View style={styles.iconLabelGroup}>
                <Bell size={18} color={colors.accent} />
                <View>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Morning Focus (8:00 AM)</Text>
                  <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                    Nudge to lock your top 3 non-negotiable outcomes
                  </Text>
                </View>
              </View>
              <Switch
                value={morningReminder}
                onValueChange={handleToggleMorning}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.bgPrimary}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

            <View style={styles.rowBetween}>
              <View style={styles.iconLabelGroup}>
                <Bell size={18} color={colors.accent} />
                <View>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Evening Debrief (9:30 PM)</Text>
                  <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                    Nudge to capture your #1 win and close your desk
                  </Text>
                </View>
              </View>
              <Switch
                value={eveningReminder}
                onValueChange={handleToggleEvening}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.bgPrimary}
              />
            </View>
          </View>

          {/* Section: Custom Venture */}
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>PRIMARY VENTURE / COMPANY</Text>
          <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border, padding: 14 }]}>
            <Text style={[styles.itemSubtitle, { color: colors.textSecondary, marginBottom: 8 }]}>
              Name your core company or primary venture to personalize tags:
            </Text>
            <View style={styles.inlineInputRow}>
              <Building size={16} color={colors.companyBadge} style={{ marginLeft: 8 }} />
              <TextInput
                style={[styles.ventureInput, { color: colors.textPrimary }]}
                placeholder="e.g. Alvestt or Planitt"
                placeholderTextColor={colors.textMuted}
                value={customVenture}
                onChangeText={setCustomVenture}
              />
              <TouchableOpacity
                style={[styles.ventureSaveBtn, { backgroundColor: colors.accent }]}
                onPress={handleSaveVenture}
              >
                <Check size={14} color={colors.bgPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Section: Security */}
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>SECURITY & PRIVACY</Text>
          <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <View style={styles.rowBetween}>
              <View style={styles.iconLabelGroup}>
                <Shield size={18} color={colors.accent} />
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

          {/* Section: Data & Encrypted Backup */}
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>DATA PORTABILITY & ENCRYPTION</Text>
          <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleExport}
              activeOpacity={0.7}
            >
              <View style={styles.iconLabelGroup}>
                <Download size={18} color={colors.accent} />
                <View>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Export Backup</Text>
                  <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                    Export all records to private JSON file
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={[styles.encryptionToggleRow, { borderTopColor: colors.borderSubtle }]}>
              <View style={styles.iconLabelGroup}>
                <Lock size={16} color={colors.accent} />
                <Text style={[styles.itemTitle, { color: colors.textPrimary, fontSize: 13 }]}>
                  Password-Protect Export File
                </Text>
              </View>
              <Switch
                value={showExportPasscode}
                onValueChange={setShowExportPasscode}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.bgPrimary}
              />
            </View>

            {showExportPasscode && (
              <View style={[styles.passcodeBox, { backgroundColor: colors.bgElevated }]}>
                <TextInput
                  style={[styles.passcodeInput, { color: colors.textPrimary }]}
                  placeholder="Set backup decryption password"
                  placeholderTextColor={colors.textMuted}
                  value={exportPasscode}
                  onChangeText={setExportPasscode}
                  secureTextEntry
                />
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleImport}
              activeOpacity={0.7}
            >
              <View style={styles.iconLabelGroup}>
                <Upload size={18} color={colors.accent} />
                <View>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Restore Backup</Text>
                  <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                    Merge and restore from a JSON file
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
              v1.1.0 • 100% Local & Private Executive Suite
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
    paddingBottom: 50,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
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
    gap: 12,
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  inlineInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.15)',
    paddingHorizontal: 8,
    gap: 8,
  },
  ventureInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },
  ventureSaveBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
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
  encryptionToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  passcodeBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  passcodeInput: {
    paddingVertical: 9,
    fontSize: 13,
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
    width: 48,
    height: 48,
    borderRadius: 14,
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
