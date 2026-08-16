import { type ReactNode } from 'react';
import { Search } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0d1119] flex-col justify-between p-12 relative overflow-hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
            <Search className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-white tracking-tight">Smart File Finder</span>
        </div>

        <div className="max-w-md">
          <h2 className="text-2xl font-semibold text-white leading-snug">
            Your files, understood, searchable, and useful.
          </h2>
          <p className="mt-3 text-sm text-gray-400 leading-relaxed">
            Upload your documents and let AI help you find answers, search semantically,
            and chat with your knowledge base using source citations.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-gray-500">
          <span>Semantic Search</span>
          <span className="w-1 h-1 rounded-full bg-gray-600" />
          <span>RAG Chat</span>
          <span className="w-1 h-1 rounded-full bg-gray-600" />
          <span>Source Citations</span>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gray-50 dark:bg-[#0b0e14]">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
