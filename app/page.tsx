"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Globe2,
  Link2,
  LoaderCircle,
  RotateCcw,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type SubmissionResult = { url: string; status: string; message: string };
type SubmissionResponse = {
  success?: boolean;
  message?: string;
  total?: number;
  submitted?: number;
  status?: string;
  results?: SubmissionResult[];
  error?: string;
  providerHttpStatus?: number;
};
type SubmissionMode = "single" | "bulk";
const MAX_URLS = 100;

function validateUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export default function IndexingPage() {
  const [mode, setMode] = useState<SubmissionMode>("single");
  const [input, setInput] = useState("");
  const [results, setResults] = useState<SubmissionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const urls = useMemo(() => {
    const parsed = input.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
    return [...new Set(parsed)];
  }, [input]);
  const invalidUrls = useMemo(() => urls.filter((url) => !validateUrl(url)), [urls]);
  const isInputValid = urls.length > 0 && urls.length <= MAX_URLS && invalidUrls.length === 0 && (mode !== "single" || urls.length === 1);
  const successCount = results.filter((result) => result.status === "success" || result.status === "submitted").length;
  const failedCount = results.filter((result) => result.status === "failed").length;

  function handleModeChange(nextMode: SubmissionMode) {
    if (loading) return;
    setMode(nextMode); setInput(""); setResults([]); setError(""); setSuccessMessage("");
  }
  function handleInputChange(value: string) {
    setInput(value); setError(""); setSuccessMessage(""); setResults([]);
  }
  async function handleSubmit() {
    if (loading) return;
    if (!urls.length) { setError("Please enter at least one URL."); return; }
    if (mode === "single" && urls.length !== 1) { setError("Please enter exactly one URL in single URL mode."); return; }
    if (urls.length > MAX_URLS) { setError(`You can submit a maximum of ${MAX_URLS} URLs at a time.`); return; }
    if (invalidUrls.length) { setError(`Please correct the invalid URL${invalidUrls.length > 1 ? "s" : ""}: ${invalidUrls.join(", ")}`); return; }

    setLoading(true); setError(""); setSuccessMessage(""); setResults([]);
    try {
      const response = await fetch("/api/indexing", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ urls }),
      });
      const responseText = await response.text();
      let data: SubmissionResponse;
      try { data = JSON.parse(responseText) as SubmissionResponse; }
      catch { throw new Error(`The API returned an invalid response (HTTP ${response.status}). Check your API route and server logs.`); }
      if (!response.ok) throw new Error(data.error || data.message || `Unable to submit URLs. HTTP ${response.status}.`);
      setResults(data.results ?? []);
      setSuccessMessage(data.message || "Your URL submission request was processed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally { setLoading(false); }
  }
  function handleReset() {
    if (loading) return;
    setInput(""); setResults([]); setError(""); setSuccessMessage("");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3" aria-label="IndexPilot home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white"><Globe2 className="h-5 w-5" /></span>
            <span className="leading-tight"><span className="block text-base font-bold tracking-tight">IndexPilot</span><span className="block text-xs text-slate-500">URL submission workspace</span></span>
          </a>

          <a href="#submit" className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">Get started <ArrowUpRight className="h-4 w-4" /></a>
        </div>
      </header>

      <div id="top" className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <section className="mb-9 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">

          <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 md:flex"><ShieldCheck className="h-5 w-5 text-blue-600" /><div><p className="text-sm font-semibold">Server-side requests</p><p className="text-xs text-slate-500">Handled by your API route</p></div></div>
        </section>

        <section id="submit" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Submission workspace</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">Submit website URLs</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Choose a submission type, add your URL(s), then send your request.</p>
          </div>
          <div className="space-y-6 p-5 sm:p-7">
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-100 p-1.5" role="group" aria-label="Submission type">
              <button type="button" onClick={() => handleModeChange("single")} disabled={loading} aria-pressed={mode === "single"} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition ${mode === "single" ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:text-slate-900"}`}><Link2 className="h-4 w-4" /> Single URL</button>
              <button type="button" onClick={() => handleModeChange("bulk")} disabled={loading} aria-pressed={mode === "bulk"} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition ${mode === "bulk" ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:text-slate-900"}`}><FileText className="h-4 w-4" /> Bulk URLs</button>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><Label htmlFor="url-input" className="text-sm font-semibold text-slate-800">{mode === "single" ? "Website URL" : "Website URLs"}</Label><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${invalidUrls.length ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{urls.length}/{MAX_URLS} URLs</span></div>
              <div className={`rounded-xl border bg-white transition focus-within:ring-4 ${error ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-100" : "border-slate-300 focus-within:border-blue-500 focus-within:ring-blue-100"}`}>
                <Textarea id="url-input" value={input} onChange={(event) => handleInputChange(event.target.value)} placeholder={mode === "single" ? "https://example.com/page" : "https://example.com/page-1\nhttps://example.com/page-2\nhttps://example.com/page-3"} rows={mode === "single" ? 4 : 8} disabled={loading} aria-invalid={Boolean(error)} className="resize-y border-0 bg-transparent px-4 py-3 font-mono text-sm leading-6 shadow-none focus-visible:ring-0" />
              </div>
              <div className="flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>{mode === "single" ? "Include the full URL, starting with https:// or http://." : "Paste one URL per line. Duplicate URLs are removed automatically."}</p>{mode === "bulk" && <p className="font-medium text-slate-600">Maximum 100 unique URLs per request</p>}</div>
              {urls.length > 0 && <div className="flex flex-wrap gap-2"><Badge variant="outline" className="border-slate-200 bg-white text-slate-600">{urls.length} unique {urls.length === 1 ? "URL" : "URLs"}</Badge>{invalidUrls.length > 0 ? <Badge className="bg-red-50 text-red-700 hover:bg-red-50">{invalidUrls.length} invalid</Badge> : urls.length <= MAX_URLS && <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50"><Check className="mr-1 h-3 w-3" /> Valid format</Badge>}</div>}
            </div>

            {error && <Alert variant="destructive" className="rounded-xl"><AlertCircle className="h-4 w-4" /><AlertTitle>Unable to submit</AlertTitle><AlertDescription className="break-words">{error}</AlertDescription></Alert>}
            {successMessage && !error && <Alert className="rounded-xl border-blue-200 bg-blue-50 text-blue-950"><CheckCircle2 className="h-4 w-4 text-blue-600" /><AlertTitle>Request processed</AlertTitle><AlertDescription>{successMessage}</AlertDescription></Alert>}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" onClick={handleReset} disabled={loading || (!input && results.length === 0)} className="h-11 rounded-lg border-slate-300 px-4 text-slate-700"><RotateCcw className="mr-2 h-4 w-4" /> Clear form</Button>
              <Button type="button" onClick={handleSubmit} disabled={loading || !isInputValid} className="h-11 rounded-lg bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300 sm:min-w-48">{loading ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : <><Send className="mr-2 h-4 w-4" /> {mode === "single" ? "Submit URL" : `Submit ${urls.length} URLs`}</>}</Button>
            </div>
          </div>
        </section>

        {results.length > 0 && <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div><h2 className="text-lg font-bold">Submission results</h2><p className="mt-1 text-sm text-slate-500">Responses returned by your indexing API. A submitted status does not guarantee indexing.</p></div><div className="flex gap-2"><Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">{successCount} accepted</Badge>{failedCount > 0 && <Badge className="bg-red-50 text-red-700 hover:bg-red-50">{failedCount} failed</Badge>}</div></div><div className="space-y-3 p-4 sm:p-6">{results.map((result, index) => { const isSubmitted = result.status === "submitted"; const isSuccess = result.status === "success"; const isFailed = result.status === "failed"; return <div key={`${result.url}-${index}`} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 gap-3"><div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isFailed ? "bg-red-50 text-red-600" : isSuccess || isSubmitted ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{isFailed ? <XCircle className="h-5 w-5" /> : isSuccess ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}</div><div className="min-w-0"><p className="break-all text-sm font-semibold text-slate-900">{result.url}</p><p className="mt-1 text-sm leading-6 text-slate-500">{result.message}</p></div></div><Badge variant="outline" className={`w-fit shrink-0 capitalize ${isFailed ? "border-red-200 bg-red-50 text-red-700" : isSuccess || isSubmitted ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"}`}>{result.status}</Badge></div>; })}</div></section>}




      </div>
    </main>
  );
}
