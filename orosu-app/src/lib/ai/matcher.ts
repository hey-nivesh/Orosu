/**
 * AI Matcher & Optimization Workflow
 * Reserved for Phase 2: Resume tailoring, LLM ATS scoring, and evidence grounding.
 */

export interface JobAnalysisStub {
  company: string;
  role: string;
  rawText: string;
}

export function analyzeJobDescriptionStub(rawText: string, company?: string, role?: string): JobAnalysisStub {
  return {
    company: company || "Target Company",
    role: role || "Target Role",
    rawText,
  };
}
