/**
 * Mobile KV storage adapter — backed by AsyncStorage.
 *
 * AsyncStorage is the de-facto standard for React Native + Supabase
 * Auth (no 2KB-per-value limit like SecureStore). For genuinely
 * sensitive items we can graduate specific keys to expo-secure-store
 * later behind this same KVStorage interface.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KVStorage } from '@elofight/shared';

export const asyncStorageKV: KVStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};
