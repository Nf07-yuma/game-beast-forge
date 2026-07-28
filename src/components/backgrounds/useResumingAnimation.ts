import { useEffect, useRef } from 'react';
import { Animated, Easing, EasingFunction } from 'react-native';
import { ANIMATION_CLOCK_START } from './animationClock';

interface PingPongOptions {
  from?: number;
  to?: number;
  /** Idle time at `from` before each up-leg, repeated every cycle. */
  delay?: number;
  easing?: EasingFunction;
}

/** An Animated.Value that eases back and forth between two bounds, resuming
 * from wherever the shared clock says it should currently be rather than
 * restarting from `from` on every mount. */
export function useResumingPingPong(duration: number, options: PingPongOptions = {}): Animated.Value {
  const { from = 0, to = 1, delay = 0, easing = Easing.inOut(Easing.sin) } = options;
  const cycle = delay + duration * 2;

  const valueRef = useRef<Animated.Value | null>(null);
  if (!valueRef.current) {
    const elapsed = (Date.now() - ANIMATION_CLOCK_START) % cycle;
    let initial: number;
    if (elapsed < delay) {
      initial = from;
    } else if (elapsed < delay + duration) {
      initial = from + (to - from) * ((elapsed - delay) / duration);
    } else {
      initial = to + (from - to) * ((elapsed - delay - duration) / duration);
    }
    valueRef.current = new Animated.Value(initial);
  }
  const value = valueRef.current;

  useEffect(() => {
    const elapsed = (Date.now() - ANIMATION_CLOCK_START) % cycle;
    const steady = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(value, { toValue: to, duration, easing, useNativeDriver: true }),
        Animated.timing(value, { toValue: from, duration, easing, useNativeDriver: true }),
      ])
    );

    let resume: Animated.CompositeAnimation;
    if (elapsed < delay) {
      resume = Animated.sequence([
        Animated.delay(delay - elapsed),
        Animated.timing(value, { toValue: to, duration, easing, useNativeDriver: true }),
        Animated.timing(value, { toValue: from, duration, easing, useNativeDriver: true }),
      ]);
    } else if (elapsed < delay + duration) {
      resume = Animated.sequence([
        Animated.timing(value, { toValue: to, duration: delay + duration - elapsed, easing, useNativeDriver: true }),
        Animated.timing(value, { toValue: from, duration, easing, useNativeDriver: true }),
      ]);
    } else {
      resume = Animated.timing(value, { toValue: from, duration: cycle - elapsed, easing, useNativeDriver: true });
    }

    resume.start(({ finished }) => {
      if (finished) steady.start();
    });

    return () => {
      resume.stop();
      steady.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return value;
}

interface SawtoothOptions {
  /** Idle time at 0 before each ramp, repeated every cycle. */
  delay?: number;
  easing?: EasingFunction;
}

/** An Animated.Value that ramps 0 -> 1 then snaps back to 0, resuming from
 * wherever the shared clock says it should currently be. */
export function useResumingSawtooth(duration: number, options: SawtoothOptions = {}): Animated.Value {
  const { delay = 0, easing = Easing.linear } = options;
  const cycle = delay + duration;

  const valueRef = useRef<Animated.Value | null>(null);
  if (!valueRef.current) {
    const elapsed = (Date.now() - ANIMATION_CLOCK_START) % cycle;
    const initial = elapsed < delay ? 0 : (elapsed - delay) / duration;
    valueRef.current = new Animated.Value(initial);
  }
  const value = valueRef.current;

  useEffect(() => {
    const elapsed = (Date.now() - ANIMATION_CLOCK_START) % cycle;
    const steady = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(value, { toValue: 1, duration, easing, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );

    const resume =
      elapsed < delay
        ? Animated.sequence([
            Animated.delay(delay - elapsed),
            Animated.timing(value, { toValue: 1, duration, easing, useNativeDriver: true }),
          ])
        : Animated.timing(value, { toValue: 1, duration: cycle - elapsed, easing, useNativeDriver: true });

    resume.start(({ finished }) => {
      if (finished) {
        value.setValue(0);
        steady.start();
      }
    });

    return () => {
      resume.stop();
      steady.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return value;
}
