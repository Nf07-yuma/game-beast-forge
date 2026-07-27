import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { OrbsBackground } from '@/components/backgrounds/OrbsBackground';
import { CircuitBackground } from '@/components/backgrounds/CircuitBackground';
import { AuroraBackground } from '@/components/backgrounds/AuroraBackground';
import { EmberBackground } from '@/components/backgrounds/EmberBackground';

export function AnimatedBackground() {
  const backgroundStyle = useGameStore((s) => s.backgroundStyle);

  switch (backgroundStyle) {
    case 'circuit':
      return <CircuitBackground />;
    case 'aurora':
      return <AuroraBackground />;
    case 'ember':
      return <EmberBackground />;
    case 'orbs':
    default:
      return <OrbsBackground />;
  }
}
