import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { launchImageLibrary } from 'react-native-image-picker';
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

            // Artificial delay to ensure UI updates
            await new Promise(resolve => setTimeout(resolve, 100));

            let assets: any[] = [];

            if (Platform.OS === 'ios') {
                // iOS: Use ImagePicker to access Photos/Gallery
                const result = await launchImageLibrary({
                    mediaType: 'video',
                    selectionLimit: 0,
                    includeExtra: false, // Optimized
                    assetRepresentationMode: 'current',
                });

                if (result.didCancel) {
                    setPreparing(false);
                    return;
                }
                if (result.errorCode) {
                    throw new Error(result.errorMessage);
                }
                assets = result.assets || [];

            } else {
                // Android: Use DocumentPicker for performance
                try {
                    const results = await DocumentPicker.pick({
                        type: [DocumentPicker.types.video],
                        allowMultiSelection: true,
                        copyTo: 'cachesDirectory',
                    });
                    assets = results;
                } catch (e: any) {
                    if (DocumentPicker.isCancel(e)) {
                        setPreparing(false);
                        return;
                    }
                    throw e;
                }
            }

            // 1. Initial count check
            if (assets.length < 5) {
                setPreparing(false);
                Alert.alert('Validation Error', `You must select at least 5 videos. You selected ${assets.length}.`);
                return;
            }

            setProcessing(true);
            setPreparing(false);
            setProgress({ current: 0, total: assets.length });

            // 2. Validate Size
            const validAssets = [];
            const errors = [];

            for (const asset of assets) {
                if (!asset.uri) continue;
                // Normalize size property check
                const size = (Platform.OS === 'ios' ? asset.fileSize : asset.size) || 0;
                // Normalize name property check
                const name = (Platform.OS === 'ios' ? asset.fileName : asset.name) || 'Video';

                const sizeError = validateVideoSize(size);

                if (sizeError) {
                    errors.push(`${name}: ${sizeError}`);
                } else {
                    // Standardize asset object for processing
                    validAssets.push({
                        uri: asset.uri,
                        name: name,
                        size: size
                    });
                }
            }

            if (validAssets.length < 5) {
                const errorMsg = `After filtering invalid sizes (50MB-2GB), only ${validAssets.length} valid videos remain. Minimum 5 valid videos required.\n\nErrors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '...' : ''}`;
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

                    // Small artificial delay for visual transition
                    await new Promise(resolve => setTimeout(resolve, 300));

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
