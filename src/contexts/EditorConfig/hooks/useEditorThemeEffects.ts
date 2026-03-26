import i18n from "@/i18n";
import { applyM3Theme } from "@/utils/applyM3Theme";
import { useEffect } from "react";


interface EditorThemeEffectsProps {
    darkMode: boolean;
    accentColor: string;
    previewFontSize: number;
    editorFontSize: number;
    blurAmount: number;
    fontChoice: string;
    editorFont: string;
    bgImage: string;
    lang: string;
    customFonts: Array<{ name: string; url: string }>;
}

export function useEditorThemeEffects({
    darkMode,
    accentColor,
    previewFontSize,
    editorFontSize,
    blurAmount,
    fontChoice,
    editorFont,
    bgImage,
    lang,
    customFonts
}: EditorThemeEffectsProps) {

    // ── 深色模式 class
    useEffect(() => {
        document.documentElement.classList.toggle("dark", darkMode);
    }, [darkMode]);

    // ── M3 颜色主题
    useEffect(() => {
        applyM3Theme(accentColor, darkMode);
    }, [accentColor, darkMode]);

    // ── T预览字体大小
    useEffect(() => {
        document.documentElement.style.setProperty(
            "--markdown-font-size",
            `${previewFontSize}px`,
        );
    }, [previewFontSize]);

    // 编辑器字体大小
    useEffect(() => {
        document.documentElement.style.setProperty(
            "--editor-font-size",
            `${editorFontSize}px`,
        );
    }, [editorFontSize]);

    // 模糊效果
    useEffect(() => {
        document.documentElement.style.setProperty(
            "--editor-blur",
            `${blurAmount}px`,
        );
    }, [blurAmount]);

    // 显示字体
    useEffect(() => {
        document.documentElement.style.setProperty(
            "--font-display",
            fontChoice === "Quicksand"
                ? '"Quicksand", sans-serif'
                : `"${fontChoice}", sans-serif`,
        );
    }, [fontChoice]);

    // 编辑器字体
    useEffect(() => {
        document.documentElement.style.setProperty(
            "--editor-font",
            editorFont === "monospace" ? "monospace" : `"${editorFont}", monospace`,
        );
    }, [editorFont]);

    // 背景图片
    useEffect(() => {
        const el = document.getElementById("editor-bg-layer");
        if (!el) return;
        if (bgImage) {
            el.style.backgroundImage = `url(${bgImage})`;
            el.style.backgroundSize = "cover";
            el.style.backgroundPosition = "center";
        } else {
            el.style.backgroundImage = "";
        }
    }, [bgImage]);


    // 语言切换 + 加载自定义字体
    useEffect(() => {
        i18n.changeLanguage(lang);
        customFonts.forEach((font) => {
            const styleId = `custom-font-${font.name.replace(/\s/g, "-")}`;
            if (!document.getElementById(styleId)) {
                const style = document.createElement("style");
                style.id = styleId;
                style.textContent = `@font-face { font-family: "${font.name}"; src: url("${font.url}"); }`;
                document.head.appendChild(style);
            }
        })
    })

}