import React, {useState, useCallback, useEffect, useMemo, useRef} from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useImageProcessor} from '../hooks/useImageProcessor';
import {ImageCell} from '../components/ImageCell';
import {ProgressBar} from '../components/ProgressBar';
import {ImagePreviewModal} from '../components/ImagePreviewModal';
import type {GalleryItem, ImageMetadata} from '../types';

const COLUMNS = 3;
const SCREEN_W = Dimensions.get('window').width;
const CELL_SIZE = Math.floor((SCREEN_W - 12) / COLUMNS);

export function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const processor = useImageProcessor();

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [metaMap, setMetaMap] = useState<Record<string, ImageMetadata>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [multiSelect, setMultiSelect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const metaCache = useRef<Record<string, ImageMetadata>>({});

  // Copy bundled images into cache on first mount
  useEffect(() => {
    let alive = true;

    processor.copyBundledImages()
      .then(uris => {
        if (!alive) return;

        // Verify: log first few URIs to confirm they come from cache dir
        console.log(`[ImageProcessor] Loaded ${uris.length} images`);
        console.log('[ImageProcessor] Sample URI:', uris[0]);

        setItems(
          uris.map((uri, i) => ({
            id: `img_${i}`,
            sourceUri: uri,
            thumbnailUri: null,
            metadata: null,
            index: i,
          })),
        );
        setLoading(false);
      })
      .catch(() => {
        if (alive) {
          setLoading(false);
          Alert.alert('Error', 'Failed to load images');
        }
      });

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync thumbnails from the processor into our items
  useEffect(() => {
    if (processor.thumbnails.length === 0) return;

    setItems(prev =>
      prev.map((item, i) => {
        const thumb = i < processor.thumbnails.length ? processor.thumbnails[i] : null;
        return thumb !== item.thumbnailUri ? {...item, thumbnailUri: thumb} : item;
      }),
    );
  }, [processor.thumbnails]);

  // Fetch metadata as thumbnails come in
  useEffect(() => {
    if (processor.thumbnails.length === 0) return;

    (async () => {
      for (let i = 0; i < processor.thumbnails.length; i++) {
        const thumb = processor.thumbnails[i];
        const id = `img_${i}`;
        if (thumb && !metaCache.current[id]) {
          try {
            const m = await processor.getImageMetadata(thumb);
            metaCache.current[id] = m;
            setMetaMap(prev => ({...prev, [id]: m}));
          } catch {
            // not critical
          }
        }
      }
    })();
  }, [processor.thumbnails, processor.getImageMetadata]);

  // Handlers

  const onGenerate = useCallback(() => {
    if (items.length === 0) return;
    processor.processBatch(items.map(it => it.sourceUri), 150);
  }, [items, processor]);

  const onCancel = useCallback(() => processor.cancel(), [processor]);

  const onItemPress = useCallback(
    (id: string) => {
      if (multiSelect) {
        setSelected(prev => {
          const next = new Set(prev);
          next.has(id) ? next.delete(id) : next.add(id);
          if (next.size === 0) setMultiSelect(false);
          return next;
        });
      } else {
        const item = items.find(i => i.id === id);
        if (!item) return;

        if (!item.thumbnailUri) {
          Alert.alert(
            'Thumbnail Not Ready',
            'Please generate thumbnails first before previewing images.',
          );
          return;
        }

        setPreviewUri(item.sourceUri);
        setShowPreview(true);
      }
    },
    [multiSelect, items],
  );

  const onItemLongPress = useCallback((id: string) => {
    setMultiSelect(true);
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const onDeleteSelected = useCallback(() => {
    setItems(prev => prev.filter(it => !selected.has(it.id)));
    setSelected(new Set());
    setMultiSelect(false);
  }, [selected]);

  const onClosePreview = useCallback(() => {
    setShowPreview(false);
    setPreviewUri(null);
  }, []);

  const onCancelSelect = useCallback(() => {
    setMultiSelect(false);
    setSelected(new Set());
  }, []);

  // FlatList stuff

  const keyExtractor = useCallback((item: GalleryItem) => item.id, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: CELL_SIZE + 28,
      offset: (CELL_SIZE + 28) * Math.floor(index / COLUMNS),
      index,
    }),
    [],
  );

  const renderItem = useCallback(
    ({item}: {item: GalleryItem}) => (
      <ImageCell
        id={item.id}
        thumbnailUri={item.thumbnailUri}
        metadata={metaMap[item.id] || null}
        isSelected={selected.has(item.id)}
        cellSize={CELL_SIZE}
        onPress={onItemPress}
        onLongPress={onItemLongPress}
      />
    ),
    [metaMap, selected, onItemPress, onItemLongPress],
  );

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <Text style={styles.title}>Image Gallery</Text>
        <Text style={styles.subtitle}>
          {items.length} images - Turbo Module Powered
        </Text>

        <ProgressBar
          completed={processor.progress.completed}
          total={processor.progress.total}
          isProcessing={processor.isProcessing}
        />

        <View style={styles.btnRow}>
          {!processor.isProcessing ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={onGenerate} activeOpacity={0.7}>
              <Text style={styles.btnText}>Generate Thumbnails</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.dangerBtn} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        {multiSelect && (
          <View style={styles.selectBar}>
            <Text style={styles.selectLabel}>{selected.size} selected</Text>
            <View style={{flexDirection: 'row', gap: 8}}>
              <TouchableOpacity style={styles.dangerBtn} onPress={onDeleteSelected}>
                <Text style={styles.btnText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={onCancelSelect}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    ),
    [
      items.length,
      processor.progress,
      processor.isProcessing,
      multiSelect,
      selected.size,
      onGenerate,
      onCancel,
      onDeleteSelected,
      onCancelSelect,
    ],
  );

  if (loading) {
    return (
      <View style={[styles.center, {paddingTop: insets.top}]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{color: '#333', marginTop: 12}}>Loading images...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={COLUMNS}
        ListHeaderComponent={header}
        getItemLayout={getItemLayout}
        maxToRenderPerBatch={12}
        windowSize={5}
        initialNumToRender={15}
        removeClippedSubviews
        updateCellsBatchingPeriod={50}
        contentContainerStyle={[styles.list, {paddingBottom: insets.bottom + 16}]}
        showsVerticalScrollIndicator={false}
        extraData={selected}
      />

      <ImagePreviewModal
        visible={showPreview}
        sourceUri={previewUri}
        onClose={onClosePreview}
        resizeImage={processor.resizeImage}
        getImageMetadata={processor.getImageMetadata}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  center: {flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center'},
  header: {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8},
  title: {fontSize: 22, fontWeight: '700', color: '#000'},
  subtitle: {fontSize: 13, color: '#666', marginTop: 2, marginBottom: 8},
  btnRow: {flexDirection: 'row', marginTop: 8, marginBottom: 4},
  primaryBtn: {flex: 1, backgroundColor: '#007AFF', paddingVertical: 12, alignItems: 'center'},
  dangerBtn: {backgroundColor: '#FF3B30', paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center'},
  btnText: {color: '#fff', fontSize: 15, fontWeight: '600'},
  selectBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginTop: 8,
  },
  selectLabel: {color: '#007AFF', fontSize: 14, fontWeight: '600'},
  secondaryBtn: {backgroundColor: '#ddd', paddingHorizontal: 14, paddingVertical: 8},
  secondaryBtnText: {color: '#333', fontSize: 13, fontWeight: '600'},
  list: {paddingHorizontal: 0, alignItems: 'center'},
});
