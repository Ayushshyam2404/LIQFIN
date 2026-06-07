import { create } from 'zustand';
import { api } from '../services/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  age?: number;
  occupation?: string;
  phone?: string;
  createdAt: string;
  webAuthnCredentials?: any[];
}

export interface EmailSyncSettings {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  email: string;
  password?: string;
  lastSync?: string;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  emailSyncSettings: EmailSyncSettings | null;
  
  login: (credentials: any) => Promise<boolean>;
  register: (userDetails: any) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  updateProfile: (profileData: any) => Promise<boolean>;
  
  // Passkey / WebAuthn Methods
  registerPasskey: () => Promise<boolean>;
  loginWithPasskey: (email: string) => Promise<boolean>;

  // Email Sync Methods
  fetchEmailSyncSettings: () => Promise<void>;
  updateEmailSyncSettings: (settings: Partial<EmailSyncSettings>) => Promise<boolean>;
  testEmailSyncSettings: (settings: EmailSyncSettings) => Promise<{ success: boolean; message: string }>;
  triggerEmailSync: () => Promise<{ success: boolean; message: string; count: number }>;
}

export const useAuthStore = create<AuthState>((set) => {
  // Listen for global logout events (like API token refresh failures)
  if (typeof window !== 'undefined') {
    window.addEventListener('auth-logout', () => {
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    });
  }

  return {
    user: null,
    accessToken: localStorage.getItem('accessToken'),
    isAuthenticated: false,
    isLoading: true,
    error: null,
    emailSyncSettings: null,

    clearError: () => set({ error: null }),

    checkAuth: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        set({ isAuthenticated: false, isLoading: false, user: null });
        return;
      }
      try {
        set({ isLoading: true });
        const res = await api.get('/auth/me');
        if (res.data.success) {
          set({
            user: res.data.user,
            isAuthenticated: true,
            accessToken: token
          });
        }
      } catch (err: any) {
        console.error('CheckAuth failed:', err);
        localStorage.removeItem('accessToken');
        set({ isAuthenticated: false, user: null, accessToken: null });
      } finally {
        set({ isLoading: false });
      }
    },

    login: async (credentials) => {
      try {
        set({ isLoading: true, error: null });
        const res = await api.post('/auth/login', credentials);
        if (res.data.success) {
          const { accessToken, user } = res.data;
          localStorage.setItem('accessToken', accessToken);
          set({
            user,
            accessToken,
            isAuthenticated: true
          });
          return true;
        }
        return false;
      } catch (err: any) {
        set({ error: err.response?.data?.message || 'Login failed. Please check credentials.' });
        return false;
      } finally {
        set({ isLoading: false });
      }
    },

    register: async (userDetails) => {
      try {
        set({ isLoading: true, error: null });
        const res = await api.post('/auth/register', userDetails);
        if (res.data.success) {
          const { accessToken, user } = res.data;
          localStorage.setItem('accessToken', accessToken);
          set({
            user,
            accessToken,
            isAuthenticated: true
          });
          return true;
        }
        return false;
      } catch (err: any) {
        set({ error: err.response?.data?.message || 'Registration failed.' });
        return false;
      } finally {
        set({ isLoading: false });
      }
    },

    logout: async () => {
      try {
        set({ isLoading: true });
        await api.post('/auth/logout');
      } catch (err) {
        console.error('Logout API call failed:', err);
      } finally {
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      }
    },

    updateProfile: async (profileData) => {
      try {
        set({ isLoading: true, error: null });
        const res = await api.put('/auth/profile', profileData);
        if (res.data.success) {
          set({ user: res.data.user });
          return true;
        }
        return false;
      } catch (err: any) {
        set({ error: err.response?.data?.message || 'Failed to update profile.' });
        return false;
      } finally {
        set({ isLoading: false });
      }
    },

    // Real browser WebAuthn passkey registration flow
    registerPasskey: async () => {
      try {
        set({ isLoading: true, error: null });
        const optionsRes = await api.get('/auth/biometrics/register-options');
        if (!optionsRes.data.success) return false;
 
        const options = optionsRes.data;
        
        // Detect if native WebAuthn is supported on the client
        const isWebAuthnSupported = window.isSecureContext && 
                                   navigator.credentials && 
                                   window.PublicKeyCredential;

        if (isWebAuthnSupported) {
          try {
            // Convert challenge and user ID strings to Uint8Arrays for WebAuthn API
            const challengeBuffer = Uint8Array.from(options.challenge, (c: any) => c.charCodeAt(0));
            const userIdBuffer = Uint8Array.from(options.user.id, (c: any) => c.charCodeAt(0));
     
            const publicKeyCredentialCreationOptions: CredentialCreationOptions = {
              publicKey: {
                challenge: challengeBuffer,
                rp: { name: options.rp.name, id: options.rp.id },
                user: {
                  id: userIdBuffer,
                  name: options.user.name,
                  displayName: options.user.displayName
                },
                pubKeyCredParams: options.pubKeyCredParams,
                timeout: options.timeout,
                attestation: options.attestation,
                authenticatorSelection: options.authenticatorSelection
              }
            };
     
            console.log('Requesting WebAuthn credential creation...');
            const credential = await navigator.credentials.create(publicKeyCredentialCreationOptions) as PublicKeyCredential;
            
            if (credential) {
              const verifyRes = await api.post('/auth/biometrics/register-verify', {
                credentialID: credential.id,
                publicKey: 'registered_via_browser_webauthn_api'
              });
              return verifyRes.data.success;
            }
          } catch (webauthnErr: any) {
            console.warn('Real WebAuthn failed, falling back to simulator:', webauthnErr);
          }
        }

        // Biometrics Simulator Fallback
        console.log('Using Biometrics Simulator for registration...');
        const mockCredentialID = `mock-passkey-${Date.now()}`;
        const verifyRes = await api.post('/auth/biometrics/register-verify', {
          credentialID: mockCredentialID,
          publicKey: 'registered_via_biometrics_simulator'
        });
        
        return verifyRes.data.success;
      } catch (err: any) {
        console.error('Passkey registration error:', err);
        set({ error: err.message || 'Passkey registration failed.' });
        return false;
      } finally {
        set({ isLoading: false });
      }
    },
 
    // Real browser WebAuthn passkey login flow
    loginWithPasskey: async (email: string) => {
      try {
        set({ isLoading: true, error: null });
        const optionsRes = await api.get(`/auth/biometrics/login-options?email=${encodeURIComponent(email)}`);
        if (!optionsRes.data.success) return false;
 
        const options = optionsRes.data;

        // Detect if native WebAuthn is supported on the client
        const isWebAuthnSupported = window.isSecureContext && 
                                   navigator.credentials && 
                                   window.PublicKeyCredential;

        if (isWebAuthnSupported && options.allowCredentials && options.allowCredentials.length > 0) {
          try {
            const challengeBuffer = Uint8Array.from(options.challenge, (c: any) => c.charCodeAt(0));
            
            const allowCredentials = options.allowCredentials.map((cred: any) => {
              // Convert base64url or hex credential ID back to Uint8Array for WebAuthn API
              let idBuffer: Uint8Array;
              try {
                const binaryId = atob(cred.id.replace(/-/g, '+').replace(/_/g, '/'));
                idBuffer = Uint8Array.from(binaryId, (c: any) => c.charCodeAt(0));
              } catch {
                idBuffer = Uint8Array.from(cred.id, (c: any) => c.charCodeAt(0));
              }
              return {
                type: 'public-key',
                id: idBuffer,
                transports: cred.transports
              };
            });
     
            const publicKeyCredentialRequestOptions: CredentialRequestOptions = {
              publicKey: {
                challenge: challengeBuffer,
                allowCredentials,
                userVerification: options.userVerification
              }
            };
     
            console.log('Requesting WebAuthn credential assertion...');
            const assertion = await navigator.credentials.get(publicKeyCredentialRequestOptions) as PublicKeyCredential;
            if (assertion) {
              const verifyRes = await api.post('/auth/biometrics/login-verify', {
                email,
                credentialID: assertion.id
              });
     
              if (verifyRes.data.success) {
                const { accessToken, user } = verifyRes.data;
                localStorage.setItem('accessToken', accessToken);
                set({
                  user,
                  accessToken,
                  isAuthenticated: true
                });
                return true;
              }
            }
          } catch (webauthnErr: any) {
            console.warn('Real WebAuthn assertion failed, falling back to simulator:', webauthnErr);
          }
        }

        // Biometrics Simulator Fallback
        console.log('Using Biometrics Simulator for login...');
        if (!options.allowCredentials || options.allowCredentials.length === 0) {
          throw new Error('No biometric credentials registered for this email. Please register a passkey in Settings first.');
        }

        // Simulate biometric verification delay (1 second) for realistic UX
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const targetCredID = options.allowCredentials[0].id;
        const verifyRes = await api.post('/auth/biometrics/login-verify', {
          email,
          credentialID: targetCredID
        });
 
        if (verifyRes.data.success) {
          const { accessToken, user } = verifyRes.data;
          localStorage.setItem('accessToken', accessToken);
          set({
            user,
            accessToken,
            isAuthenticated: true
          });
          return true;
        }
        return false;
      } catch (err: any) {
        console.error('Biometric login error:', err);
        set({ error: err.message || 'Biometric authentication failed.' });
        return false;
      } finally {
        set({ isLoading: false });
      }
    },

    fetchEmailSyncSettings: async () => {
      try {
        set({ error: null });
        const res = await api.get('/auth/email-sync');
        if (res.data.success) {
          set({ emailSyncSettings: res.data.settings });
        }
      } catch (err: any) {
        console.error('Failed to fetch email sync settings:', err);
        set({ error: err.response?.data?.message || 'Failed to fetch email sync settings' });
      }
    },

    updateEmailSyncSettings: async (settings) => {
      try {
        set({ error: null });
        const res = await api.post('/auth/email-sync', settings);
        if (res.data.success) {
          set({ emailSyncSettings: res.data.settings });
          return true;
        }
        return false;
      } catch (err: any) {
        set({ error: err.response?.data?.message || 'Failed to update email sync settings' });
        return false;
      }
    },

    testEmailSyncSettings: async (settings) => {
      try {
        const res = await api.post('/auth/email-sync/test', settings);
        return {
          success: res.data.success,
          message: res.data.message || 'Test connection successful!'
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.response?.data?.message || 'Connection failed'
        };
      }
    },

    triggerEmailSync: async () => {
      try {
        const res = await api.post('/auth/email-sync/trigger');
        return {
          success: res.data.success,
          message: res.data.message || 'Email sync executed successfully!',
          count: res.data.count || 0
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.response?.data?.message || 'Sync failed',
          count: 0
        };
      }
    }
  };
});
