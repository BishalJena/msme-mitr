"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Search,
  MessageCircle,
  FileText,
  TrendingUp,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface QuickAction {
  title: string;
  titleHi?: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    title: "Find Schemes",
    titleHi: "योजनाएं खोजें",
    description: "Discover government schemes for your business",
    icon: <Search className="w-6 h-6" />,
    href: "/schemes",
    color: "bg-blue-500",
  },
  {
    title: "Check Eligibility",
    titleHi: "पात्रता जांचें",
    description: "Quick eligibility assessment",
    icon: <FileText className="w-6 h-6" />,
    href: "/eligibility",
    color: "bg-green-500",
  },
  {
    title: "Chat Support",
    titleHi: "चैट सहायता",
    description: "Get instant help in your language",
    icon: <MessageCircle className="w-6 h-6" />,
    href: "/chat",
    color: "bg-purple-500",
  },
  {
    title: "Growth Tips",
    titleHi: "विकास युक्तियाँ",
    description: "Business growth resources",
    icon: <TrendingUp className="w-6 h-6" />,
    href: "/help",
    color: "bg-orange-500",
  },
];

interface WelcomeHeroProps {
  language?: string;
  userName?: string;
}

export function WelcomeHero({ language = "en", userName }: WelcomeHeroProps) {
  const isHindi = language === "hi";

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-6 border border-primary/20">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary mb-2">
              {isHindi
                ? `नमस्ते${userName ? `, ${userName}` : ""} 👋`
                : `Hello${userName ? `, ${userName}` : ""} 👋`}
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              {isHindi
                ? "आपके व्यवसाय को बढ़ाने के लिए सरकारी योजनाओं का लाभ उठाएं"
                : "Grow your business with government schemes and support"}
            </p>
          </div>
          <Sparkles className="w-8 h-8 text-primary opacity-50" />
        </div>

        {/* CTA Button */}
        <Button
          className="w-full mt-4 btn-touch bg-primary hover:bg-primary/90"
          asChild
        >
          <Link href="/onboarding">
            {isHindi ? "अपना व्यवसाय प्रोफ़ाइल बनाएं" : "Create Your Business Profile"}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Link>
        </Button>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {isHindi ? "त्वरित कार्य" : "Quick Actions"}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group bg-card rounded-xl p-4 border hover:shadow-md transition-all duration-200"
            >
              <div
                className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}
              >
                {action.icon}
              </div>
              <h3 className="font-semibold text-sm mb-1">
                {isHindi && action.titleHi ? action.titleHi : action.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-muted/30 rounded-xl p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">11+</p>
            <p className="text-xs text-muted-foreground">
              {isHindi ? "योजनाएं" : "Schemes"}
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">50L+</p>
            <p className="text-xs text-muted-foreground">
              {isHindi ? "अधिकतम ऋण" : "Max Funding"}
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">12</p>
            <p className="text-xs text-muted-foreground">
              {isHindi ? "भाषाएं" : "Languages"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}