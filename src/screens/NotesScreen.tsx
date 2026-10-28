import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} from '../db/queries';
import { NoteItem, ChecklistItem } from '../types';
import {
  Search,
  Pin,
  Plus,
  Trash2,
  X,
  CheckSquare,
  Square,
  Tag,
  Edit3,
} from 'lucide-react-native';
import { triggerHaptic } from '../utils/haptics';

export const NotesScreen: React.FC = () => {
  const { colors } = useTheme();

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [refreshing, setRefreshing] = useState(false);

  // Editor Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editIsPinned, setEditIsPinned] = useState(false);
  const [editChecklist, setEditChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');

  const standardTags = ['All', 'Ideas', 'Meetings', 'Company', 'Personal', 'Strategy'];

  const loadNotes = useCallback(() => {
    const list = getNotes(searchQuery, selectedTag);
    setNotes(list);
  }, [searchQuery, selectedTag]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotes();
    setRefreshing(false);
  };

  const openNewNoteModal = () => {
    triggerHaptic('medium');
    setEditingNote(null);
    setEditTitle('');
    setEditContent('');
    setEditTags(selectedTag !== 'All' ? [selectedTag] : ['Ideas']);
    setEditIsPinned(false);
    setEditChecklist([]);
    setNewChecklistText('');
    setModalVisible(true);
  };

  const openEditNoteModal = (note: NoteItem) => {
    triggerHaptic('light');
    setEditingNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags);
    setEditIsPinned(note.isPinned);
    setEditChecklist([...note.checklist]);
    setNewChecklistText('');
    setModalVisible(true);
  };

  const handleSaveNote = () => {
    if (!editTitle.trim() && !editContent.trim() && editChecklist.length === 0) {
      setModalVisible(false);
      return;
    }

    triggerHaptic('success');
    if (editingNote) {
      updateNote({
        ...editingNote,
        title: editTitle.trim() || 'Untitled Note',
        content: editContent,
        tags: editTags,
        isPinned: editIsPinned,
        checklist: editChecklist,
      });
    } else {
      createNote({
        title: editTitle.trim() || 'Untitled Note',
        content: editContent,
        tags: editTags.length > 0 ? editTags : ['Ideas'],
        isPinned: editIsPinned,
        checklist: editChecklist,
      });
    }

    setModalVisible(false);
    loadNotes();
  };

  const handleDeleteNote = (id: string) => {
    triggerHaptic('warning');
    Alert.alert('Delete Note', 'Are you sure you want to permanently delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteNote(id);
          setModalVisible(false);
          loadNotes();
        },
      },
    ]);
  };

  const togglePinQuick = (note: NoteItem) => {
    triggerHaptic('selection');
    updateNote({
      ...note,
      isPinned: !note.isPinned,
    });
    loadNotes();
  };

  const addChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    triggerHaptic('light');
    setEditChecklist([
      ...editChecklist,
      {
        id: 'chk_' + Date.now().toString(36),
        text: newChecklistText.trim(),
        done: false,
      },
    ]);
    setNewChecklistText('');
  };

  const toggleChecklistItem = (id: string) => {
    triggerHaptic('light');
    setEditChecklist(
      editChecklist.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  const removeChecklistItem = (id: string) => {
    setEditChecklist(editChecklist.filter((item) => item.id !== id));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* SEARCH & TAG FILTER BAR */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderSubtle }]}>
        {/* Search input */}
        <View
          style={[
            styles.searchWrapper,
            {
              backgroundColor: colors.bgSecondary,
              borderColor: colors.border,
            },
          ]}
        >
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search notes, checklists, thoughts..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tag pills scroller */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagScroll}
        >
          {standardTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagPill,
                  isSelected
                    ? { backgroundColor: colors.accent, borderColor: colors.accent }
                    : { backgroundColor: colors.bgSecondary, borderColor: colors.border },
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  setSelectedTag(tag);
                }}
              >
                <Text
                  style={[
                    styles.tagPillText,
                    { color: isSelected ? colors.bgPrimary : colors.textSecondary },
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* NOTES GRID / LIST */}
      <ScrollView
        contentContainerStyle={styles.notesGrid}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {notes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No notes here</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Tap the button below to start an executive note or checklist.
            </Text>
          </View>
        ) : (
          notes.map((note) => {
            const hasChecklist = note.checklist && note.checklist.length > 0;
            const completedCount = hasChecklist
              ? note.checklist.filter((c) => c.done).length
              : 0;

            return (
              <TouchableOpacity
                key={note.id}
                style={[
                  styles.noteCard,
                  {
                    backgroundColor: colors.bgSecondary,
                    borderColor: note.isPinned ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => openEditNoteModal(note)}
                activeOpacity={0.8}
              >
                <View style={styles.noteTop}>
                  <Text style={[styles.noteTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {note.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => togglePinQuick(note)}
                    style={styles.pinBtn}
                  >
                    <Pin
                      size={14}
                      color={note.isPinned ? colors.accent : colors.textMuted}
                      style={{ transform: [{ rotate: '45deg' }] }}
                    />
                  </TouchableOpacity>
                </View>

                {note.content ? (
                  <Text
                    style={[styles.noteSnippet, { color: colors.textSecondary }]}
                    numberOfLines={3}
                  >
                    {note.content}
                  </Text>
                ) : null}

                {/* Checklist Summary */}
                {hasChecklist && (
                  <View style={[styles.checklistBadge, { backgroundColor: colors.bgElevated }]}>
                    <CheckSquare size={12} color={colors.accent} />
                    <Text style={[styles.checklistBadgeText, { color: colors.textSecondary }]}>
                      {completedCount}/{note.checklist.length} items done
                    </Text>
                  </View>
                )}

                {/* Footer Tags */}
                <View style={styles.noteFooter}>
                  <View style={styles.noteTagsRow}>
                    {note.tags.map((t) => (
                      <View key={t} style={[styles.miniTag, { backgroundColor: colors.accentMuted }]}>
                        <Text style={[styles.miniTagText, { color: colors.accent }]}>
                          #{t}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <Text style={[styles.noteDate, { color: colors.textMuted }]}>
                    {new Date(note.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* FLOATING ACTION BUTTON */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={openNewNoteModal}
        activeOpacity={0.85}
      >
        <Plus size={24} color={colors.bgPrimary} strokeWidth={2.4} />
      </TouchableOpacity>

      {/* NOTE EDITOR MODAL */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={handleSaveNote}>
        <View style={[styles.editorContainer, { backgroundColor: colors.bgPrimary }]}>
          {/* Editor Header */}
          <View style={[styles.editorHeader, { borderBottomColor: colors.borderSubtle }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.headerBtn}>
              <X size={22} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.editorHeaderActions}>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  setEditIsPinned(!editIsPinned);
                }}
                style={[
                  styles.headerBtn,
                  editIsPinned && { backgroundColor: colors.accentMuted, borderRadius: 8 },
                ]}
              >
                <Pin
                  size={18}
                  color={editIsPinned ? colors.accent : colors.textSecondary}
                  style={{ transform: [{ rotate: '45deg' }] }}
                />
              </TouchableOpacity>

              {editingNote && (
                <TouchableOpacity
                  onPress={() => handleDeleteNote(editingNote.id)}
                  style={styles.headerBtn}
                >
                  <Trash2 size={18} color={colors.highPriority} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleSaveNote}
                style={[styles.saveNoteBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={[styles.saveNoteBtnText, { color: colors.bgPrimary }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Editor Content */}
          <ScrollView contentContainerStyle={styles.editorScroll}>
            {/* Title Input */}
            <TextInput
              style={[styles.titleInput, { color: colors.textPrimary }]}
              placeholder="Note Title"
              placeholderTextColor={colors.textMuted}
              value={editTitle}
              onChangeText={setEditTitle}
            />

            {/* Tags Selector */}
            <View style={styles.editTagsRow}>
              {['Ideas', 'Meetings', 'Company', 'Personal', 'Strategy'].map((t) => {
                const isSelected = editTags.includes(t);
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.editTagChip,
                      isSelected
                        ? { backgroundColor: colors.accentMuted, borderColor: colors.accent }
                        : { backgroundColor: colors.bgSecondary, borderColor: colors.border },
                    ]}
                    onPress={() => {
                      triggerHaptic('selection');
                      if (isSelected) {
                        setEditTags(editTags.filter((item) => item !== t));
                      } else {
                        setEditTags([...editTags, t]);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.editTagChipText,
                        { color: isSelected ? colors.accent : colors.textSecondary },
                      ]}
                    >
                      #{t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Note Body Text */}
            <TextInput
              style={[styles.bodyInput, { color: colors.textPrimary }]}
              placeholder="Start typing your thoughts..."
              placeholderTextColor={colors.textMuted}
              value={editContent}
              onChangeText={setEditContent}
              multiline
              textAlignVertical="top"
            />

            {/* In-Note Checklists Section */}
            <View style={[styles.checklistSection, { borderTopColor: colors.borderSubtle }]}>
              <Text style={[styles.checklistSectionTitle, { color: colors.accent }]}>
                CHECKLIST
              </Text>

              {editChecklist.map((item) => (
                <View key={item.id} style={styles.checklistItemRow}>
                  <TouchableOpacity
                    onPress={() => toggleChecklistItem(item.id)}
                    style={styles.chkToggle}
                  >
                    {item.done ? (
                      <CheckSquare size={18} color={colors.accent} />
                    ) : (
                      <Square size={18} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>
                  <Text
                    style={[
                      styles.checklistItemText,
                      {
                        color: item.done ? colors.textMuted : colors.textPrimary,
                        textDecorationLine: item.done ? 'line-through' : 'none',
                      },
                    ]}
                  >
                    {item.text}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeChecklistItem(item.id)}
                    style={styles.chkRemove}
                  >
                    <X size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add checklist item row */}
              <View style={styles.addChkRow}>
                <TextInput
                  style={[
                    styles.addChkInput,
                    {
                      backgroundColor: colors.bgSecondary,
                      color: colors.textPrimary,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Add a checklist item..."
                  placeholderTextColor={colors.textMuted}
                  value={newChecklistText}
                  onChangeText={setNewChecklistText}
                  onSubmitEditing={addChecklistItem}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[styles.addChkBtn, { backgroundColor: colors.accentMuted, borderColor: colors.accent }]}
                  onPress={addChecklistItem}
                >
                  <Plus size={16} color={colors.accent} />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  tagScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  tagPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notesGrid: {
    padding: 16,
    gap: 12,
    paddingBottom: 80,
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
  noteCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  noteTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  pinBtn: {
    padding: 4,
  },
  noteSnippet: {
    fontSize: 13,
    lineHeight: 18,
  },
  checklistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  checklistBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  noteTagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  miniTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  noteDate: {
    fontSize: 11,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  editorContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  editorHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBtn: {
    padding: 8,
  },
  saveNoteBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
  },
  saveNoteBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  editorScroll: {
    padding: 20,
    gap: 16,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '700',
  },
  editTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  editTagChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  editTagChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bodyInput: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 140,
  },
  checklistSection: {
    borderTopWidth: 1,
    paddingTop: 16,
    gap: 10,
  },
  checklistSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  checklistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  chkToggle: {
    padding: 2,
  },
  checklistItemText: {
    fontSize: 14,
    flex: 1,
  },
  chkRemove: {
    padding: 4,
  },
  addChkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  addChkInput: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
  },
  addChkBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
