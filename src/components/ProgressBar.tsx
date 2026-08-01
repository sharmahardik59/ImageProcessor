import React from 'react';
import {StyleSheet, View, Text} from 'react-native';

type Props = {
  completed: number;
  total: number;
  isProcessing: boolean;
};

export const ProgressBar = React.memo(function ProgressBar({
  completed,
  total,
  isProcessing,
}: Props) {
  if (!isProcessing && completed === 0) return null;

  const pct = total > 0 ? (completed / total) * 100 : 0;
  const done = !isProcessing && completed === total && total > 0;

  let label: string;
  if (isProcessing) {
    label = `Processing ${completed} / ${total}`;
  } else if (done) {
    label = `Done - ${total} thumbnails`;
  } else {
    label = `Stopped at ${completed} / ${total}`;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.track}>
        <View style={[styles.fill, done && styles.fillDone, {width: `${pct}%`}]} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 8,
  },
  track: {
    height: 6,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  fillDone: {
    backgroundColor: '#34C759',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
