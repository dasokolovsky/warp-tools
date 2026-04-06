'use client';

import { useState, useCallback } from 'react';
import { Copy, Download, AlertCircle, Loader2, Zap, RotateCcw } from 'lucide-react';
import { UploadZone } from '@/components/UploadZone';
import { ExtractedFieldCard } from '@/components/ExtractedFieldCard';
import { RawTextView } from '@/components/RawTextView';
import type { ExtractedField } from '@/lib/parser';

interface ParseResult {
  fields: ExtractedField[];
  rawText: string;
  error?: string;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function fieldsToCSV(fields: ExtractedField[]): string {
  const header = 'Label,Value,Confidence,Pattern';
  const rows = fields.map(
    (f) =>
      `"${f.label}","${f.value.replace(/"/g, '""')}","${f.confidence}","${f.pattern.replace(/"/g, '""')}"`
  );
  return [header, ...rows].join('\n');
}

export default function FreightParserPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [copied, setCopied] = useState<'json' | 'csv' | null>(null);

  const handleParseResult = useCallback((data: ParseResult) => {
    setResult(data);
    setFields(data.fields);
    setErrorMsg(data.error ?? null);
  }, []);

  const submitFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setErrorMsg(null);
      setResult(null);
      setFields([]);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/parse', { method: 'POST', body: formData });
        const data = (await res.json()) as ParseResult;
        if (!res.ok) {
          setErrorMsg(data.error ?? 'Parse failed');
        } else {
          handleParseResult(data);
        }
      } catch {
        setErrorMsg('Network error — could not reach the server.');
      } finally {
        setLoading(false);
      }
    },
    [handleParseResult]
  );

  const submitText = useCallback(
    async (text: string) => {
      setLoading(true);
      setErrorMsg(null);
      setResult(null);
      setFields([]);
      try {
        const res = await fetch('/api/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        const data = (await res.json()) as ParseResult;
        if (!res.ok) {
          setErrorMsg(data.error ?? 'Parse failed');
        } else {
          handleParseResult(data);
        }
      } catch {
        setErrorMsg('Network error — could not reach the server.');
      } finally {
        setLoading(false);
      }
    },
    [handleParseResult]
  );

  function handleFieldUpdate(key: string, newValue: string) {
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, value: newValue } : f))
    );
  }

  function handleCopyJSON() {
    copyToClipboard(JSON.stringify(fields, null, 2));
    setCopied('json');
    setTimeout(() => setCopied(null), 2000);
  }

  function handleCopyCSV() {
    copyToClipboard(fieldsToCSV(fields));
    setCopied('csv');
    setTimeout(() => setCopied(null), 2000);
  }

  function handleReset() {
    setResult(null);
    setFields([]);
    setErrorMsg(null);
  }

  const matchedValues = fields.map((f) => f.value.split(', ')).flat();

  return (
    <div className="min-h-screen bg-[#040810]">
      {/* Top Nav */}
      <header className="border-b border-[#1A2235] bg-[#040810]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#00C650]/15 flex items-center justify-center">
              <Zap size={14} className="text-[#00C650]" />
            </div>
            <span className="font-semibold text-slate-200 text-sm">Freight Parser</span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[#1A2235] text-[#8B95A5]">
              v1 · Pattern Matching
            </span>
          </div>
          <a
            href="https://github.com/wearewarp/warp-tools"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#8B95A5] hover:text-slate-200 transition-colors"
          >
            GitHub ↗
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-slate-100">
            Freight Document Parser
          </h1>
          <p className="text-[#8B95A5] max-w-xl mx-auto">
            Upload a rate confirmation, bill of lading, or invoice — extract structured data
            instantly using pattern matching. No AI, no cloud, no data leaves your machine.
          </p>
        </div>

        {/* Upload zone */}
        {!result && (
          <div className="bg-[#080F1E] border border-[#1A2235] rounded-2xl p-6">
            <UploadZone onFile={submitFile} onText={submitText} loading={loading} />
            {loading && (
              <div className="mt-6 flex items-center justify-center gap-2 text-[#8B95A5]">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Parsing document…</span>
              </div>
            )}
            {errorMsg && (
              <div className="mt-4 flex items-start gap-2 text-sm text-[#FF4444] bg-[#FF4444]/10 border border-[#FF4444]/20 rounded-xl px-4 py-3">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Results header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-200">
                  Extracted Fields
                </h2>
                <p className="text-sm text-[#8B95A5]">
                  {fields.length} field{fields.length !== 1 ? 's' : ''} found ·{' '}
                  <button
                    onClick={handleReset}
                    className="text-[#00C650] hover:text-[#00B048] transition-colors inline-flex items-center gap-1"
                  >
                    <RotateCcw size={11} />
                    Parse another
                  </button>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyJSON}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A2235] text-sm text-slate-200 hover:bg-[#2A3345] transition-colors"
                >
                  <Copy size={13} />
                  {copied === 'json' ? 'Copied!' : 'JSON'}
                </button>
                <button
                  onClick={handleCopyCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A2235] text-sm text-slate-200 hover:bg-[#2A3345] transition-colors"
                >
                  <Download size={13} />
                  {copied === 'csv' ? 'Copied!' : 'CSV'}
                </button>
              </div>
            </div>

            {/* Error message if any */}
            {errorMsg && (
              <div className="flex items-start gap-2 text-sm text-[#FF4444] bg-[#FF4444]/10 border border-[#FF4444]/20 rounded-xl px-4 py-3">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* No fields found */}
            {fields.length === 0 && !errorMsg && (
              <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl px-6 py-10 text-center text-[#8B95A5]">
                <p className="font-medium">No recognizable fields found.</p>
                <p className="text-sm mt-1">
                  The document may not contain standard freight data patterns, or the text
                  extraction may have failed. Try pasting the text manually.
                </p>
              </div>
            )}

            {/* Field cards */}
            {fields.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {fields.map((field) => (
                  <ExtractedFieldCard
                    key={field.key}
                    field={field}
                    onUpdate={handleFieldUpdate}
                  />
                ))}
              </div>
            )}

            {/* Raw text */}
            {result.rawText && (
              <RawTextView rawText={result.rawText} matchedValues={matchedValues} />
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-[#1A2235] pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#8B95A5]">
          <span>
            Built by{' '}
            <a href="https://wearewarp.com" className="text-[#00C650] hover:underline" target="_blank" rel="noopener noreferrer">
              Warp
            </a>{' '}
            · Free &amp; open-source
          </span>
          <span>v1 uses pattern matching · v2 will add AI parsing</span>
        </div>
      </main>
    </div>
  );
}
