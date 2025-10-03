"use client";

import { FC } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@heroui/react";

interface LanguageSwitchProps {
  className?: string;
}

export const LanguageSwitch: FC<LanguageSwitchProps> = ({ className }) => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "zh" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <Button onClick={toggleLanguage} className={className}>
      {i18n.language.toUpperCase()}
    </Button>
  );
};
