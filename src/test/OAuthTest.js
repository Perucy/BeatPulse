import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OAuthTest = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [receivedUrl, setReceivedUrl] = React.useState(null);
  const [redirectStatus, setRedirectStatus] = React.useState('Waiting for redirect...');

  const spotifyConfig = {
    clientId: 'a32ad6490feb49fe8f542a596e47a983',
    redirectUrl: 'beatpulse://callback',
    scopes: ['user-read-playback-state', 'user-read-private'],
  };

  React.useEffect(() => {
    checkExistingAuth();
  }, []);

  const processOAuthRedirect = (url) => {
    console.log('🔄 Processing OAuth redirect:', url);
    setReceivedUrl(url);
    setRedirectStatus('Processing redirect...');
    
    try {
      const urlString = url.url || url;
      const queryString = urlString.split('?')[1];
      
      if (!queryString) {
        setRedirectStatus('Error: No query parameters');
        throw new Error('No query parameters found');
      }
      
      const params = new URLSearchParams(queryString);
      const code = params.get('code');
      const error = params.get('error');

      setRedirectStatus(`Code: ${code ? 'Received' : 'Missing'}, Error: ${error || 'None'}`);

      if (error) {
        setRedirectStatus(`Error: ${error}`);
        Alert.alert('Authentication Failed', `Spotify error: ${error}`);
        return;
      }

      if (!code) {
        setRedirectStatus('Error: No authorization code');
        Alert.alert('Authentication Error', 'No authorization code received');
        return;
      }

      setRedirectStatus('Exchanging code for tokens...');
      console.log('✅ Authorization code received');
      exchangeCodeForToken(code);
      
    } catch (urlError) {
      setRedirectStatus('Error: Failed to parse URL');
      console.error('Error parsing URL:', urlError);
    }
  };

  const checkExistingAuth = async () => {
    try {
      setIsLoading(true);
      const accessToken = await AsyncStorage.getItem('spotify_access_token');
      const expiresAt = await AsyncStorage.getItem('spotify_expires_at');
      
      if (accessToken && expiresAt && Date.now() < parseInt(expiresAt)) {
        console.log('🔍 Found stored token');
        const isValid = await verifyAuthentication(accessToken);
        if (!isValid) {
          await clearStoredTokens();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testOAuth = async () => {
    try {
      setIsLoading(true);
      console.log('🚀 Starting OAuth...');

      const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${spotifyConfig.clientId}&redirect_uri=${encodeURIComponent(spotifyConfig.redirectUrl)}&scope=${encodeURIComponent(spotifyConfig.scopes.join(' '))}&show_dialog=true`;

      console.log('Auth URL:', authUrl);

      const canOpen = await Linking.canOpenURL(authUrl);
      if (!canOpen) {
        throw new Error('Cannot open Spotify URL');
      }

      await Linking.openURL(authUrl);
      console.log('✅ Opened Spotify login');
      setRedirectStatus('Check Safari - complete login and click "Open" when prompted');
      Alert.alert('Check Safari', 'Complete login in Safari. When you see "Open in BeatPulse?", tap it.');

    } catch (error) {
      console.error('OAuth failed:', error);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    console.log('🔧 Setting up URL listeners...');
    
    const handleUrl = (event) => {
      console.log('📱 URL received via event:', event.url);
      setReceivedUrl(event.url);
      
      if (event.url && event.url.includes('beatpulse://callback')) {
        processOAuthRedirect(event.url);
      }
    };

    const handleAppStateChange = (nextAppState) => {
      console.log('📱 App state changed to:', nextAppState);
      
      if (nextAppState === 'active') {
        Linking.getInitialURL().then(url => {
          if (url && url.includes('beatpulse://callback')) {
            console.log('🔗 URL found on app resume:', url);
            processOAuthRedirect(url);
          }
        });
      }
    };

    const linkingSubscription = Linking.addEventListener('url', handleUrl);
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    Linking.getInitialURL().then(url => {
      if (url) {
        console.log('🔗 Initial URL on app start:', url);
        setReceivedUrl(url);
        if (url.includes('beatpulse://callback')) {
          processOAuthRedirect(url);
        }
      }
    });

    return () => {
      linkingSubscription.remove();
      appStateSubscription.remove();
    };
  }, []);

  const exchangeCodeForToken = async (authorizationCode) => {
    try {
      setIsLoading(true);
      setRedirectStatus('Exchanging code for tokens...');
      console.log('Sending code to server...');

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
      setRedirectStatus('Token exchange successful! Storing tokens...');
      await storeTokens(data);
      await verifyAuthentication(data.access_token);
      
    } catch (error) {
      console.error('Token exchange failed:', error);
      setRedirectStatus('Error: ' + error.message);
      Alert.alert('Authentication Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const storeTokens = async (tokenData) => {
    try {
      await AsyncStorage.setItem('spotify_access_token', tokenData.access_token);
      if (tokenData.refresh_token) {
        await AsyncStorage.setItem('spotify_refresh_token', tokenData.refresh_token);
      }
      const expiresIn = tokenData.expires_in || 3600;
      const expiresAt = Date.now() + (expiresIn * 1000);
      await AsyncStorage.setItem('spotify_expires_at', expiresAt.toString());
      console.log('✅ Tokens stored');
      setRedirectStatus('Tokens stored successfully!');
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw error;
    }
  };

  const verifyAuthentication = async (accessToken) => {
    try {
      setRedirectStatus('Verifying authentication...');
      console.log('🔍 Verifying authentication...');
      
      const response = await fetch('https://api.spotify.com/v1/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status}`);
      }

      const userData = await response.json();
      console.log('✅ Authentication verified');
      setRedirectStatus('Authentication successful!');
      
      setIsAuthenticated(true);
      setUser(userData);
      Alert.alert('Success!', `Welcome ${userData.display_name || userData.id}!`);
      
      return true;
      
    } catch (error) {
      console.error('Verification failed:', error);
      setRedirectStatus('Verification failed: ' + error.message);
      await clearStoredTokens();
      return false;
    }
  };

  const clearStoredTokens = async () => {
    try {
      await AsyncStorage.removeItem('spotify_access_token');
      await AsyncStorage.removeItem('spotify_refresh_token');
      await AsyncStorage.removeItem('spotify_expires_at');
      setIsAuthenticated(false);
      setUser(null);
      console.log('✅ Cleared tokens');
      setRedirectStatus('Logged out - tokens cleared');
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  };

  const testDeepLink = async () => {
    try {
      const canOpen = await Linking.canOpenURL('beatpulse://test');
      Alert.alert(canOpen ? '✅ Works!' : '❌ Broken', 
        `Deep links ${canOpen ? 'work' : 'do not work'}`);
    } catch (error) {
      console.error('Deep link test failed:', error);
    }
  };

  const testManualDeepLink = async () => {
    try {
      const testUrl = 'beatpulse://callback?code=test_manual_123&state=test';
      console.log('Testing manual deep link:', testUrl);
      
      const canOpen = await Linking.canOpenURL(testUrl);
      if (canOpen) {
        await Linking.openURL(testUrl);
        Alert.alert('Testing...', 'This should open your app with a test code');
      } else {
        Alert.alert('Error', 'Your app cannot handle beatpulse:// URLs');
      }
    } catch (error) {
      console.error('Manual test failed:', error);
    }
  };

  const checkCurrentUrl = async () => {
    try {
      const url = await Linking.getInitialURL();
      Alert.alert('Current URL', url || 'No URL received');
      console.log('Current URL:', url);
    } catch (error) {
      console.error('URL check failed:', error);
    }
  };
  const debugUrlReception = async () => {
    try {
      console.log('🔍 Debugging URL reception...');
      
      // Check all possible ways URLs can be received
      const initialUrl = await Linking.getInitialURL();
      console.log('Initial URL:', initialUrl);
      
      // Also check if we have any stored URLs
      console.log('Received URL state:', receivedUrl);
      console.log('Redirect status:', redirectStatus);
      
      Alert.alert(
        'URL Debug Info',
        `Initial URL: ${initialUrl || 'None'}\n\n` +
        `Received URL: ${receivedUrl || 'None'}\n\n` +
        `Status: ${redirectStatus}`
      );
      
    } catch (error) {
      console.error('Debug failed:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
        <Text style={styles.subtitle}>{redirectStatus}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spotify OAuth Test</Text>
      
      {isAuthenticated ? (
        <View style={styles.authenticatedContainer}>
          <Text style={styles.successText}>✅ Authenticated!</Text>
          <Text style={styles.userInfo}>User: {user?.display_name || user?.id}</Text>
          <Text style={styles.userInfo}>Email: {user?.email || 'Not provided'}</Text>
          
          <TouchableOpacity style={styles.logoutButton} onPress={clearStoredTokens}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.unauthenticatedContainer}>
          <Text style={styles.subtitle}>Login with Spotify</Text>
          <Text style={styles.redirectUri}>Redirect: {spotifyConfig.redirectUrl}</Text>
          
          <TouchableOpacity style={styles.button} onPress={testOAuth}>
            <Text style={styles.buttonText}>Login with Spotify</Text>
          </TouchableOpacity>

          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={styles.statusText}>{redirectStatus}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.button, {backgroundColor: '#FF6B35'}]} 
            onPress={debugUrlReception}
          >
            <Text style={styles.buttonText}>Debug URL Reception</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, {backgroundColor: '#8B4513'}]} onPress={testDeepLink}>
            <Text style={styles.buttonText}>Test Deep Links</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, {backgroundColor: '#6A0DAD'}]} onPress={testManualDeepLink}>
            <Text style={styles.buttonText}>Test Manual Deep Link</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, {backgroundColor: '#FF6B35'}]} onPress={checkCurrentUrl}>
            <Text style={styles.buttonText}>Check Current URL</Text>
          </TouchableOpacity>

          {receivedUrl && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugLabel}>Last URL Received:</Text>
              <Text style={styles.debugText}>{receivedUrl}</Text>
            </View>
          )}
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
    marginBottom: 10,
    width: '100%',
  },
  logoutButton: {
    backgroundColor: '#DC3545',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 10,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
  },
  statusLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  statusText: {
    color: '#666',
    fontSize: 14,
  },
  authenticatedContainer: {
    alignItems: 'center',
    width: '100%',
  },
  unauthenticatedContainer: {
    alignItems: 'center',
    width: '100%',
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1DB954',
    marginBottom: 20,
  },
  userInfo: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  debugContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    width: '100%',
  },
  debugLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
  },
});

export default OAuthTest;