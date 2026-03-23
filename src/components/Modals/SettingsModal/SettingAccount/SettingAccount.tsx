import { Edit3, Smile, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";

const LANGUAGES = [
  { code: "zh", labelKey: "account.langZh" },
  { code: "en", labelKey: "account.langEn" },
  { code: "ja", labelKey: "account.langJa" },
] as const;

interface SettingAccountProps {
  draftLang: string;
  setDraftLang: (lang: string) => void;
}

export default function SettingAccount({ draftLang, setDraftLang }: SettingAccountProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
          <Smile className="w-5 h-5 text-primary" />
          {t("account.profile")}
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
                  {t("account.proMember")}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 rounded-2xl bg-white border border-pink-100 text-sm font-bold text-slate-600 hover:bg-pink-50 transition-all">
              {t("account.editProfile")}
            </button>
            <button className="p-4 rounded-2xl bg-white border border-pink-100 text-sm font-bold text-rose-400 hover:bg-rose-50 transition-all">
              {t("account.signOut")}
            </button>
          </div>
        </div>
      </section>

      {/* Language Section */}
      <section>
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
          <Globe className="w-5 h-5 text-primary" />
          {t("account.language")}
        </h2>
        <div className="p-6 rounded-3xl bg-gradient-to-br from-pink-50 to-white border border-pink-100 shadow-sm">
          <p className="text-sm text-slate-500 mb-4">{t("account.languageDesc")}</p>
          <div className="flex gap-3">
            {LANGUAGES.map(({ code, labelKey }) => (
              <button
                key={code}
                onClick={() => setDraftLang(code)}
                className={cn(
                  "flex-1 py-3 rounded-2xl text-sm font-bold transition-all border-2",
                  draftLang === code
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/30"
                    : "bg-white text-slate-500 border-pink-100 hover:border-primary/40 hover:text-primary",
                )}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col items-center justify-center py-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-xl shadow-primary/30 mb-4">
          <Edit3 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-800 mb-1">NoteBuddy Pro</h2>
        <p className="text-primary font-bold uppercase tracking-[0.3em] text-[10px] mb-4">
          {t("account.version")}
        </p>
        <p className="text-xs text-slate-400 max-w-xs">{t("account.tagline")}</p>
      </section>
    </div>
  );
}
