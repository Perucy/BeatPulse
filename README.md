# 🎵 BeatPulse AI

**Biometric-driven music adaptation powered by AI coaching**

BeatPulse AI is a React Native prototype that dynamically adapts your music to your real-time biometric data. By integrating WHOOP wearable data with Spotify/Apple Music, the app creates personalized workout experiences with AI-powered audio coaching cues.

![Status](https://img.shields.io/badge/status-prototype-yellow)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 **What It Does**

- **Real-time Music Adaptation**: Automatically adjusts music BPM based on your heart rate
- **Biometric Integration**: Pulls live data from WHOOP wearables during workouts
- **Smart Playlists**: Selects tracks from Spotify/Apple Music that match your workout intensity
- **AI Coaching**: Provides personalized audio cues to optimize your training
- **Seamless Experience**: Works across iOS and Android with secure OAuth authentication

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  React Native   │    │   Node.js API   │    │  External APIs  │
│      App        │◄──►│     Server      │◄──►│ Spotify, WHOOP  │
│                 │    │                 │    │  Apple Music    │
│  • OAuth Flow   │    │  • Token Mgmt   │    │                 │
│  • UI/UX        │    │  • API Proxy    │    │                 │
│  • Audio Player │    │  • BPM Mapping  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Tech Stack**
- **Frontend**: React Native, react-native-app-auth
- **Backend**: Node.js, Express, axios
- **Authentication**: OAuth 2.0 with PKCE
- **Storage**: Secure token management
- **APIs**: Spotify Web API, WHOOP API, Apple Music API

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 16+ and npm
- React Native CLI
- iOS Simulator (Mac) or Android Studio
- Spotify Developer Account
- WHOOP Developer Account (pending approval)

### **1. Clone the Repository**
```bash
git clone https://github.com/yourusername/beatpulse-ai.git
cd beatpulse-ai
```

### **2. Backend Setup**
```bash
# Install server dependencies
cd server
npm install

# Create environment file
cp .env.example .env
# Edit .env with your API credentials

# Start the server
npm start
```

### **3. Mobile App Setup**
```bash
# Install app dependencies
cd ..
npm install

# iOS setup (Mac only)
cd ios && pod install && cd ..

# Run the app
npx react-native run-ios
# or
npx react-native run-android
```

### **4. Configure API Credentials**

#### **Spotify Setup**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Set redirect URI to: `beatpulse://callback`
4. Copy Client ID and Secret to `.env`

#### **WHOOP Setup**
1. Apply for developer access at [WHOOP Developer Portal](https://developer.whoop.com)
2. Once approved, configure credentials in `.env`

## 🔧 **Configuration**

### **Environment Variables** (`server/.env`)
```env
# Spotify API
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# WHOOP API
WHOOP_CLIENT_ID=your_whoop_client_id
WHOOP_CLIENT_SECRET=your_whoop_client_secret

# Server
PORT=3000
```

### **URL Scheme Configuration**

The app uses custom URL schemes for OAuth redirects:

**iOS** (`ios/BeatPulseAI/Info.plist`):
```xml
<key>CFBundleURLSchemes</key>
<array>
    <string>beatpulse</string>
</array>
```

**Android** (`android/app/src/main/AndroidManifest.xml`):
```xml
<data android:scheme="beatpulse" />
```

## 🎮 **How It Works**

### **OAuth Flow**
1. User taps "Connect Spotify" in app
2. Redirected to Spotify login (secure browser)
3. User approves permissions
4. App receives authorization code
5. Backend exchanges code for access token
6. Token stored securely for API calls

### **Biometric Music Adaptation**
```javascript
// Simplified logic
const heartRate = await whoop.getCurrentHeartRate();
const targetBPM = mapHeartRateToBPM(heartRate);
const tracks = await spotify.searchByBPM(targetBPM);
await spotify.playTrack(tracks[0]);
```

### **Heart Rate → BPM Mapping**
- **< 100 bpm**: Warm-up tracks (90-110 BPM)
- **100-120 bpm**: Moderate intensity (110-130 BPM)  
- **> 120 bpm**: High intensity (130+ BPM)

## 📁 **Project Structure**

```
beatpulse-ai/
├── server/                 # Node.js backend
│   ├── index.js           # Main server file
│   ├── package.json       # Dependencies
│   └── .env              # API credentials
├── src/                   # React Native source
│   ├── screens/          # App screens
│   ├── services/         # API services
│   └── components/       # Reusable components
├── ios/                  # iOS configuration
├── android/              # Android configuration
└── package.json         # React Native dependencies
```

## 🔌 **API Endpoints**

### **Authentication**
- `POST /spotify/token` - Exchange OAuth code for access token
- `GET /spotify/token/:userId` - Retrieve stored access token

### **Testing**
- `GET /health` - Server health check
- `GET /test/spotify/:userId` - Test Spotify API integration

## 🧪 **Testing**

### **Server Testing**
```bash
# Test server health
curl http://localhost:3000/health

# Test OAuth endpoint (after mobile auth)
curl -X POST http://localhost:3000/spotify/token \
  -H "Content-Type: application/json" \
  -d '{"authCode":"...", "userId":"test-user"}'
```

### **Mobile Testing**
- Use React Native debugger for network requests
- Test OAuth flow with actual Spotify account
- Verify URL scheme handling on device

## 🛡️ **Security Features**

- **OAuth 2.0 with PKCE**: Industry-standard secure authentication
- **No passwords stored**: Users authenticate directly with Spotify/WHOOP
- **Token expiration**: Automatic refresh of expired tokens
- **Secure storage**: Sensitive data encrypted on device
- **Server-side secrets**: Client secrets never exposed to mobile app

## 📱 **Current Features**

✅ **Implemented**
- OAuth authentication for Spotify
- Secure token management
- Basic server infrastructure
- Mobile app foundation

🚧 **In Development**
- WHOOP integration
- Real-time heart rate monitoring
- Music BPM matching algorithm
- AI coaching audio generation

📋 **Planned**
- Apple Music integration
- Advanced AI coaching
- Team workout synchronization
- Spatial audio features

## 🚨 **Known Issues**

- **WHOOP API access**: Requires developer approval (may take weeks)
- **iOS simulator**: OAuth testing requires physical device
- **Token storage**: Currently in-memory (use database for production)

## 🤝 **Contributing**

This is a learning prototype, but contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📚 **Learning Resources**

- [OAuth 2.0 Guide](https://oauth.net/2/)
- [React Native Documentation](https://reactnative.dev/)
- [Spotify Web API Reference](https://developer.spotify.com/documentation/web-api/)
- [WHOOP API Documentation](https://developer.whoop.com/)

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

## 🎯 **Roadmap**

### **Phase 1: Core Integration** (Current)
- [x] Basic OAuth implementation
- [x] Server infrastructure
- [ ] WHOOP API integration
- [ ] Music BPM matching

### **Phase 2: AI Features**
- [ ] Audio coaching generation
- [ ] Personalized workout recommendations
- [ ] Advanced biometric analysis

### **Phase 3: Enhanced Experience**
- [ ] Apple Music integration
- [ ] Team features
- [ ] Spatial audio
- [ ] Production deployment

## 🆘 **Support**

Having issues? Check out:
- [Troubleshooting Guide](docs/troubleshooting.md)
- [OAuth Setup Guide](docs/oauth-setup.md)
- [API Integration Examples](docs/api-examples.md)

---

**Built with ❤️ for fitness enthusiasts who love data-driven music experiences**

*Note: This is a prototype for learning and experimentation. Not intended for production use without additional security and scalability considerations.*