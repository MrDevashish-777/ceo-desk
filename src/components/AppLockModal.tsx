import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Fingerprint, Delete } from 'lucide-react-native';
import { authenticateBiometric, getStoredPIN } from '../utils/security';
import { triggerHaptic } from '../utils/haptics';

interface AppLockModalProps {
  visible: boolean;
  onUnlocked: () => void;
}

export const AppLockModal: React.FC<AppLockModalProps> = ({ visible, onUnlocked }) => {
  const { colors } = useTheme();
  const [pin, setPin] = useState('');
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    if (visible) {
      setPin('');
      setErrorText('');
      tryBiometric();
    }
  }, [visible]);

  const tryBiometric = async () => {
    const success = await authenticateBiometric();
    if (success) {
      triggerHaptic('success');
      onUnlocked();
    }
  };

  const handleKeyPress = (num: string) => {
    triggerHaptic('light');
    setErrorText('');
    if (pin.length < 6) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length >= 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    triggerHaptic('light');
    setErrorText('');
    setPin((prev) => prev.slice(0, -1));
  };

  const verifyPin = async (inputPin: string) => {
    const stored = await getStoredPIN();
    if (stored && inputPin === stored) {
      triggerHaptic('success');
      onUnlocked();
    } else if (inputPin.length === (stored ? stored.length : 4)) {
      triggerHaptic('warning');
      setErrorText('Incorrect PIN. Please try again.');
      setPin('');
    }
  };

  return (
    <Modal visible={visible} transparent={false} animationType="fade">
      <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
        <View style={styles.topSection}>
          <View style={[styles.iconWrapper, { borderColor: colors.accent }]}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.appIconImage}
              resizeMode="cover"
            />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>CEO Desk</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your PIN or use biometrics to continue
          </Text>

          {/* PIN Dots */}
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              return (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      borderColor: colors.accent,
                      backgroundColor: isFilled ? colors.accent : 'transparent',
                    },
                  ]}
                />
              );
            })}
          </View>

          {errorText ? (
            <Text style={[styles.errorText, { color: colors.highPriority }]}>{errorText}</Text>
          ) : null}
        </View>

        {/* Numeric Keypad */}
        <View style={styles.keypad}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['bio', '0', 'del'],
          ].map((row, rIdx) => (
            <View key={rIdx} style={styles.keypadRow}>
              {row.map((item) => {
                if (item === 'bio') {
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.keyButton, { backgroundColor: 'transparent' }]}
                      onPress={tryBiometric}
                    >
                      <Fingerprint size={28} color={colors.accent} />
                    </TouchableOpacity>
                  );
                }
                if (item === 'del') {
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.keyButton, { backgroundColor: 'transparent' }]}
                      onPress={handleDelete}
                    >
                      <Delete size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.keyButton,
                      {
                        backgroundColor: colors.bgSecondary,
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                    onPress={() => handleKeyPress(item)}
                  >
                    <Text style={[styles.keyText, { color: colors.textPrimary }]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 50,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topSection: {
    alignItems: 'center',
    marginTop: 40,
    width: '100%',
  },
  iconWrapper: {
    width: 76,
    height: 76,
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#C5A880',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  appIconImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 32,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: 13,
    marginTop: 8,
  },
  keypad: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
    marginBottom: 20,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keyButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
  },
});
