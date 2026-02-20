// 🔙 Centralized Android back button handler
// Modals register/unregister close callbacks. If no modal is open, shows "press again to exit" on main tabs.
import { useEffect, useRef, useCallback, createContext, useContext, useState, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { toast } from 'sonner';

const MAIN_TABS = ['/', '/calendar', '/stats', '/medications'];
const EXIT_TIMEOUT = 1500;

type CloseHandler = () => void;

interface BackHandlerContextType {
  /** Register a modal close handler. Returns unregister function. */
  registerBackHandler: (handler: CloseHandler) => () => void;
}

const BackHandlerContext = createContext<BackHandlerContextType | null>(null);

export function BackHandlerProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const handlersRef = useRef<CloseHandler[]>([]);
  const lastBackPress = useRef(0);

  const registerBackHandler = useCallback((handler: CloseHandler) => {
    handlersRef.current.push(handler);
    return () => {
      handlersRef.current = handlersRef.current.filter(h => h !== handler);
    };
  }, []);

  useEffect(() => {
    const listener = App.addListener('backButton', () => {
      // If any modal is open, close the most recent one
      if (handlersRef.current.length > 0) {
        const lastHandler = handlersRef.current[handlersRef.current.length - 1];
        lastHandler();
        return;
      }

      // On main tabs: "press again to exit"
      if (MAIN_TABS.includes(location.pathname)) {
        const now = Date.now();
        if (now - lastBackPress.current < EXIT_TIMEOUT) {
          App.exitApp();
        } else {
          lastBackPress.current = now;
          toast('Çıkmak için tekrar basın', {
            duration: EXIT_TIMEOUT,
            id: 'back-to-exit',
          });
        }
        return;
      }

      // On non-main pages (settings, profile etc), go browser back
      window.history.back();
    });

    return () => {
      listener.then(h => h.remove());
    };
  }, [location.pathname]);

  return (
    <BackHandlerContext.Provider value={{ registerBackHandler }}>
      {children}
    </BackHandlerContext.Provider>
  );
}

/** Hook for modals/sheets to register their close handler with the back button system */
export function useBackHandler(isOpen: boolean, onClose: () => void) {
  const ctx = useContext(BackHandlerContext);

  useEffect(() => {
    if (!isOpen || !ctx) return;
    const unregister = ctx.registerBackHandler(onClose);
    return unregister;
  }, [isOpen, onClose, ctx]);
}
