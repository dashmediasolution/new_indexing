

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

 
const LIVEINDEXING_API_URL =
  "https://liveindexing.com/fui-api/api/v1/urls";

const MAX_URLS = 100;

function isValidUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);

    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "LiveIndexing API route is working.",
    endpoint: "/api/indexing",
    method: "POST",
  });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Please sign in before submitting URLs." },
        { status: 401 }
      );
    }

    const apiKey = process.env.LIVEINDEXING_API_KEY;

    if (!apiKey) {
      console.error("LIVEINDEXING_API_KEY is missing.");

      return NextResponse.json(
        { success: false, error: "LiveIndexing API is not configured." },
        { status: 500 }
      );
    }

    let body: { url?: unknown; urls?: unknown };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Request body must contain valid JSON." },
        { status: 400 }
      );
    }

    const input = Array.isArray(body.urls)
      ? body.urls
      : body.url !== undefined
        ? [body.url]
        : [];

    if (
      input.length === 0 ||
      input.length > MAX_URLS ||
      input.some((url) => !isValidUrl(url))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Submit between 1 and ${MAX_URLS} valid HTTP or HTTPS URLs.`,
        },
        { status: 400 }
      );
    }

    const urls = [
      ...new Set((input as string[]).map((url) => url.trim())),
    ];

    let providerResponse: Response;

    try {
      providerResponse = await fetch(LIVEINDEXING_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ urls }),
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      });
    } catch (error) {
      console.error("LiveIndexing connection error:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Could not connect to LiveIndexing. Please try again.",
        },
        { status: 502 }
      );
    }

    const responseText = await providerResponse.text();

    let providerData: unknown = null;

    try {
      providerData = responseText ? JSON.parse(responseText) : null;
    } catch {
      providerData = { rawResponse: responseText.slice(0, 1000) };
    }

    if (!providerResponse.ok) {
      console.error("LiveIndexing API error:", {
        status: providerResponse.status,
        response: providerData,
      });

      const providerMessage =
        providerData &&
        typeof providerData === "object" &&
        "message" in providerData &&
        typeof providerData.message === "string"
          ? providerData.message
          : "The provider rejected the request.";

      return NextResponse.json(
        {
          success: false,
          error: providerMessage,
          providerHttpStatus: providerResponse.status,
        },
        { status: 502 }
      );
    }

    const providerMessage =
      providerData &&
      typeof providerData === "object" &&
      "message" in providerData &&
      typeof providerData.message === "string"
        ? providerData.message
        : "The provider returned a successful response.";

    return NextResponse.json({
      success: true,
      status: "submitted",
      message: providerMessage,
      total: urls.length,
      submitted: urls.length,
      results: urls.map((url) => ({
        url,
        status: "submitted",
        message: providerMessage,
      })),
      providerHttpStatus: providerResponse.status,
      providerResponse: providerData,
    });
  } catch (error) {
    console.error("Indexing route error:", error);

    return NextResponse.json(
      { success: false, error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
