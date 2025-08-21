import { authorize } from 'react-native-app-auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SpotifyAuthService {
    constructor() {
        this.serverUrl = __DEV__
            ? 'http://localhost:3000'
            : 'https://your-server.com';

        this.userId = this.generateUserId();

        this.spotifyConfig = {
            issuer: 'https://accounts.spotify.com',
            clientId: 'a32ad6490feb49fe8f542a596e47a983',
            redirectUrl: 'beatpulse://callback',
            scopes: [
                'user-read-playback-state',
                'user-modify-playback-state',
                'streaming'
            ],
            authorizationEndpoint: 'https://accounts.spotify.com/authorize',
            tokenEndpoint: 'https://aacounts.spotify.com/api/token',
            additionalParameters: {},
            customHeaders: {}
        };
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    async authenticateSpotify() {
        try {
            console.log('🚀 Starting Spotify OAuth flow....');

            const oauthResult = await this.startOAuthFlow();

            await this.exchangeCodeForToken(oauthResult.authorizationCode);

            await this.saveAuthenticationState(true);

            console.log('✅ Successfully authenticated with Spotify');

            return { success: true };
        } catch (error) {
            console.error('❌ Spotify authentication failed:', error.message);
            throw new Error('Spotify authentication failed: ' + error.message);
        }
    }

    async startOAuthFlow() {
        try {
            console.log('🚀 Opening Spotify login browser...');

            const result = await authorize(this.spotifyConfig);

            console.log('User approved! Get authorization code');

            return result;
        } catch (error) {
            if (error.message.includes('User cancelled')) {
                throw new Error('User cancelled the login process');
            }
            throw new Error('Failed to authenticate with Spotify: ' + error.message);
        }
    }

    async exchangeCodeForToken(authorizationCode) {
        try {
            console.log('Sending authorization code to server...');

            const response = await fetch(`${this.serverUrl}/spotify/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    authCode: authorizationCode,
                    userId: this.userId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error('Server error:' + errorData.error);
            }

            const data = await response.json();
            console.log('Successfully stored tokens');

            return data;
        } catch (error) {
            if (error.message.includes('Network request failed')) {
                throw new Error('Network error: Please check your internet connection');
            }
            throw error;
        }
    }

    async saveAuthenticationState(isAAuthenticated) {
        try {
            await AsyncStorage.setItem('spotify_authenticated', isAAuthenticated.toString());
            await AsyncStorage.setItem('spotify_user_id', this.userId);
            console.log('Saved authentication state locally');
        } catch (error) {
            console.error(' Failed to save auth state:', error);
        }
    }

    async isAAuthenticated() {
        try {
            const authState = await AsyncStorage.getItem('spotify_authenticated');
            return authState == 'true';
        } catch (error) {
            console.error('Error checking auth state:', error);
            return false;
        }
    }

    async getUserId() {
        try {
            const storedUserId = await AsyncStorage.getItem('spotify_user_id');
            return storedUserId || this.userId;
        } catch (error) {
            console.error('Error getting user ID:', error);
            return this.userId;
        }
    }

    async getAccessToken() {
        try {
            const userId = await this.getUserId();

            const response = await fetch(`${this.serverUrl}/spotify/token/${userId}`);

            if (!response.ok) {
                const errorData = await response.json();

                if (errorData.needsRefresh) {
                    throw new Error('Token expired, need to refresh');
                }

                throw new Error('Failed to get token:' + errorData.error);
            }

            const data = await response.json();
            return data.accessToken;
        } catch (error) {
            console.error('Error getting access token:', error);
            throw error;
        }
    }

    async testAuthentication() {
        try {
            const userId = await this.getUserId();
        
            const response = await fetch(`${this.serverUrl}/test/spotify/${userId}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Test failed: ${errorData.error}`);
            }
            
            const data = await response.json();
            console.log('🎵 Test successful! User profile:', data.profile.display_name);
            
            return data.profile;
        
        } catch (error) {
            console.error('Authentication test failed:', error);
            throw error;
        }
    }

    async logout() {
        try {
            await AsyncStorage.removeItem('spotify_authenticated');
            await AsyncStorage.removeItem('spotify_user_id');
            console.log('👋 Logged out from Spotify');
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }
}
export default new SpotifyAuthService();