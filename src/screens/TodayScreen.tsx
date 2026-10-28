import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import {
  getDailyCheckin,
  upsertDailyCheckin,
  getTasks,
  toggleTaskStatus,
} from '../db/queries';
import { DailyCheckin, TaskItem } from '../types';
import {
  Target,
  Zap,
  Award,
  Flame,
  BatteryLow,
  BatteryMedium,
  Battery,
  BatteryCharging,
  FaceSlightlyFrowning,
  FaceNeutral,
  FaceSlightlySmiling,
  FaceGrinning,
  Moon,
  Bed,
  Dumbbell,
  Trophy,
  Minus,
  Plus,
  CircleCheck,
  Circle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  FileText,
  CheckSquare,
} from 'lucide-react-native';
import { triggerHaptic } from '../utils/haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TodayScreenProps {
  onNavigateToTasks: () => void;
  onNavigateToNotes: () => void;
  onOpenQuickAdd: () => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  onNavigateToTasks,
  onNavigateToNotes,
  onOpenQuickAdd,
}) => {
  const { colors } = useTheme();
  const todayStr = new Date().toISOString().split('T')[0];

  const [refreshing, setRefreshing] = useState(false);
  const [checkin, setCheckin] = useState<DailyCheckin | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [checkinExpanded, setCheckinExpanded] = useState(true);

  // Top 3 priority text inputs
  const [priority1, setPriority1] = useState('');
  const [priority2, setPriority2] = useState('');
  const [priority3, setPriority3] = useState('');

  // Check-in input states
  const [winLine, setWinLine] = useState('');
  const [workoutNote, setWorkoutNote] = useState('');
  const [sleepHours, setSleepHours] = useState(7.0);

  const loadData = useCallback(() => {
    const c = getDailyCheckin(todayStr);
    setCheckin(c);
    if (c) {
      setPriority1(c.topPriority1 || '');
      setPriority2(c.topPriority2 || '');
      setPriority3(c.topPriority3 || '');
      setWinLine(c.winLine || '');
      setWorkoutNote(c.workoutNote || '');
      setSleepHours(c.sleepHours || 7.0);
    } else {
      setPriority1('');
      setPriority2('');
      setPriority3('');
      setWinLine('');
      setWorkoutNote('');
      setSleepHours(7.0);
    }

    const todayTasks = getTasks('today');
    setTasks(todayTasks);
  }, [todayStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const handleTogglePriority = (slot: 1 | 2 | 3) => {
    triggerHaptic('success');
    if (!checkin) {
      const newC = upsertDailyCheckin({
        date: todayStr,
        [`topPriority${slot}Done`]: true,
      } as any);
      setCheckin(newC);
      return;
    }

    const currentDone =
      slot === 1
        ? checkin.topPriority1Done
        : slot === 2
        ? checkin.topPriority2Done
        : checkin.topPriority3Done;

    const updated = upsertDailyCheckin({
      date: todayStr,
      [`topPriority${slot}Done`]: !currentDone,
    } as any);
    setCheckin(updated);
  };

  const handleSavePriorityText = (slot: 1 | 2 | 3, text: string) => {
    const updated = upsertDailyCheckin({
      date: todayStr,
      [`topPriority${slot}`]: text.trim(),
    } as any);
    setCheckin(updated);
  };

  const handleEnergySelect = (val: number) => {
    triggerHaptic('selection');
    const updated = upsertDailyCheckin({
      date: todayStr,
      energy: val,
    });
    setCheckin(updated);
  };

  const handleMoodSelect = (val: number) => {
    triggerHaptic('selection');
    const updated = upsertDailyCheckin({
      date: todayStr,
      mood: val,
    });
    setCheckin(updated);
  };

  const handleAdjustSleep = (delta: number) => {
    triggerHaptic('light');
    const nextVal = Math.max(3, Math.min(14, +(sleepHours + delta).toFixed(1)));
    setSleepHours(nextVal);
    const updated = upsertDailyCheckin({
      date: todayStr,
      sleepHours: nextVal,
    });
    setCheckin(updated);
  };

  const handleSleepQualitySelect = (quality: 'poor' | 'fair' | 'good' | 'great') => {
    triggerHaptic('selection');
    const updated = upsertDailyCheckin({
      date: todayStr,
      sleepQuality: quality,
    });
    setCheckin(updated);
  };

  const handleWorkoutToggle = () => {
    triggerHaptic('medium');
    const nextVal = !(checkin?.workoutDone);
    const updated = upsertDailyCheckin({
      date: todayStr,
      workoutDone: nextVal,
      workoutNote,
    });
    setCheckin(updated);
  };

  const handleSaveWin = () => {
    const updated = upsertDailyCheckin({
      date: todayStr,
      winLine: winLine.trim(),
      workoutNote: workoutNote.trim(),
    });
    setCheckin(updated);
  };

  const handleToggleTask = (task: TaskItem) => {
    triggerHaptic('light');
    toggleTaskStatus(task.id, task.status);
    loadData();
  };

  const toggleAccordion = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCheckinExpanded(!checkinExpanded);
  };

  // Priorities count
  const completedPrioritiesCount = [
    checkin?.topPriority1Done,
    checkin?.topPriority2Done,
    checkin?.topPriority3Done,
  ].filter(Boolean).length;

  const energyOptions = [
    { level: 1, label: 'Depleted', icon: BatteryLow },
    { level: 2, label: 'Low', icon: BatteryMedium },
    { level: 3, label: 'Steady', icon: Battery },
    { level: 4, label: 'Charged', icon: BatteryCharging },
    { level: 5, label: 'Electric', icon: Zap },
  ];

  const moodOptions = [
    { level: 1, label: 'Tough', icon: FaceSlightlyFrowning },
    { level: 2, label: 'Flat', icon: FaceNeutral },
    { level: 3, label: 'Steady', icon: FaceSlightlySmiling },
    { level: 4, label: 'Elevated', icon: FaceGrinning },
    { level: 5, label: 'Peak', icon: Flame },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      {/* QUICK ACTIONS INTERACTIVE ROW */}
      <View style={styles.quickBar}>
        <TouchableOpacity
          style={[styles.quickBarItem, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
          onPress={onOpenQuickAdd}
          activeOpacity={0.7}
        >
          <View style={[styles.quickBarIcon, { backgroundColor: colors.accentMuted }]}>
            <CheckSquare size={16} color={colors.accent} />
          </View>
          <Text style={[styles.quickBarText, { color: colors.textPrimary }]}>Quick Task</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickBarItem, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
          onPress={onNavigateToNotes}
          activeOpacity={0.7}
        >
          <View style={[styles.quickBarIcon, { backgroundColor: colors.companyBadgeBg }]}>
            <FileText size={16} color={colors.companyBadge} />
          </View>
          <Text style={[styles.quickBarText, { color: colors.textPrimary }]}>Quick Note</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickBarItem, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
          onPress={handleWorkoutToggle}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.quickBarIcon,
              checkin?.workoutDone
                ? { backgroundColor: colors.successBg }
                : { backgroundColor: colors.bgElevated },
            ]}
          >
            <Dumbbell
              size={16}
              color={checkin?.workoutDone ? colors.success : colors.textMuted}
            />
          </View>
          <Text
            style={[
              styles.quickBarText,
              { color: checkin?.workoutDone ? colors.success : colors.textPrimary },
            ]}
          >
            {checkin?.workoutDone ? 'Trained' : 'Log Workout'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* SECTION 1: TOP 3 OUTCOMES */}
      <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Target size={18} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Top 3 Outcomes
            </Text>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: colors.accentMuted }]}>
            <Text style={[styles.scoreBadgeText, { color: colors.accent }]}>
              {completedPrioritiesCount}/3 WON
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressBarTrack, { backgroundColor: colors.bgElevated }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${(completedPrioritiesCount / 3) * 100}%`,
                backgroundColor: colors.accent,
              },
            ]}
          />
        </View>

        <View style={styles.prioritiesList}>
          {([1, 2, 3] as const).map((slot) => {
            const isDone =
              slot === 1
                ? Boolean(checkin?.topPriority1Done)
                : slot === 2
                ? Boolean(checkin?.topPriority2Done)
                : Boolean(checkin?.topPriority3Done);

            const value = slot === 1 ? priority1 : slot === 2 ? priority2 : priority3;
            const setValue = slot === 1 ? setPriority1 : slot === 2 ? setPriority2 : setPriority3;

            return (
              <View
                key={slot}
                style={[
                  styles.priorityRow,
                  { borderBottomColor: slot < 3 ? colors.borderSubtle : 'transparent' },
                ]}
              >
                {/* Number Slot Badge */}
                <View
                  style={[
                    styles.slotBadge,
                    isDone
                      ? { backgroundColor: colors.accentMuted, borderColor: colors.accent }
                      : { backgroundColor: colors.bgElevated, borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.slotBadgeText,
                      { color: isDone ? colors.accent : colors.textSecondary },
                    ]}
                  >
                    #{slot}
                  </Text>
                </View>

                {/* Input Text */}
                <TextInput
                  style={[
                    styles.priorityInput,
                    {
                      color: isDone ? colors.textMuted : colors.textPrimary,
                      textDecorationLine: isDone ? 'line-through' : 'none',
                    },
                  ]}
                  placeholder={`Priority outcome #${slot}...`}
                  placeholderTextColor={colors.textMuted}
                  value={value}
                  onChangeText={setValue}
                  onBlur={() => handleSavePriorityText(slot, value)}
                  returnKeyType="done"
                />

                {/* Interactive Checkmark Icon */}
                <TouchableOpacity
                  onPress={() => handleTogglePriority(slot)}
                  style={styles.checkTouch}
                  activeOpacity={0.7}
                >
                  {isDone ? (
                    <CircleCheck size={24} color={colors.accent} strokeWidth={2.2} />
                  ) : (
                    <Circle size={24} color={colors.textMuted} strokeWidth={1.8} />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      {/* SECTION 2: DAILY PULSE INTERACTIVE CHECK-IN */}
      <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={toggleAccordion}
          activeOpacity={0.7}
        >
          <View style={styles.headerLeft}>
            <Zap size={18} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Daily Pulse
            </Text>
            {checkin?.mood || checkin?.energy ? (
              <View style={[styles.loggedBadge, { backgroundColor: colors.accentMuted }]}>
                <Sparkles size={11} color={colors.accent} />
                <Text style={[styles.loggedBadgeText, { color: colors.accent }]}>Logged</Text>
              </View>
            ) : null}
          </View>
          {checkinExpanded ? (
            <ChevronUp size={20} color={colors.textSecondary} />
          ) : (
            <ChevronDown size={20} color={colors.textSecondary} />
          )}
        </TouchableOpacity>

        {checkinExpanded && (
          <View style={styles.checkinBody}>
            {/* ENERGY INTERACTIVE GAUGE */}
            <View style={styles.checkinField}>
              <View style={styles.fieldHeaderRow}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  ENERGY LEVEL
                </Text>
                <Text style={[styles.activeValueLabel, { color: colors.accent }]}>
                  {energyOptions.find((e) => e.level === (checkin?.energy || 3))?.label}
                </Text>
              </View>

              <View style={styles.iconOptionRow}>
                {energyOptions.map((item) => {
                  const isSelected = (checkin?.energy || 3) === item.level;
                  const IconComp = item.icon;

                  return (
                    <TouchableOpacity
                      key={item.level}
                      style={[
                        styles.iconOptionBtn,
                        isSelected
                          ? { backgroundColor: colors.accentMuted, borderColor: colors.accent }
                          : { backgroundColor: colors.bgElevated, borderColor: colors.border },
                      ]}
                      onPress={() => handleEnergySelect(item.level)}
                      activeOpacity={0.7}
                    >
                      <IconComp
                        size={20}
                        color={isSelected ? colors.accent : colors.textMuted}
                        strokeWidth={isSelected ? 2.4 : 1.8}
                      />
                      <Text
                        style={[
                          styles.iconOptionText,
                          { color: isSelected ? colors.accent : colors.textMuted },
                        ]}
                      >
                        {item.level}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* MOOD INTERACTIVE GAUGE */}
            <View style={styles.checkinField}>
              <View style={styles.fieldHeaderRow}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  STATE OF MIND
                </Text>
                <Text style={[styles.activeValueLabel, { color: colors.accent }]}>
                  {moodOptions.find((m) => m.level === (checkin?.mood || 3))?.label}
                </Text>
              </View>

              <View style={styles.iconOptionRow}>
                {moodOptions.map((item) => {
                  const isSelected = (checkin?.mood || 3) === item.level;
                  const IconComp = item.icon;

                  return (
                    <TouchableOpacity
                      key={item.level}
                      style={[
                        styles.iconOptionBtn,
                        isSelected
                          ? { backgroundColor: colors.accentMuted, borderColor: colors.accent }
                          : { backgroundColor: colors.bgElevated, borderColor: colors.border },
                      ]}
                      onPress={() => handleMoodSelect(item.level)}
                      activeOpacity={0.7}
                    >
                      <IconComp
                        size={20}
                        color={isSelected ? colors.accent : colors.textMuted}
                        strokeWidth={isSelected ? 2.4 : 1.8}
                      />
                      <Text
                        style={[
                          styles.iconOptionText,
                          { color: isSelected ? colors.accent : colors.textMuted },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* SLEEP TRACKER */}
            <View style={styles.checkinField}>
              <View style={styles.fieldHeaderRow}>
                <View style={styles.fieldHeaderIconRow}>
                  <Moon size={14} color={colors.accent} />
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    SLEEP RESTORATION
                  </Text>
                </View>

                {/* Interactive Stepper */}
                <View style={[styles.sleepStepper, { borderColor: colors.border }]}>
                  <TouchableOpacity
                    onPress={() => handleAdjustSleep(-0.5)}
                    style={[styles.stepBtn, { backgroundColor: colors.bgElevated }]}
                  >
                    <Minus size={14} color={colors.textPrimary} />
                  </TouchableOpacity>

                  <Text style={[styles.sleepValueText, { color: colors.textPrimary }]}>
                    {sleepHours}h
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleAdjustSleep(0.5)}
                    style={[styles.stepBtn, { backgroundColor: colors.bgElevated }]}
                  >
                    <Plus size={14} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quality chips */}
              <View style={styles.qualityChipsRow}>
                {(['poor', 'fair', 'good', 'great'] as const).map((q) => {
                  const isSelected = (checkin?.sleepQuality || 'good') === q;
                  return (
                    <TouchableOpacity
                      key={q}
                      style={[
                        styles.qualityChip,
                        isSelected
                          ? { backgroundColor: colors.accent, borderColor: colors.accent }
                          : { backgroundColor: colors.bgElevated, borderColor: colors.border },
                      ]}
                      onPress={() => handleSleepQualitySelect(q)}
                    >
                      <Bed size={12} color={isSelected ? colors.bgPrimary : colors.textMuted} />
                      <Text
                        style={[
                          styles.qualityChipText,
                          { color: isSelected ? colors.bgPrimary : colors.textSecondary },
                        ]}
                      >
                        {q.charAt(0).toUpperCase() + q.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* TODAY'S #1 WIN */}
            <View style={styles.checkinField}>
              <View style={styles.fieldHeaderRow}>
                <View style={styles.fieldHeaderIconRow}>
                  <Trophy size={14} color={colors.accent} />
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    TODAY'S STANDOUT WIN
                  </Text>
                </View>
              </View>
              <TextInput
                style={[
                  styles.textInputShort,
                  {
                    backgroundColor: colors.bgElevated,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="The single biggest breakthrough or victory today..."
                placeholderTextColor={colors.textMuted}
                value={winLine}
                onChangeText={setWinLine}
                onBlur={handleSaveWin}
              />
            </View>
          </View>
        )}
      </View>

      {/* SECTION 3: TODAY'S TASKS */}
      <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            Today's Agenda ({tasks.length})
          </Text>
          <TouchableOpacity
            onPress={onNavigateToTasks}
            style={styles.seeAllBtn}
            activeOpacity={0.7}
          >
            <Text style={[styles.seeAllText, { color: colors.accent }]}>All Tasks</Text>
            <ArrowRight size={14} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              All scheduled tasks cleared.
            </Text>
            <TouchableOpacity
              style={[styles.inlineAddBtn, { borderColor: colors.border }]}
              onPress={onOpenQuickAdd}
            >
              <Plus size={14} color={colors.accent} />
              <Text style={[styles.inlineAddText, { color: colors.accent }]}>Add task</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.tasksList}>
            {tasks.slice(0, 5).map((task) => {
              const isDone = task.status === 'done';
              const isCompany = task.area === 'company';

              return (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.taskItem, { borderBottomColor: colors.borderSubtle }]}
                  onPress={() => handleToggleTask(task)}
                  activeOpacity={0.7}
                >
                  <View style={styles.taskLeft}>
                    {isDone ? (
                      <CircleCheck size={20} color={colors.accent} strokeWidth={2.2} />
                    ) : (
                      <Circle size={20} color={colors.textMuted} strokeWidth={1.8} />
                    )}
                    <Text
                      style={[
                        styles.taskTitle,
                        {
                          color: isDone ? colors.textMuted : colors.textPrimary,
                          textDecorationLine: isDone ? 'line-through' : 'none',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.pillarBadge,
                      {
                        backgroundColor: isCompany ? colors.companyBadgeBg : colors.personalBadgeBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillarBadgeText,
                        {
                          color: isCompany ? colors.companyBadge : colors.personalBadge,
                        },
                      ]}
                    >
                      {isCompany ? 'Company' : 'Personal'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 36,
  },
  quickBar: {
    flexDirection: 'row',
    gap: 10,
  },
  quickBarItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickBarIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBarText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scoreBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  progressBarTrack: {
    height: 3,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  prioritiesList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  slotBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  checkTouch: {
    padding: 4,
  },
  priorityInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  loggedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 6,
  },
  loggedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  checkinBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
    paddingTop: 14,
  },
  checkinField: {
    gap: 8,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldHeaderIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  activeValueLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  iconOptionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconOptionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 4,
  },
  iconOptionText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sleepStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepValueText: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 10,
  },
  qualityChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  qualityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  qualityChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  textInputShort: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
  },
  inlineAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  inlineAddText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tasksList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  taskTitle: {
    fontSize: 14,
    flex: 1,
  },
  pillarBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillarBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
