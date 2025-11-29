import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  PanResponder,
  LayoutChangeEvent,
  StyleSheet,
  Animated,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';

type Props = {
  style?: any;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  value?: number;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  onValueChange?: (v: number) => void;
  onSlidingComplete?: (v: number) => void;
};

export default function JsSlider({
  style,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  value = 0,
  minimumTrackTintColor = '#2196F3',
  maximumTrackTintColor = '#ddd',
  thumbTintColor = '#2196F3',
  onValueChange,
  onSlidingComplete,
}: Props) {
  const trackWidth = useRef(0);
  const [internalValue, setInternalValue] = useState(value);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setInternalValue(value);
    if (trackWidth.current) {
      const pct = (value - minimumValue) / (maximumValue - minimumValue);
      Animated.timing(anim, {
        toValue: pct,
        duration: 0,
        useNativeDriver: false,
      }).start();
    }
  }, [value, minimumValue, maximumValue]);

  const toValue = useCallback(
    (px: number) => {
      const w = trackWidth.current || 1;
      let pct = Math.max(0, Math.min(1, px / w));
      let raw = minimumValue + pct * (maximumValue - minimumValue);
      // snap to step
      const stepped = Math.round(raw / step) * step;
      return Math.max(minimumValue, Math.min(maximumValue, stepped));
    },
    [minimumValue, maximumValue, step],
  );

  const updateFromGesture = useCallback(
    (gestureX: number) => {
      const v = toValue(gestureX);
      setInternalValue(v);
      if (onValueChange) onValueChange(v);
      const pct = (v - minimumValue) / (maximumValue - minimumValue);
      Animated.timing(anim, {
        toValue: pct,
        duration: 0,
        useNativeDriver: false,
      }).start();
    },
    [toValue, onValueChange, anim, minimumValue, maximumValue],
  );

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (
        e: GestureResponderEvent,
        g: PanResponderGestureState,
      ) => {
        const x = g.x0 - (g?.moveX ?? g.x0) + (g.dx || 0);
        // we will use locationX from native event instead
        const locX = (e.nativeEvent as any).locationX;
        updateFromGesture(locX);
      },
      onPanResponderMove: (
        e: GestureResponderEvent,
        g: PanResponderGestureState,
      ) => {
        const locX = (e.nativeEvent as any).locationX;
        updateFromGesture(locX);
      },
      onPanResponderRelease: (
        e: GestureResponderEvent,
        g: PanResponderGestureState,
      ) => {
        const locX = (e.nativeEvent as any).locationX;
        const v = toValue(locX);
        if (onSlidingComplete) onSlidingComplete(v);
      },
    }),
  ).current;

  return (
    <View style={[styles.container, style]}>
      <View
        style={styles.trackWrap}
        onLayout={(e: LayoutChangeEvent) => {
          trackWidth.current = e.nativeEvent.layout.width;
        }}
        {...pan.panHandlers}
      >
        <View
          style={[styles.track, { backgroundColor: maximumTrackTintColor }]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.trackFill,
            {
              backgroundColor: minimumTrackTintColor,
              width: anim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.thumb,
            { backgroundColor: thumbTintColor },
            {
              left: anim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              transform: [
                {
                  translateX: Animated.multiply(anim, trackWidth.current)
                    .interpolate
                    ? 0
                    : 0,
                },
              ],
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', height: 40, justifyContent: 'center' },
  trackWrap: { flex: 1, justifyContent: 'center' },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    height: 6,
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    top: -7,
  },
});
