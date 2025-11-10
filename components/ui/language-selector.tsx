/**
 * Language Selector Component
 * Allows users to switch between supported languages
 */

"use client";

import React from 'react';
import { Check, Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { SupportedLanguage, LanguageInfo } from '@/services/language/languageService';

interface LanguageSelectorProps {
  currentLanguage: SupportedLanguage;
  languages: LanguageInfo[];
  onLanguageChange: (lang: SupportedLanguage) => void;
  variant?: 'default' | 'compact' | 'mobile';
}

export function LanguageSelector({
  currentLanguage,
  languages,
  onLanguageChange,
  variant = 'default'
}: LanguageSelectorProps) {
  const currentLangInfo = languages.find(l => l.code === currentLanguage);

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Globe className="h-4 w-4" />
            <span className="sr-only">Change language</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Select Language</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => onLanguageChange(lang.code)}
              className="cursor-pointer"
            >
              <span className="flex-1">
                {lang.nativeName}
                <span className="text-xs text-muted-foreground ml-2">
                  ({lang.name})
                </span>
              </span>
              {currentLanguage === lang.code && (
                <Check className="h-4 w-4 ml-2" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'mobile') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 text-xs"
          >
            {currentLangInfo?.nativeName || 'English'}
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => onLanguageChange(lang.code)}
              className="cursor-pointer"
            >
              <span className="flex-1">{lang.nativeName}</span>
              {currentLanguage === lang.code && (
                <Check className="h-3 w-3 ml-2" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-[140px]">
          <Globe className="h-4 w-4 mr-2" />
          {currentLangInfo?.nativeName || 'English'}
          <ChevronDown className="h-4 w-4 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center">
          <Globe className="h-4 w-4 mr-2" />
          Choose Language / भाषा चुनें
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => onLanguageChange(lang.code)}
              className="cursor-pointer py-2"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col">
                  <span className="font-medium">{lang.nativeName}</span>
                  <span className="text-xs text-muted-foreground">
                    {lang.name}
                  </span>
                </div>
                {currentLanguage === lang.code && (
                  <Check className="h-4 w-4 text-primary ml-2" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Language Badge Component
 */
export function LanguageBadge({
  language,
  languages
}: {
  language: SupportedLanguage;
  languages: LanguageInfo[];
}) {
  const langInfo = languages.find(l => l.code === language);

  return (
    <Badge variant="secondary" className="text-xs">
      {langInfo?.nativeName || language.toUpperCase()}
    </Badge>
  );
}

/**
 * Language Toggle for Quick Switching (Hindi/English)
 */
export function LanguageToggle({
  currentLanguage,
  onToggle
}: {
  currentLanguage: SupportedLanguage;
  onToggle: () => void;
}) {
  const isHindi = currentLanguage === 'hi';

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      className="h-8"
    >
      <span className="text-xs font-medium">
        {isHindi ? 'EN' : 'हि'}
      </span>
    </Button>
  );
}

/**
 * Language Pills for Mobile
 */
export function LanguagePills({
  currentLanguage,
  languages,
  onLanguageChange,
  maxVisible = 3
}: {
  currentLanguage: SupportedLanguage;
  languages: LanguageInfo[];
  onLanguageChange: (lang: SupportedLanguage) => void;
  maxVisible?: number;
}) {
  const visibleLangs = languages.slice(0, maxVisible);
  const hasMore = languages.length > maxVisible;

  return (
    <div className="flex gap-2 flex-wrap">
      {visibleLangs.map((lang) => (
        <Button
          key={lang.code}
          variant={currentLanguage === lang.code ? "default" : "outline"}
          size="sm"
          onClick={() => onLanguageChange(lang.code)}
          className="h-7 px-3 text-xs"
        >
          {lang.nativeName}
        </Button>
      ))}
      {hasMore && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 px-2">
              <span className="text-xs">+{languages.length - maxVisible}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {languages.slice(maxVisible).map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
              >
                {lang.nativeName}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}