
type LiveIndexingResponse = {
  httpStatus: number;
  accepted: boolean;
  message: string;
  data: unknown;
};

export async function submitUrlsForIndexing(
  urls: string[]
): Promise<LiveIndexingResponse> {
  const endpoint = process.env.LIVEINDEXING_API_URL;
  const apiKey = process.env.LIVEINDEXING_API_KEY;

  if (!endpoint || !apiKey) {
    throw new Error("LiveIndexing API environment variables are missing.");
  }

  let response: Response;

  try {
    response = await fetch(endpoint, {
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
  } catch {
    throw new Error("Could not connect to the LiveIndexing API.");
  }

  const rawBody = await response.text();
  let data: unknown = null;

  if (rawBody) {
    try {
      data = JSON.parse(rawBody);
    } catch {
      data = { rawResponse: rawBody.slice(0, 2000) };
    }
  }

  const body =
    data && typeof data === "object"
      ? (data as Record<string, unknown>)
      : {};

  const message =
    typeof body.message === "string"
      ? body.message
      : response.ok
        ? "Request accepted by LiveIndexing."
        : "LiveIndexing rejected the request.";

  if (!response.ok) {
    throw new Error(
      `LiveIndexing API returned HTTP ${response.status}: ${message}`
    );
  }

  return {
    httpStatus: response.status,
    accepted: true,
    message,
    data,
  };
}
