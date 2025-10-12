/**
 * Browser API type extensions
 * This file extends global browser APIs with vendor-specific or non-standard properties
 */

interface Navigator {
  /**
   * iOS-specific property for standalone mode (PWA)
   */
  standalone?: boolean;
  
  /**
   * Maximum touch points supported by the device
   */
  maxTouchPoints: number;
}

interface Window {
  // Add custom window properties here if needed
}

// Extend existing types as needed
declare global {
  interface WindowEventMap {
    // Custom events can be added here
  }
}

export {};

