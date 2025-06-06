// components/analysis/AnalysisTab.tsx
"use client"; // If not already, though likely for useState/useEffect

import React, { useState, useEffect } from 'react';
import { ResumeList } from './ResumeList';
// import { ChatInterface } from './ChatInterface'; // Chat is on a different page now
import { ResumeStats } from './ResumeStats';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, Info } from 'lucide-react'; // For loading/error states

// This is the structure of each item from your API endpoint
// /get_job_application_by_role/{job_role_id}
export interface ApiAnalyzedResume {
  id: number;
  Education: string;
  Education_Similarity: number;
  Email: string;
  Experience: string;
  Experience_Similarity: number;
  Extra: string;
  Level: string;
  Level_Similarity: number;
  Linkedin_link: string;
  Name: string;
  Phone_Number: string;
  Portfolio_link: string;
  ResumeID: number;
  Skill_Similarity: number;
  Skills: string;
  ai_generated_score: number;
  is_analyzed: boolean;
  job_role_id: number;
  spam_probability?: number; // Added: Make it optional if not all records might have it
}

// This is the structure expected by ResumeList, ResumeStats
export interface MappedAnalyzedResume {
  id: string; // We'll use ApiAnalyzedResume.id (job_application id) as string
  candidateName: string;
  aiGeneratedScore: number;
  spamScore: number; // API doesn't provide this, so we'll mock or set to 0
  matchScore: number; // We can calculate this from similarities
  keywords: string[];
  status: 'Recommended' | 'Maybe' | 'Not Recommended';
  education: string;
  experienceYears: number; // We'll try to parse/estimate this
  lastPosition: string;
  // Keep original API data if needed for navigation or detailed view context
  originalApiData?: ApiAnalyzedResume;
}

// Helper function to determine resume status (can be reused or adapted)
function determineResumeStatus(
  aiGeneratedScore: number,
  spamScore: number,
  matchScore: number,
  isAnalyzed: boolean
): MappedAnalyzedResume['status'] {
  if (!isAnalyzed) {
      return 'Maybe'; // Or a specific "Not Yet Analyzed" status if your UI supports it
  }
  // --- Strong Rejection Criteria ---
  if (spamScore > 75) return 'Not Recommended';
  if (matchScore < 30) return 'Not Recommended';
  if (aiGeneratedScore > 80 && matchScore < 60) return 'Not Recommended';

  // --- Strong Recommendation Criteria ---
  if (matchScore > 75 && spamScore < 30 && aiGeneratedScore < 50) return 'Recommended';
  if (matchScore > 85 && spamScore < 40 && aiGeneratedScore < 70) return 'Recommended';

  // --- "Maybe" Criteria ---
  if (matchScore > 60 && spamScore < 50 && aiGeneratedScore < 75) return 'Maybe';
  if (matchScore > 50 && spamScore < 65 && aiGeneratedScore < 80) return 'Maybe';

  return 'Not Recommended'; // Fallback
}

// Helper to estimate experience years from text (very basic)
function estimateExperienceYears(experienceText: string): number {
    if (!experienceText) return 0;
    // Look for patterns like "X years", "X+ years"
    const yearMatch = experienceText.match(/(\d+)\+?\s*years?/i);
    if (yearMatch && yearMatch[1]) {
        return parseInt(yearMatch[1], 10);
    }
    // Very naive: count words, assume more words = more experience (highly unreliable)
    const wordCount = experienceText.split(/\s+/).length;
    if (wordCount > 100) return 5;
    if (wordCount > 50) return 3;
    if (wordCount > 10) return 1;
    return 0;
}


interface AnalysisTabProps {
  jobId: string; // This is the job_role_id
}

