import React, { useEffect, useState } from 'react';
import { View, Button, Linking, Text, StyleSheet } from 'react-native';
import axios from 'axios';
import { WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET, WHOOP_CALLBACK_URL, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI } from '@env';

const AUTH_URLS = {
    whoop: `https://api.prod.whoop.com/oauth/oauth2/auth?response_type=code&client_id=${WHOOP_CLIENT_ID}&redirect_uri=${WHOOP_CALLBACK_URL}&scope=read:workout read:profile`,
    spotify: `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${SPOTIFY_REDIRECT_URI}&scope=user-read-recently-played user-top-read`,
};

export default function App() {
    const [token, setToken] = useState(null);

    useEffect(() => {
        const handleDeepLink = (event) => {
            const url = event.url;
            if (url.includes('code=')) {
                const code = url.split('code=')[1].split('&')[0];
                const provider = url.includes('whoop') ? 'whoop' : 'spotify';
                exchangeCodeForToken(code, provider);
            }
        };
        const subscription = Linking.addEventListener('url', handleDeepLink);
        return () => {
            subscription.remove();
        };
    }, []);

    const exchangeCodeForToken = async (code, provider) => {
        try {
            const response = await axios.post(
                provider === 'whoop'
                    ? 'https://api.prod.whoop.com/oauth/oauth2/token'
                    : 'https://accounts.spotify.com/api/token',
                new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: provider === 'whoop' ? WHOOP_CALLBACK_URL : SPOTIFY_REDIRECT_URI,
                    client_id: provider === 'whoop' ? WHOOP_CLIENT_ID : SPOTIFY_CLIENT_ID,
                    client_secret: provider === 'whoop' ? WHOOP_CLIENT_SECRET : SPOTIFY_CLIENT_SECRET,
                }).toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            setToken(response.data.access_token);
        } catch (error) {
            console.error('Error exchanging code for token:', error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>BeatPulse</Text>
            <Button
                title="Connect to Whoop"
                onPress={() => Linking.openURL(AUTH_URLS.whoop)}
            />
            <Button
                title="Connect to Spotify"
                onPress={() => Linking.openURL(AUTH_URLS.spotify)}
            />
            {token && <Text style={styles.token}>Token: {token.substring(0, 10)}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    token: {
        marginTop: 20,
        fontSize: 14,
        color: 'gray',
    },
});