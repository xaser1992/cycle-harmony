// 🌸 App Lock Provider Component
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PinLock } from './PinLock';
import { Preferences } from '@capacitor/preferences';

interface AppLockContextType {
  isLocked: boolean;
  isEnabled: boolean;
  hasPin: boolean;
  enableLock: () => void;
  disableLock: () => void;
  setPin: (pin: string) => Promise<void>;
  removePin: () => Promise<void>;
  lock: () => void;
  unlock: () => void;
}

const AppLockContext = createContext<AppLockContextType | null>(null);

const PIN_STORAGE_KEY = 'app_lock_pin';
const LOCK_ENABLED_KEY = 'app_lock_enabled';

export function AppLockProvider({ children }: { children: ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [isSettingPin, setIsSettingPin] = useState(false);

  // Load lock state on mount
  useEffect(() => {
    async function loadLockState() {
      try {
        const { value: pin } = await Preferences.get({ key: PIN_STORAGE_KEY });
        const { value: enabled } = await Preferences.get({ key: LOCK_ENABLED_KEY });
        
        if (pin) {
          setStoredPin(pin);
          setHasPin(true);
        }
        
        if (enabled === 'true' && pin) {
          setIsEnabled(true);
          setIsLocked(true);
        }
      } catch (error) {
        // Fallback to localStorage for web
        const pin = localStorage.getItem(PIN_STORAGE_KEY);
        const enabled = localStorage.getItem(LOCK_ENABLED_KEY);
        
        if (pin) {
          setStoredPin(pin);
          setHasPin(true);
        }
        
        if (enabled === 'true' && pin) {
          setIsEnabled(true);
          setIsLocked(true);
        }
      }
    }
    loadLockState();
  }, []);

  // Lock when app goes to background (visibility change)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isEnabled && hasPin) {
        setIsLocked(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isEnabled, hasPin]);

  const setPin = async (pin: string) => {
    try {
      await Preferences.set({ key: PIN_STORAGE_KEY, value: pin });
    } catch {
      localStorage.setItem(PIN_STORAGE_KEY, pin);
    }
    setStoredPin(pin);
    setHasPin(true);
    setIsSettingPin(false);
    setIsEnabled(true);
    try {
      await Preferences.set({ key: LOCK_ENABLED_KEY, value: 'true' });
    } catch {
      localStorage.setItem(LOCK_ENABLED_KEY, 'true');
    }
  };

  const removePin = async () => {
    try {
      await Preferences.remove({ key: PIN_STORAGE_KEY });
      await Preferences.remove({ key: LOCK_ENABLED_KEY });
    } catch {
      localStorage.removeItem(PIN_STORAGE_KEY);
      localStorage.removeItem(LOCK_ENABLED_KEY);
    }
    setStoredPin(null);
    setHasPin(false);
    setIsEnabled(false);
    setIsLocked(false);
  };

  const enableLock = () => {
    if (!hasPin) {
      setIsSettingPin(true);
    } else {
      setIsEnabled(true);
      Preferences.set({ key: LOCK_ENABLED_KEY, value: 'true' }).catch(() => {
        localStorage.setItem(LOCK_ENABLED_KEY, 'true');
      });
    }
  };

  const [isDisabling, setIsDisabling] = useState(false);

  const disableLock = () => {
    // Show PIN screen to verify before disabling
    setIsDisabling(true);
  };

  const confirmDisableLock = () => {
    setIsEnabled(false);
    setIsLocked(false);
    setIsDisabling(false);
    Preferences.set({ key: LOCK_ENABLED_KEY, value: 'false' }).catch(() => {
      localStorage.setItem(LOCK_ENABLED_KEY, 'false');
    });
  };

  const lock = () => {
    if (isEnabled && hasPin) {
      setIsLocked(true);
    }
  };

  const unlock = () => {
    setIsLocked(false);
  };

  return (
    <AppLockContext.Provider
      value={{
        isLocked,
        isEnabled,
        hasPin,
        enableLock,
        disableLock,
        setPin,
        removePin,
        lock,
        unlock,
      }}
    >
      {isLocked && hasPin && (
        <PinLock 
          onUnlock={unlock} 
          storedPin={storedPin}
        />
      )}
      {isSettingPin && (
        <PinLock 
          onUnlock={() => setIsSettingPin(false)}
          onSetPin={setPin}
          isSettingPin={true}
        />
      )}
      {isDisabling && (
        <PinLock 
          onUnlock={confirmDisableLock}
          storedPin={storedPin}
          title="Kilidi Kaldır"
        />
      )}
      {children}
    </AppLockContext.Provider>
  );
}

export const useAppLock = () => {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error('useAppLock must be used within an AppLockProvider');
  }
  return context;
};
