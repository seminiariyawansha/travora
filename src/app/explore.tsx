import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { router } from 'expo-router';
import { getDestinations } from '../services/destinationService';

export default function ExploreScreen() {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDestinations();
  }, []);

  const loadDestinations = async () => {
    try {
      const data = await getDestinations();
      setDestinations(data);
    } catch (error: any) {
      console.error(error);
      setError(error?.message || 'Failed to load destinations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Explore 🌍</Text>

      <Text style={styles.subtitle}>
        Discover places and unlock their stories.
      </Text>

      <TextInput
        style={styles.search}
        placeholder="Search destinations..."
      />

      {loading && (
        <ActivityIndicator
          size="large"
          style={styles.loader}
        />
      )}

      {!loading && error !== '' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>
            Unable to load destinations
          </Text>

          <Text style={styles.errorText}>
            {error}
          </Text>
        </View>
      )}

      {!loading &&
        error === '' &&
        destinations.map((destination) => (
          <Pressable
            key={destination.id}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/destination',
                params: {
                  name: destination.name,
                  location: destination.location,
                  description: destination.description,
                  story: destination.story,
                  latitude: String(destination.latitude),
                  longitude: String(destination.longitude),

                  // Images and video from Firestore
                  images: JSON.stringify(
                    destination.images || []
                  ),
                  video: destination.video || '',
                },
              })
            }
          >
            <Text style={styles.cardTitle}>
              {destination.name}
            </Text>

            <Text style={styles.location}>
              📍 {destination.location}
            </Text>

            <Text style={styles.description}>
              {destination.description}
            </Text>

            <View style={styles.unlockBox}>
              <Text style={styles.unlockText}>
                🔒 Reach the location to unlock the story
              </Text>
            </View>
          </Pressable>
        ))}

      {!loading &&
        error === '' &&
        destinations.length === 0 && (
          <Text style={styles.empty}>
            No destinations found.
          </Text>
        )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>
          How it works
        </Text>

        <Text style={styles.infoText}>
          1. Explore a destination
        </Text>

        <Text style={styles.infoText}>
          2. Travel to the location
        </Text>

        <Text style={styles.infoText}>
          3. Unlock its hidden story
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
    padding: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#208AEF',
    marginTop: 20,
  },

  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 6,
    marginBottom: 20,
  },

  search: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 20,
  },

  loader: {
    marginTop: 30,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },

  location: {
    fontSize: 14,
    color: '#208AEF',
    marginTop: 6,
  },

  description: {
    fontSize: 15,
    color: '#555',
    marginTop: 12,
    lineHeight: 22,
  },

  unlockBox: {
    backgroundColor: '#F0F6FF',
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
  },

  unlockText: {
    color: '#208AEF',
    fontSize: 13,
    fontWeight: '600',
  },

  errorBox: {
    backgroundColor: '#FFECEC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },

  errorTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#C62828',
  },

  errorText: {
    fontSize: 13,
    color: '#C62828',
    marginTop: 8,
  },

  empty: {
    textAlign: 'center',
    color: '#777',
    marginTop: 30,
  },

  infoBox: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    marginTop: 10,
    marginBottom: 30,
  },

  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  infoText: {
    fontSize: 15,
    color: '#555',
    marginBottom: 8,
  },
});