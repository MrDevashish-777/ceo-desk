import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { CheckSquare, FileText, X } from 'lucide-react-native';
import { createTask, createNote } from '../db/queries';
import { TaskArea, PriorityLevel } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface QuickActionModalProps {
  visible: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  visible,
  onClose,
  onRefresh,
}) => {
  const { colors } = useTheme();
  const [activeMode, setActiveMode] = useState<'task' | 'note'>('task');

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskArea, setTaskArea] = useState<TaskArea>('company');
  const [taskPriority, setTaskPriority] = useState<PriorityLevel>('med');

  // Note form state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [selectedTag, setSelectedTag] = useState('Ideas');

  const availableTags = ['Ideas', 'Meetings', 'Company', 'Personal', 'Strategy'];

  const handleSave = () => {
    if (activeMode === 'task') {
      if (!taskTitle.trim()) return;
      createTask({
        title: taskTitle.trim(),
        area: taskArea,
        priority: taskPriority,
        dueDate: new Date().toISOString().split('T')[0],
      });
      triggerHaptic('success');
      setTaskTitle('');
    } else {
      if (!noteTitle.trim() && !noteContent.trim()) return;
      createNote({
        title: noteTitle.trim() || 'Quick Note',
        content: noteContent.trim(),
        tags: [selectedTag],
        isPinned: false,
        checklist: [],
      });
      triggerHaptic('success');
      setNoteTitle('');
      setNoteContent('');
    }

    onRefresh();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.keyboardContainer}
            >
              <View
                style={[
                  styles.sheet,
                  {
                    backgroundColor: colors.bgSecondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                {/* Header */}
                <View style={styles.sheetHeader}>
                  <View style={styles.tabToggle}>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        activeMode === 'task' && {
                          backgroundColor: colors.accentMuted,
                          borderColor: colors.accent,
                        },
                      ]}
                      onPress={() => {
                        triggerHaptic('selection');
                        setActiveMode('task');
                      }}
                    >
                      <CheckSquare
                        size={16}
                        color={activeMode === 'task' ? colors.accent : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.toggleText,
                          {
                            color: activeMode === 'task' ? colors.accent : colors.textMuted,
                            fontWeight: activeMode === 'task' ? '700' : '500',
                          },
                        ]}
                      >
                        Quick Task
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        activeMode === 'note' && {
                          backgroundColor: colors.accentMuted,
                          borderColor: colors.accent,
                        },
                      ]}
                      onPress={() => {
                        triggerHaptic('selection');
                        setActiveMode('note');
                      }}
                    >
                      <FileText
                        size={16}
                        color={activeMode === 'note' ? colors.accent : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.toggleText,
                          {
                            color: activeMode === 'note' ? colors.accent : colors.textMuted,
                            fontWeight: activeMode === 'note' ? '700' : '500',
                          },
                        ]}
                      >
                        Quick Note
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <X size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Body: Task Form */}
                {activeMode === 'task' ? (
                  <View style={styles.formContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.bgElevated,
                          color: colors.textPrimary,
                          borderColor: colors.border,
                        },
                      ]}
                      placeholder="What needs to be done?"
                      placeholderTextColor={colors.textMuted}
                      value={taskTitle}
                      onChangeText={setTaskTitle}
                      autoFocus
                    />

                    {/* Area Selector */}
                    <Text style={[styles.label, { color: colors.textSecondary }]}>PILLAR</Text>
                    <View style={styles.optionsRow}>
                      <TouchableOpacity
                        style={[
                          styles.chip,
                          taskArea === 'company'
                            ? { backgroundColor: colors.companyBadgeBg, borderColor: colors.companyBadge }
                            : { backgroundColor: colors.bgElevated, borderColor: colors.border },
                        ]}
                        onPress={() => setTaskArea('company')}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: taskArea === 'company' ? colors.companyBadge : colors.textSecondary },
                          ]}
                        >
                          Company
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.chip,
                          taskArea === 'personal'
                            ? { backgroundColor: colors.personalBadgeBg, borderColor: colors.personalBadge }
                            : { backgroundColor: colors.bgElevated, borderColor: colors.border },
                        ]}
                        onPress={() => setTaskArea('personal')}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: taskArea === 'personal' ? colors.personalBadge : colors.textSecondary },
                          ]}
                        >
                          Personal
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Priority Selector */}
                    <Text style={[styles.label, { color: colors.textSecondary }]}>PRIORITY</Text>
                    <View style={styles.optionsRow}>
                      {(['high', 'med', 'low'] as PriorityLevel[]).map((p) => {
                        const isSelected = taskPriority === p;
                        const label = p.toUpperCase();
                        let badgeColor = colors.lowPriority;
                        let badgeBg = colors.lowPriorityBg;
                        if (p === 'high') {
                          badgeColor = colors.highPriority;
                          badgeBg = colors.highPriorityBg;
                        } else if (p === 'med') {
                          badgeColor = colors.medPriority;
                          badgeBg = colors.medPriorityBg;
                        }

                        return (
                          <TouchableOpacity
                            key={p}
                            style={[
                              styles.chip,
                              isSelected
                                ? { backgroundColor: badgeBg, borderColor: badgeColor }
                                : { backgroundColor: colors.bgElevated, borderColor: colors.border },
                            ]}
                            onPress={() => setTaskPriority(p)}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                { color: isSelected ? badgeColor : colors.textSecondary },
                              ]}
                            >
                              {label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  /* Body: Note Form */
                  <View style={styles.formContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.bgElevated,
                          color: colors.textPrimary,
                          borderColor: colors.border,
                        },
                      ]}
                      placeholder="Note Title"
                      placeholderTextColor={colors.textMuted}
                      value={noteTitle}
                      onChangeText={setNoteTitle}
                    />

                    <TextInput
                      style={[
                        styles.textArea,
                        {
                          backgroundColor: colors.bgElevated,
                          color: colors.textPrimary,
                          borderColor: colors.border,
                        },
                      ]}
                      placeholder="Capture your thoughts..."
                      placeholderTextColor={colors.textMuted}
                      value={noteContent}
                      onChangeText={setNoteContent}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />

                    {/* Tag Selector */}
                    <Text style={[styles.label, { color: colors.textSecondary }]}>TAG</Text>
                    <View style={styles.optionsRow}>
                      {availableTags.map((tag) => (
                        <TouchableOpacity
                          key={tag}
                          style={[
                            styles.chip,
                            selectedTag === tag
                              ? { backgroundColor: colors.accentMuted, borderColor: colors.accent }
                              : { backgroundColor: colors.bgElevated, borderColor: colors.border },
                          ]}
                          onPress={() => setSelectedTag(tag)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              { color: selectedTag === tag ? colors.accent : colors.textSecondary },
                            ]}
                          >
                            {tag}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Save CTA */}
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: colors.accent }]}
                  onPress={handleSave}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.saveBtnText, { color: colors.bgPrimary }]}>
                    Save {activeMode === 'task' ? 'Task' : 'Note'}
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  keyboardContainer: {
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tabToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toggleText: {
    fontSize: 13,
  },
  closeBtn: {
    padding: 6,
  },
  formContainer: {
    gap: 12,
  },
  input: {
    fontSize: 15,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  textArea: {
    fontSize: 15,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    height: 100,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
