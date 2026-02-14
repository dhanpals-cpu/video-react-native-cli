import React, { useRef, useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Text, Dimensions, ActivityIndicator } from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { useVideoStore } from '../store/useVideoStore';

const VideoPlayerModal = () => {
    const { selectedVideo, setSelectedVideo } = useVideoStore();
    const videoRef = useRef<VideoRef>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    if (!selectedVideo) return null;

    const handleClose = () => {
        setSelectedVideo(null);
        setIsPlaying(false);
    };

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    return (
        <Modal
            visible={!!selectedVideo}
            animationType="slide"
            onRequestClose={handleClose}
            supportedOrientations={['portrait', 'landscape']}
        >
            <View style={styles.container}>
                <View style={styles.videoContainer}>
                    <Video
                        // @ts-ignore
                        ref={videoRef}
                        source={{ uri: selectedVideo.path }}
                        style={styles.video}
                        paused={!isPlaying}
                        onLoad={() => setIsLoading(false)}
                        onEnd={() => setIsPlaying(false)}
                        resizeMode="contain"
                        controls={true}
                        onError={(e) => console.error("Video Error:", e)}
                    />
                    {isLoading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#ffffff" />
                        </View>
                    )}
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>

                    <Text style={styles.title} numberOfLines={1}>{selectedVideo.name}</Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
    },
    videoContainer: {
        width: '100%',
        height: '80%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    controls: {
        height: '20%',
        backgroundColor: '#111',
        padding: 20,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    closeButton: {
        backgroundColor: '#333',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginBottom: 10,
    },
    closeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    title: {
        color: '#ccc',
        fontSize: 14,
    }
});

export default VideoPlayerModal;
