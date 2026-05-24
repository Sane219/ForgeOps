import { Boxes } from 'lucide-react';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 ring-1 ring-indigo-500/20">
            <Boxes className="h-5 w-5 text-indigo-400" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-50">ForgeOps</h1>
          <p className="text-sm text-zinc-400">Internal Developer Platform</p>
        </div>
        {children}
      </div>
    </div>
  );
}
