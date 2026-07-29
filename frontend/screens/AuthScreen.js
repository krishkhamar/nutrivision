import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

const AuthScreen = ({ onNavigate }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fallback Google Sign-In Handler for Expo Go testing
  const handleGoogleSignIn = () => {
    Alert.alert(
      'Google Login',
      'Google Sign-In requires a custom native build. Please use Email/Password login while testing in Expo Go.'
    );
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/user/login' : '/user/signup';
      const response = await api.post(endpoint, {
        email: email.trim().toLowerCase(),
        password: password,
      });

      const { token, user } = response.data;

      if (token) {
        await AsyncStorage.setItem('token', token);
        if (user) {
          await AsyncStorage.setItem('user', JSON.stringify(user));
        }

        const hasBiometrics = Boolean(user && (user.dailyCalorieTarget || user.age));
        if (isLogin && hasBiometrics) {
          onNavigate('dashboard', { user });
        } else {
          onNavigate('biometrics', { user });
        }
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>NutriVision</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Welcome back! Log in to your account.' : 'Create a new account to get started.'}
          </Text>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, isLogin && styles.activeTab]}
              onPress={() => { setIsLogin(true); setErrorMessage(''); }}
            >
              <Text style={[styles.tabText, isLogin && styles.activeTabText]}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, !isLogin && styles.activeTab]}
              onPress={() => { setIsLogin(false); setErrorMessage(''); }}
            >
              <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formCard}>
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password Input with Show/Hide Toggle */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor="#64748b"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>{isLogin ? 'Log In' : 'Create Account'}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Fallback Google Sign-In Button */}
            <TouchableOpacity
              style={styles.googleButton}
              disabled={loading}
              onPress={handleGoogleSignIn}
              activeOpacity={0.8}
            >
              <Text style={styles.googleIcon}>🌐</Text>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => onNavigate('welcome')}
          >
            <Text style={styles.backButtonText}>← Back to Welcome</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  keyboardView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: '#ffffff', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 6, marginBottom: 28 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 4,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  activeTab: { backgroundColor: '#10b981' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#94a3b8' },
  activeTabText: { color: '#ffffff', fontWeight: '700' },
  formCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#f87171', fontSize: 13, textAlign: 'center' },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#cbd5e1', marginBottom: 6 },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#f8fafc',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#f8fafc',
    fontSize: 15,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#334155' },
  dividerText: { color: '#64748b', fontSize: 12, fontWeight: '700', marginHorizontal: 12 },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  googleIcon: { fontSize: 18, marginRight: 10 },
  googleButtonText: { color: '#38bdf8', fontSize: 15, fontWeight: '700' },
  backButton: { marginTop: 24, padding: 10 },
  backButtonText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
});

export default AuthScreen;