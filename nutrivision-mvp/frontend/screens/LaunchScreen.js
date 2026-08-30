import React, { useEffect, useRef } from 'react';
import { Animated, StatusBar, StyleSheet, Text, View } from 'react-native';

export default function LaunchScreen() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.82)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 65, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 650, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale, translateY]);

  return <View style={styles.page}>
    <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
    <Animated.View style={[styles.content, { opacity, transform: [{ scale }, { translateY }] }]}>
      <View style={styles.mark}><Text style={styles.leaf}>✦</Text></View>
      <Text style={styles.title}>NutriVision</Text>
      <Text style={styles.tagline}>Fuel your healthier day</Text>
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center' },
  mark: { width: 92, height: 92, borderRadius: 28, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: '#10b981', shadowOpacity: 0.45, shadowRadius: 18, elevation: 8 },
  leaf: { color: '#ffffff', fontSize: 46, fontWeight: '700' },
  title: { color: '#ffffff', fontSize: 34, fontWeight: '800', letterSpacing: -0.8 },
  tagline: { color: '#94a3b8', fontSize: 14, marginTop: 8, fontWeight: '600' },
});
