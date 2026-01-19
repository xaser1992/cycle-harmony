// 🌸 PIN Lock Screen Component
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PinLockProps {
  onUnlock: () => void;
  onSetPin?: (pin: string) => void;
  isSettingPin?: boolean;
  storedPin?: string | null;
}

export function PinLock({ onUnlock, onSetPin, isSettingPin = false, storedPin }: PinLockProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const PIN_LENGTH = 4;

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      if (isSettingPin) {
        if (step === 'enter') {
          setConfirmPin(pin);
          setPin('');
          setStep('confirm');
        } else {
          if (pin === confirmPin) {
            onSetPin?.(pin);
          } else {
            setError('PIN\'ler eşleşmiyor');
            triggerShake();
            setPin('');
            setConfirmPin('');
            setStep('enter');
          }
        }
      } else {
        // Verify PIN
        if (pin === storedPin) {
          onUnlock();
        } else {
          setError('Yanlış PIN');
          triggerShake();
          setPin('');
        }
      }
    }
  }, [pin]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleNumberPress = (num: number) => {
    if (pin.length < PIN_LENGTH) {
      setPin(prev => prev + num.toString());
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleBiometric = async () => {
    // In a real app, this would use capacitor biometric plugin
    // For now, we'll just unlock
    onUnlock();
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center safe-area-top safe-area-bottom">
      {/* Logo */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="text-6xl mb-8"
      >
        🌸
      </motion.div>

      {/* Title */}
      <h1 className="text-xl font-bold text-foreground mb-2">
        {isSettingPin 
          ? (step === 'enter' ? 'Yeni PIN Oluştur' : 'PIN\'i Onayla')
          : 'PIN Gir'
        }
      </h1>
      
      {error && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-destructive text-sm mb-4"
        >
          {error}
        </motion.p>
      )}

      {/* PIN Dots */}
      <motion.div 
        className="flex gap-4 my-8"
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <motion.div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-colors ${
              i < pin.length 
                ? 'bg-primary border-primary' 
                : 'border-muted-foreground'
            }`}
            animate={i < pin.length ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.15 }}
          />
        ))}
      </motion.div>

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-4 w-64">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <motion.button
            key={num}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNumberPress(num)}
            className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-medium hover:bg-muted/80 transition-colors mx-auto"
          >
            {num}
          </motion.button>
        ))}
        
        {/* Biometric Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleBiometric}
          className="w-16 h-16 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors mx-auto"
          disabled={isSettingPin}
        >
          <Fingerprint className={`w-6 h-6 ${isSettingPin ? 'text-muted-foreground/50' : 'text-muted-foreground'}`} />
        </motion.button>
        
        {/* Zero */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => handleNumberPress(0)}
          className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-medium hover:bg-muted/80 transition-colors mx-auto"
        >
          0
        </motion.button>
        
        {/* Delete */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleDelete}
          className="w-16 h-16 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors mx-auto"
        >
          <Delete className="w-6 h-6 text-muted-foreground" />
        </motion.button>
      </div>

      {/* Cancel button for setting PIN */}
      {isSettingPin && (
        <Button 
          variant="ghost" 
          className="mt-8"
          onClick={() => {
            setPin('');
            setConfirmPin('');
            setStep('enter');
            setError('');
          }}
        >
          İptal
        </Button>
      )}
    </div>
  );
}
