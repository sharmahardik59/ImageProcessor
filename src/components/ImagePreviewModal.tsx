import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import type {ImageMetadata} from '../types';

const SCREEN = Dimensions.get('window');

type Props = {
  visible: boolean;
  sourceUri: string | null;
  onClose: () => void;
  resizeImage: (uri: string, w: number, h: number, q: number) => Promise<string>;
  getImageMetadata: (uri: string) => Promise<ImageMetadata>;
};

function fmtSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export function ImagePreviewModal({
  visible,
  sourceUri,
  onClose,
  resizeImage,
  getImageMetadata,
}: Props) {
  const [uri, setUri] = useState<string | null>(null);
  const [meta, setMeta] = useState<ImageMetadata | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !sourceUri) return;

    setLoading(true);
    setUri(null);
    setMeta(null);

    // Kick off resize + metadata fetch in parallel
    Promise.all([
      resizeImage(sourceUri, SCREEN.width * 2, SCREEN.height * 2, 90),
      getImageMetadata(sourceUri),
    ])
      .then(([resizedUri, metadata]) => {
        setUri(resizedUri);
        setMeta(metadata);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visible, sourceUri, resizeImage, getImageMetadata]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <View style={styles.content}>
          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loaderText}>Resizing...</Text>
            </View>
          ) : uri ? (
            <>
              <Image
                source={{uri}}
                style={styles.image}
                resizeMode="contain"
              />
              {meta && (
                <Text style={styles.meta}>
                  {meta.width} x {meta.height} | {fmtSize(meta.fileSize)} | {meta.mimeType}
                </Text>
              )}
            </>
          ) : null}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeTxt}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: SCREEN.width - 32,
    alignItems: 'center',
  },
  loader: {
    alignItems: 'center',
    padding: 40,
  },
  loaderText: {
    marginTop: 8,
    color: '#ccc',
    fontSize: 14,
  },
  image: {
    width: SCREEN.width - 32,
    height: SCREEN.width - 32,
  },
  meta: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 8,
  },
  closeBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#333',
  },
  closeTxt: {
    color: '#fff',
    fontSize: 14,
  },
});
