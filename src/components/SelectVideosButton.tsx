import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { useVideoStore } from '../store/useVideoStore';
import { copyVideoToStorage, validateVideoSize } from '../utils/fileSystem';

const SelectVideosButton = () => {
    const { addVideos, setError } = useVideoStore();
    const [processing, setProcessing] = useState(false);
    const [preparing, setPreparing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const handleSelectVideos = async () => {
        try {
            setPreparing(true);
            setError(null);

            /**
             * CRITICAL FIX #4: Removed artificial delay
             * Artificial delays slow down processing and are unnecessary
             */

            /**
             * MEMORY-SAFE VIDEO SELECTION
             * 
             * Using react-native-document-picker for BOTH iOS and Android ensures:
             * 1. Files are NOT loaded into JavaScript memory
             * 2. Only file URIs are returned (file paths)
             * 3. Supports all video formats natively supported by the device
             * 4. Consistent behavior across platforms
             * 
             * CRITICAL FIX #1: Removed 'copyTo' option
             * The copyTo option causes duplicate file copying and severe performance issues.
             * We handle file copying manually in copyVideoToStorage() for better control.
             */
            let results;
            try {
                results = await DocumentPicker.pick({
                    type: [DocumentPicker.types.video],
                    allowMultiSelection: true,
                    presentationStyle: 'fullScreen',
                });
            } catch (e: any) {
                if (DocumentPicker.isCancel(e)) {
                    setPreparing(false);
                    return;
                }
                throw e;
            }

            const assets = results;

            // No minimum count validation - user can select any number of videos

            setProcessing(true);
            setPreparing(false);
            setProgress({ current: 0, total: assets.length });

            // 2. Validate Size
            const validAssets = [];
            const errors = [];

            for (const asset of assets) {
                if (!asset.uri) continue;

                /**
                 * CRITICAL FIX #2: Use asset.uri only
                 * 
                 * DocumentPicker returns consistent properties across platforms:
                 * - size: file size in bytes
                 * - name: file name
                 * - uri: file URI (content:// on Android, file:// on iOS)
                 * 
                 * We do NOT use fileCopyUri as we removed the copyTo option.
                 */
                const size = asset.size || 0;
                const name = asset.name || 'Video';
                const uri = asset.uri;

                const sizeError = validateVideoSize(size);

                if (sizeError) {
                    errors.push(`${name}: ${sizeError}`);
                } else {
                    // Standardize asset object for processing
                    validAssets.push({
                        uri: uri,
                        name: name,
                        size: size
                    });
                }
            }

            if (validAssets.length < 1) {
                const errorMsg = `After filtering invalid sizes (5MB-2GB), no valid videos remain.${errors.length > 0 ? '\n\nErrors:\n' + errors.slice(0, 5).join('\n') + (errors.length > 5 ? '...' : '') : ''}`;
                Alert.alert('Validation Error', errorMsg);
                setProcessing(false);
                return;
            }

            // 3. Process valid videos SEQUENTIALLY
            setProgress({ current: 0, total: validAssets.length });

            let successCount = 0;

            for (let i = 0; i < validAssets.length; i++) {
                const asset = validAssets[i];
                try {
                    // Update progress UI
                    setProgress(prev => ({ ...prev, current: i + 1 }));

                    // Copy file
                    const meta = await copyVideoToStorage(asset.uri, asset.name);

                    // Add to store immediately
                    await addVideos([meta]);
                    successCount++;

                    /**
                     * CRITICAL FIX #4: Removed artificial delay
                     * No delay needed - sequential processing is already optimized
                     */

                } catch (e: any) {
                    console.error(`Failed to copy ${asset.name}`, e);
                    errors.push(`Failed to save ${asset.name}: ${e.message}`);
                }
            }

            // 4. Final Report
            if (successCount > 0) {
                // Success
            } else {
                Alert.alert('Error', 'Failed to save any videos.');
            }

            if (errors.length > 0) {
                console.log('Some errors occurred:', errors);
                if (successCount === 0) {
                    Alert.alert('Error', `Failed to save videos.\n\nErrors:\n${errors.slice(0, 5).join('\n')}`);
                }
            }

        } catch (e: any) {
            setPreparing(false);
            console.error(e);
            Alert.alert('Error', 'An unexpected error occurred: ' + e.message);
        } finally {
            setProcessing(false);
            setPreparing(false);
            setProgress({ current: 0, total: 0 });
        }
    };

    return (
        <View style={styles.container}>
            {preparing && !processing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#4B7BEC" />
                    <Text style={styles.loadingText}>Preparing selection...</Text>
                </View>
            ) : processing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#4B7BEC" />
                    <Text style={styles.loadingText}>
                        Adding video {progress.current} of {progress.total}...
                    </Text>
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.button}
                    onPress={handleSelectVideos}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>+ Select New Videos</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#4B7BEC',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#4B7BEC',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F0F4FF',
        borderRadius: 12,
        width: '100%',
        justifyContent: 'center',
    },
    loadingText: {
        marginLeft: 12,
        fontSize: 14,
        color: '#4B7BEC',
        fontWeight: '600',
    },
});

export default SelectVideosButton;
