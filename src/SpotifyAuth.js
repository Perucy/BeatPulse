// src/SpotifyAuth.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SpotifyAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const spotifyConfig = {
    clientId: 'a32ad6490feb49fe8f542a596e47a983',
    redirectUrl: 'beatpulse://callback',
    scopes: ['user-read-playback-state'],
  };

  const loginWithSpotify = async () => {
    try {
      setIsLoading(true);
      console.log('🚀 Starting Spotify login...');

      // Build the auth URL
      const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${spotifyConfig.clientId}&redirect_uri=${encodeURIComponent(spotifyConfig.redirectUrl)}&scope=${encodeURIComponent(spotifyConfig.scopes.join(' '))}&show_dialog=true`;

      console.log('Auth URL:', authUrl);

      // Open in browser
      await Linking.openURL(authUrl);
      
      console.log('✅ Opened Spotify login');
      Alert.alert('Check Safari', 'Complete login in Safari. When iOS asks to "Open in BeatPulse?", tap OPEN.');

    } catch (error) {
      console.error('❌ Login failed:', error);
      Alert.alert('Error', 'Failed to open Spotify: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle the redirect when app reopens
  React.useEffect(() => {
    const handleUrl = (event) => {
      console.log('📱 URL received:', event.url);
      
      if (event.url && event.url.includes('beatpulse://callback')) {
        try {
          const url = new URL(event.url);
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');

          if (error) {
            Alert.alert('Error', 'Spotify login failed: ' + error);
            return;
          }

          if (code) {
            console.log('✅ Authorization code received');
            Alert.alert('Success!', 'Got authorization code. Now getting access token...');
            exchangeCodeForToken(code);
          }
        } catch (parseError) {
          console.error('Error parsing URL:', parseError);
        }
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', handleUrl);

    // Check if app was launched with a URL
    Linking.getInitialURL().then(url => {
      if (url && url.includes('beatpulse://callback')) {
        handleUrl({ url });
      }
    });

    return () => subscription.remove();
  }, []);

  const exchangeCodeForToken = async (authorizationCode) => {
    try {
      setIsLoading(true);
      console.log('🔁 Exchanging code for tokens...');

      const response = await fetch('http://localhost:3000/spotify/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authCode: authorizationCode,
          userId: 'user_' + Math.random().toString(36).substr(2, 9)
        })
      });

      if (!response.ok) {
        throw new Error('Server error: ' + response.status);
      }

      const data = await response.json();
      
      if (!data.access_token) {
        throw new Error('No access token received');
      }

      console.log('✅ Token exchange successful');
      
      // Store the token
      await AsyncStorage.setItem('spotify_access_token', data.access_token);
      await AsyncStorage.setItem('spotify_refresh_token', data.refresh_token || '');
      const expiresAt = Date.now() + (data.expires_in * 1000);
      await AsyncStorage.setItem('spotify_expires_at', expiresAt.toString());
      
      Alert.alert('Success!', 'You are now connected to Spotify 🎉');
      setIsAuthenticated(true);
      
    } catch (error) {
      console.error('❌ Token exchange failed:', error);
      Alert.alert('Error', 'Failed to get tokens: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('spotify_access_token');
      const expiresAt = await AsyncStorage.getItem('spotify_expires_at');
      
      if (token && expiresAt && Date.now() < parseInt(expiresAt)) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('spotify_access_token');
      await AsyncStorage.removeItem('spotify_refresh_token');
      await AsyncStorage.removeItem('spotify_expires_at');
      setIsAuthenticated(false);
      Alert.alert('Logged out', 'Disconnected from Spotify');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  const checkForRedirect = async () => {
    try {
        const url = await Linking.getInitialURL();
        Alert.alert('Current URL', url || 'No redirect URL received');
        console.log('Current URL:', url);
    } catch (error) {
        console.error('URL check failed:', error);
    }
 };
    
  // Check auth status on component mount
  React.useEffect(() => {
    checkAuthStatus();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Connecting to Spotify...</Text>
        <Text style={styles.subtitle}>Please wait</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BeatPulse</Text>
      
      {isAuthenticated ? (
        <View style={styles.content}>
          <Text style={styles.successText}>✅ Connected to Spotify!</Text>
          <Text style={styles.userText}>Ready to play music 🎵</Text>
          
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.buttonText}>Disconnect Spotify</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.subtitle}>Connect your Spotify account</Text>
          <Text style={styles.instruction}>This will open Spotify login in your browser</Text>
          
          <TouchableOpacity style={styles.loginButton} onPress={loginWithSpotify}>
            <Text style={styles.buttonText}>Connect Spotify</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, {backgroundColor: '#6A0DAD'}]} 
            onPress={checkForRedirect}
            >
            <Text style={styles.buttonText}>Check for Redirect</Text>
            </TouchableOpacity>
          
          <Text style={styles.note}>
            After logging in, iOS will ask to "Open in BeatPulse?" - tap OPEN to complete the connection.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 10,
    color: '#666',
    textAlign: 'center',
  },
  instruction: {
    fontSize: 14,
    marginBottom: 30,
    color: '#888',
    textAlign: 'center',
  },
  successText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1DB954',
    marginBottom: 20,
  },
  userText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: '#999',
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SpotifyAuth;