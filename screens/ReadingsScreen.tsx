import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { SessionType } from '../contexts/WebRTCContext';
import { toast } from 'sonner-native';

// Reader interface
interface Reader {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  rating: number;
  reviewCount: number;
  isOnline: boolean;
  imageUrl: string;
  ratePerMinute: {
    chat: number;
    audio: number;
    video: number;
  };
}

// Mock readers data
const MOCK_READERS: Reader[] = [
  {
    id: 'reader123',
    name: 'Mystique Luna',
    specialty: 'Tarot & Astrology',
    bio: 'With over 15 years of experience in tarot reading and astrology, I specialize in providing clarity on life paths and relationship challenges.',
    rating: 4.9,
    reviewCount: 486,
    isOnline: true,
    imageUrl: 'https://api.a0.dev/assets/image?text=mystical%20woman%20with%20tarot%20cards%20and%20cosmic%20background&aspect=1:1',
    ratePerMinute: {
      chat: 3.99,
      audio: 4.99,
      video: 5.99,
    },
  },
  {
    id: 'reader456',
    name: 'Serenity Star',
    specialty: 'Intuitive Empath',
    bio: 'As an intuitive empath, I connect deeply with your energy to provide guidance on emotional hurdles and spiritual growth.',
    rating: 4.7,
    reviewCount: 312,
    isOnline: true,
    imageUrl: 'https://api.a0.dev/assets/image?text=serene%20spiritual%20guide%20with%20ethereal%20aura&aspect=1:1',
    ratePerMinute: {
      chat: 3.49,
      audio: 4.49,
      video: 5.49,
    },
  },
  {
    id: 'reader789',
    name: 'Raven Moonlight',
    specialty: 'Medium & Psychic',
    bio: 'As a 4th generation psychic medium, I connect with spiritual energies to bring messages from beyond and provide insights into your future.',
    rating: 4.8,
    reviewCount: 254,
    isOnline: false,
    imageUrl: 'https://api.a0.dev/assets/image?text=mysterious%20psychic%20with%20raven%20and%20moon%20symbols&aspect=1:1',
    ratePerMinute: {
      chat: 4.99,
      audio: 5.99,
      video: 6.99,
    },
  },
  {
    id: 'reader101',
    name: 'Celeste Vision',
    specialty: 'Clairvoyant',
    bio: 'My clairvoyant abilities allow me to see beyond the veil and provide guidance on your past, present, and future paths.',
    rating: 4.6,
    reviewCount: 198,
    isOnline: true,
    imageUrl: 'https://api.a0.dev/assets/image?text=woman%20with%20third%20eye%20symbol%20and%20celestial%20background&aspect=1:1',
    ratePerMinute: {
      chat: 3.99,
      audio: 4.99,
      video: 5.99,
    },
  },
  {
    id: 'reader202',
    name: 'Orion Truth',
    specialty: 'Spiritual Healing',
    bio: 'I combine energy healing techniques with psychic insights to help you overcome spiritual blocks and find your true path.',
    rating: 4.5,
    reviewCount: 176,
    isOnline: false,
    imageUrl: 'https://api.a0.dev/assets/image?text=healer%20with%20spiritual%20energy%20emanating%20from%20hands&aspect=1:1',
    ratePerMinute: {
      chat: 3.49,
      audio: 4.49,
      video: 5.49,
    },
  },
];