export const AnalysisTab: React.FC<AnalysisTabProps> = ({ jobId }) => {
  const router = useRouter();
  const [analyzedResumes, setAnalyzedResumes] = useState<MappedAnalyzedResume[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // selectedResume for highlighting in the list, if ResumeList supports it
  // const [selectedResumeForList, setSelectedResumeForList] = useState<string | null>(null);


  useEffect(() => {
    if (!jobId) {
      setAnalyzedResumes([]); // Clear resumes if no job is selected
      return;
    }

    const fetchAnalyzedResumes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://127.0.0.1:8000/get_job_application_by_role/${jobId}`);
        if (!response.ok) {
          if (response.status === 404) {
            // Handle 404 specifically - no applications for this role yet
            setAnalyzedResumes([]);
            // Optionally set a specific message instead of generic error
            // setError("No applications found for this job role yet.");
            console.log(`No applications found for job role ID: ${jobId}`);
            return; // Exit early
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ApiAnalyzedResume[] = await response.json();

        // Map API data to MappedAnalyzedResume
        const mappedData = data.map((apiResume): MappedAnalyzedResume => {
          const similarities = [
            apiResume.Education_Similarity,
            apiResume.Experience_Similarity,
            apiResume.Skill_Similarity,
            apiResume.Level_Similarity,
          ].filter(s => typeof s === 'number') as number[];

          const matchScore = similarities.length > 0
            ? (similarities.reduce((sum, val) => sum + val, 0) / similarities.length) * 100
            : 0;

          // API's ai_generated_score might be -1 if not analyzed, or a percentage like 34.3409
          // The mock data used a 0-100 scale. Adjust if your API provides 0-1 for ai_generated_score
          // If ai_generated_score is already 0-100 (like 34.3409), use it directly.
          // If it's 0-1 (like 0.313314), multiply by 100.
          // For now, assuming it's a percentage if > 1, else needs scaling if it's 0-1.
          // --- AI Generated Score Processing ---
          let aiScore: number;
          if (apiResume.ai_generated_score === -1) {
            aiScore = 0; // Not analyzed or explicitly marked as -1
          } else if (apiResume.ai_generated_score > 0 && apiResume.ai_generated_score < 1) {
            // If score is like 0.313314, treat as 0 as per new requirement
            aiScore = 0;
          } else {
            // If score is like 34.3409 or 70, round it
            aiScore = Math.round(apiResume.ai_generated_score);
          }
          // Clamp AI score to 0-100 (though rounding should keep it reasonable if input is)
          aiScore = Math.max(0, Math.min(100, aiScore));  


          const spamScore = apiResume.spam_probability !== undefined
            ? Math.round(apiResume.spam_probability * 100)
            : 0; // Default to 0 if spam_probability is missing

          const status = determineResumeStatus(
            aiScore,
            spamScore,
            matchScore,
            apiResume.is_analyzed
          );

          return {
            id: apiResume.id.toString(),
            candidateName: apiResume.Name,
            aiGeneratedScore: aiScore, // Already rounded or set
            spamScore: spamScore,     // Processed spam score
            matchScore: Math.round(matchScore),
            keywords: apiResume.Skills ? apiResume.Skills.split(',').map(s => s.trim()).slice(0, 5) : [],
            status: status,
            education: apiResume.Education,
            experienceYears: estimateExperienceYears(apiResume.Experience),
            lastPosition: apiResume.Level,
            originalApiData: apiResume,
          };
        });

        setAnalyzedResumes(mappedData);

      } catch (err) {
        console.error(`Failed to fetch analyzed resumes for job ID ${jobId}:`, err);
        setError(err instanceof Error ? err.message : "An unknown error occurred while fetching resumes.");
        setAnalyzedResumes([]); // Clear resumes on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyzedResumes();
  }, [jobId]); // Re-fetch when jobId changes

  const handleResumeSelect = (resumeApplicationId: string) => {
    // The resumeApplicationId is now the `id` from the job_application table
    // which is what UserAnalysisPage expects in the URL.
    router.push(`/UserAnalysis/${resumeApplicationId}`);
    // setSelectedResumeForList(resumeApplicationId); // Optional: if you want to highlight in the list
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <span>Loading resumes for this job...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive">
        <AlertTriangle className="mr-2 h-8 w-8" />
        <span>Error: {error}</span>
      </div>
    );
  }

  if (!jobId) { // Should not happen if Analysis tab is disabled when no jobId
    return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
            <Info className="mr-2 h-5 w-5" />
            <span>Select a job to see resume analysis.</span>
        </div>
    );
  }

  if (analyzedResumes.length === 0 && !isLoading) { // No error, not loading, but no resumes
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Info className="mr-2 h-8 w-8" />
        <span>No applications found for this job role yet, or they are still being processed.</span>
      </div>
    );
  }

  return (
    // The AnalysisTab itself likely doesn't need to be a Card, as its children (ResumeStats, ResumeList) might be.
    // Or, if AnalysisTab is meant to be the Card content, remove the outer div and ensure this root div fits.
    <div className="space-y-6"> {/* Use space-y for gap between stats and list */}
      {/* <ResumeStats resumes={analyzedResumes} /> */}
      <ResumeList
        resumes={analyzedResumes}
        onSelectResume={handleResumeSelect}
        // selectedResumeId={selectedResumeForList} // Pass if you implement highlighting
      />
      {/* ChatInterface is not here anymore, it's on the UserAnalysis/[resumeId] page */}
    </div>
  );
};