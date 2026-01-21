// 🌸 Profile Page - Flo Inspired Design
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Calendar, 
  ChevronLeft,
  Camera,
  Edit3,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useCycleData } from '@/hooks/useCycleData';

interface UserProfile {
  name: string;
  email: string;
  birthDate: string;
  avatar?: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { cycleSettings } = useCycleData();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : {
      name: '',
      email: '',
      birthDate: '',
      avatar: undefined
    };
  });

  const [editForm, setEditForm] = useState(profile);

  const handleSave = () => {
    setProfile(editForm);
    localStorage.setItem('userProfile', JSON.stringify(editForm));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  const stats = [
    { label: 'Döngü Günü', value: cycleSettings.cycleLength, icon: '📅' },
    { label: 'Takip Edilen', value: '3 ay', icon: '📊' },
    { label: 'Kayıt', value: '45+', icon: '✍️' },
  ];

  return (
    <div className="min-h-screen bg-background safe-area-top">
      {/* Header with gradient */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-rose via-pink to-rose h-56" />
        
        {/* Back button */}
        <div className="relative px-4 pt-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        {/* Profile Avatar */}
        <div className="relative flex flex-col items-center pt-4 pb-20">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center overflow-hidden">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl">👩</span>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center"
            >
              <Camera className="w-4 h-4 text-primary" />
            </motion.button>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-xl font-bold text-white"
          >
            {profile.name || 'İsim Ekle'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/80 text-sm"
          >
            {profile.email || 'E-posta ekle'}
          </motion.p>
        </div>
      </div>

      {/* Content */}
      <div className="relative -mt-10 px-4 space-y-4">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-card rounded-2xl p-4 shadow-lg border border-border/50 text-center"
            >
              <span className="text-2xl">{stat.icon}</span>
              <p className="text-lg font-bold text-foreground mt-1">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Profile Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-3xl p-5 shadow-lg border border-border/50"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Profil Bilgileri</h2>
            {!isEditing && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEditing(true)}
                className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"
              >
                <Edit3 className="w-4 h-4 text-primary" />
              </motion.button>
            )}
          </div>

          {isEditing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">İsim</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="İsminizi girin"
                  className="rounded-xl border-border/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">E-posta</label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="E-posta adresinizi girin"
                  className="rounded-xl border-border/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Doğum Tarihi</label>
                <Input
                  type="date"
                  value={editForm.birthDate}
                  onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                  className="rounded-xl border-border/50"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={handleCancel}
                >
                  İptal
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-gradient-to-r from-rose to-pink text-white border-0"
                  onClick={handleSave}
                >
                  Kaydet
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">İsim</p>
                  <p className="font-medium text-foreground">{profile.name || 'Belirtilmedi'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-violet/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-violet" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">E-posta</p>
                  <p className="font-medium text-foreground">{profile.email || 'Belirtilmedi'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-amber" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Doğum Tarihi</p>
                  <p className="font-medium text-foreground">{profile.birthDate || 'Belirtilmedi'}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Google Sign In Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-3xl p-5 shadow-lg border border-border/50"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue to-sky flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Google ile Giriş</h3>
              <p className="text-xs text-muted-foreground">Verilerinizi bulutta yedekleyin</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            className="w-full rounded-xl h-12 border-2 border-dashed border-border hover:border-primary hover:bg-primary/5"
          >
            <span className="text-muted-foreground">Yakında...</span>
          </Button>
          
          <p className="text-xs text-muted-foreground text-center mt-3">
            Google ile giriş yaparak verilerinizi güvende tutabilir ve farklı cihazlarda senkronize edebilirsiniz.
          </p>
        </motion.div>

        {/* Health Reminder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-rose/10 to-pink/10 rounded-3xl p-5 border border-rose/20"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose/20 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-rose" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Sağlık Notu</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Bu uygulama tıbbi bir cihaz değildir. Sağlık kararlarınız için lütfen bir uzmanla görüşün.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Spacer for bottom */}
        <div className="h-6" />
      </div>
    </div>
  );
}