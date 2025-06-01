import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';

// Define WebRTC session types
export type SessionType = 'chat' | 'audio' | 'video';

// Define WebRTC session status
export type SessionStatus = 
  | 'idle' 
  | 'connecting' 
  | 'connected' 
  | 'failed' 
  | 'closed'
  | 'reconnecting';

// Define session partner (the other participant)
export interface SessionPartner {
  id: string;
  name: string;
  role: string;
  profileImage?: string;
  ratePerMinute?: {
    chat: number;
    audio: number;
    video: number;
  };
}

// Define session details
export interface SessionDetails {
  id: string;
  type: SessionType;
  startTime: Date | null;
  duration: number; // in seconds
  partner: SessionPartner | null;
  rate: number; // Per minute rate
  currentCharge: number; // Total charge so far
}

// WebRTC context type
interface WebRTCContextType {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  sessionStatus: SessionStatus;
  sessionDetails: SessionDetails | null;
  messages: Array<{ id: string; sender: string; content: string; timestamp: Date }>;
  isMicMuted: boolean;
  isVideoEnabled: boolean;
  isSpeakerEnabled: boolean;
  
  // Methods
  initializeSession: (
    sessionType: SessionType, 
    partnerId: string, 
    partnerDetails: SessionPartner
  ) => Promise<boolean>;
  acceptSession: (sessionId: string) => Promise<boolean>;
  rejectSession: (sessionId: string) => Promise<void>;
  endSession: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  toggleMic: () => void;
  toggleVideo: () => void;
  toggleSpeaker: () => void;
  
  // Incoming session
  incomingSession: {
    id: string | null;
    type: SessionType | null;
    from: SessionPartner | null;
  } | null;
  handleIncomingSessionResponse: (accept: boolean) => Promise<void>;
}

const initialSessionDetails: SessionDetails = {
  id: '',
  type: 'chat',
  startTime: null,
  duration: 0,
  partner: null,
  rate: 0,
  currentCharge: 0,
};

// Create the context
const WebRTCContext = createContext<WebRTCContextType>({
  localStream: null,
  remoteStream: null,
  sessionStatus: 'idle',
  sessionDetails: initialSessionDetails,
  messages: [],
  isMicMuted: false,
  isVideoEnabled: true,
  isSpeakerEnabled: true,
  
  // Methods stubs
  initializeSession: async () => false,
  acceptSession: async () => false,
  rejectSession: async () => {},
  endSession: async () => {},
  sendMessage: async () => {},
  toggleMic: () => {},
  toggleVideo: () => {},
  toggleSpeaker: () => {},
  
  incomingSession: null,
  handleIncomingSessionResponse: async () => {},
});

interface WebRTCProviderProps {
  children: ReactNode;
}

