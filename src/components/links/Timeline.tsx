import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TimelineEntry } from '../../types';

interface TimelineProps {
  entries: TimelineEntry[];
  onDeleteNote?: (noteId: string) => void;
}

const Timeline: React.FC<TimelineProps> = ({ entries, onDeleteNote }) => {
  if (!entries || entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>まだメモや要約がありません</Text>
      </View>
    );
  }

  // Sort entries by date, newest first
  const sortedEntries = [...entries].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  const handleLongPress = (entry: TimelineEntry) => {
    if (entry.type === 'note' && onDeleteNote) {
      onDeleteNote(entry.id);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>タイムライン</Text>
      {sortedEntries.map((entry, index) => (
        <View key={entry.id} style={styles.entryContainer}>
          <View style={styles.timeline}>
            <View style={[
              styles.dot,
              entry.type === 'summary' ? styles.summaryDot : styles.noteDot
            ]} />
            {index < sortedEntries.length - 1 && <View style={styles.line} />}
          </View>
          <View style={styles.contentContainer}>
            <Text style={styles.date}>
              {formatDate(entry.createdAt)}
            </Text>
            <TouchableOpacity
              style={[
                styles.card,
                entry.type === 'summary' ? styles.summaryCard : styles.noteCard
              ]}
              onLongPress={() => handleLongPress(entry)}
              delayLongPress={500}
              activeOpacity={entry.type === 'note' ? 0.7 : 1}
              disabled={entry.type === 'summary'}
            >
              <View style={styles.cardHeader}>
                <Ionicons
                  name={entry.type === 'summary' ? 'sparkles' : 'document-text'}
                  size={16}
                  color={entry.type === 'summary' ? '#FF9500' : '#007AFF'}
                  style={styles.icon}
                />
                <Text style={styles.typeLabel}>
                  {entry.type === 'summary' ? 'AI要約' : 'メモ'}
                </Text>
              </View>
              <Text style={styles.content}>{entry.content}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

const formatDate = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    // Today: show time
    return `今日, ${date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (days === 1) {
    return '昨日';
  } else if (days < 7) {
    return `${days}日前`;
  } else {
    // Show full date
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  entryContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timeline: {
    width: 30,
    alignItems: 'center',
    marginRight: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 25,
  },
  noteDot: {
    backgroundColor: '#007AFF',
  },
  summaryDot: {
    backgroundColor: '#FF9500',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E5EA',
    marginTop: 4,
  },
  contentContainer: {
    flex: 1,
  },
  date: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noteCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  summaryCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 6,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  content: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
});

export default Timeline;
