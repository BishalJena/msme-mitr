"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle,
  FileText,
  IndianRupee,
  Building2,
  MapPin,
  Users,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SchemeCardProps {
  scheme: {
    id: string;
    scheme_name: string;
    objective?: string;
    benefits?: string;
    eligibility?: string;
    application_process?: string;
    authority?: string;
    category?: string;
    state?: string;
    scheme_type?: string; // central/state
    special_categories?: string[]; // women, SC/ST, etc.
    link?: string;
    subsidy_amount?: string;
    loan_amount?: string;
  };
  onCheckEligibility?: (schemeId: string) => void;
  onApply?: (schemeId: string) => void;
}

export function SchemeCard({ scheme, onCheckEligibility, onApply }: SchemeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isCentral = scheme.scheme_type?.toLowerCase() === "central";
  const hasWomenCategory = scheme.special_categories?.some(cat =>
    cat.toLowerCase().includes("women")
  );
  const hasSCSTCategory = scheme.special_categories?.some(cat =>
    ["sc", "st", "sc/st"].includes(cat.toLowerCase())
  );

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base sm:text-lg leading-tight mb-2">
              {scheme.scheme_name}
            </CardTitle>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge
                variant={isCentral ? "default" : "secondary"}
                className="text-xs"
              >
                <Building2 className="w-3 h-3 mr-1" />
                {isCentral ? "Central" : "State"}
              </Badge>

              {scheme.category && (
                <Badge variant="outline" className="text-xs">
                  <Target className="w-3 h-3 mr-1" />
                  {scheme.category}
                </Badge>
              )}

              {hasWomenCategory && (
                <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-100">
                  <Users className="w-3 h-3 mr-1" />
                  Women
                </Badge>
              )}

              {hasSCSTCategory && (
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-100">
                  <Users className="w-3 h-3 mr-1" />
                  SC/ST
                </Badge>
              )}

              {scheme.state && (
                <Badge variant="outline" className="text-xs">
                  <MapPin className="w-3 h-3 mr-1" />
                  {scheme.state}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Quick Info */}
        {(scheme.subsidy_amount || scheme.loan_amount) && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t">
            {scheme.subsidy_amount && (
              <div className="flex items-center gap-1.5 text-sm">
                <IndianRupee className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-600 dark:text-green-400">
                  {scheme.subsidy_amount}
                </span>
                <span className="text-muted-foreground text-xs">subsidy</span>
              </div>
            )}
            {scheme.loan_amount && (
              <div className="flex items-center gap-1.5 text-sm">
                <IndianRupee className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {scheme.loan_amount}
                </span>
                <span className="text-muted-foreground text-xs">loan</span>
              </div>
            )}
          </div>
        )}

        {scheme.objective && (
          <CardDescription className="mt-3 text-sm line-clamp-2">
            {scheme.objective}
          </CardDescription>
        )}
      </CardHeader>

      {/* Expandable Details */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent className="px-6 pb-4 space-y-3">
          <Separator />

          {scheme.benefits && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Benefits
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {scheme.benefits}
              </p>
            </div>
          )}

          {scheme.eligibility && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                Eligibility
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {scheme.eligibility}
              </p>
            </div>
          )}

          {scheme.application_process && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-orange-600" />
                Application Process
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {scheme.application_process}
              </p>
            </div>
          )}

          {scheme.authority && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-purple-600" />
                Authority
              </h4>
              <p className="text-sm text-muted-foreground">
                {scheme.authority}
              </p>
            </div>
          )}
        </CollapsibleContent>

        <CardFooter className="flex flex-col gap-2 pt-0">
          {/* Expand/Collapse Button */}
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center text-xs h-9"
            >
              {isExpanded ? (
                <>
                  <span>Show Less</span>
                  <ChevronUp className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  <span>Show More Details</span>
                  <ChevronDown className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </CollapsibleTrigger>

          <Separator />

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 w-full sm:grid-cols-3">
            {scheme.link && (
              <Button
                variant="outline"
                size="sm"
                className="btn-touch text-xs h-10"
                onClick={() => window.open(scheme.link, "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Learn More
              </Button>
            )}

            {onCheckEligibility && (
              <Button
                variant="secondary"
                size="sm"
                className="btn-touch text-xs h-10"
                onClick={() => onCheckEligibility(scheme.id)}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Check Eligibility
              </Button>
            )}

            {onApply && (
              <Button
                size="sm"
                className={cn(
                  "btn-touch text-xs h-10",
                  !scheme.link && !onCheckEligibility && "col-span-2 sm:col-span-3"
                )}
                onClick={() => onApply(scheme.id)}
              >
                <FileText className="w-4 h-4 mr-1" />
                Apply Now
              </Button>
            )}
          </div>
        </CardFooter>
      </Collapsible>
    </Card>
  );
}
