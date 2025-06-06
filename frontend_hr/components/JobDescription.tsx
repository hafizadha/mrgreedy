import React from 'react';
import { BriefcaseIcon, MapPinIcon, ClockIcon, BuildingIcon, DollarSignIcon } from 'lucide-react';
import { Job } from './JobSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
interface JobDescriptionProps {
  job: Job | null;
}
export const JobDescription = ({
  job
}: JobDescriptionProps) => {
  if (!job) {
    return <Card>
        <CardContent className="flex items-center justify-center text-muted-foreground h-32">
          Please select a job position to view its description
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <CardTitle>{job.title}</CardTitle>
        <div className="flex items-center text-teal-600">
          <BuildingIcon className="h-5 w-5 mr-2" />
          <span className="font-medium">{job.company}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center text-muted-foreground">
            <MapPinIcon className="h-5 w-5 mr-2 text-teal-500" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <ClockIcon className="h-5 w-5 mr-2 text-teal-500" />
            <span>{job.type}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <BriefcaseIcon className="h-5 w-5 mr-2 text-teal-500" />
            <span>{job.experience}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <DollarSignIcon className="h-5 w-5 mr-2 text-teal-500" />
            <span>{job.salary}</span>
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Job Description</h3>
            <p className="text-muted-foreground">{job.description}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Requirements</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              {job.requirements.map((req, index) => <li key={index}>{req}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Benefits</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              {job.benefits.map((benefit, index) => <li key={index}>{benefit}</li>)}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>;
};