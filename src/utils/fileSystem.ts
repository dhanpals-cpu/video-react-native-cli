import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import { VideoMetadata } from '../store/useVideoStore';

const MIN_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
// const MAX_SIZE_BYTES = 1 * 1024 * 1024 * 1024; // 1GB - USER Requested 1GB in requirements but 2GB in validations. 
// User requirement said: "Maximum: 1 GB" in one place, but "Reject videos > 2GB" in VALIDATIONS section. I will stick to 2GB as it is the safer upper bound mentioned in validations.
const MAX_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB

// Directory to store videos
const VIDEO_DIR = Platform.select({
    ios: RNFS.DocumentDirectoryPath + '/imported_videos',
    android: RNFS.DocumentDirectoryPath + '/imported_videos', // Use DocumentDirectory for Android as well for simple internal storage logic
})!;

export const ensureVideoDirExists = async () => {
    const exists = await RNFS.exists(VIDEO_DIR);
    if (!exists) {
        await RNFS.mkdir(VIDEO_DIR);
    }
};

export const validateVideoSize = (size: number): string | null => {
    if (size < MIN_SIZE_BYTES) return `Video is too small (<5MB)`;
    if (size > MAX_SIZE_BYTES) return `Video is too large (>2GB)`;
    return null;
};

export const copyVideoToStorage = async (
    sourceUri: string,
    fileName: string | undefined
): Promise<VideoMetadata> => {
    await ensureVideoDirExists();

    // Create a unique filename to avoid collisions
    const timestamp = Date.now();
    const safeName = fileName ? fileName.replace(/[^a-zA-Z0-9.]/g, '_') : `video_${timestamp}.mp4`;
    const ext = safeName.split('.').pop() || 'mp4';
    const finalName = `${timestamp}_${safeName}`;
    const destPath = `${VIDEO_DIR}/${finalName}`;

    try {
        // For iOS, sourceUri usually starts with file://, RNFS handles it.
        // For Android, content:// uri might need special handling if RNFS.copyFile doesn't support it directly, 
        // but RNFS v2.20+ supports content uri copying.

        // IMPORTANT: decodeURI might be needed if uri is encoded.
        const decodedUri = decodeURIComponent(sourceUri);

        // Check file stats of SOURCE first to validate size one last time if not already passed? 
        // (Presumes caller has passed validation logic, but we can double check)

        await RNFS.copyFile(decodedUri, destPath);

        // Get file stats of the COPIED file to confirm size and success
        const stats = await RNFS.stat(destPath);
        const sizeBytes = typeof stats.size === 'string' ? parseInt(stats.size) : stats.size;

        return {
            id: finalName,
            name: safeName,
            size: sizeBytes,
            path: destPath,
            createdAt: timestamp,
        };
    } catch (error) {
        console.error('File copy failed:', error);
        // Cleanup if copy failed partially?
        if (await RNFS.exists(destPath)) {
            await RNFS.unlink(destPath);
        }
        throw error;
    }
};

export const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
