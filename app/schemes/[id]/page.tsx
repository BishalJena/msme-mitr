"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Building, FileText, CheckCircle, Users, ClipboardList, Link } from "lucide-react";
import schemesData from "@/data/schemes.json";
import { ReactNode } from "react";

// Section component for displaying scheme details with icons
interface SectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

// Helper function to get tag variant based on tag type
const getTagVariant = (tag: string): "default" | "secondary" | "outline" => {
  // Financial tags
  if (['Loan', 'Financial Assistance', 'Subsidy', 'Credit Linked Subsidy'].includes(tag)) {
    return 'default';
  }
  
  // Beneficiary tags
  if (['Women', 'Mahila', 'SC/ST'].includes(tag)) {
    return 'secondary';
  }
  
  // Skill/Training tags
  if (['Training', 'Skill Development', 'Skill Upgradation'].includes(tag)) {
    return 'outline';
  }
  
  // Business tags
  if (['Entrepreneur', 'Business', 'MSME', 'Enterprises'].includes(tag)) {
    return 'default';
  }
  
  return 'secondary';
};

export default function SchemeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const schemeId = decodeURIComponent(params.id as string);

  // Find the scheme by name
  const scheme = schemesData.schemes.find(
    (s) => s.scheme_name === schemeId
  );

  // Handle scheme not found
  if (!scheme) {
    return (
      <div className="container mx-auto px-4 py-12 text-center max-w-4xl">
        <h1 className="text-2xl font-bold">Scheme Not Found</h1>
        <p className="text-muted-foreground mt-2">
          The scheme you're looking for doesn't exist.
        </p>
        <Button className="mt-4" onClick={() => router.push('/schemes')}>
          Back to Schemes
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => router.push('/schemes')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Schemes
      </Button>
      
      {/* Scheme Header */}
      <div className="mt-6">
        {/* Ministry Badge */}
        <Badge variant="outline" className="mb-2">
          <Building className="w-3 h-3 mr-1" />
          {scheme.ministry}
        </Badge>
        
        {/* Scheme Name */}
        <h1 className="text-3xl font-bold mt-2">{scheme.scheme_name}</h1>
        
        {/* Description */}
        <p className="text-muted-foreground mt-2 text-lg">
          {scheme.description}
        </p>
        
        {/* All Tags */}
        {scheme.tags && scheme.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {scheme.tags.map((tag, idx) => (
              <Badge key={idx} variant={getTagVariant(tag)}>
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Details Sections */}
      <div className="mt-8 space-y-6">
        {/* Details Section */}
        {scheme.details && (
          <Section title="Details" icon={<FileText className="w-5 h-5" />}>
            <p className="whitespace-pre-line">{scheme.details}</p>
          </Section>
        )}

        {/* Benefits Section */}
        {scheme.benefits && (
          <Section title="Benefits" icon={<CheckCircle className="w-5 h-5" />}>
            <p className="whitespace-pre-line">{scheme.benefits}</p>
          </Section>
        )}

        {/* Eligibility Section */}
        {scheme.eligibility && (
          <Section title="Eligibility" icon={<Users className="w-5 h-5" />}>
            <p className="whitespace-pre-line">{scheme.eligibility}</p>
          </Section>
        )}

        {/* Application Process Section */}
        {scheme.application_process && (
          <Section title="Application Process" icon={<ClipboardList className="w-5 h-5" />}>
            <p className="whitespace-pre-line">{scheme.application_process.content}</p>
          </Section>
        )}

        {/* Sources Section */}
        {scheme.sources && scheme.sources.length > 0 && (
          <Section title="Sources & Links" icon={<Link className="w-5 h-5" />}>
            <div className="space-y-2">
              {scheme.sources.map((source, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => window.open(source.url, '_blank', 'noopener,noreferrer')}
                >
                  {source.text}
                  <Link className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
