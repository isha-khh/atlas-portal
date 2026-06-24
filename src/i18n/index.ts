import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "./locales/en";
import zhTW from "./locales/zh-TW";

export const SUPPORTED_LANGUAGES = [
    { code: "zh-TW", label: "繁體中文" },
    { code: "en", label: "English" },
] as const;

void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            "zh-TW": { translation: zhTW },
            en: { translation: en },
        },
        // navigator 給 zh / zh-Hant 之類的變體時,不在 supportedLngs 內就落到 fallback zh-TW。
        // 注意不要用 nonExplicitSupportedLngs:它會把 zh-TW 化約成 zh 去比對,反而全濾掉。
        fallbackLng: "zh-TW",
        supportedLngs: ["zh-TW", "en"],
        detection: {
            order: ["localStorage", "navigator"],
            caches: ["localStorage"],
            lookupLocalStorage: "atlas.lang",
        },
        interpolation: { escapeValue: false }, // React 已處理 XSS escape
    });

// <html lang> 跟著切。inline resources 的 init 是同步完成的,
// languageChanged 在這裡註冊前就發過了,所以先補設一次目前值。
i18n.on("languageChanged", (lng) => {
    document.documentElement.lang = lng;
});
if (i18n.resolvedLanguage) {
    document.documentElement.lang = i18n.resolvedLanguage;
}

export default i18n;
