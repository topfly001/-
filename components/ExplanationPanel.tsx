import React, { useState } from 'react';
import { Sparkles, BookOpen, Loader2 } from 'lucide-react';
import { explainGeometryTheorem } from '../services/geminiService';
import ReactMarkdown from 'react-markdown'; // Note: In a real env, need to install this. Assuming standard markdown rendering for now or plain text.

// Since we can't install new packages dynamically in this prompt, we will render text safely.
// I'll implement a simple text renderer.

interface ExplanationPanelProps {
  chordLength: number;
  angle: number;
  radius: number;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ chordLength, angle, radius }) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAskAI = async () => {
    setLoading(true);
    const result = await explainGeometryTheorem(chordLength, angle, radius);
    setExplanation(result);
    setLoading(false);
  };

  return (
    <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-800">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-lg">定理与解析</h3>
        </div>
        <button
          onClick={handleAskAI}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          咨询 AI 助教
        </button>
      </div>

      {explanation ? (
        <div className="prose prose-slate max-w-none text-slate-600 text-sm leading-relaxed p-4 bg-slate-50 rounded-lg border border-slate-100">
           {/* Simple Markdown-like rendering for basic paragraphs and lists */}
           {explanation.split('\n').map((line, i) => (
             <p key={i} className="mb-2">{line}</p>
           ))}
        </div>
      ) : (
        <div className="text-slate-400 text-sm italic p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center">
          点击“咨询 AI 助教”获取关于当前几何状态的圆周角定理个性化解释。
        </div>
      )}
    </div>
  );
};