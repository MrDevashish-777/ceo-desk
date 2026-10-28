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
  createTask,
} from '../db/queries';
import { DailyCheckin, TaskItem } from '../types';
import {
  CheckCircle2,
  Circle,
  Flame,
  Moon,
  BatteryCharging,
  Smile,
  Dumbbell,
  Trophy,
  ChevronDown,
  ChevronUp,
  Plus,
  ArrowRight,
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
  const [checkinExpanded, setCheckinExpanded] = useState(false);

  // Top 3 priority text inputs
  const [priority1, setPriority1] = useState('');
  const [priority2, setPriority2] = useState('');
  const [priority3, setPriority3] = useState('');

  // Check-in input states
  const [winLine, setWinLine] = useState('');
  const [workoutNote, setWorkoutNote] = useState('');

  const loadData = useCallback(() => {
    const c = getDailyCheckin(todayStr);
    setCheckin(c);
    if (c) {
      setPriority1(c.topPriority1 || '');
      setPriority2(c.topPriority2 || '');
      setPriority3(c.topPriority3 || '');
      setWinLine(c.winLine || '');
      setWorkoutNote(c.workoutNote || '');
    } else {
      setPriority1('');
      setPriority2('');
      setPriority3('');
      setWinLine('');
      setWorkoutNote('');
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
    triggerHaptic('medium');
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

  const handleWorkoutToggle = () => {
    triggerHaptic('selection');
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

  const moodEmojis = ['😔', '😐', '🙂', '😊', '🔥'];
  const energyLevels = [1, 2, 3, 4, 5];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      {/* SECTION 1: TOP 3 PRIORITIES */}
      <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Flame size={18} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Top 3 Outcomes
            </Text>
          </View>
          <Text style={[styles.cardMeta, { color: colors.accent }]}>
            NON-NEGOTIABLE
          </Text>
        </View>

        <View style={styles.prioritiesList}>
          {([1, 2, 3] as const).map((slot) => {
            const isDone =
              slot === 1
                ? Boolean(checkin?.topPriority1Done)
                : slot === 2
                ? Boolean(checkin?.topPriority2Done)
                : Boolean(checkin?.topPriority3Done);

            const value =
              slot === 1 ? priority1 : slot === 2 ? priority2 : priority3;
            const setValue =
              slot === 1
                ? setPriority1
                : slot === 2
                ? setPriority2
                : setPriority3;

            return (
              <View
                key={slot}
                style={[
                  styles.priorityRow,
                  { borderBottomColor: slot < 3 ? colors.borderSubtle : 'transparent' },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleTogglePriority(slot)}
                  style={styles.checkTouch}
                  activeOpacity={0.7}
                >
                  {isDone ? (
                    <CheckCircle2 size={22} color={colors.accent} />
                  ) : (
                    <Circle size={22} color={colors.textMuted} />
                  )}
                </TouchableOpacity>

                <TextInput
                  style={[
                    styles.priorityInput,
                    {
                      color: isDone ? colors.textMuted : colors.textPrimary,
                      textDecorationLine: isDone ? 'line-through' : 'none',
                    },
                  ]}
                  placeholder={`Priority ${slot} for today...`}
                  placeholderTextColor={colors.textMuted}
                  value={value}
                  onChangeText={setValue}
                  onBlur={() => handleSavePriorityText(slot, value)}
                  returnKeyType="done"
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* SECTION 2: DAILY CHECK-IN ACCORDION */}
      <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={toggleAccordion}
          activeOpacity={0.7}
        >
          <View style={styles.headerLeft}>
            <BatteryCharging size={18} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Daily Pulse
            </Text>
            {checkin?.mood || checkin?.energy ? (
              <View style={[styles.statusPill, { backgroundColor: colors.accentMuted }]}>
                <Text style={[styles.statusPillText, { color: colors.accent }]}>Logged</Text>
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
            {/* Energy */}
            <View style={styles.checkinField}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                ENERGY LEVEL (1–5)
              </Text>
              <View style={styles.scaleRow}>
                {energyLevels.map((lvl) => {
                  const isSelected = (checkin?.energy || 3) === lvl;
                  return (
                    <TouchableOpacity
                      key={lvl}
                      style={[
                        styles.scaleBtn,
                        isSelected
                          ? { backgroundColor: colors.accent, borderColor: colors.accent }
                          : { backgroundColor: colors.bgElevated, borderColor: colors.border },
                      ]}
                      onPress={() => handleEnergySelect(lvl)}
                    >
                      <Text
                        style={[
                          styles.scaleText,
                          { color: isSelected ? colors.bgPrimary : colors.textPrimary },
                        ]}
                      >
                        {lvl}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Mood */}
            <View style={styles.checkinField}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                CURRENT MOOD
              </Text>
              <View style={styles.scaleRow}>
                {moodEmojis.map((emoji, idx) => {
                  const val = idx + 1;
                  const isSelected = (checkin?.mood || 3) === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.scaleBtn,
                        isSelected
                          ? { backgroundColor: colors.accentMuted, borderColor: colors.accent }
                          : { backgroundColor: colors.bgElevated, borderColor: colors.border },
                      ]}
                      onPress={() => handleMoodSelect(val)}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Workout Toggle */}
            <View style={styles.checkinField}>
              <View style={styles.fieldHeaderRow}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  PHYSICAL WORKOUT
                </Text>
                <TouchableOpacity
                  style={[
                    styles.workoutToggle,
                    checkin?.workoutDone
                      ? { backgroundColor: colors.successBg, borderColor: colors.success }
                      : { backgroundColor: colors.bgElevated, borderColor: colors.border },
                  ]}
                  onPress={handleWorkoutToggle}
                >
                  <Dumbbell
                    size={15}
                    color={checkin?.workoutDone ? colors.success : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.workoutToggleText,
                      { color: checkin?.workoutDone ? colors.success : colors.textSecondary },
                    ]}
                  >
                    {checkin?.workoutDone ? 'Completed' : 'Did you train?'}
                  </Text>
                </TouchableOpacity>
              </View>

              {checkin?.workoutDone && (
                <TextInput
                  style={[
                    styles.textInputShort,
                    {
                      backgroundColor: colors.bgElevated,
                      color: colors.textPrimary,
                      borderColor: colors.border,
                      marginTop: 8,
                    },
                  ]}
                  placeholder="Workout details (e.g., 45m strength & 20m run)"
                  placeholderTextColor={colors.textMuted}
                  value={workoutNote}
                  onChangeText={setWorkoutNote}
                  onBlur={handleSaveWin}
                />
              )}
            </View>

            {/* 1-Line Win */}
            <View style={styles.checkinField}>
              <View style={styles.fieldHeaderRow}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  TODAY'S #1 WIN
                </Text>
                <Trophy size={14} color={colors.accent} />
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
                placeholder="One standout win or breakthrough today..."
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
              No pending tasks for today.
            </Text>
            <TouchableOpacity
              style={[styles.inlineAddBtn, { borderColor: colors.border }]}
              onPress={onOpenQuickAdd}
            >
              <Plus size={14} color={colors.accent} />
              <Text style={[styles.inlineAddText, { color: colors.accent }]}>Add a task</Text>
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
                      <CheckCircle2 size={19} color={colors.accent} />
                    ) : (
                      <Circle size={19} color={colors.textMuted} />
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

      {/* SECTION 4: ONE-TAP QUICK NOTE BANNER */}
      <TouchableOpacity
        style={[
          styles.quickNoteCard,
          {
            backgroundColor: colors.bgElevated,
            borderColor: colors.border,
          },
        ]}
        onPress={onNavigateToNotes}
        activeOpacity={0.8}
      >
        <View>
          <Text style={[styles.quickNoteTitle, { color: colors.textPrimary }]}>
            Jot down a fleeting thought
          </Text>
          <Text style={[styles.quickNoteSub, { color: colors.textSecondary }]}>
            Capture meetings, strategy notes, or quick ideas
          </Text>
        </View>
        <View style={[styles.quickNoteArrow, { backgroundColor: colors.accentMuted }]}>
          <ArrowRight size={16} color={colors.accent} />
        </View>
      </TouchableOpacity>
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
    paddingBottom: 32,
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
  cardMeta: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
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
  checkTouch: {
    padding: 2,
  },
  priorityInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
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
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scaleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scaleBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  scaleText: {
    fontSize: 15,
    fontWeight: '700',
  },
  emojiText: {
    fontSize: 18,
  },
  workoutToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  workoutToggleText: {
    fontSize: 12,
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
  quickNoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  quickNoteTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  quickNoteSub: {
    fontSize: 12,
  },
  quickNoteArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
