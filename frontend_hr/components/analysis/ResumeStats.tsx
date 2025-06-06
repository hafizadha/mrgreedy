import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { MappedAnalyzedResume as AnalyzedResume } from './AnalysisTab';
interface ResumeStatsProps {
  resumes: AnalyzedResume[];
}
export const ResumeStats = ({
  resumes
}: ResumeStatsProps) => {
  const stats = {
    total: resumes.length,
    recommended: resumes.filter(r => r.status === 'Recommended').length,
    maybe: resumes.filter(r => r.status === 'Maybe').length,
    notRecommended: resumes.filter(r => r.status === 'Not Recommended').length,
    avgMatchScore: resumes.length > 0
      ? Math.round(resumes.reduce((acc, r) => acc + r.matchScore, 0) / resumes.length)
      : 0, // Default to 0 if no resumes
    potentialSpam: resumes.filter(r => r.spamScore > 70).length
  };
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.total}</div>
        <p className="text-xs text-muted-foreground">
          {stats.recommended} recommended
        </p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Average Match Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.avgMatchScore}%</div>
        <p className="text-xs text-muted-foreground">Across all candidates</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Potential Spam</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.potentialSpam}</div>
        <p className="text-xs text-muted-foreground">
          High spam score resumes
        </p>
      </CardContent>
    </Card>
  </div>;
};