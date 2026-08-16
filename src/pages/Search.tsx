import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Loader2, Sparkles, FileText, ChevronRight } from 'lucide-react';
import { semanticSearch } from '@/api/search';
import type { SearchResponse, SearchResult, Citation } from '@/types';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FileIconComponent } from '@/components/files/FileIcon';
import { getFileCategory } from '@/utils';

function getFileName(result: SearchResult): string {
  return result.file_name || result.filename || 'Unknown file';
}

function getSnippet(result: SearchResult): string {
  return result.snippet || result.text || '';
}

function getCitationName(c: Citation): string {
  return c.file_name || c.filename || 'Unknown file';
}

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async (q?: string) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setLoading(true);
    setError(false);
    setHasSearched(true);
    try {
      const data = await semanticSearch(searchQuery);
      setResults(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const suggestions = [
    'What did I write about database normalization?',
    'Summarize my operating systems notes',
    'Find documents about project planning',
  ];

  const searchResults = results?.results || [];
  const answer = results?.answer;
  const sources = results?.sources || results?.answer_sources || [];

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="surface p-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search your knowledge base..."
            className="input-base pl-9 pr-20 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            autoFocus
          />
          <Button
            size="sm"
            className="absolute right-1.5 top-1/2 -translate-y-1/2"
            onClick={() => handleSearch()}
            loading={loading}
            disabled={!query.trim()}
          >
            Search
          </Button>
        </div>

        {!hasSearched && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSearch(s)}
                  className="px-3 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="surface p-8 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Searching your documents...</span>
        </div>
      )}

      {error && !loading && (
        <div className="surface">
          <ErrorState message="Unable to complete your search. Please try again." onRetry={() => handleSearch()} />
        </div>
      )}

      {!loading && !error && hasSearched && results && (
        <>
          {answer && (
            <div className="surface p-4 border-l-2 border-l-brand-500">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-brand-500" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Answer</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{answer}</p>
              {sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Sources:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sources.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => src.file_id && navigate(`/files/${src.file_id}`)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        {getCitationName(src)}
                        {src.page ? ` · p.${src.page}` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Results</h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">{searchResults.length} found</span>
            </div>

            {searchResults.length === 0 ? (
              <div className="surface">
                <EmptyState
                  icon={<SearchIcon className="w-10 h-10" />}
                  title="No relevant documents found"
                  description="Try using different words or a broader question."
                />
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((result, index) => (
                  <SearchResultCard key={result.id || index} result={result} onClick={() => result.file_id && navigate(`/files/${result.file_id}`)} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SearchResultCard({ result, onClick }: { result: SearchResult; onClick: () => void }) {
  const name = getFileName(result);
  const snippet = getSnippet(result);
  const category = getFileCategory(name, result.file_type);
  return (
    <button
      onClick={onClick}
      className="surface p-4 w-full text-left hover:border-brand-300 dark:hover:border-brand-700 transition-colors group"
    >
      <div className="flex items-start gap-3">
        <FileIconComponent category={category} className="mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{name}</p>
            {result.score !== undefined && (
              <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0">
                {Math.round(result.score * 100)}% match
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{snippet}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            {result.page && <span>Page {result.page}</span>}
            {result.chunk_index !== undefined && <span>Chunk {result.chunk_index}</span>}
            {result.source && <span>{result.source}</span>}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 group-hover:text-brand-500 transition-colors" />
      </div>
    </button>
  );
}
