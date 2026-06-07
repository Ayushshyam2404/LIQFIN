import React from 'react';
import { useSettingsStore, CurrencyType } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { Sun, Moon, Coins, HelpCircle, Mail, Check, AlertCircle, RefreshCw, Loader2, Save, Key, Fingerprint, Bell } from 'lucide-react';
import { isPushSupported, getNotificationPermission, subscribeUserToPush, unsubscribeUserFromPush } from '../services/pushNotification';

export const SettingsPage: React.FC = () => {
  const { currency, theme, setCurrency, setTheme } = useSettingsStore();
  const { 
    user,
    registerPasskey,
    emailSyncSettings, 
    fetchEmailSyncSettings, 
    updateEmailSyncSettings, 
    testEmailSyncSettings, 
    triggerEmailSync,
    isLoading: isAuthLoading
  } = useAuthStore();

  const { 
    fetchExpenses, 
    fetchCards, 
    fetchBudgets, 
    fetchDashboard, 
    fetchNotifications 
  } = useFinanceStore();

  const [enabled, setEnabled] = React.useState(false);
  const [host, setHost] = React.useState('imap.gmail.com');
  const [port, setPort] = React.useState(993);
  const [secure, setSecure] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  
  const [testResult, setTestResult] = React.useState<{ success: boolean; message: string } | null>(null);
  const [syncResult, setSyncResult] = React.useState<{ success: boolean; message: string; count: number } | null>(null);
  const [testing, setTesting] = React.useState(false);
  
  const [defaultToPasskey, setDefaultToPasskey] = React.useState(() => {
    return localStorage.getItem('liquid_default_to_passkey') === 'true';
  });
  const [passkeyStatus, setPasskeyStatus] = React.useState<{ success: boolean; message: string } | null>(null);
  const [registeringPasskey, setRegisteringPasskey] = React.useState(false);

  // Web Push State variables
  const [pushSupported, setPushSupported] = React.useState(false);
  const [pushEnabled, setPushEnabled] = React.useState(false);
  const [pushLoading, setPushLoading] = React.useState(false);
  const [pushStatus, setPushStatus] = React.useState<{ success: boolean; message: string } | null>(null);

  React.useEffect(() => {
    const supported = isPushSupported();
    setPushSupported(supported);
    if (supported) {
      setPushEnabled(getNotificationPermission() === 'granted');
    }
  }, []);

  const handleTogglePush = async () => {
    setPushLoading(true);
    setPushStatus(null);
    try {
      if (pushEnabled) {
        const success = await unsubscribeUserFromPush();
        if (success) {
          setPushEnabled(false);
          setPushStatus({ success: true, message: 'Unsubscribed from push alerts successfully.' });
        } else {
          setPushStatus({ success: false, message: 'Failed to unsubscribe.' });
        }
      } else {
        const success = await subscribeUserToPush();
        if (success) {
          setPushEnabled(true);
          setPushStatus({ success: true, message: 'Push alerts enabled! You will now receive system notifications.' });
        } else {
          setPushStatus({ success: false, message: 'Permission denied or browser error.' });
        }
      }
    } catch (err: any) {
      setPushStatus({ success: false, message: err.message || 'Error toggling push notifications.' });
    } finally {
      setPushLoading(false);
    }
  };

  const handleRegisterPasskey = async () => {
    setRegisteringPasskey(true);
    setPasskeyStatus(null);
    try {
      const success = await registerPasskey();
      if (success) {
        setPasskeyStatus({ success: true, message: 'Passkey registered successfully on this device!' });
        localStorage.setItem('liquid_default_to_passkey', 'true');
        if (user?.email) {
          localStorage.setItem('liquid_saved_email', user.email);
        }
        setDefaultToPasskey(true);
      } else {
        setPasskeyStatus({ success: false, message: 'Could not register passkey. Make sure biometrics are supported.' });
      }
    } catch (err: any) {
      setPasskeyStatus({ success: false, message: err.message || 'Passkey registration failed.' });
    } finally {
      setRegisteringPasskey(false);
    }
  };

  const handleTogglePasskeyDefault = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setDefaultToPasskey(checked);
    if (checked) {
      localStorage.setItem('liquid_default_to_passkey', 'true');
      if (user?.email) {
        localStorage.setItem('liquid_saved_email', user.email);
      }
    } else {
      localStorage.removeItem('liquid_default_to_passkey');
      localStorage.removeItem('liquid_saved_email');
    }
  };
  const [syncing, setSyncing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetchEmailSyncSettings();
  }, []);

  React.useEffect(() => {
    if (emailSyncSettings) {
      setEnabled(emailSyncSettings.enabled);
      setHost(emailSyncSettings.host);
      setPort(emailSyncSettings.port);
      setSecure(emailSyncSettings.secure);
      setEmail(emailSyncSettings.email);
      setPassword(emailSyncSettings.password || '');
    }
  }, [emailSyncSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const success = await updateEmailSyncSettings({
      enabled,
      host,
      port,
      secure,
      email,
      password
    });
    setSaving(false);
    if (success) {
      alert('Email synchronization settings saved successfully!');
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testEmailSyncSettings({
      enabled,
      host,
      port,
      secure,
      email,
      password
    });
    setTestResult(result);
    setTesting(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    const result = await triggerEmailSync();
    setSyncResult(result);
    setSyncing(false);

    if (result.success) {
      // Refresh all financial records in the global store immediately
      try {
        await Promise.all([
          fetchExpenses(),
          fetchCards(),
          fetchBudgets(),
          fetchDashboard(),
          fetchNotifications()
        ]);
      } catch (err) {
        console.error('Error refreshing store records after email sync:', err);
      }
    }
  };

  const currencies: { code: CurrencyType; name: string; symbol: string; desc: string; flag: string }[] = [
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', desc: 'Indian Rupee (INR) - Ideal for India', flag: '🇮🇳' },
    { code: 'USD', name: 'US Dollar', symbol: '$', desc: 'United States Dollar', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', symbol: '€', desc: 'European Union Euro', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', symbol: '£', desc: 'Great British Pound', flag: '🇬🇧' },
  ];

  return (
    <div className="space-y-8 max-w-4xl pb-10">
      {/* Header Sticker Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-4 border-brand-on-surface pb-6">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight">SETTINGS</h1>
          <p className="font-mono text-xs text-brand-outline uppercase mt-1">Configure your workspace theme and region preferences</p>
        </div>
        <div className="bg-brand-secondary-fixed text-brand-on-surface px-4 py-2 border-2 border-brand-on-surface font-mono text-xs font-black sticker-rotate-right neo-shadow-sm">
          PREFERENCES_PANEL
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column info */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-5 neo-panel space-y-3">
            <h3 className="font-sans text-sm font-black uppercase tracking-wide">Workspace Settings</h3>
            <p className="text-xs text-brand-outline leading-relaxed">
              These settings customize your local dashboard representation. All transactions, budgets, goals, and credit card balances will automatically recalculate and format to reflect these values.
            </p>
            <div className="border-t-2 border-brand-on-surface/10 pt-3 flex items-center gap-2 text-[10px] font-mono text-brand-outline">
              <HelpCircle className="w-4 h-4" />
              <span>SAVED LOCALLY IN BROWSER</span>
            </div>
          </div>
        </div>

        {/* Right column settings panels */}
        <div className="md:col-span-2 space-y-6">
          {/* THEME TOGGLE SECTION */}
          <div className="p-6 neo-panel-lg space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-brand-primary-fixed border-2 border-brand-on-surface text-brand-on-surface font-black">
                {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <h2 className="text-lg font-black uppercase tracking-wide">DISPLAY THEME</h2>
            </div>
            <p className="text-xs text-brand-outline">
              Switch between Light Mode and Dark Mode. Neo-brutalist high-contrast borders and custom patterns adapt automatically.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-3 py-4 border-2 border-brand-on-surface font-black uppercase text-xs transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-brand-surface-lowest text-brand-on-surface neo-shadow-md border-brand-on-surface translate-x-[-2px] translate-y-[-2px]'
                    : 'bg-brand-surface text-brand-outline hover:text-brand-on-surface border-dashed'
                }`}
              >
                <Sun className={`w-4 h-4 ${theme === 'light' ? 'text-amber-500 fill-amber-500' : ''}`} />
                <span>LIGHT MODE</span>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-3 py-4 border-2 border-brand-on-surface font-black uppercase text-xs transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-brand-secondary-fixed text-brand-on-surface neo-shadow-md border-brand-on-surface translate-x-[-2px] translate-y-[-2px]'
                    : 'bg-brand-surface text-brand-outline hover:text-brand-on-surface border-dashed'
                }`}
              >
                <Moon className={`w-4 h-4 ${theme === 'dark' ? 'text-blue-400 fill-blue-400' : ''}`} />
                <span>DARK MODE</span>
              </button>
            </div>
          </div>

          {/* CURRENCY CONFIGURATION SECTION */}
          <div className="p-6 neo-panel-lg space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-brand-secondary-fixed border-2 border-brand-on-surface text-brand-on-surface font-black">
                <Coins className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-wide">CURRENCY SYMBOL</h2>
            </div>
            <p className="text-xs text-brand-outline">
              Select your currency denomination. For users in India, switching to <b>INR (₹)</b> will format values to the Indian currency grouping system and display the Rupee symbol.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {currencies.map((curr) => {
                const isSelected = currency === curr.code;
                return (
                  <button
                    key={curr.code}
                    onClick={() => setCurrency(curr.code)}
                    className={`flex items-start gap-4 p-4 border-2 border-brand-on-surface text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-brand-primary-fixed border-brand-on-surface neo-shadow-md translate-x-[-2px] translate-y-[-2px]'
                        : 'bg-brand-surface-lowest text-brand-on-surface hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_var(--border-color)] border-dashed'
                    }`}
                  >
                    <span className="text-3xl filter drop-shadow">{curr.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-sans text-xs font-black uppercase tracking-wide">{curr.name}</span>
                        <span className="font-mono text-xs font-black px-1.5 py-0.5 border border-brand-on-surface bg-brand-surface">{curr.symbol}</span>
                      </div>
                      <p className="text-[10px] text-brand-outline mt-1 truncate">{curr.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BIOMETRIC LOGIN SECTION */}
          <div className="p-6 neo-panel-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-brand-secondary-fixed border-2 border-brand-on-surface text-brand-on-surface font-black">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black uppercase tracking-wide">BIOMETRIC LOGIN (PASSKEY)</h2>
              </div>
            </div>

            <p className="text-xs text-brand-outline">
              Secure your account using your device's native fingerprint scanner (Touch ID), Face ID, or system PIN. Registering a passkey allows you to sign in safely from this device without entering a password.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-2 border-brand-on-surface bg-brand-surface-lowest shadow-[2px_2px_0px_0px_rgba(27,27,27,1)]">
                <div>
                  <h4 className="text-xs font-mono font-black uppercase">Device Passkey Credentials</h4>
                  <p className="text-[10px] text-brand-outline mt-0.5">
                    {user?.webAuthnCredentials && user.webAuthnCredentials.length > 0 
                      ? `${user.webAuthnCredentials.length} passkey(s) registered for this account.`
                      : 'No passkeys registered yet. Create one below.'}
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={handleRegisterPasskey}
                  disabled={registeringPasskey || isAuthLoading}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-brand-on-surface font-mono text-[10px] font-black uppercase bg-brand-primary text-white shadow-[2px_2px_0px_0px_rgba(27,27,27,1)] hover:shadow-[1px_1px_0px_0px_rgba(27,27,27,1)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-55 shrink-0"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{registeringPasskey ? 'REGISTERING...' : 'REGISTER PASSKEY'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="biometric-default-enabled"
                  checked={defaultToPasskey}
                  onChange={handleTogglePasskeyDefault}
                  className="w-5 h-5 border-2 border-brand-on-surface rounded-none accent-brand-primary cursor-pointer"
                />
                <label htmlFor="biometric-default-enabled" className="text-xs font-mono font-black uppercase cursor-pointer select-none">
                  Default to Biometric Login on this device
                </label>
              </div>

              {passkeyStatus && (
                <div className={`p-3 border-2 font-mono text-[10px] font-bold flex items-start gap-2 ${
                  passkeyStatus.success 
                    ? 'bg-emerald-100 border-emerald-500 text-emerald-800' 
                    : 'bg-rose-100 border-rose-500 text-rose-800'
                }`}>
                  {passkeyStatus.success ? <Check className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                  <div>
                    <span className="uppercase font-black block">{passkeyStatus.success ? 'PASSKEY REGISTERED' : 'REGISTRATION FAILED'}</span>
                    <p className="mt-0.5 text-xs font-normal">{passkeyStatus.message}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PUSH ALERTS (PWA NOTIFICATIONS) SECTION */}
          <div className="p-6 neo-panel-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-brand-primary border-2 border-brand-on-surface text-brand-on-surface font-black">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-black uppercase tracking-wide">PUSH ALERTS (PWA NOTIFICATIONS)</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border-2 border-brand-on-surface ${
                  pushEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {pushEnabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
            </div>

            <p className="text-xs text-brand-outline">
              Subscribe to push notifications on this device to receive instant alerts for budget breaches, transaction notifications, credit card statement deadlines, and automated sync summaries directly on your home screen.
            </p>

            <div className="space-y-4 pt-2">
              {!pushSupported ? (
                <div className="p-3 border-2 border-amber-500 bg-amber-100 text-amber-900 font-mono text-[10px] font-bold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
                  <div>
                    <span className="uppercase font-black block">Not Supported on This Browser</span>
                    <p className="mt-0.5 text-xs font-normal">
                      Web Push is only supported on secure origins (HTTPS or localhost). On iOS, you must first add this web app to your Home Screen (tap Share, then "Add to Home Screen") and launch it as an installed app shortcut to trigger push notifications.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-2 border-brand-on-surface bg-brand-surface-lowest shadow-[2px_2px_0px_0px_rgba(27,27,27,1)]">
                  <div>
                    <h4 className="text-xs font-mono font-black uppercase">PWA Push Status</h4>
                    <p className="text-[10px] text-brand-outline mt-0.5 font-bold uppercase">
                      {pushEnabled ? 'Active Subscription' : 'Inactive Subscription'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleTogglePush}
                    disabled={pushLoading}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-brand-on-surface font-mono text-[10px] font-black uppercase bg-brand-primary text-white shadow-[2px_2px_0px_0px_rgba(27,27,27,1)] hover:shadow-[1px_1px_0px_0px_rgba(27,27,27,1)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-55 shrink-0"
                  >
                    {pushLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Bell className="w-3.5 h-3.5 font-black" />
                    )}
                    <span>{pushEnabled ? 'Disable Push Alerts' : 'Enable Push Alerts'}</span>
                  </button>
                </div>
              )}

              {pushStatus && (
                <div className={`p-3 border-2 font-mono text-[10px] font-bold flex items-start gap-2 ${
                  pushStatus.success 
                    ? 'bg-emerald-100 border-emerald-500 text-emerald-800' 
                    : 'bg-rose-100 border-rose-500 text-rose-800'
                }`}>
                  {pushStatus.success ? (
                    <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <div>
                    <span className="uppercase font-black block">
                      {pushStatus.success ? 'Success' : 'Subscription Error'}
                    </span>
                    <p className="mt-0.5 text-xs font-normal">{pushStatus.message}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* EMAIL SYNC CONFIGURATION SECTION */}
          <div className="p-6 neo-panel-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-brand-primary border-2 border-brand-on-surface text-brand-on-surface font-black">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-black uppercase tracking-wide">EMAIL TRANSACTION SYNC</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border-2 border-brand-on-surface ${
                  enabled ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {enabled ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>

            <p className="text-xs text-brand-outline">
              Automatically sync credit card transaction alerts from your email inbox. The system scans your inbox every two minutes for Axis Bank credit card notifications and other bank alerts, logging them straight to your ledger.
            </p>

            <form onSubmit={handleSave} className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-2">
                <input
                  type="checkbox"
                  id="email-sync-enabled"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-5 h-5 border-2 border-brand-on-surface rounded-none accent-brand-primary cursor-pointer"
                />
                <label htmlFor="email-sync-enabled" className="text-xs font-mono font-black uppercase cursor-pointer select-none">
                  Enable Automatic Email Outflow Logging
                </label>
              </div>

              {enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border-2 border-brand-on-surface bg-brand-surface-lowest shadow-[2px_2px_0px_0px_rgba(27,27,27,1)] space-y-2 sm:space-y-0">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">IMAP Server Address</label>
                    <input
                      type="text"
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      placeholder="imap.gmail.com"
                      className="w-full px-3 py-2 neo-input"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">IMAP Port</label>
                      <input
                        type="number"
                        value={port}
                        onChange={(e) => setPort(Number(e.target.value))}
                        placeholder="993"
                        className="w-full px-3 py-2 neo-input"
                        required
                      />
                    </div>
                    <div className="flex items-end pb-2.5 pl-2">
                      <label className="flex items-center gap-1.5 text-[10px] uppercase font-mono font-bold text-brand-outline cursor-pointer">
                        <input
                          type="checkbox"
                          checked={secure}
                          onChange={(e) => setSecure(e.target.checked)}
                          className="w-4 h-4 border-2 border-brand-on-surface rounded-none accent-brand-primary"
                        />
                        <span>SSL / TLS</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your-email@gmail.com"
                      className="w-full px-3 py-2 neo-input"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">App Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full px-3 py-2 neo-input"
                      required
                    />
                  </div>
                  
                  <div className="col-span-1 sm:col-span-2 text-[10px] text-brand-outline leading-tight font-mono pt-1">
                    💡 <b>Tip:</b> If using Gmail, you must configure a 16-character <b>App Password</b> under Google Account Security settings.
                  </div>
                </div>
              )}

              {emailSyncSettings?.lastSync && (
                <div className="text-[10px] font-mono text-brand-outline bg-brand-surface p-2 border border-brand-on-surface/25 flex items-center justify-between">
                  <span>LAST AUTOMATIC SCAN PERFORMED AT:</span>
                  <span className="font-bold">{new Date(emailSyncSettings.lastSync).toLocaleString()}</span>
                </div>
              )}

              {/* Status and Action Buttons */}
              {testResult && (
                <div className={`p-3 border-2 font-mono text-[10px] font-bold flex items-start gap-2 ${
                  testResult.success 
                    ? 'bg-emerald-100 border-emerald-500 text-emerald-800' 
                    : 'bg-rose-100 border-rose-500 text-rose-800'
                }`}>
                  {testResult.success ? <Check className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                  <div>
                    <span className="uppercase font-black block">{testResult.success ? 'CONNECTION SUCCESS' : 'CONNECTION FAILED'}</span>
                    <p className="mt-0.5 text-xs font-normal">{testResult.message}</p>
                  </div>
                </div>
              )}

              {syncResult && (
                <div className={`p-3 border-2 font-mono text-[10px] font-bold flex items-start gap-2 ${
                  syncResult.success 
                    ? 'bg-sky-100 border-sky-500 text-sky-800' 
                    : 'bg-rose-100 border-rose-500 text-rose-800'
                }`}>
                  {syncResult.success ? <Check className="w-4 h-4 shrink-0 text-sky-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                  <div>
                    <span className="uppercase font-black block">{syncResult.success ? 'SYNC COMPLETE' : 'SYNC FAILED'}</span>
                    <p className="mt-0.5 text-xs font-normal">
                      {syncResult.message}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving || isAuthLoading}
                  className="flex items-center gap-2 px-5 py-2.5 border-2 border-brand-on-surface font-mono text-xs font-black uppercase bg-brand-primary text-white shadow-[3px_3px_0px_0px_rgba(27,27,27,1)] hover:shadow-[1px_1px_0px_0px_rgba(27,27,27,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer disabled:opacity-55"
                >
                  <Save className="w-4 h-4 text-white" />
                  <span>{saving ? 'SAVING...' : 'SAVE CONFIG'}</span>
                </button>

                {enabled && (
                  <>
                    <button
                      type="button"
                      onClick={handleTest}
                      disabled={testing || isAuthLoading}
                      className="flex items-center gap-2 px-4 py-2.5 border-2 border-brand-on-surface font-mono text-xs font-black uppercase bg-white text-brand-on-surface shadow-[3px_3px_0px_0px_rgba(27,27,27,1)] hover:shadow-[1px_1px_0px_0px_rgba(27,27,27,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer disabled:opacity-55"
                    >
                      {testing ? <Loader2 className="w-4 h-4 animate-spin text-brand-on-surface" /> : null}
                      <span>TEST CONNECTION</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSync}
                      disabled={syncing || isAuthLoading}
                      className="flex items-center gap-2 px-4 py-2.5 border-2 border-brand-on-surface font-mono text-xs font-black uppercase bg-brand-secondary-fixed text-brand-on-surface shadow-[3px_3px_0px_0px_rgba(27,27,27,1)] hover:shadow-[1px_1px_0px_0px_rgba(27,27,27,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer disabled:opacity-55"
                    >
                      <RefreshCw className={`w-4 h-4 text-brand-on-surface ${syncing ? 'animate-spin' : ''}`} />
                      <span>SYNC NOW</span>
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
