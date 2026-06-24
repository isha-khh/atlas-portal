import { useTranslation } from "react-i18next";

import { SUPPORTED_LANGUAGES } from "@/i18n";

export const TopbarLanguageMenu = () => {
    const { t, i18n } = useTranslation();
    // resolvedLanguage 已收斂到 supportedLngs 之一 (zh-TW / en)
    const current = i18n.resolvedLanguage ?? "zh-TW";

    const onSelect = (code: string) => {
        void i18n.changeLanguage(code);
        // dropdown 是 CSS focus 驅動;切完把焦點移走讓它收合
        (document.activeElement as HTMLElement | null)?.blur();
    };

    return (
        <div className="dropdown dropdown-bottom dropdown-center">
            <div
                tabIndex={0}
                role="button"
                aria-label={t("layout.language")}
                title={t("layout.language")}
                className="btn btn-ghost btn-circle btn-sm cursor-pointer">
                <span className="iconify lucide--languages size-4.5" />
            </div>
            <div tabIndex={0} className="dropdown-content bg-base-100 rounded-box mt-2 w-40 shadow-sm">
                <ul className="menu w-full p-2">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                        <li key={lang.code}>
                            <button
                                type="button"
                                className={`flex items-center gap-2 ${current === lang.code ? "menu-active" : ""}`}
                                onClick={() => onSelect(lang.code)}>
                                <span className="grow text-start">{lang.label}</span>
                                {current === lang.code && <span className="iconify lucide--check size-4" />}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
