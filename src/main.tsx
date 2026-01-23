import React from 'react';
import { createRoot } from "react-dom/client";
import { Capacitor } from '@capacitor/core';
import App from "./App.tsx";
import "./index.css";

// Initialize notifications on app start (only on native platforms)
async function initializeApp() {
  // Only initialize native notifications on native platforms
  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const { 
        registerMedicationActionTypes, 
        handleMedicationNotificationAction,
        createMedicationNotificationChannel 
      } = await import('@/lib/medicationNotifications');
      
      // Register medication action types
      await registerMedicationActionTypes();
      
      // Create notification channel
      await createMedicationNotificationChannel();
      
      // Listen for notification actions
      LocalNotifications.addListener('localNotificationActionPerformed', handleMedicationNotificationAction);
      
      console.log('Native app initialized successfully');
    } catch (error) {
      console.error('Error initializing native features:', error);
    }
  } else {
    console.log('Web platform - native notifications disabled');
  }
}

initializeApp();

createRoot(document.getElementById("root")!).render(<App />);
