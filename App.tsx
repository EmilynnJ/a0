import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from 'sonner-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Context Providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WebRTCProvider } from './contexts/WebRTCContext';

// Screens
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import ReadingsScreen from "./screens/ReadingsScreen";
import ReadingScreen from "./screens/ReadingScreen";

// Components
import IncomingSessionModal from './components/IncomingSessionModal';

const Stack = createNativeStackNavigator();

// Routes that don't require authentication
const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};

// Routes that require authentication
const MainStack = () => {
  const { user } = useAuth();
  
  // If user is a reader, we should show the IncomingSessionModal
  const isReader = user?.role === 'reader';
  
  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Readings" component={ReadingsScreen} />
        <Stack.Screen name="Reading" component={ReadingScreen} />
        {/* Add other routes here */}
      </Stack.Navigator>
      
      {/* Show incoming session requests for readers */}
      {isReader && <IncomingSessionModal />}
    </>
  );
};

// Main navigation container with auth-based routing
const Navigation = () => {
  const { user, loading } = useAuth();
  
  // Show a loading screen while checking authentication
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  
  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default function App() {
  // Clear any stored data for fresh testing
  useEffect(() => {
    const clearStorageForTesting = async () => {
      // Uncomment to clear storage when testing
      // await AsyncStorage.clear();
    };
    
    clearStorageForTesting();
  }, []);

  return (
    <SafeAreaProvider style={styles.container}>
      <AuthProvider>
        <WebRTCProvider>
          <Toaster />
          <Navigation />
        </WebRTCProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    userSelect: "none"
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
  }
});