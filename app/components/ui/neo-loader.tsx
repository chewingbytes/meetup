import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, Text, StyleSheet, Image } from 'react-native';

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
          styles.logoContainer,
          { transform: [{ rotate: spin }] },
        ]}
      >
        <Image
          source={require('../../assets/images/transparentbackgroundlogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
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
  logoContainer: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 64,
    height: 64,
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
