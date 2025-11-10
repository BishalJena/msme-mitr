"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, FileText, HelpCircle, IndianRupee, Phone } from "lucide-react";

export interface QuickReply {
  text: string;
  textHi?: string;
  icon?: React.ReactNode;
  action?: string;
}

interface QuickReplyChipsProps {
  suggestions: QuickReply[];
  onSelect: (text: string) => void;
  disabled?: boolean;
  language?: string;
}

export function QuickReplyChips({
  suggestions,
  onSelect,
  disabled = false,
  language = 'en'
}: QuickReplyChipsProps) {
  const isHindi = language === 'hi';

  // Default icon if not provided
  const getDefaultIcon = () => <ArrowRight className="w-4 h-4" />;

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="h-9 text-xs font-medium rounded-full hover:bg-primary/10 hover:text-primary hover:border-primary transition-all"
          onClick={() => onSelect(isHindi && suggestion.textHi ? suggestion.textHi : suggestion.text)}
          disabled={disabled}
        >
          {suggestion.icon || getDefaultIcon()}
          <span className="ml-1.5">
            {isHindi && suggestion.textHi ? suggestion.textHi : suggestion.text}
          </span>
        </Button>
      ))}
    </div>
  );
}

// Predefined quick replies for common scenarios
export const commonQuickReplies = {
  eligibility: [
    { text: "Check eligibility", textHi: "पात्रता जांचें", icon: <CheckCircle className="w-4 h-4" /> },
    { text: "Required documents", textHi: "आवश्यक दस्तावेज", icon: <FileText className="w-4 h-4" /> },
    { text: "How to apply", textHi: "आवेदन कैसे करें", icon: <HelpCircle className="w-4 h-4" /> },
  ],
  scheme: [
    { text: "Tell me more", textHi: "और बताएं", icon: <HelpCircle className="w-4 h-4" /> },
    { text: "Check eligibility", textHi: "पात्रता जांचें", icon: <CheckCircle className="w-4 h-4" /> },
    { text: "Start application", textHi: "आवेदन शुरू करें", icon: <FileText className="w-4 h-4" /> },
    { text: "Contact helpline", textHi: "हेल्पलाइन संपर्क करें", icon: <Phone className="w-4 h-4" /> },
  ],
  loan: [
    { text: "Loan amount details", textHi: "ऋण राशि विवरण", icon: <IndianRupee className="w-4 h-4" /> },
    { text: "Interest rate", textHi: "ब्याज दर", icon: <IndianRupee className="w-4 h-4" /> },
    { text: "Apply for loan", textHi: "ऋण के लिए आवेदन करें", icon: <FileText className="w-4 h-4" /> },
  ],
  welcome: [
    { text: "Find schemes for me", textHi: "मेरे लिए योजनाएं खोजें", icon: <HelpCircle className="w-4 h-4" /> },
    { text: "I need a loan", textHi: "मुझे ऋण चाहिए", icon: <IndianRupee className="w-4 h-4" /> },
    { text: "How to start a business", textHi: "व्यवसाय कैसे शुरू करें", icon: <FileText className="w-4 h-4" /> },
  ],
};
