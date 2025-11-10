"use client";

import { useState } from "react";
import { MobileLayout } from "@/components/layouts/MobileLayout";
import { SchemeCard } from "@/components/mobile/SchemeCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Bot } from "lucide-react";
import schemesData from "@/data/schemes.json";
import Link from "next/link";

const categories = [
  "All",
  "Loan",
  "Subsidy",
  "Training",
  "Women",
  "Rural",
  "Startup",
];

export default function SchemesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filteredSchemes, setFilteredSchemes] = useState(schemesData.schemes);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterSchemes(query, selectedCategory);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    filterSchemes(searchQuery, category);
  };

  const filterSchemes = (query: string, category: string) => {
    let filtered = schemesData.schemes;

    // Filter by search query
    if (query) {
      filtered = filtered.filter(
        (scheme) =>
          scheme.scheme_name.toLowerCase().includes(query.toLowerCase()) ||
          scheme.description.toLowerCase().includes(query.toLowerCase()) ||
          scheme.tags?.some((tag) =>
            tag.toLowerCase().includes(query.toLowerCase())
          )
      );
    }

    // Filter by category
    if (category !== "All") {
      filtered = filtered.filter((scheme) =>
        scheme.tags?.some((tag) =>
          tag.toLowerCase().includes(category.toLowerCase())
        )
      );
    }

    setFilteredSchemes(filtered);
  };

  return (
    <MobileLayout>
      <div className="px-4 py-4">
        {/* AI Assistant Prompt */}
        <Link href="/">
          <Card className="bg-primary/5 border-primary/20 p-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary rounded-lg p-2">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Need help finding schemes?</p>
                <p className="text-xs text-muted-foreground">
                  Ask our AI assistant for personalized recommendations
                </p>
              </div>
            </div>
          </Card>
        </Link>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search schemes..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="px-3 py-1.5 cursor-pointer whitespace-nowrap"
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredSchemes.length} schemes found
          </p>
          <Button variant="outline" size="sm" className="h-8">
            <Filter className="w-4 h-4 mr-1" />
            Filters
          </Button>
        </div>

        {/* Schemes List */}
        <div className="space-y-4">
          {filteredSchemes.length > 0 ? (
            filteredSchemes.map((scheme, index) => (
              <SchemeCard key={index} scheme={scheme} language="en" />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No schemes found matching your criteria
              </p>
              <Button asChild>
                <Link href="/">Ask AI for Help</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

// Import Card since we're using it
import { Card } from "@/components/ui/card";