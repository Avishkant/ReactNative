import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

type Props = {
  size?: number;
  onChange?: (h: number, s: number) => void;
  hue?: number;
  sat?: number;
  rings?: number;
  segments?: number;
  dotScale?: number;
};

function hsvToHex(h: number, s: number, v = 100) {
  s /= 100;
  v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0,
    g = 0,
    b = 0;
  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }
  const R = Math.round((r + m) * 255);
  const G = Math.round((g + m) * 255);
  const B = Math.round((b + m) * 255);
  return '#' + [R, G, B].map(vv => vv.toString(16).padStart(2, '0')).join('');
}

export default function ColorWheel({
  size = 280,
  onChange,
  hue = 0,
  sat = 100,
  rings = 8,
  segments = 48,
  dotScale = 1,
}: Props) {
  const center = size / 2;
  const maxR = size / 2 - 8;
  const inner = Math.max(8, size * 0.05);

  const dots = useMemo(() => {
    const arr: Array<{ left: number; top: number; color: string; key: string; size: number }> = [];
    for (let r = 0; r < rings; r++) {
      const radius = inner + (r / Math.max(1, rings - 1)) * (maxR - inner);
      const segs = Math.max(6, Math.round(segments + r * Math.max(2, Math.round(rings / 3))));
      const dotSize = Math.max(3, Math.round((size / (140 / dotScale)) * (1.0 + r * 0.12)));
      for (let i = 0; i < segs; i++) {
        const angle = (i / segs) * Math.PI * 2;
        const deg = ((i / segs) * 360 + (r % 2 ? (360 / segs) / 2 : 0)) % 360;
        const saturation = Math.round(((radius - inner) / (maxR - inner)) * 100);
        const color = hsvToHex(deg, saturation, 100);
        const left = center + Math.cos(angle) * radius - dotSize / 2;
        const top = center + Math.sin(angle) * radius - dotSize / 2;
        arr.push({ left, top, color, key: `r${r}s${i}`, size: dotSize });
      }
    }
    return arr;
  }, [size, rings, segments, dotScale]);

  function handleResponder(evt: any) {
    const x = evt.nativeEvent.locationX;
    const y = evt.nativeEvent.locationY;
    const dx = x - center;
    const dy = y - center;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxR) return;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angle < 0) angle += 360;
    const hueVal = angle;
    const satVal = Math.max(0, Math.min(100, (dist / maxR) * 100));
    if (onChange) onChange(hueVal, satVal);
  }

  const marker = useMemo(() => {
    const radius = inner + (sat / 100) * (maxR - inner);
    const angle = (hue * Math.PI) / 180;
    return { left: center + Math.cos(angle) * radius, top: center + Math.sin(angle) * radius };
  }, [hue, sat, size, inner, maxR, center]);

  return (
    <View
      style={{ width: size, height: size }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleResponder}
      onResponderMove={handleResponder}
    >
      <View style={{ width: size, height: size }}>
        {dots.map(d => (
          <View
            key={d.key}
            style={[styles.dot, { left: d.left, top: d.top, backgroundColor: d.color, width: d.size, height: d.size, borderRadius: d.size / 2 }]}
          />
        ))}
        <View pointerEvents="none" style={[styles.markerWrap, { left: marker.left - 14, top: marker.top - 14 }]}> 
          <View style={styles.markerOuter} />
          <View style={[styles.markerInner, { backgroundColor: hsvToHex(hue, sat) }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: { position: 'absolute', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)' },
  markerWrap: { position: 'absolute', width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  markerOuter: { position: 'absolute', width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.08)' },
  markerInner: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.18)' },
});
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

type Props = {
  size?: number;
  onChange?: (h: number, s: number) => void;
  hue?: number;
  sat?: number;
  rings?: number;
  segments?: number;
  dotScale?: number;
};

function hsvToHex(h: number, s: number, v = 100) {
  s /= 100;
  v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0,
    g = 0,
    b = 0;
  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }
  const R = Math.round((r + m) * 255);
  const G = Math.round((g + m) * 255);
  const B = Math.round((b + m) * 255);
  return '#' + [R, G, B].map(vv => vv.toString(16).padStart(2, '0')).join('');
}

