// src/test/OAuthTest.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking, Platform } from 'react-native';

const OAuthTest = () => {
  const spotifyConfig = {
    clientId: 'a32ad6490feb49fe8f542a596e47a983',
    redirectUrl: 'beatpulse://callback',
    scopes: ['user-read-playback-state'],
  };

  const testOAuth = async () => {
    try {
      console.log('🚀 Starting OAuth with manual implementation...');

      // Build the authorization URL
      const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${spotifyConfig.clientId}&redirect_uri=${encodeURIComponent(spotifyConfig.redirectUrl)}&scope=${encodeURIComponent(spotifyConfig.scopes.join(' '))}&show_dialog=false`;

      console.log('Auth URL:', authUrl);

      // Test if we can open the URL
      const canOpen = await Linking.canOpenURL(authUrl);
      if (!canOpen) {
        throw new Error('Cannot open Spotify authorization URL');
      }

      // Open in system browser (Safari)
      await Linking.openURL(authUrl);
      
      console.log('✅ Opened Spotify login in browser');
      Alert.alert('Success', 'Opened Spotify login in browser');

    } catch (error) {
      console.error('❌ OAuth failed:', error);
      Alert.alert('OAuth Failed', error.message);
    }
  };

  // Handle the redirect when app comes back from browser
  React.useEffect(() => {
    const handleUrl = (event) => {
      const { url } = event;
      console.log('App opened with URL:', url);

      if (url && url.includes('beatpulse://callback')) {
        console.log('✅ OAuth redirect received!');
        
        // Parse the authorization code from the URL
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        const error = urlObj.searchParams.get('error');

        if (error) {
          Alert.alert('OAuth Error', error);
          return;
        }

        if (code) {
          Alert.alert('Success!', `Got authorization code: ${code.substring(0, 20)}...`);
          console.log('Authorization code:', code);
          
          // Exchange code for tokens
          exchangeCodeForToken(code);
        }
      }
    };

    // Listen for deep links
    Linking.addEventListener('url', handleUrl);

    // Check if app was launched from a deep link
    Linking.getInitialURL().then(url => {
      if (url) {
        handleUrl({ url });
      }
    });

    return () => {
      Linking.removeEventListener('url', handleUrl);
    };
  }, []);

  const exchangeCodeForToken = async (authorizationCode) => {
    try {
      console.log('Sending authorization code to server...');

      const response = await fetch('http://localhost:3000/spotify/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authCode: authorizationCode,
          userId: 'test_user_' + Math.random().toString(36).substr(2, 9)
        })
      });

      if (!response.ok) {
        throw new Error('Server error: ' + response.status);
      }

      const data = await response.json();
      console.log('✅ Token exchange successful:', data);
      Alert.alert('Tokens Received', 'Successfully got access tokens!');
      
    } catch (error) {
      console.error('❌ Token exchange failed:', error);
      Alert.alert('Token Error', 'Failed to exchange code for tokens');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manual OAuth Test</Text>
      <Text style={styles.subtitle}>Will open in Safari browser</Text>
      <Text style={styles.redirectUri}>Redirect: {spotifyConfig.redirectUrl}</Text>
      
      <TouchableOpacity style={styles.button} onPress={testOAuth}>
        <Text style={styles.buttonText}>Test Spotify OAuth</Text>
      </TouchableOpacity>
      
      <Text style={styles.instructions}>
        This will:{'\n'}
        1. Open Spotify login in Safari{'\n'}
        2. Get authorization code from redirect{'\n'}
        3. Exchange code for tokens{'\n'}
        {'\n'}
        Check console for detailed logs!
      </Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666',
    textAlign: 'center',
  },
  redirectUri: {
    fontSize: 12,
    marginBottom: 20,
    color: '#888',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 20,
  },
});

export default OAuthTest;