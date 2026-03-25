import { Layout, Terminal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ShortcutRow } from "./ShortcutRow";
import { useEditorConfigContext } from "@/contexts/EditorConfigContext";

export default function SettingGeneral() {
  const { t } = useTranslation();
  const { autoSave, setAutoSave, autoSaveInterval, setAutoSaveInterval } = useEditorConfigContext();

  return (
    <div className="space-y-10">
      <section>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4">
          <Layout className="w-4 h-4 text-primary" />
          {t("general.workspace")}
        </h2>
        <div className="space-y-3">
          <div className="settings-m3-card p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">{t("general.workspaceName")}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t("general.workspaceNameDesc")}</p>
            </div>
            <input
              type="text"
              defaultValue="NoteBuddy"
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="settings-m3-card p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">{t("general.autoSave")}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t("general.autoSaveDesc")}</p>
            </div>
            <div
              className={`settings-m3-switch-track w-11 h-6 rounded-full relative p-1 cursor-pointer shrink-0 ${autoSave ? 'bg-primary' : 'bg-slate-200'}`}
              onClick={() => setAutoSave(!autoSave)}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${autoSave ? 'right-1' : 'left-1'}`}
              />
            </div>
          </div>
          {autoSave && (
            <div className="settings-m3-card p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">{t("general.autoSaveInterval")}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t("general.autoSaveIntervalDesc")}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1000"
                  max="60000"
                  step="1000"
                  value={autoSaveInterval}
                  onChange={(e) => setAutoSaveInterval(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm w-24 focus:ring-primary focus:border-primary"
                />
                <span className="text-xs text-slate-400">ms</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4">
          <Terminal className="w-4 h-4 text-primary" />
          {t("general.shortcuts")}
        </h2>
        <div className="grid grid-cols-1 gap-2">
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