const ReadingsScreen = () => {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'online'>('online');
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    // Simulate API call to fetch readers
    const fetchReaders = async () => {
      try {
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        setReaders(MOCK_READERS);
      } catch (error) {
        console.error('Error fetching readers:', error);
        toast.error('Failed to load readers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReaders();
  }, []);

  // Filter readers based on selected filter
  const filteredReaders = selectedFilter === 'online'
    ? readers.filter(reader => reader.isOnline)
    : readers;

  // Start a reading
  const initiateReading = (reader: Reader, type: SessionType) => {
    if (!reader.isOnline) {
      toast.error(`${reader.name} is currently offline`);
      return;
    }

    if (user?.role !== 'client') {
      toast.error('Only clients can initiate readings');
      return;
    }

    // Check if user has sufficient balance
    const userBalance = user.balance || 0;
    const ratePerMinute = reader.ratePerMinute[type];

    if (userBalance < ratePerMinute) {
      toast.error(`Insufficient balance. Please add funds to continue.`);
      return;
    }

    // Navigate to the reading screen
    navigation.navigate('Reading' as never, { 
      readerId: reader.id,
      readerDetails: reader,
      sessionType: type
    } as never);
  };

  const renderReaderCard = ({ item }: { item: Reader }) => (
    <TouchableOpacity 
      style={styles.readerCard}
      onPress={() => navigation.navigate('ReaderProfile' as never, { readerId: item.id } as never)}
    >
      <View style={styles.readerCardTop}>
        <Image source={{ uri: item.imageUrl }} style={styles.readerImage} />
        <View style={[styles.onlineIndicator, { backgroundColor: item.isOnline ? '#4CAF50' : '#757575' }]} />
      </View>
      
      <View style={styles.readerCardInfo}>
        <Text style={styles.readerName}>{item.name}</Text>
        <Text style={styles.readerSpecialty}>{item.specialty}</Text>
        
        <View style={styles.ratingContainer}>
          {[...Array(5)].map((_, i) => (
            <FontAwesome
              key={i}
              name="star"
              size={12}
              color={i < Math.floor(item.rating) ? "#FFD700" : 'rgba(255, 215, 0, 0.3)'}
              style={styles.starIcon}
            />
          ))}
          <Text style={styles.ratingText}>{item.rating.toFixed(1)} ({item.reviewCount})</Text>
        </View>
        
        <View style={styles.divider} />
        
        {item.isOnline ? (
          <View style={styles.readingButtons}>
            <TouchableOpacity 
              style={[styles.readingTypeButton, styles.chatButton]}
              onPress={() => initiateReading(item, 'chat')}
            >
              <Ionicons name="chatbubble-outline" size={16} color="white" />
              <Text style={styles.buttonText}>${item.ratePerMinute.chat}/min</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.readingTypeButton, styles.audioButton]}
              onPress={() => initiateReading(item, 'audio')}
            >
              <Ionicons name="call-outline" size={16} color="white" />
              <Text style={styles.buttonText}>${item.ratePerMinute.audio}/min</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.readingTypeButton, styles.videoButton]}
              onPress={() => initiateReading(item, 'video')}
            >
              <Ionicons name="videocam-outline" size={16} color="white" />
              <Text style={styles.buttonText}>${item.ratePerMinute.video}/min</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.offlineStatus}>
            <MaterialCommunityIcons name="clock-time-eight-outline" size={16} color="#BBBBBB" />
            <Text style={styles.offlineText}>Currently Offline</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#1a1a2e']}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Readings</Text>
        <View style={{ width: 24 }} /> {/* Empty view for balanced spacing */}
      </View>
      
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'online' && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter('online')}
          >
            <View style={styles.onlineDot} />
            <Text style={[
              styles.filterText,
              selectedFilter === 'online' && styles.filterTextActive
            ]}>Online Now</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === 'all' && styles.filterTextActive
            ]}>All Readers</Text>
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF69B4" />
            <Text style={styles.loadingText}>Loading readers...</Text>
          </View>
        ) : filteredReaders.length === 0 ? (
          <View style={styles.noReadersContainer}>
            <MaterialCommunityIcons name="emoticon-sad-outline" size={48} color="#BBBBBB" />
            <Text style={styles.noReadersText}>
              No readers available at this time
            </Text>
            <Text style={styles.noReadersSubText}>
              Please check back later or try viewing all readers
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredReaders}
            renderItem={renderReaderCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.readerList}
            scrollEnabled={false} // Disable scrolling as it's inside a ScrollView
          />
        )}
      </ScrollView>
      
      {/* Navigation Tab Bar */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 10 }]}>
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => navigation.navigate('Home' as never)}
        >
          <Ionicons name="home-outline" size={24} color="#FFFFFF" />
          <Text style={styles.tabText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="book" size={24} color="#FF69B4" />
          <Text style={[styles.tabText, styles.activeTab]}>Readings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => navigation.navigate('Live' as never)}
        >
          <Ionicons name="radio-outline" size={24} color="#FFFFFF" />
          <Text style={styles.tabText}>Live</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => navigation.navigate('Messages' as never)}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#FFFFFF" />
          <Text style={styles.tabText}>Messages</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => navigation.navigate('Profile' as never)}
        >
          <Ionicons name="person-outline" size={24} color="#FFFFFF" />
          <Text style={styles.tabText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: 'white',
    // In production would use Playfair Display font
  },
  scrollContent: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(255, 105, 180, 0.2)',
    borderColor: '#FF69B4',
    borderWidth: 1,
  },
  filterText: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#FF69B4',
    fontWeight: '500',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#CCCCCC',
    fontSize: 16,
  },
  noReadersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noReadersText: {
    marginTop: 16,
    color: '#EEEEEE',
    fontSize: 18,
    fontWeight: '500',
  },
  noReadersSubText: {
    marginTop: 8,
    color: '#BBBBBB',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  readerList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  readerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  readerCardTop: {
    position: 'relative',
  },
  readerImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    top: 12,
    right: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.3)',
  },
  readerCardInfo: {
    padding: 16,
  },
  readerName: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  readerSpecialty: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#CCCCCC',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  readingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  readingTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  chatButton: {
    backgroundColor: '#9C27B0',
  },
  audioButton: {
    backgroundColor: '#2196F3',
  },
  videoButton: {
    backgroundColor: '#FF69B4',
  },
  buttonText: {
    color: 'white',
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '500',
  },
  offlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  offlineText: {
    color: '#BBBBBB',
    marginLeft: 6,
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 12,
    marginTop: 3,
    color: '#CCCCCC',
  },
  activeTab: {
    color: '#FF69B4',
  },
});

export default ReadingsScreen;