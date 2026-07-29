import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';

const WelcomeScreen = ({ onNavigate }) => {
  const featureBullets = [
    {
      icon: '📸',
      title: 'AI Food & Meal Scanning',
      description: 'Instantly log meals and extract accurate calorie and macro data from photos.',
    },
    {
      icon: '📊',
      title: 'Precision Biometrics Engine',
      description: 'Calculate your exact BMR and TDEE using validated Mifflin-St Jeor formulas.',
    },
    {
      icon: '🎯',
      title: 'Personalized Pathway Goals',
      description: 'Choose tailored pathways for Calorie Deficit, Cardio Focus, or Gym Strength Training.',
    },
    {
      icon: '📈',
      title: 'Real-Time Health Ecosystem',
      description: 'Continuous monitoring of your caloric balance and weight progression.',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Badge */}
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>✨ NEXT-GEN HEALTH ENGINE</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>NutriVision</Text>
        <Text style={styles.subtitle}>AI Health Ecosystem</Text>

        <Text style={styles.description}>
          Empower your health journey with real-time computer vision, intelligent metabolic tracking, and custom nutrition pathways.
        </Text>

        {/* Feature Cards / Bullet Points */}
        <View style={styles.featuresList}>
          {featureBullets.map((item, index) => (
            <View key={index} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{item.icon}</Text>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureDescription}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={() => onNavigate('auth')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <Text style={styles.buttonArrow}> →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  badgeContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#10b981',
    marginBottom: 16,
  },
  badgeText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#38bdf8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  featuresList: {
    width: '100%',
    marginBottom: 36,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  button: {
    width: '100%',
    backgroundColor: '#10b981',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonArrow: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
});

export default WelcomeScreen;