export default function ColorWheel({
  size = 280,
  onChange,
  hue = 0,
  sat = 100,
  rings = 8,
  segments = 48,
  dotScale = 1,
}: Props) {
  const center = size / 2;
  const maxR = size / 2 - 8;
  const inner = Math.max(8, size * 0.05);

  const dots = useMemo(() => {
    const arr: Array<{ left: number; top: number; color: string; key: string; size: number }> = [];
    for (let r = 0; r < rings; r++) {
      const radius = inner + (r / Math.max(1, rings - 1)) * (maxR - inner);
      const segs = Math.max(6, Math.round(segments + r * Math.max(2, Math.round(rings / 3))));
      const dotSize = Math.max(3, Math.round((size / (140 / dotScale)) * (1.0 + r * 0.12)));
      for (let i = 0; i < segs; i++) {
        const angle = (i / segs) * Math.PI * 2;
        const deg = ((i / segs) * 360 + (r % 2 ? (360 / segs) / 2 : 0)) % 360;
        const saturation = Math.round(((radius - inner) / (maxR - inner)) * 100);
        const color = hsvToHex(deg, saturation, 100);
        const left = center + Math.cos(angle) * radius - dotSize / 2;
        const top = center + Math.sin(angle) * radius - dotSize / 2;
        arr.push({ left, top, color, key: `r${r}s${i}`, size: dotSize });
      }
    }
    return arr;
  }, [size, rings, segments, dotScale]);

  function handleResponder(evt: any) {
    const x = evt.nativeEvent.locationX;
    const y = evt.nativeEvent.locationY;
    const dx = x - center;
    const dy = y - center;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxR) return;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angle < 0) angle += 360;
    const hueVal = angle;
    const satVal = Math.max(0, Math.min(100, (dist / maxR) * 100));
    if (onChange) onChange(hueVal, satVal);
  }

  const marker = useMemo(() => {
    const radius = inner + (sat / 100) * (maxR - inner);
    const angle = (hue * Math.PI) / 180;
    return { left: center + Math.cos(angle) * radius, top: center + Math.sin(angle) * radius };
  }, [hue, sat, size, inner, maxR, center]);

  return (
    <View
      style={{ width: size, height: size }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleResponder}
      onResponderMove={handleResponder}
    >
      <View style={{ width: size, height: size }}>
        {dots.map(d => (
          <View
            key={d.key}
            style={[styles.dot, { left: d.left, top: d.top, backgroundColor: d.color, width: d.size, height: d.size, borderRadius: d.size / 2 }]}
          />
        ))}
        <View pointerEvents="none" style={[styles.markerWrap, { left: marker.left - 14, top: marker.top - 14 }]}> 
          <View style={styles.markerOuter} />
          <View style={[styles.markerInner, { backgroundColor: hsvToHex(hue, sat) }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: { position: 'absolute', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)' },
  markerWrap: { position: 'absolute', width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  markerOuter: { position: 'absolute', width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.08)' },
  markerInner: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.18)' },
});
import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  size?: number;
  onChange?: (h: number, s: number) => void;
  hue?: number;
  sat?: number;
  rings?: number;
  segments?: number;
  dotScale?: number;
};

function hsvToHex(h: number, s: number, v = 100) {
  s /= 100;
  v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0,
    g = 0,
    b = 0;
  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }
  const R = Math.round((r + m) * 255);
  const G = Math.round((g + m) * 255);
  const B = Math.round((b + m) * 255);
  return '#' + [R, G, B].map(vv => vv.toString(16).padStart(2, '0')).join('');
}

