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
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import {
  getJournalEntry,
  upsertJournalEntry,
  getJournalDatesWithEntries,
} from '../db/queries';
import { JournalEntry } from '../types';
import {
  Brain,
  Activity,
  Heart,
  Building,
  CircleCheck,
  Lightbulb,
  Compass,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { triggerHaptic } from '../utils/haptics';

export const JournalScreen: React.FC = () => {
  const { colors } = useTheme();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [activeTab, setActiveTab] = useState<'quadrants' | 'triad'>('quadrants');
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [datesWithEntries, setDatesWithEntries] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Form states
  const [mental, setMental] = useState('');
  const [physical, setPhysical] = useState('');
  const [emotional, setEmotional] = useState('');
  const [company, setCompany] = useState('');
  const [didText, setDidText] = useState('');
  const [learnedText, setLearnedText] = useState('');
  const [nextText, setNextText] = useState('');

  const loadJournal = useCallback(() => {
    const dates = getJournalDatesWithEntries();
    setDatesWithEntries(dates);

    const j = getJournalEntry(selectedDate);
    setEntry(j);
    if (j) {
      setMental(j.mental || '');
      setPhysical(j.physical || '');
      setEmotional(j.emotional || '');
      setCompany(j.company || '');
      setDidText(j.didText || '');
      setLearnedText(j.learnedText || '');
      setNextText(j.nextText || '');
    } else {
      setMental('');
      setPhysical('');
      setEmotional('');
      setCompany('');
      setDidText('');
      setLearnedText('');
      setNextText('');
    }
  }, [selectedDate]);

  useEffect(() => {
    loadJournal();
  }, [loadJournal]);

  const onRefresh = () => {
    setRefreshing(true);
    loadJournal();
    setRefreshing(false);
  };

  const handleSaveField = () => {
    const updated = upsertJournalEntry({
      date: selectedDate,
      mental: mental.trim(),
      physical: physical.trim(),
      emotional: emotional.trim(),
      company: company.trim(),
      didText: didText.trim(),
      learnedText: learnedText.trim(),
      nextText: nextText.trim(),
    });
    setEntry(updated);
    const dates = getJournalDatesWithEntries();
    setDatesWithEntries(dates);
  };

  // Generate 7 days centered on selected date
  const renderCalendarStrip = () => {
    const days = [];
    const baseDate = new Date(selectedDate);

    for (let i = -3; i <= 3; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const isSelected = dStr === selectedDate;
      const hasEntry = datesWithEntries.includes(dStr);

      days.push(
        <TouchableOpacity
          key={dStr}
          style={[
            styles.calendarDay,
            isSelected && {
              backgroundColor: colors.accent,
              borderColor: colors.accent,
            },
            !isSelected && {
              backgroundColor: colors.bgSecondary,
              borderColor: colors.border,
            },
          ]}
          onPress={() => {
            triggerHaptic('selection');
            handleSaveField(); // save current before switching
            setSelectedDate(dStr);
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dayOfWeek,
              { color: isSelected ? colors.bgPrimary : colors.textMuted },
            ]}
          >
            {d.toLocaleDateString('en-US', { weekday: 'narrow' })}
          </Text>
          <Text
            style={[
              styles.dayNumber,
              {
                color: isSelected ? colors.bgPrimary : colors.textPrimary,
                fontWeight: isSelected ? '700' : '500',
              },
            ]}
          >
            {d.getDate()}
          </Text>

          {/* Icon or dot for logged entry */}
          <View style={styles.entryIndicator}>
            {hasEntry ? (
              <CircleCheck
                size={10}
                color={isSelected ? colors.bgPrimary : colors.accent}
              />
            ) : (
              <View style={styles.emptyDot} />
            )}
          </View>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const shiftDay = (delta: number) => {
    triggerHaptic('selection');
    handleSaveField();
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const formattedDateTitle = new Date(selectedDate + 'T00:00:00').toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* CALENDAR STRIP */}
      <View style={[styles.calendarHeader, { borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.calendarNav}>
          <TouchableOpacity onPress={() => shiftDay(-1)} style={styles.navArrow} activeOpacity={0.7}>
            <ChevronLeft size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.dateTitleText, { color: colors.textPrimary }]}>
            {formattedDateTitle}
          </Text>
          <TouchableOpacity onPress={() => shiftDay(1)} style={styles.navArrow} activeOpacity={0.7}>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.stripRow}>{renderCalendarStrip()}</View>
      </View>

      {/* VIEW SELECTOR */}
      <View style={[styles.tabSelector, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === 'quadrants' && {
              borderBottomColor: colors.accent,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => {
            triggerHaptic('selection');
            setActiveTab('quadrants');
          }}
        >
          <Sparkles
            size={14}
            color={activeTab === 'quadrants' ? colors.accent : colors.textMuted}
          />
          <Text
            style={[
              styles.tabBtnText,
              {
                color: activeTab === 'quadrants' ? colors.accent : colors.textMuted,
                fontWeight: activeTab === 'quadrants' ? '700' : '500',
              },
            ]}
          >
            4 Pillars
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === 'triad' && {
              borderBottomColor: colors.accent,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => {
            triggerHaptic('selection');
            setActiveTab('triad');
          }}
        >
          <Compass
            size={14}
            color={activeTab === 'triad' ? colors.accent : colors.textMuted}
          />
          <Text
            style={[
              styles.tabBtnText,
              {
                color: activeTab === 'triad' ? colors.accent : colors.textMuted,
                fontWeight: activeTab === 'triad' ? '700' : '500',
              },
            ]}
          >
            Executive Triad
          </Text>
        </TouchableOpacity>
      </View>

      {/* JOURNAL FORM FIELDS */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {activeTab === 'quadrants' ? (
          /* 4 QUADRANTS */
          <View style={styles.quadrantGrid}>
            {/* 1. Mental */}
            <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconPill, { backgroundColor: colors.accentMuted }]}>
                  <Brain size={16} color={colors.accent} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Mental State</Text>
              </View>
              <TextInput
                style={[
                  styles.cardInput,
                  { backgroundColor: colors.bgElevated, color: colors.textPrimary, borderColor: colors.border },
                ]}
                placeholder="Clarity, key decisions, focus level..."
                placeholderTextColor={colors.textMuted}
                value={mental}
                onChangeText={setMental}
                onBlur={handleSaveField}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* 2. Physical */}
            <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconPill, { backgroundColor: colors.successBg }]}>
                  <Activity size={16} color={colors.success} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Physical Vitality</Text>
              </View>
              <TextInput
                style={[
                  styles.cardInput,
                  { backgroundColor: colors.bgElevated, color: colors.textPrimary, borderColor: colors.border },
                ]}
                placeholder="Body energy, recovery, nutrition notes..."
                placeholderTextColor={colors.textMuted}
                value={physical}
                onChangeText={setPhysical}
                onBlur={handleSaveField}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* 3. Emotional */}
            <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconPill, { backgroundColor: colors.highPriorityBg }]}>
                  <Heart size={16} color={colors.highPriority} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Emotional Grounding</Text>
              </View>
              <TextInput
                style={[
                  styles.cardInput,
                  { backgroundColor: colors.bgElevated, color: colors.textPrimary, borderColor: colors.border },
                ]}
                placeholder="Relationships, mood, inner calm..."
                placeholderTextColor={colors.textMuted}
                value={emotional}
                onChangeText={setEmotional}
                onBlur={handleSaveField}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* 4. Company */}
            <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconPill, { backgroundColor: colors.companyBadgeBg }]}>
                  <Building size={16} color={colors.companyBadge} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Company & Execution</Text>
              </View>
              <TextInput
                style={[
                  styles.cardInput,
                  { backgroundColor: colors.bgElevated, color: colors.textPrimary, borderColor: colors.border },
                ]}
                placeholder="Strategic moves, team pulse, business milestones..."
                placeholderTextColor={colors.textMuted}
                value={company}
                onChangeText={setCompany}
                onBlur={handleSaveField}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        ) : (
          /* EXECUTIVE TRIAD */
          <View style={styles.triadContainer}>
            {/* What I did */}
            <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconPill, { backgroundColor: colors.accentMuted }]}>
                  <CircleCheck size={16} color={colors.accent} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>What I Did</Text>
              </View>
              <TextInput
                style={[
                  styles.cardInput,
                  { backgroundColor: colors.bgElevated, color: colors.textPrimary, borderColor: colors.border },
                ]}
                placeholder="Key accomplishments and output created today..."
                placeholderTextColor={colors.textMuted}
                value={didText}
                onChangeText={setDidText}
                onBlur={handleSaveField}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* What I learned */}
            <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconPill, { backgroundColor: colors.medPriorityBg }]}>
                  <Lightbulb size={16} color={colors.medPriority} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>What I Learned</Text>
              </View>
              <TextInput
                style={[
                  styles.cardInput,
                  { backgroundColor: colors.bgElevated, color: colors.textPrimary, borderColor: colors.border },
                ]}
                placeholder="Mistakes, insights, operational lessons..."
                placeholderTextColor={colors.textMuted}
                value={learnedText}
                onChangeText={setLearnedText}
                onBlur={handleSaveField}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* What's next */}
            <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconPill, { backgroundColor: colors.lowPriorityBg }]}>
                  <Compass size={16} color={colors.lowPriority} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>What's Next</Text>
              </View>
              <TextInput
                style={[
                  styles.cardInput,
                  { backgroundColor: colors.bgElevated, color: colors.textPrimary, borderColor: colors.border },
                ]}
                placeholder="Core priorities and strategic adjustments for tomorrow..."
                placeholderTextColor={colors.textMuted}
                value={nextText}
                onChangeText={setNextText}
                onBlur={handleSaveField}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendarHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  calendarNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navArrow: {
    padding: 6,
  },
  dateTitleText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  stripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarDay: {
    width: 44,
    height: 62,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 2,
  },
  dayOfWeek: {
    fontSize: 11,
    fontWeight: '600',
  },
  dayNumber: {
    fontSize: 15,
  },
  entryIndicator: {
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'transparent',
  },
  tabSelector: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    gap: 20,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnText: {
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  quadrantGrid: {
    gap: 14,
  },
  triadContainer: {
    gap: 14,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconPill: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 70,
  },
});
