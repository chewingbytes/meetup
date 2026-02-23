import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, Text, StyleSheet } from 'react-native';

export function NeoLoader() {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1200, // Slower rotation for brutalist feel
        easing: Easing.out(Easing.exp), // Snappy rotation
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.box,
          { transform: [{ rotate: spin }] },
        ]}
      >
        <View style={styles.innerBox} />
      </Animated.View>
      <Text style={styles.label}>LOADING...</Text>
    </View>
  );
}

export function NeoButtonLoader({ color = '#000' }: { color?: string }) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear, 
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.buttonBox,
        { 
          transform: [{ rotate: spin }],
          borderColor: color 
        },
      ]}
    >
      <View style={[styles.buttonInnerBox, { backgroundColor: color }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: 20,
  },
  box: {
    width: 48,
    height: 48,
    backgroundColor: '#FFD93D', // Neo-yellow
    borderWidth: 4,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0, // No soft elevation
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerBox: {
    width: 20,
    height: 20,
    backgroundColor: '#FF6B6B', // Neo-red
    borderWidth: 2,
    borderColor: '#000',
  },
  label: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  buttonBox: {
    width: 24,
    height: 24,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInnerBox: {
    width: 8,
    height: 8,
  },
});
