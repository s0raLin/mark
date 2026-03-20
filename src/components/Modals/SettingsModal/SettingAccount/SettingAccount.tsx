import { Edit3, Smile } from "lucide-react";

export default function SettingAccount() {
  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
          <Smile className="w-5 h-5 text-primary" />
          Account Profile
        </h2>
        <div className="p-8 rounded-3xl bg-gradient-to-br from-pink-50 to-white border border-pink-100 shadow-sm">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-primary/20">
              G
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">gl0wniapar</h3>
              <p className="text-sm text-slate-500">gl0wniapar@gmail.com</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                  Pro Member
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 rounded-2xl bg-white border border-pink-100 text-sm font-bold text-slate-600 hover:bg-pink-50 transition-all">
              Edit Profile
            </button>
            <button className="p-4 rounded-2xl bg-white border border-pink-100 text-sm font-bold text-rose-400 hover:bg-rose-50 transition-all">
              Sign Out
            </button>
          </div>
        </div>
      </section>

      <section className="flex flex-col items-center justify-center py-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-xl shadow-primary/30 mb-4">
          <Edit3 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-800 mb-1">
          NoteBuddy Pro
        </h2>
        <p className="text-primary font-bold uppercase tracking-[0.3em] text-[10px] mb-4">
          Version 2.4.0 "Sparkle"
        </p>
        <p className="text-xs text-slate-400 max-w-xs">
          Crafted with love for writers, dreamers, and builders.
        </p>
      </section>
    </div>
  );
}
