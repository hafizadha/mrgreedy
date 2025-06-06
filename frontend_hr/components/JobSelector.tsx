import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDownIcon } from 'lucide-react';
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  experience: string;
  salary: string;
  description: string;
  requirements: string[];
  benefits: string[];
}
export const jobs: Job[] = [{
  id: '1',
  title: 'Senior Software Engineer',
  company: 'TechCorp Inc.',
  location: 'San Francisco, CA (Remote)',
  type: 'Full-time',
  experience: '5+ years experience',
  salary: '$120k - $150k',
  description: 'We are seeking a talented and experienced Senior Software Engineer to join our growing team. In this role, you will be responsible for developing and maintaining high-quality software solutions that meet business requirements and user needs.',
  requirements: ['5+ years of experience in software development', 'Strong proficiency in JavaScript, TypeScript, and React', 'Experience with backend technologies such as Node.js', 'Knowledge of database systems (SQL and NoSQL)', 'Understanding of CI/CD pipelines and DevOps practices', 'Excellent problem-solving and communication skills'],
  benefits: ['Competitive salary and equity package', 'Health, dental, and vision insurance', 'Flexible work hours and remote work options', 'Professional development budget', '401(k) matching', 'Generous paid time off']
}, {
  id: '2',
  title: 'Product Manager',
  company: 'TechCorp Inc.',
  location: 'New York, NY (Hybrid)',
  type: 'Full-time',
  experience: '3+ years experience',
  salary: '$110k - $140k',
  description: "We're looking for a Product Manager to drive the strategy and execution of our core products. You'll work closely with engineering, design, and business teams to deliver exceptional user experiences.",
  requirements: ['3+ years of product management experience', 'Strong analytical and problem-solving skills', 'Excellent communication and stakeholder management', 'Experience with agile methodologies', 'Technical background preferred', 'MBA or equivalent experience'],
  benefits: ['Competitive salary and equity package', 'Health, dental, and vision insurance', 'Flexible work hours and hybrid work model', 'Professional development budget', '401(k) matching', 'Generous paid time off']
}];
interface JobSelectorProps {
  jobs: Job[];
  selectedJobId: string;
  onJobSelect: (jobId: string) => void;
}
export const JobSelector = ({
  jobs,
  selectedJobId,
  onJobSelect
}: JobSelectorProps) => {
  console.log(jobs);
  if (!jobs || jobs.length === 0) {
    return <Select disabled>
        <SelectTrigger className="w-full">
            <SelectValue placeholder="No jobs available" />
        </SelectTrigger>
    </Select>;
  }
  return <Select value={selectedJobId} onValueChange={onJobSelect}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a job position" />
      </SelectTrigger>
      <SelectContent>
        {jobs.map(job => <SelectItem key={job.id} value={job.id}>
            {job.title}
          </SelectItem>)}
      </SelectContent>
    </Select>;
};