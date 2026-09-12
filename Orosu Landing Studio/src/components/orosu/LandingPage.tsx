import { Navbar } from "./Navbar";
import { ApplicationsSection, FeaturesSection, FinalCta, Footer, Hero, IntelligenceSection, PricingSection, ProblemSection, ProductSection, ResumeSection, TrustSection, WorkflowSection } from "./Sections";

export function LandingPage() {
  return <main><Navbar /><Hero /><ProblemSection /><ProductSection /><WorkflowSection /><IntelligenceSection /><FeaturesSection /><ResumeSection /><TrustSection /><ApplicationsSection /><PricingSection /><FinalCta /><Footer /></main>;
}