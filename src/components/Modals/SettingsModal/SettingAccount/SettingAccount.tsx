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
    <div className="space-y-10">
      <section>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4">
          <Smile className="w-4 h-4 text-primary" />
          {t("account.profile")}
        </h2>
        <div className="settings-m3-card p-6 rounded-2xl">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold shadow-lg shrink-0">
              G
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">gl0wniapar</h3>
              <p className="mt-1 text-sm text-slate-600">gl0wniapar@gmail.com</p>
              <span className="mt-2 inline-block px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold uppercase tracking-wide">
                {t("account.proMember")}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="settings-m3-outlined-button p-3 rounded-xl text-sm text-slate-600 transition-all">
              {t("account.editProfile")}
            </button>
            <button className="settings-m3-outlined-button p-3 rounded-xl text-sm text-rose-400 transition-all">
              {t("account.signOut")}
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4">
          <Globe className="w-4 h-4 text-primary" />
          {t("account.language")}
        </h2>
        <div className="settings-m3-card p-5 rounded-2xl">
          <p className="mb-4 text-sm leading-6 text-slate-600">{t("account.languageDesc")}</p>
          <div className="flex gap-2">
            {LANGUAGES.map(({ code, labelKey }) => (
              <button
                key={code}
                onClick={() => setDraftLang(code)}
                data-active={draftLang === code}
                className={cn(
                  "settings-m3-segmented-button flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border",
                  draftLang === code
                    ? "text-white"
                    : "text-slate-600",
                )}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col items-center py-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-md mb-3">
          <Edit3 className="w-6 h-6" />
        </div>
        <h2 className="text-base font-semibold text-slate-800">NoteBuddy Pro</h2>
        <p className="mt-1 text-[11px] text-primary/80 uppercase tracking-widest mb-3">{t("account.version")}</p>
        <p className="max-w-xs text-sm leading-6 text-slate-600">{t("account.tagline")}</p>
      </section>
    </div>
  );
}
