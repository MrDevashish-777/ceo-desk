import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import {
  getInsightsData,
  InsightsData,
  getWeeklyReview,
  upsertWeeklyReview,
} from '../db/queries';
import { WeeklyReview } from '../types';
import {
  Flame,
  CheckCircle2,
  Trophy,
  Dumbbell,
  Sparkles,
  TrendingUp,
  Award,
  Calendar,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react-native';
import { triggerHaptic } from '../utils/haptics';

export const InsightsScreen: React.FC = () => {
  const { colors } = useTheme();

  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [weeklyReview, setWeeklyReview] = useState<WeeklyReview | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(6); // Default to today

  // Review inputs
  const [workedText, setWorkedText] = useState('');
  const [didntWorkText, setDidntWorkText] = useState('');
  const [focusNextWeek, setFocusNextWeek] = useState('');

  // Get current week's Monday
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff)).toISOString().split('T')[0];
  };

  const mondayStr = getMonday(new Date());

  const loadData = useCallback(() => {
    const data = getInsightsData();
    setInsights(data);

    const review = getWeeklyReview(mondayStr);
    setWeeklyReview(review);
    if (review) {
      setWorkedText(review.workedText || '');
      setDidntWorkText(review.didntWorkText || '');
      setFocusNextWeek(review.focusNextWeek || '');
    } else {
      setWorkedText('');
      setDidntWorkText('');
      setFocusNextWeek('');
    }
  }, [mondayStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const handleSaveReview = () => {
    const updated = upsertWeeklyReview({
      weekStartDate: mondayStr,
      workedText: workedText.trim(),
      didntWorkText: didntWorkText.trim(),
      focusNextWeek: focusNextWeek.trim(),
    });
    setWeeklyReview(updated);
  };

  const maxScore = 5;
  const activeDay = selectedDayIndex !== null && insights?.days[selectedDayIndex];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      {/* EXECUTIVE SCORECARD TILES WITH INTERACTIVE ICONS */}
      <View style={styles.metricsGrid}>
        {/* Workout Streak */}
        <View style={[styles.metricCard, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIconBox, { backgroundColor: colors.accentMuted }]}>
              <Flame size={16} color={colors.accent} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Streak</Text>
          </View>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
            {insights?.workoutStreak || 0}
            <Text style={[styles.metricUnit, { color: colors.accent }]}> d</Text>
          </Text>
          <Text style={[styles.metricSub, { color: colors.textMuted }]}>Workout consistency</Text>
        </View>

        {/* Workouts this week */}
        <View style={[styles.metricCard, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIconBox, { backgroundColor: colors.successBg }]}>
              <Dumbbell size={16} color={colors.success} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Training</Text>
          </View>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
            {insights?.totalWorkoutsThisWeek || 0}
            <Text style={[styles.metricUnit, { color: colors.textMuted }]}> / 7</Text>
          </Text>
          <Text style={[styles.metricSub, { color: colors.textMuted }]}>Sessions this week</Text>
        </View>

        {/* Tasks Done */}
        <View style={[styles.metricCard, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIconBox, { backgroundColor: colors.companyBadgeBg }]}>
              <CheckCircle2 size={16} color={colors.companyBadge} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Output</Text>
          </View>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
            {insights?.tasksDoneThisWeek || 0}
          </Text>
          <Text style={[styles.metricSub, { color: colors.textMuted }]}>Tasks completed</Text>
        </View>

        {/* Priorities Won */}
        <View style={[styles.metricCard, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIconBox, { backgroundColor: colors.accentMuted }]}>
              <Trophy size={16} color={colors.accent} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Milestones</Text>
          </View>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
            {insights?.totalPrioritiesDoneThisWeek || 0}
          </Text>
          <Text style={[styles.metricSub, { color: colors.textMuted }]}>Outcomes won</Text>
        </View>
      </View>

      {/* ENERGY & MOOD 7-DAY INTERACTIVE CHART */}
      <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerTitleRow}>
            <TrendingUp size={16} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Energy & Mood Dynamics
            </Text>
          </View>
          {activeDay && (
            <Text style={[styles.activeDayDetail, { color: colors.accent }]}>
              {activeDay.dayLabel}: Energy {activeDay.energy}/5 • Mood {activeDay.mood}/5
            </Text>
          )}
        </View>

        {/* Interactive Bar Chart */}
        <View style={styles.chartWrapper}>
          <View style={styles.barsContainer}>
            {insights?.days.map((d, index) => {
              const energyHeight = Math.max(12, (d.energy / maxScore) * 80);
              const moodHeight = Math.max(12, (d.mood / maxScore) * 80);
              const isSelected = selectedDayIndex === index;

              return (
                <TouchableOpacity
                  key={d.date}
                  style={[
                    styles.barCol,
                    isSelected && [styles.barColActive, { backgroundColor: colors.bgElevated }],
                  ]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setSelectedDayIndex(index);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.barPair}>
                    {/* Energy Bar */}
                    <View
                      style={[
                        styles.barPill,
                        {
                          height: energyHeight,
                          backgroundColor: colors.accent,
                        },
                      ]}
                    />
                    {/* Mood Bar */}
                    <View
                      style={[
                        styles.barPill,
                        {
                          height: moodHeight,
                          backgroundColor: colors.companyBadge,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.dayLabel,
                      { color: isSelected ? colors.accent : colors.textMuted, fontWeight: isSelected ? '700' : '500' },
                    ]}
                  >
                    {d.dayLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={[styles.legendRow, { borderTopColor: colors.borderSubtle }]}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Energy</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.companyBadge }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Mood</Text>
            </View>
          </View>
        </View>
      </View>

      {/* WINS LOG OF THE WEEK */}
      <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerTitleRow}>
            <Sparkles size={16} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Wins of the Week
            </Text>
          </View>
        </View>

        <View style={styles.winsList}>
          {insights?.days.filter((d) => Boolean(d.winLine)).length === 0 ? (
            <Text style={[styles.emptyWinsText, { color: colors.textMuted }]}>
              Log your evening wins in the Today tab to review them here.
            </Text>
          ) : (
            insights?.days
              .filter((d) => Boolean(d.winLine))
              .map((d) => (
                <View
                  key={d.date}
                  style={[styles.winItem, { borderBottomColor: colors.borderSubtle }]}
                >
                  <Award size={14} color={colors.accent} style={{ marginTop: 2 }} />
                  <Text style={[styles.winDay, { color: colors.accent }]}>{d.dayLabel}:</Text>
                  <Text style={[styles.winText, { color: colors.textPrimary }]}>{d.winLine}</Text>
                </View>
              ))
          )}
        </View>
      </View>

      {/* SUNDAY EXECUTIVE REVIEW */}
      <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerTitleRow}>
            <Calendar size={16} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Sunday Executive Review
            </Text>
          </View>
          <Text style={[styles.weekLabel, { color: colors.accent }]}>
            WEEK OF {mondayStr}
          </Text>
        </View>

        <View style={styles.reviewBody}>
          {/* What worked */}
          <View style={styles.reviewField}>
            <View style={styles.reviewFieldHeader}>
              <Trophy size={13} color={colors.accent} />
              <Text style={[styles.reviewFieldLabel, { color: colors.textSecondary }]}>
                WHAT WORKED WELL THIS WEEK?
              </Text>
            </View>
            <TextInput
              style={[
                styles.reviewInput,
                { backgroundColor: colors.bgElevated, color: colors.textPrimary, borderColor: colors.border },
              ]}
              placeholder="Key strategic breakthroughs, disciplined habits, team wins..."
              placeholderTextColor={colors.textMuted}
              value={workedText}
              onChangeText={setWorkedText}
              onBlur={handleSaveReview}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* What didn't work */}
          <View style={styles.reviewField}>
            <View style={styles.reviewFieldHeader}>
              <AlertTriangle size={13} color={colors.highPriority} />
              <Text style={[styles.reviewFieldLabel, { color: colors.textSecondary }]}>
                WHAT FRICTION OR BOTTLENECKS OCCURRED?
              </Text>
            </View>
            <TextInput
              style={[
                styles.reviewInput,
                { backgroundColor: colors.bgElevated, color: colors.textPrimary, borderColor: colors.border },
              ]}
              placeholder="Bottlenecks, distractions, missed commitments..."
              placeholderTextColor={colors.textMuted}
              value={didntWorkText}
              onChangeText={setDidntWorkText}
              onBlur={handleSaveReview}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Focus for next week */}
          <View style={styles.reviewField}>
            <View style={styles.reviewFieldHeader}>
              <Lightbulb size={13} color={colors.medPriority} />
              <Text style={[styles.reviewFieldLabel, { color: colors.textSecondary }]}>
                CORE FOCUS & PRIORITY FOR NEXT WEEK
              </Text>
            </View>
            <TextInput
              style={[
                styles.reviewInput,
                { backgroundColor: colors.bgElevated, color: colors.textPrimary, borderColor: colors.border },
              ]}
              placeholder="The #1 strategic needle mover for the upcoming week..."
              placeholderTextColor={colors.textMuted}
              value={focusNextWeek}
              onChangeText={setFocusNextWeek}
              onBlur={handleSaveReview}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
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
    paddingBottom: 40,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricSub: {
    fontSize: 11,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  activeDayDetail: {
    fontSize: 11,
    fontWeight: '700',
  },
  weekLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chartWrapper: {
    gap: 12,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    paddingHorizontal: 4,
  },
  barCol: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderRadius: 8,
  },
  barColActive: {
    borderRadius: 8,
  },
  barPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 80,
  },
  barPill: {
    width: 8,
    borderRadius: 4,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
  winsList: {
    gap: 8,
  },
  emptyWinsText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  winItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  winDay: {
    fontSize: 13,
    fontWeight: '700',
    width: 44,
  },
  winText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  reviewBody: {
    gap: 14,
  },
  reviewField: {
    gap: 6,
  },
  reviewFieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  reviewInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 65,
  },
});
