import React, { useState, useEffect, useRef } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDistanceToNow } from 'date-fns';
import { useWebRTC, SessionType } from '../contexts/WebRTCContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner-native';

type RouteParams = {
  readerId: string;
  readerDetails: {
    id: string;
    name: string;
    specialty: string;
    imageUrl: string;
    ratePerMinute: {
      chat: number;
      audio: number;
      video: number;
    };
  };
  sessionType: SessionType;
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const ReadingScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const { readerId, readerDetails, sessionType } = route.params;
  const { user } = useAuth();
  const { 
    localStream, 
    remoteStream, 
    sessionStatus, 
    sessionDetails, 
    messages, 
    isMicMuted, 
    isVideoEnabled,
    initializeSession, 
    endSession,
    sendMessage,
    toggleMic,
    toggleVideo,
  } = useWebRTC();

  // Local state
  const [messageInput, setMessageInput] = useState('');
  const [isLocalStreamReady, setIsLocalStreamReady] = useState(false);
  const [currentTab, setCurrentTab] = useState<'video' | 'chat'>(sessionType === 'video' ? 'video' : 'chat');

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<ScrollView>(null);
  
  // Setup session when component loads
  useEffect(() => {
    const startSession = async () => {
      // Prepare partner details for WebRTC context
      const partnerDetails = {
        id: readerDetails.id,
        name: readerDetails.name,
        role: 'reader',
        profileImage: readerDetails.imageUrl,
        ratePerMinute: readerDetails.ratePerMinute,
      };
      
      // Initialize session
      const success = await initializeSession(sessionType, readerId, partnerDetails);
      if (!success) {
        toast.error('Failed to start session');
        navigation.goBack();
      }
    };
    
    startSession();
    
    return () => {
      // Clean up session when leaving screen
      endSession();
    };
  }, []);
  
  // Connect video streams to video elements
  useEffect(() => {
    if (Platform.OS === 'web') {
      // For web platform
      if (localStream && localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
        setIsLocalStreamReady(true);
      }
      
      if (remoteStream && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }
  }, [localStream, remoteStream]);
  
  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
  // Handle sending a chat message
  const handleSendMessage = () => {
    if (messageInput.trim() === '') return;
    
    sendMessage(messageInput);
    setMessageInput('');
  };
  
  // Handle end session
  const handleEndSession = () => {
    endSession();
    navigation.goBack();
  };
  
  // Extract session details for display
  const currentCharge = sessionDetails?.currentCharge || 0;
  const sessionDuration = sessionDetails?.duration || 0;
  const ratePerMinute = sessionDetails?.rate || 0;
  const partnerName = sessionDetails?.partner?.name || readerDetails.name;

  // Get user balance
  const userBalance = user?.balance || 0;
  
  // Render messages
  const renderMessage = ({ item }) => {
    const isMe = item.sender === user?.name;
    
    return (
      <View style={[
        styles.messageContainer,
        isMe ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isMe ? styles.myMessageBubble : styles.theirMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMe ? styles.myMessageText : styles.theirMessageText
          ]}>
            {item.content}
          </Text>
        </View>
        <Text style={styles.timestampText}>
          {formatDistanceToNow(item.timestamp, { addSuffix: true })}
        </Text>
      </View>
    );
  };
  
  // Render loading state
  if (sessionStatus === 'connecting') {
    return (
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#1a1a2e']}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        <View style={styles.connectingContainer}>
          <ActivityIndicator size="large" color="#FF69B4" />
          <Text style={styles.connectingText}>
            Connecting to {partnerName}...
          </Text>
          <Text style={styles.connectingSubText}>
            Please wait while we establish a secure connection
          </Text>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              endSession();
              navigation.goBack();
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Render session ended state
  if (sessionStatus === 'closed') {
    return (
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#1a1a2e']}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        <View style={styles.sessionEndedContainer}>
          <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
          <Text style={styles.sessionEndedTitle}>Reading Complete</Text>
          <Text style={styles.sessionEndedSubtitle}>
            Your session with {partnerName} has ended
          </Text>
          
          <View style={styles.sessionSummaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration:</Text>
              <Text style={styles.summaryValue}>{formatTime(sessionDuration)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rate:</Text>
              <Text style={styles.summaryValue}>${ratePerMinute.toFixed(2)}/min</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total charge:</Text>
              <Text style={styles.summaryTotal}>${currentCharge.toFixed(2)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Remaining balance:</Text>
              <Text style={styles.summaryValue}>${userBalance.toFixed(2)}</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Home' as never)}
          >
            <LinearGradient
              colors={['#FF69B4', '#FF1493']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Return Home</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('ReviewReader' as never, { 
              readerId: readerDetails.id,
              readerName: readerDetails.name,
              sessionDuration,
              sessionType,
            } as never)}
          >
            <Text style={styles.secondaryButtonText}>Leave Review</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Render main session UI
  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#1a1a2e']}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Image
            source={{ uri: readerDetails.imageUrl }}
            style={styles.readerAvatar}
          />
          <View style={styles.readerInfo}>
            <Text style={styles.readerName}>{partnerName}</Text>
            <Text style={styles.readerSpecialty}>{readerDetails.specialty}</Text>
          </View>
        </View>
        
        <View style={styles.sessionInfo}>
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={16} color="#FFFFFF" />
            <Text style={styles.timerText}>{formatTime(sessionDuration)}</Text>
          </View>
          
          <View style={styles.rateContainer}>
            <Ionicons name="cash-outline" size={16} color="#FFFFFF" />
            <Text style={styles.rateText}>
              ${currentCharge.toFixed(2)} (${ratePerMinute.toFixed(2)}/min)
            </Text>
          </View>
        </View>
      </View>
      
      {/* Tab navigation for video/chat */}
      {sessionType === 'video' && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, currentTab === 'video' && styles.activeTab]}
            onPress={() => setCurrentTab('video')}
          >
            <Ionicons 
              name={currentTab === 'video' ? 'videocam' : 'videocam-outline'} 
              size={20} 
              color={currentTab === 'video' ? '#FF69B4' : '#FFFFFF'} 
            />
            <Text style={[styles.tabText, currentTab === 'video' && styles.activeTabText]}>
              Video
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, currentTab === 'chat' && styles.activeTab]}
            onPress={() => setCurrentTab('chat')}
          >
            <Ionicons 
              name={currentTab === 'chat' ? 'chatbubble' : 'chatbubble-outline'} 
              size={20} 
              color={currentTab === 'chat' ? '#FF69B4' : '#FFFFFF'} 
            />
            <Text style={[styles.tabText, currentTab === 'chat' && styles.activeTabText]}>
              Chat
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Video content */}
      {(sessionType === 'video' && currentTab === 'video') && (
        <View style={styles.videoContainer}>
          {Platform.OS === 'web' ? (
            <>
              {/* Remote video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={styles.remoteVideo}
              />
              
              {/* Local video */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={styles.localVideo}
              />
            </>
          ) : (
            // For mobile platforms, would use react-native-webrtc components
            <View style={styles.mobileVideoPlaceholder}>
              <Text style={styles.placeholderText}>
                Video streaming would be implemented using react-native-webrtc
              </Text>
            </View>
          )}
          
          {/* Video controls */}
          <View style={styles.videoControls}>
            <TouchableOpacity 
              style={[styles.controlButton, isMicMuted && styles.controlButtonActive]} 
              onPress={toggleMic}
            >
              <Ionicons 
                name={isMicMuted ? 'mic-off' : 'mic-outline'} 
                size={24} 
                color={isMicMuted ? '#FF69B4' : 'white'} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.controlButton, styles.endCallButton]} 
              onPress={handleEndSession}
            >
              <MaterialIcons name="call-end" size={28} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.controlButton, !isVideoEnabled && styles.controlButtonActive]} 
              onPress={toggleVideo}
            >
              <Ionicons 
                name={isVideoEnabled ? 'videocam-outline' : 'videocam-off-outline'} 
                size={24} 
                color={!isVideoEnabled ? '#FF69B4' : 'white'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Chat content */}
      {(sessionType === 'chat' || currentTab === 'chat') && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.chatContainer}
          keyboardVerticalOffset={Platform.OS === "ios" ? 85 : 0}
        >
          <ScrollView
            ref={messagesEndRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyChat}>
                <FontAwesome5 name="comment-dots" size={40} color="rgba(255, 255, 255, 0.2)" />
                <Text style={styles.emptyChatText}>
                  Your conversation with {partnerName} will appear here
                </Text>
              </View>
            ) : (
              messages.map(message => renderMessage({ item: message }))
            )}
          </ScrollView>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type your message..."
              placeholderTextColor="#999"
              value={messageInput}
              onChangeText={setMessageInput}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !messageInput.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!messageInput.trim()}
            >
              <Ionicons name="send" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
      
      {/* Bottom balance display */}
      <View style={[styles.balanceBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 10 }]}>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Balance:</Text>
          <Text style={styles.balanceValue}>${userBalance.toFixed(2)}</Text>
        </View>
        
        {sessionType !== 'video' && (
          <TouchableOpacity
            style={styles.endSessionButton}
            onPress={handleEndSession}
          >
            <Text style={styles.endSessionText}>End Session</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  readerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  readerInfo: {
    flex: 1,
  },
  readerName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  readerSpecialty: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  sessionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  timerText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 6,
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  rateText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF69B4',
  },
  tabText: {
    color: 'white',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#FF69B4',
    fontWeight: '500',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  localVideo: {
    position: 'absolute',
    width: 120,
    height: 160,
    top: 10,
    right: 10,
    objectFit: 'cover',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF69B4',
  },
  mobileVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  videoControls: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 1,
    borderColor: '#FF69B4',
  },
  endCallButton: {
    backgroundColor: '#FF0000',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    flexGrow: 1,
    paddingBottom: 10,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyChatText: {
    marginTop: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    fontSize: 16,
    paddingHorizontal: 40,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: '#FF69B4',
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: 'white',
  },
  theirMessageText: {
    color: 'white',
  },
  timestampText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: 'white',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  balanceBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 6,
  },
  balanceValue: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  endSessionButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.6)',
  },
  endSessionText: {
    color: 'white',
    fontWeight: '500',
  },
  connectingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  connectingText: {
    marginTop: 16,
    color: 'white',
    fontSize: 20,
    fontWeight: '500',
  },
  connectingSubText: {
    marginTop: 8,
    color: '#CCCCCC',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 30,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  sessionEndedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sessionEndedTitle: {
    marginTop: 16,
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
  },
  sessionEndedSubtitle: {
    marginTop: 8,
    color: '#CCCCCC',
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  sessionSummaryCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  summaryValue: {
    color: 'white',
    fontWeight: '500',
  },
  summaryTotal: {
    color: '#FF69B4',
    fontWeight: '600',
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 16,
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
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF69B4',
    borderRadius: 25,
  },
  secondaryButtonText: {
    color: '#FF69B4',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ReadingScreen;