import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function DestinationScreen() {
  const params = useLocalSearchParams();

  const name = String(params.name || 'Destination');
  const location = String(params.location || 'Unknown location');

  const description = String(
    params.description || 'No description available.'
  );

  const story = String(
    params.story || 'No story available.'
  );

  // Read images safely
  const rawImages = params.images;

  let images: string[] = [];

  try {
    if (Array.isArray(rawImages)) {
      images = rawImages.map(String);
    } else if (rawImages) {
      images = JSON.parse(String(rawImages));
    }
  } catch (error) {
    console.log('❌ Image parsing error:', error);
  }

  const video = String(params.video || '');

  console.log('🖼️ Images received:', images);
  console.log('🎥 Video received:', video);

  const latitude = Number(params.latitude);
  const longitude = Number(params.longitude);

  const [checkingLocation, setCheckingLocation] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    checkLocation();
  }, []);

  const checkLocation = async () => {
    try {
      setCheckingLocation(true);
      setLocationError('');

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationError(
          'Location permission is required to unlock this story.'
        );
        setCheckingLocation(false);
        return;
      }

      const currentLocation =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      if (
        !latitude ||
        !longitude ||
        Number.isNaN(latitude) ||
        Number.isNaN(longitude)
      ) {
        setLocationError(
          'Destination location data is missing.'
        );
        setCheckingLocation(false);
        return;
      }

      const distance = calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        latitude,
        longitude
      );

      console.log(
        `📍 Distance from ${name}: ${distance.toFixed(2)} km`
      );

      // Unlock within 1 km
      if (distance <= 1) {
        setUnlocked(true);
      } else {
        setUnlocked(false);
      }
    } catch (error) {
      console.log('❌ Location error:', error);

      setLocationError(
        'Unable to get your current location.'
      );
    } finally {
      setCheckingLocation(false);
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return R * c;
  };

  const toRadians = (value: number) => {
    return (value * Math.PI) / 180;
  };

  return (
    <ScrollView style={styles.container}>

      {/* Back */}
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>
          ← Back
        </Text>
      </Pressable>

      <View style={styles.content}>

        {/* Header */}
        <Text style={styles.emoji}>
          📍
        </Text>

        <Text style={styles.title}>
          {name}
        </Text>

        <Text style={styles.location}>
          📍 {location}
        </Text>

        {/* Images */}
        {images.length > 0 && (
          <View style={styles.imageSection}>

            {images.map(
              (imageUrl: string, index: number) => (
                <Image
                  key={index}
                  source={{
                    uri: imageUrl,
                  }}
                  style={styles.image}
                  resizeMode="cover"
                  onLoad={() => {
                    console.log(
                      '✅ Image loaded:',
                      imageUrl
                    );
                  }}
                  onError={(error) => {
                    console.log(
                      '❌ Image failed:',
                      imageUrl,
                      error.nativeEvent
                    );
                  }}
                />
              )
            )}

          </View>
        )}

        {/* Description */}
        <View style={styles.card}>

          <Text style={styles.heading}>
            About this place
          </Text>

          <Text style={styles.description}>
            {description}
          </Text>

        </View>

        {/* Location checking */}
        {checkingLocation ? (

          <View style={styles.statusCard}>

            <ActivityIndicator
              size="large"
              color="#208AEF"
            />

            <Text style={styles.statusTitle}>
              Checking your location...
            </Text>

            <Text style={styles.statusText}>
              Please wait while we check if you are near
              the destination.
            </Text>

          </View>

        ) : unlocked ? (

          <View style={styles.unlockedCard}>

            <Text style={styles.lockIcon}>
              🔓
            </Text>

            <Text style={styles.unlockedTitle}>
              Story Unlocked!
            </Text>

            <Text style={styles.statusText}>
              You have reached the destination.
            </Text>

            {/* Story */}
            <View style={styles.storyCard}>

              <Text style={styles.storyTitle}>
                📖 Hidden Story
              </Text>

              <Text style={styles.storyText}>
                {story}
              </Text>

            </View>

            {/* Video */}
            {video !== '' && (

              <View style={styles.videoCard}>

                <Text style={styles.videoTitle}>
                  🎥 Destination Video
                </Text>

                <Pressable
                  style={styles.videoButton}
                  onPress={() =>
                    Linking.openURL(video)
                  }
                >
                  <Text style={styles.videoButtonText}>
                    ▶ Watch Video
                  </Text>
                </Pressable>

              </View>

            )}

          </View>

        ) : (

          <View style={styles.lockedCard}>

            <Text style={styles.lockIcon}>
              🔒
            </Text>

            <Text style={styles.lockedTitle}>
              Story Locked
            </Text>

            <Text style={styles.lockedText}>
              Reach the destination to unlock its hidden
              story.
            </Text>

            {locationError !== '' && (

              <Text style={styles.errorText}>
                {locationError}
              </Text>

            )}

            <Pressable
              style={styles.retryButton}
              onPress={checkLocation}
            >
              <Text style={styles.retryText}>
                Check Location Again
              </Text>
            </Pressable>

          </View>

        )}

      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },

  backButton: {
    marginTop: 55,
    marginLeft: 20,
  },

  backText: {
    fontSize: 18,
    color: '#208AEF',
    fontWeight: '600',
  },

  content: {
    padding: 20,
  },

  emoji: {
    fontSize: 55,
    marginTop: 30,
  },

  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#208AEF',
    marginTop: 10,
  },

  location: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    marginBottom: 20,
  },

  imageSection: {
    marginBottom: 16,
  },

  image: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#E5E5E5',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
  },

  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },

  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    elevation: 2,
  },

  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#208AEF',
    marginTop: 15,
    textAlign: 'center',
  },

  statusText: {
    textAlign: 'center',
    color: '#555',
    marginTop: 8,
    lineHeight: 22,
  },

  lockedCard: {
    backgroundColor: '#EAF3FF',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
  },

  lockIcon: {
    fontSize: 40,
    marginBottom: 10,
  },

  lockedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#208AEF',
  },

  lockedText: {
    textAlign: 'center',
    color: '#555',
    marginTop: 8,
    lineHeight: 22,
  },

  unlockedCard: {
    backgroundColor: '#EAF3FF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },

  unlockedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#208AEF',
  },

  storyCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginTop: 20,
  },

  storyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
  },

  storyText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
  },

  videoCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginTop: 16,
  },

  videoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 14,
  },

  videoButton: {
    backgroundColor: '#208AEF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  videoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  errorText: {
    color: '#C62828',
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 20,
  },

  retryButton: {
    backgroundColor: '#208AEF',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginTop: 18,
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});