import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Temporary placeholder function to fetch images
const getImageUrl = (description: string) => {
  return `https://api.a0.dev/assets/image?text=${encodeURIComponent(description)}&aspect=1:1`;
};

interface ReaderCardProps {
  name: string;
  specialty: string;
  rating: number;
  price: number;
  isOnline: boolean;
  imageDesc: string;
}

const ReaderCard = ({ name, specialty, rating, price, isOnline, imageDesc }: ReaderCardProps) => {
  const navigation = useNavigation();
  
  return (
    <TouchableOpacity 
      style={styles.readerCard}
      onPress={() => navigation.navigate('ReaderProfile' as never, { name } as never)}
    >
      <View style={styles.onlineIndicatorContainer}>
        <View style={[styles.onlineIndicator, { backgroundColor: isOnline ? '#4CAF50' : '#757575' }]} />
      </View>
      <Image 
        source={{ uri: getImageUrl(imageDesc) }} 
        style={styles.readerImage} 
      />
      <View style={styles.readerInfo}>
        <Text style={styles.readerName}>{name}</Text>
        <Text style={styles.readerSpecialty}>{specialty}</Text>
        <View style={styles.ratingContainer}>
          {[...Array(5)].map((_, i) => (
            <FontAwesome 
              key={i} 
              name={i < rating ? "star" : "star-o"} 
              size={12} 
              color={i < rating ? "#FFD700" : "#757575"} 
              style={styles.starIcon}
            />
          ))}
          <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
        </View>
        <Text style={styles.priceText}>${price}/min</Text>
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // Mock data for available readers
  const readers = [
    { name: "Mystique Luna", specialty: "Tarot & Astrology", rating: 4.9, price: 3.99, isOnline: true, imageDesc: "mystical woman with tarot cards and cosmic background" },
    { name: "Serenity Star", specialty: "Intuitive Empath", rating: 4.7, price: 4.99, isOnline: true, imageDesc: "serene spiritual guide with ethereal aura" },
    { name: "Raven Moonlight", specialty: "Medium & Psychic", rating: 4.8, price: 5.99, isOnline: false, imageDesc: "mysterious psychic with raven and moon symbols" },
    { name: "Celeste Vision", specialty: "Clairvoyant", rating: 4.6, price: 4.50, isOnline: true, imageDesc: "woman with third eye symbol and celestial background" },
    { name: "Orion Truth", specialty: "Spiritual Healing", rating: 4.5, price: 3.75, isOnline: false, imageDesc: "healer with spiritual energy emanating from hands" },
  ];

  // Mock data for featured live streams
  const liveStreams = [
    { streamer: "Mystic Aurora", viewers: 248, topic: "Weekly Tarot Readings", imageDesc: "spiritual guide doing live tarot reading with pink mystical background" },
    { streamer: "Crystal Guardian", viewers: 137, topic: "Chakra Alignment", imageDesc: "person with crystals and chakra symbols with flowing energy" }
  ];

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#1a1a2e']}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}>SoulSeer</Text>
      </View>
      
      {/* Hero Image */}
      <Image 
        source={{ uri: getImageUrl("mystical cosmic spiritual portal with stars and gold accents on dark background") }} 
        style={styles.heroImage} 
      />
      
      {/* Tagline */}
      <Text style={styles.tagline}>A Community of Gifted Psychics</Text>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Featured Section - Online Readers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Online Readers</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllReaders' as never)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {readers.map((reader, index) => (
              <ReaderCard key={index} {...reader} />
            ))}
          </ScrollView>
        </View>
        
        {/* Live Streams Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Live Now</Text>
            <TouchableOpacity onPress={() => navigation.navigate('LiveStreams' as never)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {liveStreams.map((stream, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.liveStreamCard}
                onPress={() => navigation.navigate('LiveStream' as never, { streamer: stream.streamer } as never)}
              >
                <Image 
                  source={{ uri: getImageUrl(stream.imageDesc) }} 
                  style={styles.liveStreamImage} 
                />
                <View style={styles.liveTag}>
                  <Text style={styles.liveTagText}>LIVE</Text>
                </View>
                <View style={styles.liveStreamInfo}>
                  <Text style={styles.liveStreamerName}>{stream.streamer}</Text>
                  <Text style={styles.liveStreamTopic}>{stream.topic}</Text>
                  <View style={styles.viewersContainer}>
                    <Ionicons name="eye" size={14} color="#FFFFFF" />
                    <Text style={styles.viewersText}>{stream.viewers}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Quick Access Buttons */}
        <View style={styles.quickAccessSection}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccessButtons}>
            <TouchableOpacity 
              style={[styles.quickAccessButton, styles.primaryButton]}
              onPress={() => navigation.navigate('OnDemandReading' as never)}
            >
              <LinearGradient
                colors={['#FF69B4', '#FF1493']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>On Demand Reading</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickAccessButton, styles.secondaryButton]}
              onPress={() => navigation.navigate('Shop' as never)}
            >
              <Text style={styles.secondaryButtonText}>Visit Shop</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      {/* Navigation Tab Bar */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 10 }]}>
        <TouchableOpacity style={styles.tabItem} onPress={() => {}}>
          <Ionicons name="home" size={24} color="#FF69B4" />
          <Text style={[styles.tabText, styles.activeTab]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => navigation.navigate('Readings' as never)}
        >
          <Ionicons name="book-outline" size={24} color="#FFFFFF" />
          <Text style={styles.tabText}>Readings</Text>
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
    alignItems: 'center',
    paddingVertical: 15,
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: '400',
    color: '#FF69B4',
    // In production would use Alex Brush font
    textShadowColor: 'rgba(255, 105, 180, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  tagline: {
    fontSize: 18,
    fontWeight: '500',
    color: 'white',
    textAlign: 'center',
    marginVertical: 15,
    // In production would use Playfair Display font
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    // In production would use Playfair Display font
  },
  viewAllText: {
    fontSize: 14,
    color: '#FF69B4',
    fontWeight: '500',
  },
  horizontalScroll: {
    paddingBottom: 10,
  },
  readerCard: {
    width: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginRight: 15,
    overflow: 'hidden',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  onlineIndicatorContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    padding: 5,
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  readerImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  readerInfo: {
    padding: 10,
  },
  readerName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  readerSpecialty: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#CCCCCC',
    marginLeft: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF69B4',
  },
  liveStreamCard: {
    width: 220,
    borderRadius: 12,
    marginRight: 15,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  liveStreamImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  liveTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FF0000',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  liveTagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  liveStreamInfo: {
    padding: 10,
  },
  liveStreamerName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  liveStreamTopic: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 6,
  },
  viewersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewersText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#CCCCCC',
  },
  quickAccessSection: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  quickAccessButtons: {
    marginTop: 15,
    gap: 10,
  },
  quickAccessButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  primaryButton: {
    marginBottom: 10,
  },
  buttonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF69B4',
  },
  secondaryButtonText: {
    color: '#FF69B4',
    fontWeight: '600',
    fontSize: 16,
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
  }
});

export default HomeScreen;