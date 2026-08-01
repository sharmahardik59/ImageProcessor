import React, {useCallback, useMemo} from 'react';
import {Image, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import type {ImageMetadata} from '../types';

type Props = {
  id: string;
  thumbnailUri: string | null;
  metadata: ImageMetadata | null;
  isSelected: boolean;
  cellSize: number;
  onPress: (id: string) => void;
  onLongPress: (id: string) => void;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function ImageCellInner({
  id,
  thumbnailUri,
  metadata,
  isSelected,
  cellSize,
  onPress,
  onLongPress,
}: Props) {
  const handlePress = useCallback(() => onPress(id), [id, onPress]);
  const handleLongPress = useCallback(() => onLongPress(id), [id, onLongPress]);

  const imgSize = cellSize - 6;

  const imageSource = useMemo(
    () => (thumbnailUri ? {uri: thumbnailUri} : null),
    [thumbnailUri],
  );

  const metaLabel = metadata
    ? `${metadata.width}x${metadata.height} - ${formatSize(metadata.fileSize)}`
    : 'Loading...';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={400}>
      <View
        style={[
          styles.cell,
          {width: cellSize, height: cellSize + 28},
          isSelected && styles.selected,
        ]}>
        {imageSource ? (
          <Image
            source={imageSource}
            style={{width: imgSize, height: imgSize}}
            resizeMode="cover"
            fadeDuration={0}
          />
        ) : (
          <View style={[styles.placeholder, {width: imgSize, height: imgSize}]} />
        )}

        <View style={styles.info}>
          <Text style={styles.infoText} numberOfLines={1}>
            {metaLabel}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export const ImageCell = React.memo(ImageCellInner, (prev, next) => {
  return (
    prev.id === next.id &&
    prev.thumbnailUri === next.thumbnailUri &&
    prev.isSelected === next.isSelected &&
    prev.metadata === next.metadata &&
    prev.cellSize === next.cellSize
  );
});

const styles = StyleSheet.create({
  cell: {
    margin: 3,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selected: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#e8f0fe',
  },
  placeholder: {
    backgroundColor: '#e0e0e0',
  },
  info: {
    height: 24,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  infoText: {
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
  },
});
