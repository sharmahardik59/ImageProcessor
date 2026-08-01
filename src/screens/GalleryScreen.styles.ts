import {StyleSheet} from 'react-native';

export const galleryStyles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  center: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8},
  title: {fontSize: 22, fontWeight: '700', color: '#000'},
  subtitle: {fontSize: 13, color: '#666', marginTop: 2, marginBottom: 8},
  btnRow: {flexDirection: 'row', marginTop: 8, marginBottom: 4},
  primaryBtn: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    alignItems: 'center',
  },
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
  list: {paddingHorizontal: 0},
});
