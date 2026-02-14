import React, { useState } from 'react';
import { FlatList, Text, View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useVideoStore, VideoMetadata } from '../store/useVideoStore';
import { formatSize } from '../utils/fileSystem';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const VideoList = () => {
    const { videos, isLoading, setSelectedVideo, deleteVideo } = useVideoStore();
    const [videoToDelete, setVideoToDelete] = useState<VideoMetadata | null>(null);

    if (isLoading && videos.length === 0) {
        return (
            <View style={styles.center}>
                <Text style={styles.loadingText}>Loading your videos...</Text>
            </View>
        );
    }

    if (videos.length === 0) {
        return (
            <View style={styles.center}>
                <Text style={styles.emptyText}>No videos saved yet</Text>
                <Text style={styles.emptySubText}>Tap the button below to add some</Text>
            </View>
        );
    }

    const handlePress = (video: VideoMetadata) => {
        setSelectedVideo(video);
    };

    const handleDeletePress = (video: VideoMetadata) => {
        setVideoToDelete(video);
    };

    const confirmDelete = async () => {
        if (videoToDelete) {
            await deleteVideo(videoToDelete.id);
            setVideoToDelete(null);
        }
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={videos}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => handlePress(item)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.cardIcon}>
                            <View style={styles.iconPlaceholder} />
                        </View>

                        <View style={styles.cardContent}>
                            <Text style={styles.title} numberOfLines={1}>
                                {item.name}
                            </Text>

                            <View style={styles.metaContainer}>
                                <Text style={styles.metaText}>
                                    {formatSize(item.size)}
                                </Text>
                                <Text style={styles.metaDot}>•</Text>
                                <Text style={styles.metaText}>
                                    {/* {new Date(item.createdAt).toLocaleDateString()} */}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeletePress(item)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Text style={styles.deleteIcon}>🗑️</Text>
                            </TouchableOpacity>

                            <View style={styles.playButton}>
                                <Text style={styles.playIcon}>▶</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />

            <DeleteConfirmationModal
                visible={!!videoToDelete}
                itemName={videoToDelete?.name || 'Video'}
                onCancel={() => setVideoToDelete(null)}
                onConfirm={confirmDelete}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    list: {
        padding: 24,
        paddingTop: 8,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        color: '#666',
        fontSize: 16,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F0F4FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    iconPlaceholder: {
        width: 24,
        height: 24,
        backgroundColor: '#4B7BEC',
        borderRadius: 6,
        opacity: 0.2,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
        marginRight: 12, // Added spacing to prevent overlap
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2d3436',
        marginBottom: 4,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 13,
        color: '#b2bec3',
        fontWeight: '500',
    },
    metaDot: {
        marginHorizontal: 6,
        color: '#dfe6e9',
        fontSize: 10,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deleteButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    deleteIcon: {
        fontSize: 14,
    },
    playButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F0F4FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIcon: {
        color: '#4B7BEC',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default VideoList;
