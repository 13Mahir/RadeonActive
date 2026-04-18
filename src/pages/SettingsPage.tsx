// src/pages/SettingsPage.tsx
import { useState } from 'react';
import { motion } from 'motion/react';
import { Globe, Bell, MapPin, User, CheckCircle, Shield } from 'lucide-react';
import { useLanguage, Language } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const LANGUAGE_OPTIONS: { code: Language; label: string; nativeName: string; flag: string }[] = [
  { code: 'en', label: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'gu', label: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🟠' },
];

const DISTRICT_OPTIONS = ['All Districts', 'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'];

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(() =>
    localStorage.getItem('dbt_notifications') !== 'false'
  );
  const [defaultDistrict, setDefaultDistrict] = useState(() =>
    localStorage.getItem('dbt_default_district') || 'All Districts'
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('dbt_notifications', String(notifications));
    localStorage.setItem('dbt_default_district', defaultDistrict);
    window.dispatchEvent(new Event('storage'));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-10 space-y-10 max-w-4xl">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-black tracking-tighter text-on-surface mb-2"
        >
          {t('settings.title')}
        </motion.h1>
        <p className="text-on-surface-variant font-medium">
          Manage your preferences for the DBT Intelligence System.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8">

        {/* Language */}
        <div className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-xl border-t-4 border-black ring-1 ring-black/5">
          <div className="flex items-center gap-3 mb-6">
            <Globe size={20} className="text-on-surface-variant" />
            <h3 className="text-lg font-black tracking-tight">{t('settings.language')}</h3>
          </div>
          <div className="space-y-3">
            {LANGUAGE_OPTIONS.map(lang => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all active:scale-95 font-label
                  ${language === lang.code
                    ? 'border-black bg-surface-container-high'
                    : 'border-outline-variant/20 hover:bg-surface-container-high'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{lang.flag}</span>
                  <div className="text-left">
                    <p className="text-sm font-black">{lang.nativeName}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">{lang.label}</p>
                  </div>
                </div>
                {language === lang.code && (
                  <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                    <CheckCircle size={12} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-on-surface-variant font-label uppercase tracking-widest mt-4">
            UI labels update immediately. Page content translations are applied to key elements.
          </p>
        </div>

        {/* Profile */}
        <div className="space-y-6">
          <div className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-xl border-t-4 border-blue-600 ring-1 ring-black/5">
            <div className="flex items-center gap-3 mb-6">
              <User size={20} className="text-on-surface-variant" />
              <h3 className="text-lg font-black tracking-tight">{t('settings.profile')}</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Full Name', value: user?.full_name || '—' },
                { label: 'Username', value: user?.username || '—' },
                { label: 'Role', value: user?.role || '—' },
                { label: 'Staff ID', value: user?.staff_id || '—' },
                { label: 'Jurisdiction', value: user?.district || '—' },
              ].map(field => (
                <div key={field.label} className="flex justify-between items-center border-b border-outline-variant/10 pb-3">
                  <span className="text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">{field.label}</span>
                  <span className="text-sm font-bold text-on-surface">{field.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">
              <Shield size={12} />
              Profile managed by system admin
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-surface-container-lowest p-6 rounded-[2rem] shadow-sm border border-outline-variant/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-on-surface-variant" />
                <div>
                  <p className="text-sm font-black">{t('settings.notifications')}</p>
                  <p className="text-[10px] text-on-surface-variant font-label uppercase tracking-widest">Live feed alerts</p>
                </div>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full transition-all relative ${notifications ? 'bg-black' : 'bg-surface-container-highest'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${notifications ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {/* Default District */}
          <div className="bg-surface-container-lowest p-6 rounded-[2rem] shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-4">
              <MapPin size={18} className="text-on-surface-variant" />
              <p className="text-sm font-black">{t('settings.default_district')}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DISTRICT_OPTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setDefaultDistrict(d)}
                  className={`py-2.5 px-4 rounded-xl font-label text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 text-center
                    ${defaultDistrict === d ? 'bg-black text-white' : 'bg-surface-container-high hover:bg-surface-container-highest'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          className="gradient-cta text-white px-8 py-3.5 rounded-xl font-label text-[11px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 shadow-xl transition-all flex items-center gap-2"
        >
          {saved ? <CheckCircle size={16} /> : null}
          {saved ? t('settings.saved') : t('settings.save')}
        </button>
        {saved && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-[11px] font-black font-label uppercase tracking-widest text-green-600"
          >
            ✓ Changes applied
          </motion.span>
        )}
      </div>
    </div>
  );
}
