import type { Device, DeviceId } from '../types/theme';

export const DEVICES: Record<DeviceId, Device> = {
  iphone15pro: {
    id: 'iphone15pro',
    name: 'iPhone 15 Pro',
    width: 393,
    height: 852,
  },
  pixel8: {
    id: 'pixel8',
    name: 'Pixel 8',
    width: 412,
    height: 924,
  },
  ipadAir: {
    id: 'ipadAir',
    name: 'iPad Air',
    width: 820,
    height: 1180,
  },
  desktop: {
    id: 'desktop',
    name: 'Desktop',
    width: 1280,
    height: 800,
  },
};
