import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

const DashboardScreen = ({ onNavigate, screenData }) => {
  const user = screenData?.user || {};
  const biometrics = screenData?.biometrics || {};

  // Component States
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState(
    user?.name || user?.email?.split('@')[0] || 'User'
  );
  const [dailyCalorieTarget, setDailyCalorieTarget] = useState(
    biometrics?.dailyCalorieTarget || user?.dailyCalorieTarget || 2100
  );
  const [waterIntake, setWaterIntake] = useState(1.8);
  const [waterTarget] = useState(3.0);
  const [steps, setSteps] = useState(7250);
  const [stepsTarget] = useState(10000);
  const [selectedMood, setSelectedMood] = useState('😊');
  const [loggedCalories, setLoggedCalories] = useState(1350);
  const [bmr] = useState(biometrics?.bmr || user?.bmr || 1650);
  const [tdee] = useState(biometrics?.tdee || user?.tdee || 2300);
  const [activeTab, setActiveTab] = useState('Home');

  const moodsList = [
    { emoji: '😊', label: 'Good' },
    { emoji: '😐', label: 'Okay' },
    { emoji: '😔', label: 'Low' },
    { emoji: '🤩', label: 'Great' },
  ];

  const navItems = [
    { id: 'Home', label: 'Home', icon: 'home' },
    { id: 'Workout', label: 'Workout', icon: 'barbell' },
    { id: 'Nutrition', label: 'Nutrition', icon: 'restaurant' },
    { id: 'Progress', label: 'Progress', icon: 'stats-chart' },
    { id: 'Profile', label: 'Profile', icon: 'person' },
  ];

  const firstName = userName.charAt(0).toUpperCase() + userName.slice(1);

  // 1. Mount hook to fetch GET /api/dashboard/today with JWT token
  const fetchTodayDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/today');
      const data = res.data;

      if (data) {
        if (data.user) {
          if (data.user.name) setUserName(data.user.name);
          if (data.user.dailyCalorieTarget) setDailyCalorieTarget(data.user.dailyCalorieTarget);
        }

        if (data.dailyLog) {
          if (typeof data.dailyLog.waterIntake === 'number') {
            setWaterIntake(data.dailyLog.waterIntake);
          }
          if (typeof data.dailyLog.steps === 'number' && data.dailyLog.steps > 0) {
            setSteps(data.dailyLog.steps);
          }
          if (data.dailyLog.mood) {
            setSelectedMood(data.dailyLog.mood);
          }
        }

        if (data.nutrition && typeof data.nutrition.caloriesConsumed === 'number') {
          if (data.nutrition.caloriesConsumed > 0) {
            setLoggedCalories(data.nutrition.caloriesConsumed);
          }
        }
      }
    } catch (error) {
      console.log('GET /dashboard/today fallback to local cache:', error.message);
      // Fallback to AsyncStorage if network fails
      try {
        const savedWater = await AsyncStorage.getItem('@water_today');
        const savedMood = await AsyncStorage.getItem('@mood_today');
        if (savedWater !== null) setWaterIntake(parseFloat(savedWater) || 1.8);
        if (savedMood) setSelectedMood(savedMood);
      } catch (e) {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayDashboard();
  }, []);

  // Water card addition handler (+0.25 L)
  const handleWaterAdd = async () => {
    const amountToAdd = 0.25;
    const nextLocalWater = parseFloat((waterIntake + amountToAdd).toFixed(2));
    
    // Optimistic UI update
    setWaterIntake(nextLocalWater);

    try {
      const res = await api.post('/dashboard/water', { amount: amountToAdd });
      if (res.data && typeof res.data.waterIntake === 'number') {
        setWaterIntake(res.data.waterIntake);
      }
      await AsyncStorage.setItem('@water_today', nextLocalWater.toString());
    } catch (error) {
      console.error('POST /dashboard/water error:', error.message);
      await AsyncStorage.setItem('@water_today', nextLocalWater.toString());
    }
  };

  // Water card subtraction handler (-0.25 L)
  const handleWaterSubtract = async () => {
    const amountToSub = -0.25;
    const nextLocalWater = Math.max(0, parseFloat((waterIntake + amountToSub).toFixed(2)));
    
    // Optimistic UI update
    setWaterIntake(nextLocalWater);

    try {
      const res = await api.post('/dashboard/water', { amount: amountToSub });
      if (res.data && typeof res.data.waterIntake === 'number') {
        setWaterIntake(res.data.waterIntake);
      }
      await AsyncStorage.setItem('@water_today', nextLocalWater.toString());
    } catch (error) {
      console.error('POST /dashboard/water subtract error:', error.message);
      await AsyncStorage.setItem('@water_today', nextLocalWater.toString());
    }
  };

  // Mood selection handler -> POST /api/dashboard/mood
  const handleMoodSelect = async (emoji) => {
    // Optimistic UI update
    setSelectedMood(emoji);

    try {
      await api.post('/dashboard/mood', { mood: emoji });
      await AsyncStorage.setItem('@mood_today', emoji);
    } catch (error) {
      console.error('POST /dashboard/mood error:', error.message);
      await AsyncStorage.setItem('@mood_today', emoji);
    }
  };

  // Bottom Navigation Handler
  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
    if (onNavigate && typeof onNavigate === 'function') {
      if (tabId === 'Profile') {
        onNavigate('biometrics');
      } else {
        onNavigate(tabId.toLowerCase());
      }
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    } catch (e) {
      console.error('Logout error:', e);
    }
    onNavigate('welcome');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Good Morning, {firstName}! 👋</Text>
            <Text style={styles.bannerSubtitle}>Let's make today amazing!</Text>
          </View>
          <TouchableOpacity style={styles.bannerLogoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* 2. Daily Progress Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Daily Progress</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={fetchTodayDashboard}>
            {loading ? (
              <ActivityIndicator size="small" color="#10b981" />
            ) : (
              <Text style={styles.viewAllText}>Refresh ↻</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.progressRingRow}>
          {/* Steps Ring */}
          <View style={styles.progressRingCard}>
            <View style={[styles.ringOuter, { borderColor: '#10b981' }]}>
              <View style={styles.ringInner}>
                <Ionicons name="footsteps" size={20} color="#10b981" />
              </View>
            </View>
            <Text style={styles.ringValue}>{steps.toLocaleString()}</Text>
            <Text style={styles.ringTarget}>/ {stepsTarget.toLocaleString()}</Text>
            <Text style={styles.ringLabel}>Steps</Text>
          </View>

          {/* Water Ring (Interactive POST /water + and -) */}
          <View style={[styles.progressRingCard, styles.interactiveCard]}>
            <View style={[styles.ringOuter, { borderColor: '#38bdf8' }]}>
              <View style={styles.ringInner}>
                <Ionicons name="water" size={20} color="#38bdf8" />
              </View>
            </View>
            <Text style={styles.ringValue}>{waterIntake.toFixed(1)} L</Text>
            <Text style={styles.ringTarget}>/ {waterTarget} L</Text>

            {/* Quick Action Controls (- / +) */}
            <View style={styles.waterControlsRow}>
              <TouchableOpacity
                style={styles.waterControlBtn}
                onPress={handleWaterSubtract}
                activeOpacity={0.7}
              >
                <Text style={styles.waterControlBtnText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.waterControlBtn}
                onPress={handleWaterAdd}
                activeOpacity={0.7}
              >
                <Text style={styles.waterControlBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Calories Ring */}
          <View style={styles.progressRingCard}>
            <View style={[styles.ringOuter, { borderColor: '#f59e0b' }]}>
              <View style={styles.ringInner}>
                <Ionicons name="flame" size={20} color="#f59e0b" />
              </View>
            </View>
            <Text style={styles.ringValue}>{loggedCalories}</Text>
            <Text style={styles.ringTarget}>/ {dailyCalorieTarget}</Text>
            <Text style={styles.ringLabel}>Calories</Text>
          </View>
        </View>

        {/* 3. Summary Cards */}
        {/* Today's Workout Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCardHeader}>
            <View style={[styles.badgeIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Text style={styles.badgeEmoji}>🏋️</Text>
            </View>
            <View style={styles.summaryTextContainer}>
              <Text style={styles.cardHeaderTitle}>Today's Workout</Text>
              <Text style={styles.cardMainTitle}>Upper Body Strength</Text>
              <Text style={styles.cardSubText}>45 min | Intermediate</Text>
            </View>
            <TouchableOpacity style={styles.cardActionButton} activeOpacity={0.8}>
              <Ionicons name="play" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Diet Plan Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCardHeader}>
            <View style={[styles.badgeIcon, { backgroundColor: 'rgba(56, 189, 248, 0.2)' }]}>
              <Text style={styles.badgeEmoji}>🥗</Text>
            </View>
            <View style={styles.summaryTextContainer}>
              <Text style={styles.cardHeaderTitle}>Today's Diet Plan</Text>
              <Text style={styles.cardMainTitle}>{loggedCalories} / {dailyCalorieTarget} kcal</Text>
              <Text style={styles.cardSubText}>Balanced Macro Distribution</Text>
            </View>
            <TouchableOpacity style={styles.cardActionButtonAlt} activeOpacity={0.8}>
              <Ionicons name="chevron-forward" size={18} color="#38bdf8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Mood Check-in Card (Interactive POST /mood) */}
        <View style={styles.summaryCard}>
          <Text style={styles.moodCardTitle}>Mood Check-in</Text>
          <Text style={styles.moodCardSub}>How are you feeling today?</Text>

          <View style={styles.moodEmojiRow}>
            {moodsList.map((m) => {
              const isSelected = selectedMood === m.emoji;
              return (
                <TouchableOpacity
                  key={m.emoji}
                  style={[styles.moodItem, isSelected && styles.moodItemSelected]}
                  onPress={() => handleMoodSelect(m.emoji)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, isSelected && styles.moodLabelSelected]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Biometrics Recalculate Settings Card */}
        <View style={styles.actionCard}>
          <View style={styles.actionCardRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Metabolic Settings</Text>
              <Text style={styles.actionSub}>BMR: {bmr} kcal | TDEE: {tdee} kcal</Text>
            </View>
            <TouchableOpacity
              style={styles.recalculateButton}
              onPress={() => onNavigate('biometrics')}
              activeOpacity={0.8}
            >
              <Text style={styles.recalculateButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 4. Bottom Tab Bar Navigation */}
      <View style={styles.bottomTabBar}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.tabItem}
              onPress={() => handleTabPress(item.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isActive ? item.icon : `${item.icon}-outline`}
                size={22}
                color={isActive ? '#10b981' : '#64748b'}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 90,
  },

  /* 1. Header Banner */
  headerBanner: {
    backgroundColor: '#10b981',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  bannerLogoutButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 10,
    borderRadius: 12,
    marginLeft: 12,
  },

  /* 2. Daily Progress Section */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  viewAllText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '700',
  },
  progressRingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  progressRingCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  interactiveCard: {
    borderColor: '#38bdf8',
  },
  ringOuter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  ringInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  ringTarget: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  waterControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  waterControlBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  waterControlBtnText: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '800',
    marginTop: -2,
  },

  /* 3. Summary Cards */
  summaryCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  badgeEmoji: {
    fontSize: 22,
  },
  summaryTextContainer: {
    flex: 1,
  },
  cardHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardMainTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  cardSubText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  cardActionButton: {
    backgroundColor: '#10b981',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardActionButtonAlt: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Mood Card */
  moodCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  moodCardSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 14,
  },
  moodEmojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodItem: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  moodItemSelected: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  moodEmoji: {
    fontSize: 22,
    marginBottom: 2,
  },
  moodLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  moodLabelSelected: {
    color: '#10b981',
    fontWeight: '700',
  },

  /* Action / Settings Card */
  actionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  actionCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  actionSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  recalculateButton: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  recalculateButtonText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '700',
  },

  /* 4. Bottom Tab Bar */
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 3,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#10b981',
    fontWeight: '700',
  },
});

export default DashboardScreen;
