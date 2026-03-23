import { Layout, Terminal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ShortcutRow } from "./ShortcutRow";

export default function SettingGeneral() {
  const { t } = useTranslation();

  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
          <Layout className="w-5 h-5 text-primary" />
          {t("general.workspace")}
        </h2>
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-pink-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">{t("general.workspaceName")}</p>
              <p className="text-xs text-slate-400">{t("general.workspaceNameDesc")}</p>
            </div>
            <input
              type="text"
              defaultValue="NoteBuddy"
              className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-bold focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="p-6 rounded-2xl bg-white border border-pink-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">{t("general.autoSave")}</p>
              <p className="text-xs text-slate-400">{t("general.autoSaveDesc")}</p>
            </div>
            <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
          <Terminal className="w-5 h-5 text-primary" />
          {t("general.shortcuts")}
        </h2>
        <div className="grid grid-cols-1 gap-3">
          <ShortcutRow keys={["Ctrl", "K"]} label={t("general.shortcutSearch")} />
          <ShortcutRow keys={["Ctrl", "B"]} label={t("general.shortcutBold")} />
          <ShortcutRow keys={["Ctrl", "I"]} label={t("general.shortcutItalic")} />
          <ShortcutRow keys={["Alt", "1"]} label={t("general.shortcutSplit")} />
          <ShortcutRow keys={["Alt", "2"]} label={t("general.shortcutEditorOnly")} />
          <ShortcutRow keys={["Alt", "3"]} label={t("general.shortcutPreviewOnly")} />
        </div>
      </section>
    </div>
  );
}
