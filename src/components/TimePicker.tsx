// 🌸 Time Picker Component
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TimePickerProps {
  value: string; // HH:mm format
  onChange: (time: string) => void;
  label?: string;
}

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState(() => parseInt(value.split(':')[0]) || 9);
  const [minutes, setMinutes] = useState(() => parseInt(value.split(':')[1]) || 0);

  const handleConfirm = () => {
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    onChange(timeStr);
    setIsOpen(false);
  };

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = [0, 15, 30, 45];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
      >
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium">{value}</span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>{label || 'Saat Seç'}</DialogTitle>
          </DialogHeader>
          
          <div className="flex justify-center gap-4 py-6">
            {/* Hours */}
            <div className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground mb-2">Saat</span>
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-primary/10 rounded-lg pointer-events-none z-10" />
                <motion.div
                  className="flex flex-col items-center"
                  drag="y"
                  dragConstraints={{ top: -(hours * 40), bottom: ((23 - hours) * 40) }}
                  onDragEnd={(_, info) => {
                    const offset = Math.round(info.offset.y / 40);
                    setHours(Math.max(0, Math.min(23, hours - offset)));
                  }}
                >
                  <div className="h-20" />
                  {hourOptions.map((h) => (
                    <button
                      key={h}
                      onClick={() => setHours(h)}
                      className={`h-10 w-16 flex items-center justify-center text-lg transition-all ${
                        h === hours 
                          ? 'text-primary font-bold scale-110' 
                          : 'text-muted-foreground'
                      }`}
                    >
                      {h.toString().padStart(2, '0')}
                    </button>
                  ))}
                  <div className="h-20" />
                </motion.div>
              </div>
            </div>

            <span className="text-3xl font-bold text-muted-foreground self-center">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground mb-2">Dakika</span>
              <div className="flex flex-col gap-2">
                {minuteOptions.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMinutes(m)}
                    className={`h-10 w-16 flex items-center justify-center text-lg rounded-lg transition-all ${
                      m === minutes 
                        ? 'bg-primary text-primary-foreground font-bold' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {m.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={handleConfirm} className="w-full">
            Tamam
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
