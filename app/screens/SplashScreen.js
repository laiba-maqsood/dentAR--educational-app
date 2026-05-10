import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated,
  Easing, TouchableWithoutFeedback, StatusBar
} from 'react-native';
import Svg, { Path, Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export default function SplashScreen({ navigation }) {
  // Animations
  const rotate = useRef(new Animated.Value(0)).current;
  const toothScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const dotOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence: glow appears → tooth scales in → tooth rotates continuously → title fades in → tagline → loading dots
    Animated.parallel([
      // Glow ring fades in
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Tooth scales up with overshoot
      Animated.spring(toothScale, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Title fade-in (delayed)
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslate, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(dotOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto navigate to Login after 3 seconds
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Tap-to-skip
  function skip() {
    navigation.replace('Login');
  }

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableWithoutFeedback onPress={skip}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f6e56" />

        {/* Background decorative circles */}
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />
        <View style={styles.bgCircle3} />

        {/* Tooth + glow */}
        <View style={styles.toothWrap}>
          {/* Outer glow ring */}
          <Animated.View style={[styles.glowRing, { opacity: glowOpacity }]} />
          <Animated.View style={[styles.glowRing2, { opacity: glowOpacity }]} />

          {/* Animated tooth SVG */}
          <Animated.View
            style={{
              transform: [
                { scale: toothScale },
                { rotateY: rotation },
              ],
            }}>
            <Svg width={140} height={160} viewBox="0 0 140 160">
              <Defs>
                <RadialGradient id="toothGrad" cx="50%" cy="40%" r="60%">
                  <Stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <Stop offset="60%" stopColor="#f5f5f0" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#d4d4c8" stopOpacity="1" />
                </RadialGradient>
                <RadialGradient id="shineGrad" cx="35%" cy="30%" r="25%">
                  <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                  <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </RadialGradient>
              </Defs>

              {/* Tooth shape — crown + two roots */}
              <Path
                d="M 70 10
                   C 45 10, 25 25, 25 50
                   C 25 70, 30 85, 35 95
                   L 45 130
                   C 47 145, 55 150, 58 140
                   L 62 110
                   C 64 100, 76 100, 78 110
                   L 82 140
                   C 85 150, 93 145, 95 130
                   L 105 95
                   C 110 85, 115 70, 115 50
                   C 115 25, 95 10, 70 10
                   Z"
                fill="url(#toothGrad)"
                stroke="#0a4d3c"
                strokeWidth="2"
              />

              {/* Highlight shine on top-left */}
              <Path
                d="M 50 25
                   C 45 30, 42 40, 44 50
                   C 50 45, 55 35, 55 28
                   Z"
                fill="url(#shineGrad)"
              />

              {/* Subtle cusp lines on crown */}
              <Path
                d="M 55 35 Q 70 28 85 35"
                stroke="#c8c8b8"
                strokeWidth="1"
                fill="none"
                opacity="0.6"
              />
            </Svg>
          </Animated.View>
        </View>

        {/* App name */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslate }],
            alignItems: 'center',
          }}>
          <Text style={styles.appName}>
            Dent<Text style={styles.appNameAccent}>AR</Text>
          </Text>
          <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
            Learn dentistry in 3D
          </Animated.Text>
        </Animated.View>

        {/* Loading dots */}
        <Animated.View style={[styles.dotsRow, { opacity: dotOpacity }]}>
          <LoadingDot delay={0} />
          <LoadingDot delay={200} />
          <LoadingDot delay={400} />
        </Animated.View>

        {/* Skip hint */}
        <Animated.Text style={[styles.skipHint, { opacity: dotOpacity }]}>
          Tap anywhere to continue
        </Animated.Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

// Pulsing dot component
function LoadingDot({ delay }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[styles.dot, { opacity }]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f6e56',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -150,
    right: -80,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  bgCircle3: {
    position: 'absolute',
    top: '40%',
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  toothWrap: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  glowRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  glowRing2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  appName: {
    fontSize: 44,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  appNameAccent: {
    color: '#a7f3d0',
  },
  tagline: {
    fontSize: 15,
    color: '#d1fae5',
    marginTop: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop: 50,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  skipHint: {
    position: 'absolute',
    bottom: 40,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '500',
  },
});
