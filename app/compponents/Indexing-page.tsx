 "use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ExternalLink,
  FileText,
  Globe,
  Layers3,
  Link2,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  Upload,
  XCircle,
} from "lucide-react";

import LogoutButton from "./logout-button";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

type IndexingResult = {
  url: string;
  success: boolean;
  message?: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  results?: IndexingResult[];
  data?: unknown;
  [key: string]: unknown;
};

type Mode = "single" | "bulk";

export default function IndexingPage() {
  const [mode, setMode] = useState<Mode>("single");
  const [input, setInput] = useState("");
  const [results, setResults] = useState<IndexingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);

  const urls = useMemo(() => {
    const values =
      mode === "single"
        ? [input.trim()]
        : input.split(/[\n,\s]+/).map((url) => url.trim());

    return [...new Set(values.filter(Boolean))];
  }, [input, mode]);

  const invalidUrls = useMemo(() => {
    return urls.filter((value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol !== "http:" && parsed.protocol !== "https:";
      } catch {
        return true;
      }
    });
  }, [urls]);

  const validUrls = urls.filter((url) => !invalidUrls.includes(url));

  function handleModeChange(nextMode: Mode) {
    setMode(nextMode);
    setInput("");
    setResults([]);
    setError("");
    setSuccessMessage("");
    setApiResponse(null);
  }

  function handleClear() {
    setInput("");
    setResults([]);
    setError("");
    setSuccessMessage("");
    setApiResponse(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");
    setResults([]);
    setApiResponse(null);

    if (!input.trim()) {
      setError(
        mode === "single"
          ? "Please enter a URL to submit."
          : "Please enter at least one URL to submit."
      );
      return;
    }

    if (invalidUrls.length > 0) {
      setError(
        `Please correct these invalid URL${invalidUrls.length > 1 ? "s" : ""}: ${invalidUrls.join(", ")}`
      );
      return;
    }

    if (validUrls.length === 0) {
      setError("Please enter at least one valid HTTP or HTTPS URL.");
      return;
    }

    if (validUrls.length > 100) {
      setError("You can submit a maximum of 100 URLs per request.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/indexing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          mode === "single"
            ? { url: validUrls[0] }
            : { urls: validUrls }
        ),
      });

      const data = (await response.json().catch(() => ({}))) as ApiResponse;

      setApiResponse(data);

      if (!response.ok) {
        setError(
          data.error ||
            data.message ||
            (response.status === 401
              ? "Your session has expired. Please log in again."
              : "Unable to submit your URLs. Please try again.")
        );
        return;
      }

      if (Array.isArray(data.results)) {
        setResults(data.results);
      } else {
        setResults(
          validUrls.map((url) => ({
            url,
            success: data.success !== false,
            message: data.message || "Request processed.",
          }))
        );
      }

      setSuccessMessage(
          `Your ${validUrls.length} ${validUrls.length === 1 ? "URL has" : "URLs have"} been submitted successfully.`
      );
      setInput("");
    } catch {
      setError(
        "A network error occurred while submitting your URLs. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const successfulCount = results.filter((item) => item.success).length;
  const failedCount = results.filter((item) => !item.success).length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
              <Layers3 className="h-5 w-5" />
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight text-slate-900">
                Indexing
              </p>
              <p className="text-xs text-slate-500">
                URL submission workspace
              </p>
            </div>
          </a>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 sm:flex">
              <ShieldCheck className="h-4 w-4 text-teal-700" />
              Admin workspace
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="mb-9">
          <Badge className="mb-4 border border-teal-100 bg-teal-50 px-3 py-1 text-teal-800 hover:bg-teal-50">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Simple URL submission
          </Badge>

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Submit URLs for indexing
              </h1>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Submit a single page or multiple URLs from one workspace.
                Review your input and track the response from the indexing
                service.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 md:self-auto">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50">
                <ShieldCheck className="h-5 w-5 text-teal-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Secure workspace
                </p>
                <p className="text-xs text-slate-500">
                  Authenticated access
                </p>
              </div>
            </div>
          </div>
        </section>

<section className="grid grid-cols-1 items-start">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <h2 className="text-lg font-semibold text-slate-900">
                URL submission
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose a submission method and enter your URLs below.
              </p>
            </div>

            <div className="p-5 sm:p-7">
              <div className="mb-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleModeChange("single")}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                    mode === "single"
                      ? "border-teal-700 bg-teal-50/70 ring-1 ring-teal-700"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      mode === "single"
                        ? "bg-teal-700 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Link2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Single URL
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Submit one page
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange("bulk")}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                    mode === "bulk"
                      ? "border-teal-700 bg-teal-50/70 ring-1 ring-teal-700"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      mode === "bulk"
                        ? "bg-teal-700 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Bulk URLs
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Submit multiple pages
                    </p>
                  </div>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <Label
                      htmlFor="url-input"
                      className="text-sm font-semibold text-slate-800"
                    >
                      {mode === "single" ? "Page URL" : "Page URLs"}
                    </Label>

                    {mode === "bulk" && (
                      <span className="text-xs text-slate-500">
                        Maximum 100 URLs
                      </span>
                    )}
                  </div>

                  <Textarea
                    id="url-input"
                    value={input}
                    onChange={(event) => {
                      setInput(event.target.value);
                      setError("");
                      setSuccessMessage("");
                    }}
                    placeholder={
                      mode === "single"
                        ? "https://example.com/your-page"
                        : "https://example.com/page-one\nhttps://example.com/page-two\nhttps://example.com/page-three"
                    }
                    rows={mode === "single" ? 4 : 9}
                    className="min-h-28 resize-y rounded-xl border-slate-200 bg-white px-4 py-3 text-sm leading-6 shadow-none placeholder:text-slate-400 focus-visible:ring-teal-700"
                    disabled={loading}
                  />

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-slate-500">
                      {mode === "single"
                        ? "Enter a complete URL beginning with https:// or http://."
                        : "Enter one URL per line. Commas and spaces are also accepted."}
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      {urls.length} {urls.length === 1 ? "URL" : "URLs"}
                    </p>
                  </div>
                </div>

               

                {error && (
                  <Alert
                    variant="destructive"
                    className="rounded-xl"
                  >
                    <CircleAlert className="h-4 w-4" />
                    <AlertTitle>Submission failed</AlertTitle>
                    <AlertDescription className="break-words">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert className="rounded-xl border-teal-200 bg-teal-50 text-teal-950">
                    <CheckCircle2 className="h-4 w-4 text-teal-700" />
                    <AlertTitle>Request processed</AlertTitle>
                    <AlertDescription className="text-teal-900">
                      {successMessage}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                    disabled={loading}
                    className="rounded-xl border-slate-200 px-5"
                  >
                    Clear input
                  </Button>

                  <Button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="rounded-xl bg-teal-700 px-6 text-white hover:bg-teal-800"
                  >
                    {loading ? (
                      <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        Submitting URLs...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Submit for indexing
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          
        </section>

        

        <footer className="mt-10 border-t border-slate-200 py-6">
          <div className="flex flex-col gap-2 text-center text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">
     
            <p className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Private admin workspace
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
 