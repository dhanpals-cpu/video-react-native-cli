import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VideoMetadata {
  id: string;
  name: string;
  size: number; // in bytes
  path: string;
  createdAt: number;
}

interface VideoStore {
  videos: VideoMetadata[];
  isLoading: boolean;
  error: string | null;
  selectedVideo: VideoMetadata | null;
  loadVideos: () => Promise<void>;
  addVideos: (newVideos: VideoMetadata[]) => Promise<void>;
  clearVideos: () => Promise<void>;
  deleteVideo: (id: string) => Promise<void>;
  setSelectedVideo: (video: VideoMetadata | null) => void;
  setError: (error: string | null) => void;
}

const STORAGE_KEY = '@start_poc_videos';

export const useVideoStore = create<VideoStore>((set, get) => ({
  videos: [],
  isLoading: false,
  error: null,
  selectedVideo: null,

  loadVideos: async () => {
    set({ isLoading: true, error: null });
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ videos: JSON.parse(stored) });
      }
    } catch (e) {
      set({ error: 'Failed to load videos from storage' });
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  addVideos: async (newVideos) => {
    set({ isLoading: true, error: null });
    try {
      // Append to existing
      const updatedVideos = [...get().videos, ...newVideos];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedVideos));
      set({ videos: updatedVideos });
    } catch (e) {
      set({ error: 'Failed to save videos metadata' });
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  clearVideos: async () => {
    set({ isLoading: true, error: null });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      set({ videos: [] });
    } catch (e) {
      set({ error: 'Failed to clear videos' });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteVideo: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const currentVideos = get().videos;
      const videoToDelete = currentVideos.find(v => v.id === id);

      if (!videoToDelete) {
        throw new Error("Video not found");
      }

      // Remove from list first for UI responsiveness (optimistic update could be better but this is fine)
      const updatedVideos = currentVideos.filter(v => v.id !== id);
      set({ videos: updatedVideos });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedVideos));

      // Build path to delete
      // Note: In a real app we would use RNFS to delete the file. 
      // For this POC, we are just removing the reference as requested in previous steps (or I should check if I should delete the file physically).
      // The user prompt said "video delete bhi kr paye", usually implies physical deletion. 
      // The previous context mentioned "copying them to the app's local storage".
      // I will assume physical deletion is good practice.

      const RNFS = require('react-native-fs');
      if (await RNFS.exists(videoToDelete.path)) {
        await RNFS.unlink(videoToDelete.path);
      }

    } catch (e: any) {
      console.error("Delete error:", e);
      set({ error: 'Failed to delete video: ' + e.message });
      // Revert if needed, but for POC we just show error
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedVideo: (video) => set({ selectedVideo: video }),
  setError: (error) => set({ error }),
}));
