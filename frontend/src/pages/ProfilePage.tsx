import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { User, Mail, Smartphone, Briefcase, Calendar, Save, Sparkles, KeyRound } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [age, setAge] = useState(user?.age !== undefined ? String(user.age) : '');
  const [occupation, setOccupation] = useState(user?.occupation || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarSeed, setAvatarSeed] = useState(user?.name || 'Julian');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);

  const currentAvatar = user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(avatarSeed)}`;

  const handleRandomizeAvatar = () => {
    const randomSeeds = ['Aria', 'Leo', 'Nova', 'Echo', 'Felix', 'Zara', 'Milo', 'Luna', 'Kai', 'Iris'];
    const randomSeed = randomSeeds[Math.floor(Math.random() * randomSeeds.length)] + '_' + Math.floor(Math.random() * 1000);
    setAvatarSeed(randomSeed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    clearError();

    if (password && password !== confirmPassword) {
      setStatus({ success: false, message: 'Passwords do not match.' });
      return;
    }

    if (password && password.length < 6) {
      setStatus({ success: false, message: 'Password must be at least 6 characters.' });
      return;
    }

    // Build update object
    const updateData: any = {
      name,
      email,
      age: age ? Number(age) : null,
      occupation,
      phone,
      avatar: currentAvatar
    };

    if (password) {
      updateData.password = password;
    }

    const success = await updateProfile(updateData);
    if (success) {
      setStatus({ success: true, message: 'Profile details updated successfully!' });
      setPassword('');
      setConfirmPassword('');
    } else {
      setStatus({ success: false, message: 'Failed to update profile.' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-brand-on-surface uppercase tracking-tight font-mono">USER_PROFILE</h2>
        <p className="text-xs text-brand-outline font-medium">Configure account credentials and personal metadata.</p>
      </div>

      {status && (
        <div className={`p-4 border-4 font-mono text-xs font-black shadow-[4px_4px_0px_0px_var(--border-color)] flex items-start gap-3 ${
          status.success 
            ? 'bg-emerald-100 border-emerald-500 text-emerald-800' 
            : 'bg-rose-100 border-rose-500 text-rose-800'
        }`}>
          <div className="mt-0.5 uppercase tracking-wide">
            {status.success ? 'Success:' : 'Error:'}
          </div>
          <div className="font-bold">{status.message}</div>
        </div>
      )}

      {error && (
        <div className="p-4 border-4 border-rose-500 bg-rose-100 text-rose-800 font-mono text-xs font-black shadow-[4px_4px_0px_0px_var(--border-color)]">
          ERROR: {error.toUpperCase()}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Avatar Display */}
        <div className="md:col-span-1 border-4 border-brand-on-surface bg-brand-surface-lowest p-6 shadow-[6px_6px_0px_0px_var(--border-color)] flex flex-col items-center justify-between text-center min-h-[350px]">
          <div className="space-y-4 w-full">
            <h3 className="font-extrabold text-xs uppercase font-mono tracking-tight text-brand-outline">Avatar Profile</h3>
            
            {/* Avatar Circle */}
            <div className="w-32 h-32 rounded-full border-4 border-brand-on-surface bg-brand-secondary-fixed overflow-hidden mx-auto shadow-[4px_4px_0px_0px_var(--border-color)]">
              <img 
                src={currentAvatar} 
                alt="Avatar Preview" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono font-bold text-brand-outline block">Avatar Seed</label>
              <input
                type="text"
                value={avatarSeed}
                onChange={(e) => setAvatarSeed(e.target.value)}
                className="w-full px-2 py-1.5 neo-input text-center text-xs font-bold"
                placeholder="Enter custom seed"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleRandomizeAvatar}
            className="w-full py-2.5 mt-4 border-2 border-brand-on-surface bg-brand-surface text-brand-on-surface font-black uppercase text-[10px] tracking-wider font-mono shadow-[3px_3px_0px_0px_var(--border-color)] hover:shadow-[1px_1px_0px_0px_var(--border-color)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Randomize Seed</span>
          </button>
        </div>

        {/* Right Columns: Forms */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Metadata Section */}
          <div className="border-4 border-brand-on-surface bg-brand-surface-lowest p-6 shadow-[6px_6px_0px_0px_var(--border-color)] space-y-4">
            <h3 className="font-extrabold text-sm uppercase font-mono tracking-tight text-brand-on-surface pb-2 border-b-2 border-brand-on-surface">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-outline flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 neo-input text-xs font-bold"
                  placeholder="Julian Sterling"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-outline flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Account</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 neo-input text-xs font-bold"
                  placeholder="julian@example.com"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-outline flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Age</span>
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3 py-2 neo-input text-xs font-bold"
                  placeholder="e.g. 28"
                  min="0"
                  max="120"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-outline flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Occupation</span>
                </label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full px-3 py-2 neo-input text-xs font-bold"
                  placeholder="e.g. Product Designer"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-outline flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 neo-input text-xs font-bold"
                  placeholder="e.g. +91 99518 60002"
                />
              </div>
            </div>
          </div>

          {/* Security Credentials Section */}
          <div className="border-4 border-brand-on-surface bg-brand-surface-lowest p-6 shadow-[6px_6px_0px_0px_var(--border-color)] space-y-4">
            <h3 className="font-extrabold text-sm uppercase font-mono tracking-tight text-brand-on-surface pb-2 border-b-2 border-brand-on-surface flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-brand-primary" />
              <span>Security Credentials</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 neo-input text-xs font-bold"
                  placeholder="Leave blank to keep current"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 neo-input text-xs font-bold"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          {/* Save Action Banner */}
          <div className="flex justify-end gap-4 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 border-2 border-brand-on-surface font-mono text-xs font-black uppercase bg-brand-primary text-white shadow-[4px_4px_0px_0px_var(--border-color)] hover:shadow-[1px_1px_0px_0px_var(--border-color)] hover:translate-x-[3px] hover:translate-y-[3px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer disabled:opacity-55"
            >
              <Save className="w-4 h-4 text-white" />
              <span>{isLoading ? 'SAVING...' : 'SAVE CHANGES'}</span>
            </button>
          </div>

        </div>

      </form>

    </div>
  );
};

export default ProfilePage;
