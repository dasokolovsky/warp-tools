'use client';

import { useState } from 'react';
import { Save, FolderOpen, Trash2 } from 'lucide-react';
import type { SavedTemplate, RateConData } from '@/app/types';

const STORAGE_KEY = 'warp-ratecon-templates';

function loadTemplates(): SavedTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedTemplate[]) : [];
  } catch {
    return [];
  }
}

function saveTemplates(templates: SavedTemplate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

interface Props {
  data: RateConData;
  onLoad: (data: RateConData) => void;
}

export function TemplateManager({ data, onLoad }: Props) {
  const [templates, setTemplates] = useState<SavedTemplate[]>(() => loadTemplates());
  const [templateName, setTemplateName] = useState('');
  const [showSave, setShowSave] = useState(false);
  const [showLoad, setShowLoad] = useState(false);

  function handleSave() {
    if (!templateName.trim()) return;
    const newTemplate: SavedTemplate = {
      id: Date.now().toString(),
      name: templateName.trim(),
      savedAt: new Date().toISOString(),
      data: { ...data },
    };
    const updated = [...templates, newTemplate];
    saveTemplates(updated);
    setTemplates(updated);
    setTemplateName('');
    setShowSave(false);
  }

  function handleLoad(template: SavedTemplate) {
    onLoad(template.data);
    setShowLoad(false);
  }

  function handleDelete(id: string) {
    const updated = templates.filter((t) => t.id !== id);
    saveTemplates(updated);
    setTemplates(updated);
  }

  const inputClass =
    'bg-[#080F1E] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] focus:ring-1 focus:ring-[#00C650] transition-colors';

  return (
    <div className="flex gap-2 flex-wrap">
      {/* Save Template */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setShowSave(!showSave); setShowLoad(false); }}
          className="flex items-center gap-2 px-3 py-2 bg-[#080F1E] border border-[#1A2235] rounded-lg text-sm text-slate-200 hover:border-[#00C650] transition-colors"
        >
          <Save size={14} />
          Save Template
        </button>
        {showSave && (
          <div className="absolute top-full left-0 mt-1 z-10 bg-[#080F1E] border border-[#1A2235] rounded-xl p-3 shadow-xl w-64">
            <p className="text-xs text-[#8B95A5] mb-2">Template name</p>
            <input
              className={`${inputClass} w-full mb-2`}
              placeholder="e.g. Standard Chicago Lane"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              autoFocus
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={!templateName.trim()}
              className="w-full py-1.5 bg-[#00C650] text-black text-sm font-medium rounded-lg disabled:opacity-40 hover:bg-green-400 transition-colors"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* Load Template */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setShowLoad(!showLoad); setShowSave(false); }}
          className="flex items-center gap-2 px-3 py-2 bg-[#080F1E] border border-[#1A2235] rounded-lg text-sm text-slate-200 hover:border-[#00C650] transition-colors"
        >
          <FolderOpen size={14} />
          Load Template
          {templates.length > 0 && (
            <span className="bg-[#00C650] text-black text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {templates.length}
            </span>
          )}
        </button>
        {showLoad && (
          <div className="absolute top-full left-0 mt-1 z-10 bg-[#080F1E] border border-[#1A2235] rounded-xl p-3 shadow-xl w-72">
            {templates.length === 0 ? (
              <p className="text-xs text-[#8B95A5] text-center py-2">No saved templates yet</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#0C1528] group"
                  >
                    <button
                      type="button"
                      onClick={() => handleLoad(t)}
                      className="flex-1 text-left text-sm text-slate-200 hover:text-[#00C650] transition-colors"
                    >
                      <span className="font-medium">{t.name}</span>
                      <span className="block text-xs text-[#8B95A5]">
                        {new Date(t.savedAt).toLocaleDateString()}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      className="text-[#8B95A5] hover:text-[#FF4444] transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
