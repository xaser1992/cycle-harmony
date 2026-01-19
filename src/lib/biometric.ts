// 🌸 Biometric Authentication Service
import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';

export interface BiometricStatus {
  isAvailable: boolean;
  biometryType: 'fingerprint' | 'face' | 'iris' | 'none';
  errorMessage?: string;
}

/**
 * Check if biometric authentication is available on the device
 */
export async function checkBiometricAvailability(): Promise<BiometricStatus> {
  try {
    const result = await NativeBiometric.isAvailable();
    
    let biometryType: BiometricStatus['biometryType'] = 'none';
    
    if (result.isAvailable) {
      switch (result.biometryType) {
        case BiometryType.FINGERPRINT:
        case BiometryType.TOUCH_ID:
          biometryType = 'fingerprint';
          break;
        case BiometryType.FACE_ID:
        case BiometryType.FACE_AUTHENTICATION:
          biometryType = 'face';
          break;
        case BiometryType.IRIS_AUTHENTICATION:
          biometryType = 'iris';
          break;
        default:
          biometryType = 'fingerprint';
      }
    }
    
    return {
      isAvailable: result.isAvailable,
      biometryType,
    };
  } catch (error) {
    console.log('Biometric check error:', error);
    return {
      isAvailable: false,
      biometryType: 'none',
      errorMessage: error instanceof Error ? error.message : 'Biyometrik kontrol başarısız',
    };
  }
}

/**
 * Verify user with biometric authentication
 */
export async function verifyBiometric(): Promise<{ success: boolean; error?: string }> {
  try {
    // First check availability
    const availability = await checkBiometricAvailability();
    
    if (!availability.isAvailable) {
      return {
        success: false,
        error: 'Biyometrik doğrulama bu cihazda kullanılamıyor',
      };
    }
    
    // Perform verification
    await NativeBiometric.verifyIdentity({
      reason: 'Uygulamayı açmak için doğrulama gerekiyor',
      title: 'Biyometrik Doğrulama',
      subtitle: 'Parmak izinizi veya yüzünüzü kullanın',
      description: 'Döngü Takibi uygulamasına erişmek için kimliğinizi doğrulayın',
      negativeButtonText: 'PIN Kullan',
    });
    
    return { success: true };
  } catch (error) {
    console.log('Biometric verification error:', error);
    
    // Handle specific error codes
    const errorMessage = error instanceof Error ? error.message : 'Doğrulama başarısız';
    
    return {
      success: false,
      error: errorMessage.includes('cancel') 
        ? 'Doğrulama iptal edildi' 
        : errorMessage.includes('lockout')
        ? 'Çok fazla deneme. Lütfen bekleyin.'
        : 'Biyometrik doğrulama başarısız',
    };
  }
}

/**
 * Get the appropriate icon name for the biometry type
 */
export function getBiometryIcon(type: BiometricStatus['biometryType']): string {
  switch (type) {
    case 'face':
      return '👤';
    case 'fingerprint':
      return '👆';
    case 'iris':
      return '👁️';
    default:
      return '🔒';
  }
}

/**
 * Get the localized label for the biometry type
 */
export function getBiometryLabel(type: BiometricStatus['biometryType'], language: 'tr' | 'en' = 'tr'): string {
  const labels = {
    fingerprint: { tr: 'Parmak İzi', en: 'Fingerprint' },
    face: { tr: 'Yüz Tanıma', en: 'Face ID' },
    iris: { tr: 'İris Tarama', en: 'Iris Scan' },
    none: { tr: 'Biyometrik', en: 'Biometric' },
  };
  
  return labels[type][language];
}
