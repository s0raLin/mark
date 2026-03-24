import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function SettingExport() {
  const { t } = useTranslation();

  return (
    <div className="space-y-10">
      <section>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4">
          <Download className="w-4 h-4 text-primary" />
          {t("export.title")}
        </h2>
        <div className="space-y-3">
          <div className="settings-m3-card p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">{t("export.defaultFormat")}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t("export.defaultFormatDesc")}</p>
            </div>
            <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-primary focus:border-primary appearance-none">
              <option>PDF</option>
              <option>HTML</option>
              <option>Markdown</option>
              <option>PNG</option>
            </select>
          </div>
          <div className="settings-m3-card p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">{t("export.includeMetadata")}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t("export.includeMetadataDesc")}</p>
            </div>
            <div className="settings-m3-switch-track w-11 h-6 bg-primary rounded-full relative p-1 cursor-pointer shrink-0">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
