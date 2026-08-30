import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WelcomeScreen from './screens/WelcomeScreen';
import AuthScreen from './screens/AuthScreen';
import BiometricsScreen from './screens/BiometricsScreen';
import DashboardScreen from './screens/DashboardScreen';
import NutritionScreen from './screens/NutritionScreen';
import InfoScreen from './screens/InfoScreen';
import FoodScanScreen from './screens/FoodScanScreen';
import ProfileScreen from './screens/ProfileScreen';
import LaunchScreen from './screens/LaunchScreen';
import GoalPlanScreen from './screens/GoalPlanScreen';
import ProgressScreen from './screens/ProgressScreen';

export default function App() {
  // Navigation state: 'welcome' | 'auth' | 'biometrics' | 'dashboard'
  const [currentScreen, setCurrentScreen] = useState('launch');
  const [screenData, setScreenData] = useState({});

  useEffect(() => {
    // Check if token exists on app launch
    const checkToken = async () => {
      let nextScreen = 'welcome';
      try {
        const token = await AsyncStorage.getItem('token');
        const userStr = await AsyncStorage.getItem('user');
        if (token && userStr) {
          const user = JSON.parse(userStr);
          setScreenData({ user });
          // If user already has biometrics calculated, go to dashboard, else biometrics
          nextScreen = user.dailyCalorieTarget || user.bmr ? 'dashboard' : 'biometrics';
        }
      } catch (e) {
        console.error('Failed to restore session:', e);
      } finally {
        // Keep the brand animation visible long enough to feel intentional.
        setTimeout(() => setCurrentScreen(nextScreen), 1600);
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
      case 'launch':
        return <LaunchScreen />;
      case 'welcome':
        return <WelcomeScreen onNavigate={handleNavigate} />;
      case 'auth':
        return <AuthScreen onNavigate={handleNavigate} />;
      case 'biometrics':
        return <BiometricsScreen onNavigate={handleNavigate} screenData={screenData} />;
      case 'dashboard':
        return <DashboardScreen onNavigate={handleNavigate} screenData={screenData} />;
      case 'nutrition':
        return <NutritionScreen onNavigate={handleNavigate} />;
      case 'food-scan':
        return <FoodScanScreen onNavigate={handleNavigate} />;
      case 'profile':
        return <ProfileScreen onNavigate={handleNavigate} screenData={screenData} />;
      case 'goal-plan':
        return <GoalPlanScreen onNavigate={handleNavigate} screenData={screenData} />;
      case 'workout':
        return <InfoScreen title="Workout" message="Plan your next session and record it here." onNavigate={handleNavigate} />;
      case 'progress':
        return <ProgressScreen onNavigate={handleNavigate} />;
      default:
        return <WelcomeScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0 }]}>
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
