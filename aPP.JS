import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, Linking } from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';


const LoginScreen = ({ navigation }) => {
  // Handle deep link when app is opened from redirect
  useEffect(() => {
    const handleDeepLink = (event) => {
      if (event.url.includes('beatpulse://callback')) {
        const url = new URL(event.url);
        const code = url.searchParams.get('code');
        
        if (code) {
          exchangeCodeForToken(code);
        }
      }
    };

    // Listen for incoming links
    Linking.addEventListener('url', handleDeepLink);

    // Check if app was launched from a deep link
    Linking.getInitialURL().then(url => {
      if (url && url.includes('beatpulse://callback')) {
        handleDeepLink({ url });
      }
    });

    return () => {
      Linking.removeEventListener('url', handleDeepLink);
    };
  }, []);

  const exchangeCodeForToken = async (code) => {
    try {
      const response = await fetch(
        `http://192.168.1.248:5001/spotify/callback?code=${code}`
      );
      const tokenData = await response.json();
      console.log('Auth successful:', tokenData);
      navigation.navigate('Home');
    } catch (error) {
      console.error('Token exchange failed:', error);
      Alert.alert('Error', 'Failed to complete authentication');
    }
  };

  const handleSpotifyLogin = async () => {
    try {
      const response = await fetch('http://192.168.1.248:5001/spotify/auth_url');
      const { auth_url } = await response.json();
      
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open(auth_url, {
          dismissButtonStyle: 'cancel',
          preferredBarTintColor: '#1DB954',
          preferredControlTintColor: 'white',
          // Enable deep linking back to your app
          ephemeralWebSession: false, // Important for auth to persist
        });
      } else {
        Linking.openURL(auth_url);
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      Alert.alert('Connection Error', 'Failed to connect to Spotify. Please try again later.');
    }
  };

  return (
    <View style={styles.container}>
      {/* App Logo - True Center */}
      <View style={styles.centerContainer}>
        <Image 
          source={require('./assets/beat-logo.png')}
          style={styles.appLogo}
        />
      </View>
      
      {/* Buttons - Slightly Below Center */}
      <View style={styles.buttonGroup}>
        <Text style={styles.title}>Connect Your Accounts</Text>
        
        <TouchableOpacity style={[styles.button, styles.whoopButton]}>
          <Image source={require('./assets/whoop-logo.png')} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Connect WHOOP</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.spotifyButton]} 
          onPress={handleSpotifyLogin}
        >
          <Image source={require('./assets/spotify-logo.png')} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Connect Spotify</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