export default function ColorWheel({
  size = 280,
  onChange,
  hue = 0,
  sat = 100,
}: Props) {
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  // Increase rings/segments for a smoother, denser wheel
  const rings = 12;
  const segments = 96; // base segments per ring

  const dots = useMemo(() => {
    const arr: Array<{
      left: number;
      top: number;
      color: string;
      key: string;
      size: number;
    }> = [];
      // density and sizing are controllable via props (dotScale, rings, segments)
      // Use defaults for a reasonably-dense wheel
      const ringsDefault = 12;
      const segmentsDefault = 96;
      const dotScaleDefault = 1;

      // Allow props override by reading from the passed Props via the component arguments
      // (Props additions handled by the caller). Fallback to defaults.
      // Note: we destructured props earlier; to get optional props we read from arguments
      // via the local scope by relying on variable names 'rings' and 'segments' passed by caller.
    const inner = Math.max(8, size * 0.05);
    for (let r = 0; r < rings; r++) {
      const radius = inner + (r / (rings - 1)) * (maxR - inner);
      // Use smaller dots and slightly more segments per outer ring
      const dotSize = Math.max(3, Math.round((size / 160) * (1.2 + r * 0.28)));
      const segs = Math.round(segments + r * 10);
      for (let i = 0; i < segs; i++) {
        const angle = (i / segs) * Math.PI * 2;
        const deg = ((i / segs) * 360 + (r % 2 ? 360 / segs / 2 : 0)) % 360;
        const saturation = Math.round(
          ((radius - inner) / (maxR - inner)) * 100,
        );
        const color = hsvToHex(deg, saturation, 100);
        const left = center + Math.cos(angle) * radius - dotSize / 2;
        const top = center + Math.sin(angle) * radius - dotSize / 2;
        arr.push({ left, top, color, key: `r${r}s${i}`, size: dotSize });
      }
    }
    return arr;
  }, [size]);

  function handleResponder(evt: any) {
    const x = evt.nativeEvent.locationX;
    const y = evt.nativeEvent.locationY;
    const cx = size / 2;
    const cy = size / 2;
    const dx = x - cx;
    const dy = y - cy;
    rings = 12,
    segments = 96,
    dotScale = 1,
  }: Props) {
    const maxR = size / 2 - 8;
    if (dist > maxR) return;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const maxR = size / 2 - 8;
    const satVal = Math.max(0, Math.min(100, (dist / maxR) * 100));
    if (onChange) onChange(hueVal, satVal);
  }

  // compute marker position for given hue/sat
  const marker = useMemo(() => {
    const cx = size / 2;
    const cy = size / 2;
    const maxR = size / 2 - 8;
    const inner = Math.max(12, size * 0.08);
    const radius = inner + (sat / 100) * (maxR - inner);
    const angle = (hue * Math.PI) / 180;
      for (let r = 0; r < rings; r++) {
        const radius = inner + (r / (rings - 1)) * (maxR - inner);
        // Use smaller dots and slightly more segments per outer ring
        const dotSize = Math.max(3, Math.round((size / (140 / dotScale)) * (1.0 + r * 0.18)));
        const segs = Math.round(segments + r * Math.max(4, Math.round(rings / 2)));
  return (
    <View
      style={{ width: size, height: size }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleResponder}
      onResponderMove={handleResponder}
    >
      <View style={{ width: size, height: size }}>
        {dots.map(d => (
          <View
            key={d.key}
              styles.dot,
              {
                left: d.left,
                top: d.top,
                backgroundColor: d.color,
                width: d.size,
                height: d.size,
                borderRadius: d.size / 2,
              },
            ]}
          />
        ))}
        <View pointerEvents="none" style={[styles.markerWrap, { left: marker.left - 14, top: marker.top - 14 }]}> 
          <View style={styles.markerOuter} />
          <View style={[styles.markerInner, { backgroundColor: hsvToHex(hue, sat) }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  marker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 3,
  },
  markerWrap: {
    position: 'absolute',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerOuter: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  markerInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.18)',
  },
});
