interface Window {
  Capacitor?: {
    isNative: boolean;
    platform: string;
    getPlatform(): string;
  };
}
