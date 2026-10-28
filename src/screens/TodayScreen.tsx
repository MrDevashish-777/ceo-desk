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
  Share2,
} from 'lucide-react-native';
import { triggerHaptic } from '../utils/haptics';
import { MonkModeModal } from '../components/MonkModeModal';
import { ExecutiveMemoModal } from '../components/ExecutiveMemoModal';

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
  const [pulseExpanded, setPulseExpanded] = useState(true);

  // Modals for enhancements
  const [monkModeVisible, setMonkModeVisible] = useState(false);
  const [memoVisible, setMemoVisible] = useState(false);

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

  const togglePulseAccordion = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPulseExpanded(!pulseExpanded);
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
    { level: 5, label: 'Peak', icon: Zap },
  ];

  const moodOptions = [
    { level: 1, label: 'Tough', icon: FaceSlightlyFrowning },
    { level: 2, label: 'Flat', icon: FaceNeutral },
    { level: 3, label: 'Steady', icon: FaceSlightlySmiling },
    { level: 4, label: 'High', icon: FaceGrinning },
    { level: 5, label: 'Unstoppable', icon: Flame },
  ];

  // Dynamic daytime greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. EXECUTIVE COMMAND BAR (Refined Micro-Action Hub) */}
      <View style={styles.actionHub}>
        <TouchableOpacity
          style={[styles.hubPill, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
          onPress={onOpenQuickAdd}
          activeOpacity={0.75}
        >
          <View style={[styles.hubIconCircle, { backgroundColor: colors.companyBadgeBg }]}>
            <CheckSquare size={16} color={colors.companyBadge} />
          </View>
          <Text style={[styles.hubPillText, { color: colors.textPrimary }]}>Task</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.hubPill, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
          onPress={onNavigateToNotes}
          activeOpacity={0.75}
        >
          <View style={[styles.hubIconCircle, { backgroundColor: colors.personalBadgeBg }]}>
            <FileText size={16} color={colors.personalBadge} />
          </View>
          <Text style={[styles.hubPillText, { color: colors.textPrimary }]}>Note</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.hubPill, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
          onPress={() => {
            triggerHaptic('medium');
            setMonkModeVisible(true);
          }}
          activeOpacity={0.75}
        >
          <View style={[styles.hubIconCircle, { backgroundColor: colors.accentMuted }]}>
            <Flame size={16} color={colors.accent} />
          </View>
          <Text style={[styles.hubPillText, { color: colors.accent }]}>Focus</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.hubPill, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
          onPress={() => {
            triggerHaptic('medium');
            setMemoVisible(true);
          }}
          activeOpacity={0.75}
        >
          <View style={[styles.hubIconCircle, { backgroundColor: colors.bgElevated }]}>
            <Share2 size={16} color={colors.textSecondary} />
          </View>
          <Text style={[styles.hubPillText, { color: colors.textSecondary }]}>Memo</Text>
        </TouchableOpacity>
      </View>

      {/* 2. TOP 3 OUTCOMES (The Executive Anchor) */}
      <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerTitleGroup}>
            <Target size={17} color={colors.accent} strokeWidth={2.2} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Top 3 Outcomes
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.accentMuted }]}>
            <Text style={[styles.statusBadgeText, { color: colors.accent }]}>
              {completedPrioritiesCount}/3 COMPLETED
            </Text>
          </View>
        </View>

        {/* Minimalist Progress Line */}
        <View style={[styles.progressTrack, { backgroundColor: colors.borderSubtle }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(completedPrioritiesCount / 3) * 100}%`,
                backgroundColor: colors.accent,
              },
            ]}
          />
        </View>

        {/* Priority Rows */}
        <View style={styles.prioritiesContainer}>
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
                {/* Minimalist Gold Numeral Tag */}
                <View
                  style={[
                    styles.numeralTag,
                    isDone
                      ? { backgroundColor: colors.accentMuted, borderColor: colors.accent }
                      : { backgroundColor: colors.bgElevated, borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.numeralText,
                      { color: isDone ? colors.accent : colors.textSecondary },
                    ]}
                  >
                    0{slot}
                  </Text>
                </View>

                {/* Priority Text Input */}
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

                {/* Slot 1 Monk Mode Quick Trigger */}
                {slot === 1 && value.trim().length > 0 && !isDone && (
                  <TouchableOpacity
                    style={[styles.focusNudgeBtn, { backgroundColor: colors.accentMuted }]}
                    onPress={() => {
                      triggerHaptic('medium');
                      setMonkModeVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Flame size={12} color={colors.accent} />
                  </TouchableOpacity>
                )}

                {/* Completion Checkmark */}
                <TouchableOpacity
                  onPress={() => handleTogglePriority(slot)}
                  style={styles.checkTouch}
                  activeOpacity={0.7}
                >
                  {isDone ? (
                    <CircleCheck size={22} color={colors.accent} strokeWidth={2.2} />
                  ) : (
                    <Circle size={22} color={colors.textMuted} strokeWidth={1.6} />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      {/* 3. DAILY PULSE (Smooth Segmented Vitality Hub) */}
      <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={togglePulseAccordion}
          activeOpacity={0.75}
        >
          <View style={styles.headerTitleGroup}>
            <Zap size={17} color={colors.accent} strokeWidth={2.2} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Daily Pulse
            </Text>
            {checkin?.mood || checkin?.energy ? (
              <View style={[styles.loggedChip, { backgroundColor: colors.accentMuted }]}>
                <Sparkles size={10} color={colors.accent} />
                <Text style={[styles.loggedChipText, { color: colors.accent }]}>Synced</Text>
              </View>
            ) : null}
          </View>
          {pulseExpanded ? (
            <ChevronUp size={18} color={colors.textSecondary} />
          ) : (
            <ChevronDown size={18} color={colors.textSecondary} />
          )}
        </TouchableOpacity>

        {pulseExpanded && (
          <View style={styles.pulseBody}>
            {/* Energy Segmented Gauge */}
            <View style={styles.pulseMetricBlock}>
              <View style={styles.metricHeaderRow}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  ENERGY LEVEL
                </Text>
                <Text style={[styles.metricHighlight, { color: colors.accent }]}>
                  {energyOptions.find((e) => e.level === (checkin?.energy || 3))?.label}
                </Text>
              </View>

              <View style={[styles.segmentedTrack, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle }]}>
                {energyOptions.map((item) => {
                  const isSelected = (checkin?.energy || 3) === item.level;
                  const IconComp = item.icon;

                  return (
                    <TouchableOpacity
                      key={item.level}
                      style={[
                        styles.segmentCell,
                        isSelected && [styles.segmentCellActive, { backgroundColor: colors.bgSecondary, borderColor: colors.accent }],
                      ]}
                      onPress={() => handleEnergySelect(item.level)}
                      activeOpacity={0.7}
                    >
                      <IconComp
                        size={17}
                        color={isSelected ? colors.accent : colors.textMuted}
                        strokeWidth={isSelected ? 2.4 : 1.8}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* State of Mind (Mood) Segmented Gauge */}
            <View style={styles.pulseMetricBlock}>
              <View style={styles.metricHeaderRow}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  STATE OF MIND
                </Text>
                <Text style={[styles.metricHighlight, { color: colors.accent }]}>
                  {moodOptions.find((m) => m.level === (checkin?.mood || 3))?.label}
                </Text>
              </View>

              <View style={[styles.segmentedTrack, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle }]}>
                {moodOptions.map((item) => {
                  const isSelected = (checkin?.mood || 3) === item.level;
                  const IconComp = item.icon;

                  return (
                    <TouchableOpacity
                      key={item.level}
                      style={[
                        styles.segmentCell,
                        isSelected && [styles.segmentCellActive, { backgroundColor: colors.bgSecondary, borderColor: colors.accent }],
                      ]}
                      onPress={() => handleMoodSelect(item.level)}
                      activeOpacity={0.7}
                    >
                      <IconComp
                        size={17}
                        color={isSelected ? colors.accent : colors.textMuted}
                        strokeWidth={isSelected ? 2.4 : 1.8}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Balanced Twin Cards: Sleep & Workout */}
            <View style={styles.twinCardsRow}>
              {/* Sleep Tile */}
              <View style={[styles.subCard, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle }]}>
                <View style={styles.subCardHeader}>
                  <Moon size={14} color={colors.accent} />
                  <Text style={[styles.subCardTitle, { color: colors.textSecondary }]}>Sleep</Text>
                </View>

                <View style={styles.sleepCounterRow}>
                  <TouchableOpacity
                    onPress={() => handleAdjustSleep(-0.5)}
                    style={[styles.stepperMiniBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
                  >
                    <Minus size={12} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={[styles.sleepValue, { color: colors.textPrimary }]}>{sleepHours}h</Text>
                  <TouchableOpacity
                    onPress={() => handleAdjustSleep(0.5)}
                    style={[styles.stepperMiniBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
                  >
                    <Plus size={12} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                {/* Quality micro-selector */}
                <View style={styles.qualityMiniRow}>
                  {(['poor', 'fair', 'good', 'great'] as const).map((q) => {
                    const isSelected = (checkin?.sleepQuality || 'good') === q;
                    return (
                      <TouchableOpacity
                        key={q}
                        style={[
                          styles.qualityMiniPill,
                          isSelected && { backgroundColor: colors.accent, borderColor: colors.accent },
                        ]}
                        onPress={() => handleSleepQualitySelect(q)}
                      >
                        <Text
                          style={[
                            styles.qualityMiniText,
                            { color: isSelected ? colors.bgPrimary : colors.textMuted },
                          ]}
                        >
                          {q.charAt(0).toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Workout Tile */}
              <View style={[styles.subCard, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle }]}>
                <View style={styles.subCardHeader}>
                  <Dumbbell size={14} color={checkin?.workoutDone ? colors.success : colors.textMuted} />
                  <Text style={[styles.subCardTitle, { color: colors.textSecondary }]}>Training</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.workoutStatusBtn,
                    checkin?.workoutDone
                      ? { backgroundColor: colors.successBg, borderColor: colors.success }
                      : { backgroundColor: colors.bgSecondary, borderColor: colors.border },
                  ]}
                  onPress={handleWorkoutToggle}
                  activeOpacity={0.7}
                >
                  <CircleCheck
                    size={14}
                    color={checkin?.workoutDone ? colors.success : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.workoutStatusText,
                      { color: checkin?.workoutDone ? colors.success : colors.textSecondary },
                    ]}
                  >
                    {checkin?.workoutDone ? 'Trained' : 'Log Session'}
                  </Text>
                </TouchableOpacity>

                <TextInput
                  style={[
                    styles.workoutInputMini,
                    { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border },
                  ]}
                  placeholder="Notes (e.g. 45m strength)"
                  placeholderTextColor={colors.textMuted}
                  value={workoutNote}
                  onChangeText={setWorkoutNote}
                  onBlur={handleSaveWin}
                />
              </View>
            </View>

            {/* Standout Win */}
            <View style={styles.winSection}>
              <View style={styles.winHeaderRow}>
                <Trophy size={14} color={colors.accent} />
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  TODAY'S #1 BREAKTHROUGH
                </Text>
              </View>
              <TextInput
                style={[
                  styles.winInput,
                  {
                    backgroundColor: colors.bgElevated,
                    color: colors.textPrimary,
                    borderColor: colors.borderSubtle,
                  },
                ]}
                placeholder="The single standout achievement or victory today..."
                placeholderTextColor={colors.textMuted}
                value={winLine}
                onChangeText={setWinLine}
                onBlur={handleSaveWin}
              />
            </View>
          </View>
        )}
      </View>

      {/* 4. TODAY'S AGENDA */}
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
            <ArrowRight size={13} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {tasks.length === 0 ? (
          <View style={styles.emptyTasksBox}>
            <Text style={[styles.emptyTasksText, { color: colors.textMuted }]}>
              All scheduled tasks cleared for today.
            </Text>
          </View>
        ) : (
          <View style={styles.tasksList}>
            {tasks.slice(0, 4).map((task) => {
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
                      <CircleCheck size={19} color={colors.accent} strokeWidth={2.2} />
                    ) : (
                      <Circle size={19} color={colors.textMuted} strokeWidth={1.6} />
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

      {/* MONK MODE FOCUS MODAL */}
      <MonkModeModal
        visible={monkModeVisible}
        onClose={() => setMonkModeVisible(false)}
        targetOutcome={priority1 || priority2 || priority3}
        onSessionComplete={(mins) => {
          triggerHaptic('success');
          loadData();
        }}
      />

      {/* EXECUTIVE MEMO BRIEFING MODAL */}
      <ExecutiveMemoModal
        visible={memoVisible}
        onClose={() => setMemoVisible(false)}
        dateStr={todayStr}
        topPriorities={[
          { text: priority1, done: Boolean(checkin?.topPriority1Done) },
          { text: priority2, done: Boolean(checkin?.topPriority2Done) },
          { text: priority3, done: Boolean(checkin?.topPriority3Done) },
        ]}
        completedTasks={tasks.filter((t) => t.status === 'done').map((t) => t.title)}
        energyScore={checkin?.energy || 3}
        moodScore={checkin?.mood || 3}
        workoutNote={checkin?.workoutDone ? (workoutNote || 'Completed session') : undefined}
        winLine={winLine}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 18,
    gap: 16,
    paddingBottom: 130, // Generous padding so bottom tab bar never covers items!
  },
  actionHub: {
    flexDirection: 'row',
    gap: 10,
  },
  hubPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  hubIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubPillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  card: {
    borderRadius: 20,
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
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  progressTrack: {
    height: 2,
    width: '100%',
  },
  progressFill: {
    height: '100%',
  },
  prioritiesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  numeralTag: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeralText: {
    fontSize: 11,
    fontWeight: '800',
  },
  priorityInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },
  focusNudgeBtn: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  checkTouch: {
    padding: 4,
  },
  loggedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 6,
  },
  loggedChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  pulseBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.08)',
    paddingTop: 12,
  },
  pulseMetricBlock: {
    gap: 6,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  metricHighlight: {
    fontSize: 11,
    fontWeight: '700',
  },
  segmentedTrack: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
  },
  segmentCell: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentCellActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  twinCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  subCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  subCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  sleepCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperMiniBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  qualityMiniRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  qualityMiniPill: {
    flex: 1,
    height: 22,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  qualityMiniText: {
    fontSize: 10,
    fontWeight: '700',
  },
  workoutStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  workoutStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  workoutInputMini: {
    fontSize: 11,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  winSection: {
    gap: 6,
  },
  winHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  winInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyTasksBox: {
    padding: 20,
    alignItems: 'center',
  },
  emptyTasksText: {
    fontSize: 13,
  },
  tasksList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  pillarBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillarBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
