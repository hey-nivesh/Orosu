"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { profileApi, jobsApi } from "@/lib/api/client";
import {
  CareerProfileRecord,
  ExperienceItem,
  JobDescriptionRecord,
  ProjectItem,
  SkillItem,
  EducationItem,
  CertificationItem,
  StructuredCareerProfile,
} from "@/types";

interface CareerContextType {
  careerProfile: CareerProfileRecord | null;
  experiences: ExperienceItem[];
  projects: ProjectItem[];
  skills: SkillItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  jobs: JobDescriptionRecord[];
  isLoading: boolean;
  error: string | null;
  refreshCareer: () => Promise<void>;
  refreshJobs: () => Promise<void>;
  saveCareerProfile: (profile: StructuredCareerProfile, rawResumeText?: string) => Promise<void>;
  saveJobDescription: (payload: { company?: string; role?: string; raw_text: string }) => Promise<JobDescriptionRecord>;
  deleteJobDescription: (id: string) => Promise<void>;
}

const CareerContext = createContext<CareerContextType | null>(null);

export function CareerProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, refreshProfile } = useAuth();

  const [careerProfile, setCareerProfile] = useState<CareerProfileRecord | null>(null);
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [education, setEducation] = useState<EducationItem[]>([]);
  const [certifications, setCertifications] = useState<CertificationItem[]>([]);
  const [jobs, setJobs] = useState<JobDescriptionRecord[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCareer = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await profileApi.getCareer();
      setCareerProfile(data.careerProfile);
      setExperiences(data.experiences || []);
      setProjects(data.projects || []);
      setSkills(data.skills || []);
      setEducation(data.education || []);
      setCertifications(data.certifications || []);
    } catch (err: any) {
      console.warn("Career fetch notice:", err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const refreshJobs = useCallback(async () => {
    if (!user) return;
    try {
      const data = await jobsApi.getJobs();
      setJobs(data || []);
    } catch (err: any) {
      console.warn("Jobs fetch notice:", err.message);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshCareer();
      refreshJobs();
    } else {
      setCareerProfile(null);
      setExperiences([]);
      setProjects([]);
      setSkills([]);
      setEducation([]);
      setCertifications([]);
      setJobs([]);
    }
  }, [user, refreshCareer, refreshJobs]);

  const saveCareerProfile = async (
    profileData: StructuredCareerProfile,
    rawResumeText?: string
  ) => {
    setIsLoading(true);
    try {
      await profileApi.saveCareer(profileData, rawResumeText);
      await refreshProfile();
      await refreshCareer();
    } finally {
      setIsLoading(false);
    }
  };

  const saveJobDescription = async (payload: {
    company?: string;
    role?: string;
    raw_text: string;
  }): Promise<JobDescriptionRecord> => {
    const job = await jobsApi.createJob(payload);
    await refreshJobs();
    return job;
  };

  const deleteJobDescription = async (id: string) => {
    await jobsApi.deleteJob(id);
    await refreshJobs();
  };

  return (
    <CareerContext.Provider
      value={{
        careerProfile,
        experiences,
        projects,
        skills,
        education,
        certifications,
        jobs,
        isLoading,
        error,
        refreshCareer,
        refreshJobs,
        saveCareerProfile,
        saveJobDescription,
        deleteJobDescription,
      }}
    >
      {children}
    </CareerContext.Provider>
  );
}

export function useCareer() {
  const context = useContext(CareerContext);
  if (!context) {
    throw new Error("useCareer must be used within a CareerProvider");
  }
  return context;
}
