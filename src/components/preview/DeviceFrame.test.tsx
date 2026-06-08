import { describe, it, expect } from 'vite-plus/test';
import { render, screen } from '@testing-library/react';
import { DeviceFrame } from './DeviceFrame';

describe('DeviceFrame', () => {
  it('renders with device data attribute', () => {
    render(
      <DeviceFrame deviceId="iphone15pro">
        <div>content</div>
      </DeviceFrame>,
    );
    const frame = screen.getByTestId('device-frame');
    expect(frame).toHaveAttribute('data-device', 'iphone15pro');
  });

  it('renders device label for iPad Air', () => {
    render(
      <DeviceFrame deviceId="ipadAir">
        <div>content</div>
      </DeviceFrame>,
    );
    expect(screen.getByText('iPad Air')).toBeInTheDocument();
  });

  it('renders children inside the frame', () => {
    render(
      <DeviceFrame deviceId="pixel8">
        <div data-testid="inner-content">hello</div>
      </DeviceFrame>,
    );
    expect(screen.getByTestId('inner-content')).toBeInTheDocument();
  });

  it('renders Dynamic Island for iPhone 15 Pro', () => {
    const { container } = render(
      <DeviceFrame deviceId="iphone15pro">
        <div>content</div>
      </DeviceFrame>,
    );
    const dynamicIsland = container.querySelector('[class*="dynamicIsland"]');
    expect(dynamicIsland).toBeInTheDocument();
  });

  it('renders desktop frame with titlebar', () => {
    const { container } = render(
      <DeviceFrame deviceId="desktop">
        <div>content</div>
      </DeviceFrame>,
    );
    const titlebar = container.querySelector('[class*="desktopTitlebar"]');
    expect(titlebar).toBeInTheDocument();
  });
});
