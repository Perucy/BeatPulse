import React, { useEffect, useState } from 'react';
import { View, Button, Linking, Text, StyleSheet } from 'react-native';
import axios from 'axios';
require ('dotenv').config();

const AUTH_URLS = {
    whoop: `https://api.prod.whoop.com/oauth/oauth2/auth?response_type=code&client_id=` +
    `${process.env.WHOOP_CLIENT_ID}&redirect_uri=${process.env.WHOOP_CALLBACK_URL}&scope=['read:workout', 'read:profile']`,
    spotify: `https://accounts.spotify.com/authorize?client_id=${process.env.SPOTIFY_CLIENT_ID}` +
    `&response_type=code&redirect_uri=${process.env.SPOTIFY_REDIRECT_URI}&scope=["user-read-recently-played", "user-top-read"]`,
}

export default function App() {
    const [token, setToken] = useState(null);
}