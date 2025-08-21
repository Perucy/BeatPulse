import React from "react";
import { View, Text, TouchableOpacity,StyleSheet,ALert } from "react-native";
import { authorize } from "react-native-app-auth";

const OAuthTest = () => {
    const spotifyConfig = {
        issuer: 'https://accounts.spotify.com',
        clientId: 'a32ad6490feb49fe8f542a596e47a983',
        redirectUrl: 'beatpulse://callback',
        scopes: ['user-read-playback-state'],
        authorizationEndpoint: 'https://accounts.spotify.com/authorize',
        tokenEndpoint: 'https://accounts.spotify.com/api/token',
    };
    const testOAuth = async () => {
        try {
            console.log('Starting OAuth test....');
            const result = await authorize(spotifyConfig);
            console.log('OAuth success!')
            console.log('Authorization Code:', result.authorizationCode);
            console.log('Full result:',JSON.stringify(result, null, 2));

            Alert.alert(
                'OAuth Success! 🎉',
                `Got authorization code: ${result.authorizationCode.substring(0, 20)}...`,
                [{ text: 'Awesome!' }]
            );
        } 
        catch (error){
            console.error('OAuth test failed:', error);
            Alert.alert('Error', 'OAuth test failed: ' + error.message);
        }
    };
    return (
        <View style={styles.container}>
        <Text style={styles.title}>OAuth Test</Text>
        <Text style={styles.subtitle}>Test Spotify OAuth without the full app</Text>
        
        <TouchableOpacity style={styles.button} onPress={testOAuth}>
            <Text style={styles.buttonText}>Test Spotify OAuth</Text>
        </TouchableOpacity>
        
        <Text style={styles.instructions}>
            This will:{'\n'}
            1. Open Spotify login in browser{'\n'}
            2. Get authorization code{'\n'}
            3. Log the result{'\n'}
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
        marginBottom: 30,
        color: '#666',
        textAlign: 'center',
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
    },
});

export default OAuthTest;