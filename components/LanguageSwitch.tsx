"use client";

import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@heroui/react";

interface LanguageSwitchProps {
  className?: string;
}

export const LanguageSwitch: FC<LanguageSwitchProps> = ({ className }) => {
  const { i18n } = useTranslation();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "zh" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <Button onClick={toggleLanguage} className={className}>
      {isClient ? i18n.language.toUpperCase() : ""}
    </Button>
  );
};
