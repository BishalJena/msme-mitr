"use client";

import React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  IndianRupee,
  Users,
  Calendar,
  Building,
  CheckCircle,
} from "lucide-react";

interface SchemeCardProps {
  scheme: {
    id?: string;
    scheme_name: string;
    ministry: string;
    description: string;
    tags?: string[];
    benefits?: string;
    eligibility?: string;
  };
  language?: string;
}

export function SchemeCard({ scheme, language = "en" }: SchemeCardProps) {
  // Extract key information from description/benefits
  const getSchemeType = (tags: string[] = []) => {
    if (tags.includes("Loan")) return { label: "Loan", color: "bg-blue-100 text-blue-800" };
    if (tags.includes("Subsidy") || tags.includes("Credit Linked Subsidy"))
      return { label: "Subsidy", color: "bg-green-100 text-green-800" };
    if (tags.includes("Training") || tags.includes("Skill Development"))
      return { label: "Training", color: "bg-purple-100 text-purple-800" };
    if (tags.includes("Grant")) return { label: "Grant", color: "bg-amber-100 text-amber-800" };
    return { label: "Support", color: "bg-gray-100 text-gray-800" };
  };

  const schemeType = getSchemeType(scheme.tags);

  // Truncate description for card display
  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getKeyBenefits = (benefits: string) => {
    if (!benefits) return [];
    // Extract first 3 key points from benefits
    const points = benefits.split('.').filter(p => p.trim().length > 10);
    return points.slice(0, 3).map(p => p.trim());
  };

  return (
    <Card className="card-mobile hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2 mb-2">
          <Badge className={`${schemeType.color} text-xs px-2 py-1`}>
            {schemeType.label}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Building className="w-3 h-3 mr-1" />
            MSME
          </Badge>
        </div>

        <CardTitle className="text-lg leading-tight line-clamp-2">
          {scheme.scheme_name}
        </CardTitle>

        <CardDescription className="text-sm mt-2 line-clamp-2">
          {truncateText(scheme.description, 100)}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Key Features Icons */}
        <div className="flex flex-wrap gap-3 mb-4">
          {scheme.tags?.includes("Financial Assistance") && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <IndianRupee className="w-4 h-4 text-green-600" />
              <span>Funding</span>
            </div>
          )}
          {scheme.tags?.includes("Women") && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Women</span>
            </div>
          )}
          {scheme.tags?.includes("Training") && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Training</span>
            </div>
          )}
        </div>

        {/* Key Benefits - if available */}
        {scheme.benefits && (
          <div className="mb-4 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Key Benefits
            </p>
            <div className="space-y-1">
              {getKeyBenefits(scheme.benefits).slice(0, 2).map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground line-clamp-1">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="default"
            className="flex-1 btn-touch h-11 text-sm font-medium"
            asChild
          >
            <Link href={`/schemes/${scheme.id || scheme.scheme_name.toLowerCase().replace(/\s+/g, '-')}`}>
              View Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>

          <Button
            variant="outline"
            className="btn-touch h-11 px-4"
            aria-label="Check eligibility"
          >
            Check Eligibility
          </Button>
        </div>

        {/* Tags */}
        {scheme.tags && scheme.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {scheme.tags.slice(0, 4).map((tag, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="text-xs px-2 py-0.5"
              >
                {tag}
              </Badge>
            ))}
            {scheme.tags.length > 4 && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                +{scheme.tags.length - 4} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}