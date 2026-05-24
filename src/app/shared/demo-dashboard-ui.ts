export interface DemoKpi {
  label: string;
  value: string;
  helper: string;
  icon: string;
  tone: 'blue' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';
}

export interface DemoAction {
  label: string;
  description: string;
  icon: string;
  route?: string;
}

export interface DemoActivity {
  title: string;
  meta: string;
  amount?: string;
  status: 'success' | 'warning' | 'info' | 'danger';
}

export const demoToneClass: Record<DemoKpi['tone'], string> = {
  blue: 'demo-tone-blue',
  cyan: 'demo-tone-cyan',
  emerald: 'demo-tone-emerald',
  amber: 'demo-tone-amber',
  rose: 'demo-tone-rose',
  violet: 'demo-tone-violet'
};
