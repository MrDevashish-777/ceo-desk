import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Flame,
  CheckCircle2,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { triggerHaptic } from '../utils/haptics';

interface MonkModeModalProps {
  visible: boolean;
  onClose: () => void;
  targetOutcome?: string;
  onSessionComplete?: (minutes: number) => void;
}

export const MonkModeModal: React.FC<MonkModeModalProps> = ({
  visible,
  onClose,
  targetOutcome,
  onSessionComplete,
}) => {
  const { colors } = useTheme();

  const [durations] = useState([25, 45, 60, 90]);
  const [selectedMinutes, setSelectedMinutes] = useState(45);
  const [secondsLeft, setSecondsLeft] = useState(45 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      setSecondsLeft(selectedMinutes * 60);
      setIsRunning(false);
      setCompleted(false);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, selectedMinutes]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            setCompleted(true);
            triggerHaptic('success');
            if (onSessionComplete) onSessionComplete(selectedMinutes);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, selectedMinutes, onSessionComplete]);

  const toggleTimer = () => {
    triggerHaptic('medium');
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    triggerHaptic('light');
    setIsRunning(false);
    setCompleted(false);
    setSecondsLeft(selectedMinutes * 60);
  };

  const handleSelectDuration = (mins: number) => {
    triggerHaptic('selection');
    setSelectedMinutes(mins);
    setSecondsLeft(mins * 60);
    setIsRunning(false);
    setCompleted(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.max(
    0,
    Math.min(100, ((selectedMinutes * 60 - secondsLeft) / (selectedMinutes * 60)) * 100)
  );

  return (
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <View style={[styles.monkBadge, { backgroundColor: colors.accentMuted, borderColor: colors.accent }]}>
              <Flame size={14} color={colors.accent} />
              <Text style={[styles.monkBadgeText, { color: colors.accent }]}>MONK MODE</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Target Outcome Anchor */}
        <View style={styles.anchorSection}>
          <Text style={[styles.anchorLabel, { color: colors.textMuted }]}>ACTIVE EXECUTIVE FOCUS</Text>
          <Text style={[styles.anchorText, { color: colors.textPrimary }]} numberOfLines={2}>
            {targetOutcome && targetOutcome.trim() ? targetOutcome : 'High-Impact Strategic Execution'}
          </Text>
        </View>

        {/* Central Ambient Dial */}
        <View style={styles.dialContainer}>
          <View style={[styles.dialOuterRing, { borderColor: colors.borderSubtle }]}>
            {/* Minimal Progress Indicator */}
            <View
              style={[
                styles.dialInnerTrack,
                {
                  borderColor: isRunning ? colors.accent : colors.border,
                  backgroundColor: colors.bgSecondary,
                },
              ]}
            >
              <Text style={[styles.timeDisplay, { color: colors.textPrimary }]}>
                {formatTime(secondsLeft)}
              </Text>
              <Text style={[styles.dialSubtitle, { color: colors.accent }]}>
                {completed ? 'SESSION COMPLETE' : isRunning ? 'DEEP WORK ACTIVE' : 'READY TO FOCUS'}
              </Text>
            </View>
          </View>

          {/* Progress Bar Line */}
          <View style={[styles.progressLineTrack, { backgroundColor: colors.bgElevated }]}>
            <View
              style={[
                styles.progressLineFill,
                { width: `${progressPercent}%`, backgroundColor: colors.accent },
              ]}
            />
          </View>
        </View>

        {/* Duration Selectors */}
        {!isRunning && !completed && (
          <View style={styles.durationRow}>
            {durations.map((d) => {
              const isSelected = selectedMinutes === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.durationChip,
                    isSelected
                      ? { backgroundColor: colors.accent, borderColor: colors.accent }
                      : { backgroundColor: colors.bgSecondary, borderColor: colors.border },
                  ]}
                  onPress={() => handleSelectDuration(d)}
                >
                  <Text
                    style={[
                      styles.durationChipText,
                      { color: isSelected ? colors.bgPrimary : colors.textSecondary },
                    ]}
                  >
                    {d}m
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.resetBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
            onPress={resetTimer}
            activeOpacity={0.7}
          >
            <RotateCcw size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryControlBtn,
              {
                backgroundColor: isRunning ? colors.bgElevated : colors.accent,
                borderColor: colors.accent,
              },
            ]}
            onPress={toggleTimer}
            activeOpacity={0.8}
          >
            {completed ? (
              <CheckCircle2 size={28} color={colors.bgPrimary} />
            ) : isRunning ? (
              <Pause size={28} color={colors.accent} />
            ) : (
              <Play size={28} color={colors.bgPrimary} style={{ marginLeft: 3 }} />
            )}
          </TouchableOpacity>

          <View style={{ width: 48 }} />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  monkBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  closeBtn: {
    padding: 8,
  },
  anchorSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  anchorLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  anchorText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 26,
  },
  dialContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  dialOuterRing: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialInnerTrack: {
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  timeDisplay: {
    fontSize: 54,
    fontWeight: '300',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  dialSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  progressLineTrack: {
    width: 200,
    height: 4,
    borderRadius: 2,
    marginTop: 28,
    overflow: 'hidden',
  },
  progressLineFill: {
    height: '100%',
    borderRadius: 2,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  durationChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  durationChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  resetBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primaryControlBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
