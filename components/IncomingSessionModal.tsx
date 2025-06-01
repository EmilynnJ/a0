import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useWebRTC, SessionType } from '../contexts/WebRTCContext';
import { toast } from 'sonner-native';

// Format name of session type for display
const formatSessionType = (type: SessionType): string => {
  switch (type) {
    case 'chat':
      return 'Chat Reading';
    case 'audio':
      return 'Audio Reading';
    case 'video':
      return 'Video Reading';
    default:
      return 'Reading';
  }
};

const IncomingSessionModal = () => {
  const { incomingSession, handleIncomingSessionResponse } = useWebRTC();

  // If there's no incoming session, don't render anything
  if (!incomingSession || !incomingSession.from) {
    return null;
  }

  const { from, type } = incomingSession;
  const sessionTypeName = formatSessionType(type || 'chat');
  
  // Accept the session
  const handleAccept = async () => {
    try {
      await handleIncomingSessionResponse(true);
      toast.success(`${sessionTypeName} started with ${from.name}`);
    } catch (error) {
      console.error('Error accepting session:', error);
      toast.error('Failed to accept session');
    }
  };
  
  // Reject the session
  const handleReject = async () => {
    try {
      await handleIncomingSessionResponse(false);
      toast.info(`${sessionTypeName} rejected`);
    } catch (error) {
      console.error('Error rejecting session:', error);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={handleReject}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={['rgba(26, 26, 46, 0.97)', 'rgba(22, 33, 62, 0.97)']}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.headerBar}>
              <Text style={styles.headerText}>Incoming {sessionTypeName}</Text>
            </View>
            
            <Image
              source={{ uri: from.profileImage || 'https://api.a0.dev/assets/image?text=spiritual%20client%20profile&aspect=1:1' }}
              style={styles.callerImage}
            />
            
            <Text style={styles.callerName}>{from.name}</Text>
            <Text style={styles.callingText}>is requesting a {type} reading</Text>
            
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={18} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={styles.timerText}>Request expires in 25 seconds</Text>
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={handleReject}
              >
                <Ionicons name="close-circle" size={28} color="white" />
                <Text style={styles.buttonText}>Decline</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={handleAccept}
              >
                <LinearGradient
                  colors={['#4CAF50', '#2E7D32']}
                  style={styles.acceptGradient}
                >
                  <Ionicons name="checkmark-circle" size={28} color="white" />
                  <Text style={styles.buttonText}>Accept</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            
            {type === 'video' && (
              <Text style={styles.noteText}>
                Accepting will turn on your camera and microphone
              </Text>
            )}
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalContent: {
    alignItems: 'center',
    padding: 20,
  },
  headerBar: {
    backgroundColor: 'rgba(255, 105, 180, 0.8)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  headerText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  callerImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  callerName: {
    fontSize: 22,
    fontWeight: '600',
    color: 'white',
    marginBottom: 5,
  },
  callingText: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 25,
  },
  timerText: {
    color: 'white',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  actionButton: {
    borderRadius: 15,
    overflow: 'hidden',
    width: '47%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.5)',
  },
  acceptButton: {
    overflow: 'hidden',
  },
  acceptGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    marginTop: 5,
  },
  noteText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default IncomingSessionModal;