import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import {
  X,
  Share2,
  Copy,
  Check,
  FileText,
  BookmarkPlus,
  Sparkles,
} from 'lucide-react-native';
import { createNote } from '../db/queries';
import { triggerHaptic } from '../utils/haptics';

interface ExecutiveMemoModalProps {
  visible: boolean;
  onClose: () => void;
  dateStr: string;
  topPriorities: { text: string; done: boolean }[];
  completedTasks: string[];
  energyScore: number;
  moodScore: number;
  workoutNote?: string;
  winLine?: string;
  journalMental?: string;
  journalLearned?: string;
}

export const ExecutiveMemoModal: React.FC<ExecutiveMemoModalProps> = ({
  visible,
  onClose,
  dateStr,
  topPriorities,
  completedTasks,
  energyScore,
  moodScore,
  workoutNote,
  winLine,
  journalMental,
  journalLearned,
}) => {
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);
  const [savedToNotes, setSavedToNotes] = useState(false);

  const formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const generateMarkdownMemo = () => {
    let md = `## 🏛️ CEO DESK — DAILY EXECUTIVE BRIEFING\n`;
    md += `**Date:** ${formattedDate}\n\n`;
    md += `---\n\n`;

    md += `### 🎯 Top 3 Outcomes\n`;
    topPriorities.forEach((p, idx) => {
      const status = p.done ? '✅ [COMPLETED]' : '⏳ [PENDING]';
      md += `${idx + 1}. ${status} ${p.text || 'Not set'}\n`;
    });
    md += `\n`;

    if (completedTasks.length > 0) {
      md += `### ⚡ Output & Tasks Executed\n`;
      completedTasks.forEach((t) => {
        md += `- ${t}\n`;
      });
      md += `\n`;
    }

    md += `### 🔋 Daily Pulse & Vitality\n`;
    md += `- **Energy:** ${energyScore}/5\n`;
    md += `- **State of Mind:** ${moodScore}/5\n`;
    if (workoutNote) md += `- **Physical Training:** ${workoutNote}\n`;
    md += `\n`;

    if (winLine) {
      md += `### 🏆 Standout Win of the Day\n`;
      md += `> "${winLine}"\n\n`;
    }

    if (journalMental || journalLearned) {
      md += `### 🧠 Strategic Reflections\n`;
      if (journalMental) md += `- **Mental State:** ${journalMental}\n`;
      if (journalLearned) md += `- **Key Lesson:** ${journalLearned}\n`;
      md += `\n`;
    }

    md += `---\n`;
    md += `*Generated automatically by CEO Desk • 100% Private Executive Suite*\n`;
    return md;
  };

  const memoText = generateMarkdownMemo();

  const handleShare = async () => {
    triggerHaptic('medium');
    try {
      await Share.share({
        message: memoText,
        title: `CEO Desk Daily Memo - ${formattedDate}`,
      });
    } catch {
      // Ignore
    }
  };

  const handleSaveToNotes = () => {
    triggerHaptic('success');
    createNote({
      title: `Executive Memo — ${formattedDate}`,
      content: memoText,
      tags: ['Meetings', 'Company', 'Strategy'],
      isPinned: true,
      checklist: [],
    });
    setSavedToNotes(true);
    Alert.alert('Saved to Notes', 'Your daily executive memo has been pinned in Notes.');
  };

  return (
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
          <View>
            <Text style={[styles.headerSubtitle, { color: colors.accent }]}>ONE-PAGE BRIEFING</Text>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Executive Memo</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Memo Content Sheet */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.memoSheet, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            {/* Memo Masthead */}
            <View style={[styles.memoMasthead, { borderBottomColor: colors.borderSubtle }]}>
              <View style={styles.mastheadTop}>
                <Sparkles size={16} color={colors.accent} />
                <Text style={[styles.mastheadBrand, { color: colors.accent }]}>CEO DESK DISPATCH</Text>
              </View>
              <Text style={[styles.mastheadDate, { color: colors.textPrimary }]}>{formattedDate}</Text>
            </View>

            {/* Top Outcomes */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionHeading, { color: colors.accent }]}>NON-NEGOTIABLE OUTCOMES</Text>
              {topPriorities.map((p, idx) => (
                <View key={idx} style={styles.priorityMemoRow}>
                  <Text style={[styles.prioStatus, { color: p.done ? colors.success : colors.medPriority }]}>
                    {p.done ? '✓' : '○'}
                  </Text>
                  <Text
                    style={[
                      styles.prioText,
                      {
                        color: p.done ? colors.textPrimary : colors.textSecondary,
                        textDecorationLine: p.done ? 'none' : 'none',
                      },
                    ]}
                  >
                    #{idx + 1}: {p.text || 'Unassigned'}
                  </Text>
                </View>
              ))}
            </View>

            {/* Daily Win */}
            {winLine ? (
              <View style={[styles.winQuoteBox, { backgroundColor: colors.accentMuted, borderColor: colors.accent }]}>
                <Text style={[styles.winQuoteHeading, { color: colors.accent }]}>STANDOUT WIN</Text>
                <Text style={[styles.winQuoteText, { color: colors.textPrimary }]}>"{winLine}"</Text>
              </View>
            ) : null}

            {/* Daily Pulse Breakdown */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionHeading, { color: colors.accent }]}>PULSE & METRICS</Text>
              <View style={styles.metricsRow}>
                <View style={[styles.metricChip, { backgroundColor: colors.bgElevated }]}>
                  <Text style={[styles.metricChipLabel, { color: colors.textMuted }]}>ENERGY</Text>
                  <Text style={[styles.metricChipVal, { color: colors.textPrimary }]}>{energyScore}/5</Text>
                </View>
                <View style={[styles.metricChip, { backgroundColor: colors.bgElevated }]}>
                  <Text style={[styles.metricChipLabel, { color: colors.textMuted }]}>MIND</Text>
                  <Text style={[styles.metricChipVal, { color: colors.textPrimary }]}>{moodScore}/5</Text>
                </View>
                <View style={[styles.metricChip, { backgroundColor: colors.bgElevated }]}>
                  <Text style={[styles.metricChipLabel, { color: colors.textMuted }]}>TRAINING</Text>
                  <Text style={[styles.metricChipVal, { color: workoutNote ? colors.success : colors.textMuted }]}>
                    {workoutNote ? 'Completed' : 'Rest'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Tasks Accomplished */}
            {completedTasks.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={[styles.sectionHeading, { color: colors.accent }]}>
                  OUTPUT COMPLETED ({completedTasks.length})
                </Text>
                {completedTasks.slice(0, 6).map((t, idx) => (
                  <View key={idx} style={styles.taskMemoRow}>
                    <Text style={[styles.bulletDot, { color: colors.accent }]}>•</Text>
                    <Text style={[styles.taskMemoText, { color: colors.textPrimary }]}>{t}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={[styles.bottomActionBar, { borderTopColor: colors.borderSubtle }]}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
            onPress={handleSaveToNotes}
            disabled={savedToNotes}
          >
            <BookmarkPlus size={18} color={savedToNotes ? colors.success : colors.textPrimary} />
            <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>
              {savedToNotes ? 'Saved' : 'Save to Notes'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtnPrimary, { backgroundColor: colors.accent }]}
            onPress={handleShare}
          >
            <Share2 size={18} color={colors.bgPrimary} />
            <Text style={[styles.actionBtnPrimaryText, { color: colors.bgPrimary }]}>Share Memo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  memoSheet: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 18,
  },
  memoMasthead: {
    borderBottomWidth: 1,
    paddingBottom: 14,
    gap: 4,
  },
  mastheadTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mastheadBrand: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  mastheadDate: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  priorityMemoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  prioStatus: {
    fontSize: 14,
    fontWeight: '700',
    width: 18,
  },
  prioText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  winQuoteBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  winQuoteHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  winQuoteText: {
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricChip: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    gap: 2,
  },
  metricChipLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  metricChipVal: {
    fontSize: 15,
    fontWeight: '700',
  },
  taskMemoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    fontSize: 16,
    lineHeight: 18,
  },
  taskMemoText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  bottomActionBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
