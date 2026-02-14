import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, StatusBar, View, Platform, UIManager } from 'react-native';
import { useVideoStore } from './src/store/useVideoStore';
import VideoList from './src/components/VideoList';
import SelectVideosButton from './src/components/SelectVideosButton';
import VideoPlayerModal from './src/components/VideoPlayerModal';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

function App(): React.JSX.Element {
  const { loadVideos } = useVideoStore();

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Videos</Text>
        <Text style={styles.headerSubtitle}>Pro Player</Text>
      </View>

      <View style={styles.content}>
        <VideoList />
      </View>

      <View style={styles.footer}>
        <SelectVideosButton />
      </View>

      <VideoPlayerModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 0 : 24,
  },
});

export default App;
