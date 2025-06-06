// app/components/analysis/UserResumeDisplay.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Briefcase, GraduationCap, UserCircle, Mail, Phone, LinkIcon, Brain, BarChartBig, AlertOctagon } from 'lucide-react'; // Added more icons
import type { DetailedAnalyzedResume } from '@/app/UserAnalysis/[resumeId]/page'; // Adjust path

interface UserResumeDisplayProps {
  resume: DetailedAnalyzedResume;
}

const DetailItem: React.FC<{ icon?: React.ElementType, label: string, value?: React.ReactNode }> = ({ icon: Icon, label, value }) => {
  if (!value && typeof value !== 'number') return null; // Don't render if value is empty string, null, or undefined (but allow 0)
  return (
    <div className="mb-3">
      <h4 className="text-sm font-semibold text-muted-foreground flex items-center">
        {Icon && <Icon className="mr-2 h-4 w-4" />}
        {label}
      </h4>
      <p className="text-sm text-foreground whitespace-pre-wrap">{typeof value === 'string' || typeof value === 'number' ? String(value) : value}</p>
    </div>
  );
};


export const UserResumeDisplay: React.FC<UserResumeDisplayProps> = ({ resume }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle className="text-2xl">{resume.Name || "N/A"}</CardTitle>
                <CardDescription>{resume.Level || "Level not specified"}</CardDescription>
            </div>
            <div className="text-right">
                <p className="text-sm text-muted-foreground">Resume ID: {resume.ResumeID}</p>
                <p className="text-sm text-muted-foreground">Job Role ID: {resume.job_role_id}</p>
            </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><UserCircle className="mr-2 h-5 w-5"/>Contact & Links</h3>
          <DetailItem icon={Mail} label="Email" value={resume.Email} />
          <DetailItem icon={Phone} label="Phone" value={resume.Phone_Number} />
          {resume.Linkedin_link && resume.Linkedin_link !== "LinkedIn" && ( // Check if it's a real link
            <DetailItem icon={LinkIcon} label="LinkedIn" value={<a href={resume.Linkedin_link.startsWith('http') ? resume.Linkedin_link : `https://${resume.Linkedin_link}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{resume.Linkedin_link}</a>} />
          )}
          {resume.Portfolio_link && (
            <DetailItem icon={LinkIcon} label="Portfolio" value={<a href={resume.Portfolio_link.startsWith('http') ? resume.Portfolio_link : `https://${resume.Portfolio_link}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{resume.Portfolio_link}</a>} />
          )}
        </div>

        <div>
            <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><GraduationCap className="mr-2 h-5 w-5"/>Education</h3>
            <DetailItem label="Details" value={resume.Education} />
            <DetailItem label="Education Similarity" value={resume.Education_Similarity?.toFixed(2)} />
        </div>

        <div className="md:col-span-2"> {/* Experience can take full width or be part of grid */}
            <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><Briefcase className="mr-2 h-5 w-5"/>Experience</h3>
            <DetailItem label="Summary" value={resume.Experience} />
            <DetailItem label="Experience Similarity" value={resume.Experience_Similarity?.toFixed(2)} />
        </div>

        <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><Brain className="mr-2 h-5 w-5"/>Skills</h3>
            <DetailItem label="Listed Skills" value={resume.Skills} />
            <DetailItem label="Skill Similarity" value={resume.Skill_Similarity?.toFixed(2)} />
        </div>

        <div>
            <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><BarChartBig className="mr-2 h-5 w-5"/>Similarity Scores</h3>
            <DetailItem label="Level Similarity" value={resume.Level_Similarity?.toFixed(2)} />
            {/* Other scores can be here if not grouped elsewhere */}
        </div>

        <div>
            <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><AlertOctagon className="mr-2 h-5 w-5"/>AI & Other Scores</h3>
            <DetailItem label="AI Generated Score" value={`${resume.ai_generated_score?.toFixed(2)}%`} />
            {/* Add spamScore if it comes from API, or if it's calculated */}
        </div>

        {resume.Extra && (
            <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-3 text-primary">Additional Information</h3>
                <DetailItem label="Extra Curricular / Achievements" value={resume.Extra} />
            </div>
        )}

        {/* <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-3">Original Job Description</h3>
            <DetailItem label="Job Description Text" value={resume.Job_Desc} />
        </div> */}
      </CardContent>
    </Card>
  );
};