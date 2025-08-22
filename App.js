// App.js
import React, { useEffect } from 'react';
import { Linking } from 'react-native';
import OAuthTest from './src/test/OAuthTest';

const App = () => {
  useEffect(() => {
    // Handle deep links when app is already open
    const subscription = Linking.addEventListener('url', handleOpenURL);
    
    // Handle deep links when app is launched from closed state
    Linking.getInitialURL().then(url => {
      if (url) {
        handleOpenURL({ url });
      }
    });

    return () => subscription.remove();
  }, []);

  const handleOpenURL = (event) => {
    const { url } = event;
    console.log('App opened with URL:', url);
    
    // The expo-auth-session will automatically handle this redirect
    if (url && url.includes('beatpulse://')) {
      console.log('OAuth redirect received');
    }
  };

  return <OAuthTest />;
};

export default App;