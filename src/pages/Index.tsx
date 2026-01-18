import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCycleData } from '@/hooks/useCycleData';

const Index = () => {
  const navigate = useNavigate();
  const { userSettings, isLoading } = useCycleData();

  useEffect(() => {
    if (!isLoading && !userSettings.onboardingCompleted) {
      navigate('/onboarding', { replace: true });
    }
  }, [isLoading, userSettings.onboardingCompleted, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-primary">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-2xl">🌸</span>
          </div>
        </div>
      </div>
    );
  }

  if (!userSettings.onboardingCompleted) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Main content will be added in next phase */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="text-6xl">🌸</div>
          <h1 className="text-2xl font-semibold text-foreground">Döngü Takibi</h1>
          <p className="text-muted-foreground">Ana ekran hazırlanıyor...</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