export const WebRTCProvider: React.FC<WebRTCProviderProps> = ({ children }) => {
  const { user, updateUserBalance } = useAuth();
  
  // WebRTC state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle');
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [messages, setMessages] = useState<Array<{ id: string; sender: string; content: string; timestamp: Date }>>([]);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  
  // Incoming session state
  const [incomingSession, setIncomingSession] = useState<{
    id: string | null;
    type: SessionType | null;
    from: SessionPartner | null;
  } | null>(null);
  
  // WebRTC refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  
  // Timer ref for billing
  const billingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<Date | null>(null);
  
  // WebSocket ref for signaling
  const wsRef = useRef<WebSocket | null>(null);
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (user) {
      // In a real app, would connect to a real WebSocket server
      const iceServers = JSON.parse(process.env.WEBRTC_ICE_SERVERS || '[]');
      console.log('ICE servers:', iceServers);
      
      // Mock WebSocket connection (in real implementation, we would connect to a real server)
      const mockWsHandlers = {
        onopen: () => {
          console.log('WebSocket connected');
        },
        
        onmessage: (event: any) => {
          try {
            // In a real app, we'd be receiving actual messages from the server
            const message = JSON.parse(event.data);
            
            if (message.type === 'incoming_session') {
              // Handle incoming session request
              setIncomingSession({
                id: message.sessionId,
                type: message.sessionType,
                from: message.from,
              });
            } else if (message.type === 'ice_candidate' && peerConnectionRef.current) {
              // Add ICE candidate
              const candidate = new RTCIceCandidate(message.candidate);
              peerConnectionRef.current.addIceCandidate(candidate);
            } else if (message.type === 'session_offer' && peerConnectionRef.current) {
              // Handle session offer (SDP)
              const description = new RTCSessionDescription(message.offer);
              peerConnectionRef.current.setRemoteDescription(description)
                .then(() => peerConnectionRef.current!.createAnswer())
                .then(answer => peerConnectionRef.current!.setLocalDescription(answer))
                .then(() => {
                  // Send answer to signaling server (mocked)
                  console.log('Answer created and local description set', peerConnectionRef.current!.localDescription);
                });
            } else if (message.type === 'session_answer' && peerConnectionRef.current) {
              // Handle session answer (SDP)
              const description = new RTCSessionDescription(message.answer);
              peerConnectionRef.current.setRemoteDescription(description);
            } else if (message.type === 'session_ended') {
              // Handle session ended
              endSession();
            } else if (message.type === 'chat_message') {
              // Handle chat message
              setMessages(prev => [...prev, {
                id: Math.random().toString(),
                sender: message.from.name,
                content: message.content,
                timestamp: new Date(),
              }]);
            }
          } catch (error) {
            console.error('Error handling WebSocket message:', error);
          }
        },
        
        onclose: () => {
          console.log('WebSocket disconnected');
        },
        
        onerror: (error: Event) => {
          console.error('WebSocket error:', error);
        }
      };
      
      // Mock WebSocket (in real app, would use real WebSocket connection)
      wsRef.current = {
        send: (data: string) => {
          console.log('WebSocket sending data:', data);
          
          // Mock receiving responses based on sent data
          const sent = JSON.parse(data);
          
          if (sent.type === 'session_request') {
            // Mock receiving response after a delay
            setTimeout(() => {
              const mockResponse = {
                type: 'session_accepted',
                sessionId: sent.sessionId,
              };
              mockWsHandlers.onmessage({ data: JSON.stringify(mockResponse) });
            }, 1000);
          }
        },
        close: () => {
          console.log('WebSocket closed');
        },
      } as unknown as WebSocket;
      
      // Set up mock message handlers
      Object.keys(mockWsHandlers).forEach(key => {
        const handler = mockWsHandlers[key as keyof typeof mockWsHandlers];
        // @ts-ignore - Adding handlers to our mock WebSocket
        wsRef.current[key] = handler;
      });
      
      // Trigger mock open event
      setTimeout(() => {
        // @ts-ignore - Mock onopen event
        wsRef.current?.onopen();
      }, 500);
      
      // Mock incoming session for testing (after 5 seconds)
      if (user.role === 'reader') {
        setTimeout(() => {
          const mockIncomingSession = {
            type: 'incoming_session',
            sessionId: 'mock-session-123',
            sessionType: 'video' as SessionType,
            from: {
              id: 'client123',
              name: 'Emma Thompson',
              role: 'client',
              profileImage: 'https://api.a0.dev/assets/image?text=spiritual%20client%20female%20profile%20picture&aspect=1:1',
            }
          };
          mockWsHandlers.onmessage({ data: JSON.stringify(mockIncomingSession) });
        }, 5000);
      }
      
      return () => {
        wsRef.current?.close();
      };
    }
  }, [user]);
  
  // Create and configure a new PeerConnection
  const createPeerConnection = async () => {
    try {
      // Parse ICE servers from env
      const iceServers = JSON.parse(process.env.WEBRTC_ICE_SERVERS || '[]');
      
      // Add TURN servers if available
      if (process.env.TURN_SERVERS) {
        const turnServer = {
          urls: `turn:${process.env.TURN_SERVERS}`,
          username: process.env.TURN_USERNAME,
          credential: process.env.TURN_CREDENTIAL,
        };
        iceServers.push(turnServer);
      }
      
      // Create new RTCPeerConnection with ICE servers
      const pc = new RTCPeerConnection({ iceServers });
      
      // Handle ICE candidates
      pc.onicecandidate = event => {
        if (event.candidate && wsRef.current) {
          // Send ICE candidate to signaling server
          wsRef.current.send(JSON.stringify({
            type: 'ice_candidate',
            candidate: event.candidate,
            sessionId: sessionDetails?.id,
          }));
        }
      };
      
      // Handle ICE connection state changes
      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
        
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          setSessionStatus('reconnecting');
          
          // Attempt to reconnect after a delay
          setTimeout(() => {
            if (sessionStatus === 'reconnecting') {
              // If still reconnecting after timeout, consider connection failed
              setSessionStatus('failed');
            }
          }, 10000);
        } else if (pc.iceConnectionState === 'connected') {
          setSessionStatus('connected');
        }
      };
      
      // Handle negotiation needed event
      pc.onnegotiationneeded = async () => {
        try {
          await pc.createOffer();
          await pc.setLocalDescription();
          
          // Send the offer to the remote peer via signaling server
          if (wsRef.current && pc.localDescription) {
            wsRef.current.send(JSON.stringify({
              type: 'session_offer',
              offer: pc.localDescription,
              sessionId: sessionDetails?.id,
            }));
          }
        } catch (error) {
          console.error('Error during negotiation:', error);
        }
      };
      
      // Handle incoming tracks
      pc.ontrack = event => {
        const stream = event.streams[0];
        console.log('Received remote stream:', stream);
        setRemoteStream(stream);
      };
      
      // Create data channel for chat
      const dataChannel = pc.createDataChannel('chat');
      dataChannelRef.current = dataChannel;
      
      dataChannel.onopen = () => {
        console.log('Data channel opened');
      };
      
      dataChannel.onmessage = event => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'chat') {
            setMessages(prev => [...prev, {
              id: Math.random().toString(),
              sender: sessionDetails?.partner?.name || 'Partner',
              content: message.content,
              timestamp: new Date(),
            }]);
          }
        } catch (error) {
          console.error('Error handling data channel message:', error);
        }
      };
      
      // Handle incoming data channels
      pc.ondatachannel = event => {
        const receivedDataChannel = event.channel;
        dataChannelRef.current = receivedDataChannel;
        
        receivedDataChannel.onmessage = event => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'chat') {
              setMessages(prev => [...prev, {
                id: Math.random().toString(),
                sender: sessionDetails?.partner?.name || 'Partner',
                content: message.content,
                timestamp: new Date(),
              }]);
            }
          } catch (error) {
            console.error('Error handling data channel message:', error);
          }
        };
      };
      
      peerConnectionRef.current = pc;
      return pc;
    } catch (error) {
      console.error('Error creating peer connection:', error);
      return null;
    }
  };
  
  // Get user media stream
  const getMediaStream = async (sessionType: SessionType) => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: sessionType === 'video' ? {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } : false
      };
      
      // For web platform
      if (Platform.OS === 'web') {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        return stream;
      } else {
        // For mobile platforms, would use react-native-webrtc
        console.log('Would get media stream on mobile platform');
        // Mock stream for now
        return null;
      }
    } catch (error) {
      console.error('Error getting user media:', error);
      return null;
    }
  };
  
  // Start billing timer
  const startBillingTimer = () => {
    if (billingIntervalRef.current) {
      clearInterval(billingIntervalRef.current);
    }
    
    // Record session start time
    sessionStartTimeRef.current = new Date();
    setSessionDetails(prev => prev ? {
      ...prev,
      startTime: sessionStartTimeRef.current,
    } : null);
    
    // Set up billing interval - charge every 60 seconds
    // In a real app, we'd charge via Stripe
    billingIntervalRef.current = setInterval(() => {
      if (sessionDetails && user && user.role === 'client') {
        // Calculate session duration in seconds
        const currentTime = new Date();
        const durationMs = sessionStartTimeRef.current ? 
          currentTime.getTime() - sessionStartTimeRef.current.getTime() : 0;
        const durationSec = Math.floor(durationMs / 1000);
        
        // Calculate cost for this minute
        const ratePerMinute = sessionDetails.rate;
        const ratePerSecond = ratePerMinute / 60;
        
        // Calculate charges since last update (for this minute)
        const minuteCharge = ratePerSecond * 60;
        
        // Update total charge and duration
        setSessionDetails(prev => {
          if (!prev) return null;
          
          const newCharge = prev.currentCharge + minuteCharge;
          
          // Check if client has enough balance
          if ('balance' in user && user.balance !== undefined) {
            const remainingBalance = user.balance - newCharge;
            
            // If client's balance is too low, end the session
            if (remainingBalance < 0) {
              endSession();
              return prev;
            }
            
            // Update client's balance in Auth context
            updateUserBalance(user.balance - minuteCharge);
          }
          
          return {
            ...prev,
            duration: durationSec,
            currentCharge: newCharge,
          };
        });
        
        // In a real app, we would make a Stripe API call here
        console.log(`Billed ${ratePerMinute} for 1 minute. Total: ${sessionDetails.currentCharge + minuteCharge}`);
      }
    }, 60000); // Bill every minute
    
    // Also set up a display timer that updates every second
    setInterval(() => {
      if (sessionStartTimeRef.current && sessionDetails) {
        const currentTime = new Date();
        const durationMs = currentTime.getTime() - sessionStartTimeRef.current.getTime();
        const durationSec = Math.floor(durationMs / 1000);
        
        setSessionDetails(prev => prev ? {
          ...prev,
          duration: durationSec,
        } : null);
      }
    }, 1000);
  };
  
  // Initialize a new session
  const initializeSession = async (
    sessionType: SessionType,
    partnerId: string,
    partnerDetails: SessionPartner
  ): Promise<boolean> => {
    try {
      // Create session ID
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Set up session details
      const rate = partnerDetails.ratePerMinute ? 
        partnerDetails.ratePerMinute[sessionType] : 0;
      
      setSessionDetails({
        id: sessionId,
        type: sessionType,
        startTime: null,
        duration: 0,
        partner: partnerDetails,
        rate: rate,
        currentCharge: 0,
      });
      
      // Set status to connecting
      setSessionStatus('connecting');
      
      // Get media stream
      const stream = await getMediaStream(sessionType);
      if (stream) {
        setLocalStream(stream);
      }
      
      // Create peer connection
      const pc = await createPeerConnection();
      if (!pc) {
        throw new Error('Failed to create peer connection');
      }
      
      // If we have a stream, add tracks to peer connection
      if (stream) {
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
      }
      
      // Signal session request to the server
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'session_request',
          sessionId,
          sessionType,
          partnerId,
          from: {
            id: user?.id,
            name: user?.name,
            role: user?.role,
          },
        }));
      }
      
      // Clear previous messages
      setMessages([]);
      
      return true;
    } catch (error) {
      console.error('Error initializing session:', error);
      setSessionStatus('idle');
      return false;
    }
  };
  
  // Accept an incoming session
  const acceptSession = async (sessionId: string): Promise<boolean> => {
    try {
      if (!incomingSession || !incomingSession.from) {
        throw new Error('No incoming session to accept');
      }
      
      // Set session details
      const sessionType = incomingSession.type || 'chat';
      const partner = incomingSession.from;
      const rate = user?.role === 'reader' && user.ratePerMinute ? 
        user.ratePerMinute[sessionType as 'chat' | 'audio' | 'video'] : 0;
      
      setSessionDetails({
        id: sessionId,
        type: sessionType,
        startTime: null,
        duration: 0,
        partner: partner,
        rate: rate,
        currentCharge: 0,
      });
      
      // Set status to connecting
      setSessionStatus('connecting');
      
      // Get media stream
      const stream = await getMediaStream(sessionType);
      if (stream) {
        setLocalStream(stream);
      }
      
      // Create peer connection
      const pc = await createPeerConnection();
      if (!pc) {
        throw new Error('Failed to create peer connection');
      }
      
      // If we have a stream, add tracks to peer connection
      if (stream) {
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
      }
      
      // Signal session acceptance to the server
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'session_accept',
          sessionId,
          from: {
            id: user?.id,
            name: user?.name,
            role: user?.role,
          },
        }));
      }
      
      // Clear incoming session state
      setIncomingSession(null);
      
      // Clear previous messages
      setMessages([]);
      
      // For demo purposes, simulate connection establishment after a delay
      setTimeout(() => {
        setSessionStatus('connected');
        startBillingTimer();
      }, 2000);
      
      return true;
    } catch (error) {
      console.error('Error accepting session:', error);
      setSessionStatus('idle');
      return false;
    }
  };
  
  // Reject an incoming session
  const rejectSession = async (sessionId: string): Promise<void> => {
    try {
      // Signal session rejection to the server
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'session_reject',
          sessionId,
          from: {
            id: user?.id,
            name: user?.name,
            role: user?.role,
          },
        }));
      }
      
      // Clear incoming session state
      setIncomingSession(null);
    } catch (error) {
      console.error('Error rejecting session:', error);
    }
  };
  
  // End the current session
  const endSession = async (): Promise<void> => {
    try {
      // Signal session end to the server
      if (wsRef.current && sessionDetails) {
        wsRef.current.send(JSON.stringify({
          type: 'session_end',
          sessionId: sessionDetails.id,
          from: {
            id: user?.id,
            name: user?.name,
            role: user?.role,
          },
        }));
      }
      
      // Clean up media streams
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
      
      // Clean up peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      // Clean up data channel
      dataChannelRef.current = null;
      
      // Clean up billing interval
      if (billingIntervalRef.current) {
        clearInterval(billingIntervalRef.current);
        billingIntervalRef.current = null;
      }
      
      // Reset session state
      setRemoteStream(null);
      setSessionStatus('closed');
      
      // After a delay, reset to idle
      setTimeout(() => {
        setSessionStatus('idle');
        setSessionDetails(null);
        setMessages([]);
      }, 2000);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };
  
  // Send a chat message
  const sendMessage = async (content: string): Promise<void> => {
    try {
      if (!content.trim()) return;
      
      // Create message object
      const message = {
        type: 'chat',
        content,
        from: {
          id: user?.id,
          name: user?.name,
        },
        timestamp: new Date(),
      };
      
      // Add to local messages
      const newMessage = {
        id: Math.random().toString(),
        sender: user?.name || 'Me',
        content,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMessage]);
      
      // Send via data channel if available
      if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
        dataChannelRef.current.send(JSON.stringify(message));
      } else if (wsRef.current) {
        // Fall back to signaling server for message delivery
        wsRef.current.send(JSON.stringify({
          type: 'chat_message',
          sessionId: sessionDetails?.id,
          from: {
            id: user?.id,
            name: user?.name,
          },
          content,
        }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  // Toggle microphone
  const toggleMic = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicMuted(!isMicMuted);
    }
  };
  
  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };
  
  // Toggle speaker (audio output)
  const toggleSpeaker = () => {
    // In a real mobile app, we would toggle audio output
    // On web, this would be more complex
    setIsSpeakerEnabled(!isSpeakerEnabled);
  };
  
  // Handle incoming session response (accept/reject)
  const handleIncomingSessionResponse = async (accept: boolean): Promise<void> => {
    if (!incomingSession || !incomingSession.id) {
      return;
    }
    
    if (accept) {
      await acceptSession(incomingSession.id);
    } else {
      await rejectSession(incomingSession.id);
    }
  };
  
  return (
    <WebRTCContext.Provider
      value={{
        localStream,
        remoteStream,
        sessionStatus,
        sessionDetails,
        messages,
        isMicMuted,
        isVideoEnabled,
        isSpeakerEnabled,
        
        initializeSession,
        acceptSession,
        rejectSession,
        endSession,
        sendMessage,
        toggleMic,
        toggleVideo,
        toggleSpeaker,
        
        incomingSession,
        handleIncomingSessionResponse,
      }}
    >
      {children}
    </WebRTCContext.Provider>
  );
};

export const useWebRTC = () => useContext(WebRTCContext);