import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WelcomeScreen from './screens/WelcomeScreen';
import AuthScreen from './screens/AuthScreen';
import BiometricsScreen from './screens/BiometricsScreen';
import DashboardScreen from './screens/DashboardScreen';

export default function App() {
  // Navigation state: 'welcome' | 'auth' | 'biometrics' | 'dashboard'
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [screenData, setScreenData] = useState({});

  useEffect(() => {
    // Check if token exists on app launch
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userStr = await AsyncStorage.getItem('user');
        if (token && userStr) {
          const user = JSON.parse(userStr);
          setScreenData({ user });
          // If user already has biometrics calculated, go to dashboard, else biometrics
          if (user.dailyCalorieTarget || user.bmr) {
            setCurrentScreen('dashboard');
          } else {
            setCurrentScreen('biometrics');
          }
        }
      } catch (e) {
        console.error('Failed to restore session:', e);
      }
    };

    checkToken();
  }, []);

  const handleNavigate = (nextScreen, data = {}) => {
    setScreenData((prevData) => ({ ...prevData, ...data }));
    setCurrentScreen(nextScreen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onNavigate={handleNavigate} />;
      case 'auth':
        return <AuthScreen onNavigate={handleNavigate} />;
      case 'biometrics':
        return <BiometricsScreen onNavigate={handleNavigate} screenData={screenData} />;
      case 'dashboard':
        return <DashboardScreen onNavigate={handleNavigate} screenData={screenData} />;
      default:
        return <WelcomeScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
});
