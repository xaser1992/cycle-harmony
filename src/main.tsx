import { createRoot } from "react-dom/client";
import { LocalNotifications } from '@capacitor/local-notifications';
import App from "./App.tsx";
import "./index.css";
import { 
  registerMedicationActionTypes, 
  handleMedicationNotificationAction,
  createMedicationNotificationChannel 
} from '@/lib/medicationNotifications';

// Initialize notifications on app start
async function initializeApp() {
  try {
    // Register medication action types
    await registerMedicationActionTypes();
    
    // Create notification channel
    await createMedicationNotificationChannel();
    
    // Listen for notification actions
    LocalNotifications.addListener('localNotificationActionPerformed', handleMedicationNotificationAction);
    
    console.log('App initialized successfully');
  } catch (error) {
    console.error('Error initializing app:', error);
  }
}

initializeApp();

createRoot(document.getElementById("root")!).render(<App />);
