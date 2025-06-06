'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ListFilter, BarChartHorizontal } from 'lucide-react'; // Added icons for sorting
import type { MappedAnalyzedResume as AnalyzedResume } from './AnalysisTab'; // Assuming this path is correct

interface ResumeListProps {
  resumes: AnalyzedResume[];
  onSelectResume: (resumeId: string) => void;
  selectedResumeId?: string | null; // Changed from undefined to allow null explicitly
}

// Define sort types
type SortByType = 'default' | 'matchScoreAsc' | 'matchScoreDesc';

export const ResumeList = ({
  resumes,
  onSelectResume,
  selectedResumeId
}: ResumeListProps) => {
  const [filterStatus, setFilterStatus] = useState('all'); // For filtering by status
  const [sortBy, setSortBy] = useState<SortByType>('default'); // For sorting

  // 1. Filter resumes by status
  let processedResumes = resumes.filter(resume => {
    if (filterStatus === 'recommended') return resume.status === 'Recommended';
    if (filterStatus === 'maybe') return resume.status === 'Maybe';
    if (filterStatus === 'not-recommended') return resume.status === 'Not Recommended';
    return true; // 'all'
  });

  // 2. Sort the filtered resumes
  if (sortBy === 'matchScoreDesc') {
    processedResumes = [...processedResumes].sort((a, b) => b.matchScore - a.matchScore);
  } else if (sortBy === 'matchScoreAsc') {
    processedResumes = [...processedResumes].sort((a, b) => a.matchScore - b.matchScore);
  }
  // If sortBy is 'default', no additional sorting is applied after filtering.
  // The original order from the 'resumes' prop (within the filtered set) is maintained.

  console.log('Processed Resumes:', processedResumes);

  const toggleSortByMatchScore = () => {
    if (sortBy === 'matchScoreDesc') {
      setSortBy('matchScoreAsc');
    } else if (sortBy === 'matchScoreAsc') {
      setSortBy('default'); // Cycle back to default or to descending
    } else {
      setSortBy('matchScoreDesc'); // Default to descending first
    }
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <CardTitle className="text-xl">Analyzed Resumes ({processedResumes.length})</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filters */}
            <Button variant={filterStatus === 'all' ? 'default' : 'outline'} onClick={() => setFilterStatus('all')} size="sm" className="text-xs px-2.5 py-1.5">
              All
            </Button>
            <Button variant={filterStatus === 'recommended' ? 'default' : 'outline'} onClick={() => setFilterStatus('recommended')} size="sm" className="text-xs px-2.5 py-1.5">
              Recommended
            </Button>
            <Button variant={filterStatus === 'maybe' ? 'default' : 'outline'} onClick={() => setFilterStatus('maybe')} size="sm" className="text-xs px-2.5 py-1.5">
              Maybe
            </Button>
            <Button variant={filterStatus === 'not-recommended' ? 'default' : 'outline'} onClick={() => setFilterStatus('not-recommended')} size="sm" className="text-xs px-2.5 py-1.5">
              Not Recommended
            </Button>
            {/* Sort Button */}
            <Button variant={sortBy.startsWith('matchScore') ? 'default' : 'outline'} onClick={toggleSortByMatchScore} size="sm" className="text-xs px-2.5 py-1.5 flex items-center">
              Rank by Match
              {sortBy === 'matchScoreDesc' && <ChevronDown className="ml-1 h-3 w-3" />}
              {sortBy === 'matchScoreAsc' && <ChevronUp className="ml-1 h-3 w-3" />}
              {!sortBy.startsWith('matchScore') && <BarChartHorizontal className="ml-1 h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {processedResumes.length > 0 ? (
          <div className="space-y-4">
            {processedResumes.map(resume => (
              <div
                key={resume.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedResumeId === resume.id ? 'border-primary bg-primary/10 dark:bg-primary/20 shadow-md' : 'hover:border-primary/50 dark:hover:border-primary/60'
                }`}
                onClick={() => onSelectResume(resume.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-primary">{resume.candidateName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {resume.lastPosition} • {resume.experienceYears} years
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        resume.status === 'Recommended'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : resume.status === 'Maybe'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {resume.status}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-3 text-center sm:text-left">
                  <div>
                    <p className="text-xs text-muted-foreground">Match</p>
                    <p
                      className={`text-sm font-semibold ${
                        resume.matchScore > 70
                          ? 'text-green-600 dark:text-green-400'
                          : resume.matchScore > 40
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {resume.matchScore}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">AI Gen.</p>
                    <p className="text-sm font-semibold">
                      {resume.aiGeneratedScore}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Spam</p>
                    <p className="text-sm font-semibold">{resume.spamScore}%</p>
                  </div>
                </div>
                {resume.keywords && resume.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {resume.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-6">
            No resumes match the current filter.
          </p>
        )}
      </CardContent>
    </Card>
  );
};