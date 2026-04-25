export type StepType = 'http' | 'delay' | 'script';

export interface Step {
  id: string;
  type: StepType;
  config?: any;
  next?: string[];
}

export interface Workflow {
  id: string;
  steps: Step[];
}
