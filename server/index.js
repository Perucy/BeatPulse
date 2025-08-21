const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'Server is running!' });
});

const userTokens = new Map();

app.post('/spotify/token', async (req, res) => {
    const { authCode, userId } = req.body;

    try {
        const tokenRequestData = {
            grant_type: 'authorization_code',
            code: authCode,
            redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
            client_id: process.env.SPOTIFY_CLIENT_ID,
            client_secret: process.env.SPOTIFY_CLIENT_SECRET,
        };

        console.log('🔄 Exchanging authorization code for access token.....');

        const response = await axios.post(
            'https://accounts.spotify.com/api/token',
            new URLSearchParams(tokenRequestData),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            }
        );

        console.log('✅ Successfully received tokens from Spotify')

        const { access_token, refresh_token, expires_in } = response.data;

        userTokens.set(userId, {
            spotify: {
                accessToken: access_token,
                refreshToken: refresh_token,
                expiresAt: Date.now() + (expires_in * 1000)
            }
        });

        res.json({
            success: true,
            message: 'Spotify connected successfully'
        })
    } catch (error) {
        console.error('❌ Token exchange failed:', error.response?.data);
        res.status(400).json({
            error: 'Failed to connect Spotify',
            details: error.response?.data
        });
    }
});

app.get('/spotify/token/:userId', (req, res) => {
    const { userId } = req.params;

    const userToken = userTokens.get(userId);

    if (!userToken?.spotify) {
        return res.status(404).json({
            error: 'No Spotify token found for this user'
        });
    }

    const { accessToken, expiresAt } = userToken.spotify;

    if (Date.now() >= expiresAt) {
        return res.status(401).json({
            error: 'Spotify access token has expired',
            needsRefresh: true
        });
    }

    res,json({
        accessToken,
        expiresAt
    });
});
app.get('/test/spotify/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const userToken = userTokens.get(userId);
        
        if (!userToken?.spotify) {
            return res.status(404).json({ 
                error: 'No Spotify token found' 
            });
        }
        
        // Make API call to Spotify using stored token
        const spotifyResponse = await axios.get('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${userToken.spotify.accessToken}`
            }
        });
        
        res.json({
            success: true,
            profile: spotifyResponse.data
        });
        
    } catch (error) {
        console.error('❌ Spotify API call failed:', error.response?.data);
        res.status(500).json({
            error: 'Failed to fetch Spotify profile',
            details: error.response?.data
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 Spotify endpoint: http://localhost:${PORT}/spotify/token`);
});
