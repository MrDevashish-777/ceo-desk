import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import {
  getTasks,
  createTask,
  toggleTaskStatus,
  deleteTask,
} from '../db/queries';
import { TaskItem, TaskFilter, TaskArea, PriorityLevel } from '../types';
import {
  CheckCircle2,
  Circle,
  Trash2,
  Plus,
  Calendar,
  Briefcase,
  User,
  AlertCircle,
} from 'lucide-react-native';
import { triggerHaptic } from '../utils/haptics';

export const TasksScreen: React.FC = () => {
  const { colors } = useTheme();

  const [activeFilter, setActiveFilter] = useState<TaskFilter>('today');
  const [areaFilter, setAreaFilter] = useState<TaskArea | 'all'>('all');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fast inline task creation input
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineArea, setInlineArea] = useState<TaskArea>('company');
  const [inlinePriority, setInlinePriority] = useState<PriorityLevel>('med');

  const loadTasks = useCallback(() => {
    const list = getTasks(activeFilter, areaFilter);
    setTasks(list);
  }, [activeFilter, areaFilter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTasks();
    setRefreshing(false);
  };

  const handleToggle = (task: TaskItem) => {
    triggerHaptic('light');
    toggleTaskStatus(task.id, task.status);
    loadTasks();
  };

  const handleDelete = (id: string) => {
    triggerHaptic('warning');
    Alert.alert('Delete Task', 'Are you sure you want to remove this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTask(id);
          loadTasks();
        },
      },
    ]);
  };

  const handleCreateInline = () => {
    if (!inlineTitle.trim()) return;
    triggerHaptic('success');
    createTask({
      title: inlineTitle.trim(),
      area: inlineArea,
      priority: inlinePriority,
      dueDate:
        activeFilter === 'today'
          ? new Date().toISOString().split('T')[0]
          : activeFilter === 'upcoming'
          ? new Date(Date.now() + 86400000).toISOString().split('T')[0]
          : null,
    });
    setInlineTitle('');
    loadTasks();
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'high':
        return { label: 'HIGH', color: colors.highPriority, bg: colors.highPriorityBg };
      case 'med':
        return { label: 'MED', color: colors.medPriority, bg: colors.medPriorityBg };
      case 'low':
      default:
        return { label: 'LOW', color: colors.lowPriority, bg: colors.lowPriorityBg };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* FILTER CONTROLS */}
      <View style={[styles.filterBar, { borderBottomColor: colors.borderSubtle }]}>
        {/* Status Segments */}
        <View style={[styles.segmentContainer, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          {(['today', 'upcoming', 'done'] as TaskFilter[]).map((tab) => {
            const isSelected = activeFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.segmentBtn,
                  isSelected && {
                    backgroundColor: colors.accentMuted,
                    borderColor: colors.accent,
                  },
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  setActiveFilter(tab);
                }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: isSelected ? colors.accent : colors.textMuted,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Pillar Filter Pills */}
        <View style={styles.pillarFilterRow}>
          {[
            { id: 'all', label: 'All' },
            { id: 'company', label: 'Company' },
            { id: 'personal', label: 'Personal' },
          ].map((item) => {
            const isSelected = areaFilter === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.filterPill,
                  isSelected
                    ? { backgroundColor: colors.accent, borderColor: colors.accent }
                    : { backgroundColor: colors.bgElevated, borderColor: colors.border },
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  setAreaFilter(item.id as any);
                }}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isSelected ? colors.bgPrimary : colors.textSecondary },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* TASK LIST */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {tasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No tasks found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {activeFilter === 'done'
                ? 'Completed tasks will be archived here.'
                : 'Stay proactive — capture your next action below.'}
            </Text>
          </View>
        ) : (
          tasks.map((task) => {
            const isDone = task.status === 'done';
            const prioBadge = getPriorityBadge(task.priority);
            const isCompany = task.area === 'company';

            return (
              <View
                key={task.id}
                style={[
                  styles.taskCard,
                  {
                    backgroundColor: colors.bgSecondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleToggle(task)}
                  style={styles.checkWrapper}
                  activeOpacity={0.7}
                >
                  {isDone ? (
                    <CheckCircle2 size={22} color={colors.accent} />
                  ) : (
                    <Circle size={22} color={colors.textMuted} />
                  )}
                </TouchableOpacity>

                <View style={styles.taskMiddle}>
                  <Text
                    style={[
                      styles.taskTitle,
                      {
                        color: isDone ? colors.textMuted : colors.textPrimary,
                        textDecorationLine: isDone ? 'line-through' : 'none',
                      },
                    ]}
                  >
                    {task.title}
                  </Text>

                  {/* Badges */}
                  <View style={styles.badgeRow}>
                    {/* Pillar Badge */}
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: isCompany
                            ? colors.companyBadgeBg
                            : colors.personalBadgeBg,
                        },
                      ]}
                    >
                      {isCompany ? (
                        <Briefcase size={10} color={colors.companyBadge} />
                      ) : (
                        <User size={10} color={colors.personalBadge} />
                      )}
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color: isCompany
                              ? colors.companyBadge
                              : colors.personalBadge,
                          },
                        ]}
                      >
                        {isCompany ? 'Company' : 'Personal'}
                      </Text>
                    </View>

                    {/* Priority Badge */}
                    <View style={[styles.badge, { backgroundColor: prioBadge.bg }]}>
                      <Text style={[styles.badgeText, { color: prioBadge.color }]}>
                        {prioBadge.label}
                      </Text>
                    </View>

                    {/* Due Date */}
                    {task.dueDate && (
                      <View style={[styles.badge, { backgroundColor: colors.bgElevated }]}>
                        <Calendar size={10} color={colors.textMuted} />
                        <Text style={[styles.badgeText, { color: colors.textMuted }]}>
                          {task.dueDate}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Delete Action */}
                <TouchableOpacity
                  onPress={() => handleDelete(task.id)}
                  style={styles.deleteBtn}
                  activeOpacity={0.6}
                >
                  <Trash2 size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FAST INLINE CREATION BAR */}
      <View
        style={[
          styles.inlineBar,
          {
            backgroundColor: colors.bgSecondary,
            borderTopColor: colors.borderSubtle,
          },
        ]}
      >
        <TextInput
          style={[
            styles.inlineInput,
            {
              backgroundColor: colors.bgElevated,
              color: colors.textPrimary,
              borderColor: colors.border,
            },
          ]}
          placeholder="New task..."
          placeholderTextColor={colors.textMuted}
          value={inlineTitle}
          onChangeText={setInlineTitle}
          onSubmitEditing={handleCreateInline}
          returnKeyType="done"
        />

        {/* Quick Area Switcher */}
        <TouchableOpacity
          style={[
            styles.quickAreaBtn,
            {
              backgroundColor:
                inlineArea === 'company'
                  ? colors.companyBadgeBg
                  : colors.personalBadgeBg,
              borderColor:
                inlineArea === 'company'
                  ? colors.companyBadge
                  : colors.personalBadge,
            },
          ]}
          onPress={() => {
            triggerHaptic('selection');
            setInlineArea((prev) => (prev === 'company' ? 'personal' : 'company'));
          }}
        >
          <Text
            style={[
              styles.quickAreaText,
              {
                color:
                  inlineArea === 'company'
                    ? colors.companyBadge
                    : colors.personalBadge,
              },
            ]}
          >
            {inlineArea === 'company' ? 'Co' : 'Me'}
          </Text>
        </TouchableOpacity>

        {/* Quick Add Button */}
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.accent }]}
          onPress={handleCreateInline}
          activeOpacity={0.8}
        >
          <Plus size={18} color={colors.bgPrimary} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentText: {
    fontSize: 13,
  },
  pillarFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 24,
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 240,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  checkWrapper: {
    padding: 2,
  },
  taskMiddle: {
    flex: 1,
    gap: 6,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  deleteBtn: {
    padding: 6,
  },
  inlineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  inlineInput: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  quickAreaBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAreaText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
