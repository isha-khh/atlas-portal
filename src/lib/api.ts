export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export class ApiError extends Error {
    status: number;
    title: string;
    detail?: string;

    constructor(status: number, title: string, detail?: string) {
        super(detail ? `${title}: ${detail}` : title);
        this.status = status;
        this.title = title;
        this.detail = detail;
    }
}

type FetchOpts = {
    token?: string;
    method?: string;
    body?: unknown;
    signal?: AbortSignal;
    query?: Record<string, string | number | boolean | undefined | null>;
};

const buildUrl = (path: string, query?: FetchOpts["query"]) => {
    const base = path.startsWith("http") ? path : `${API_BASE}${path}`;
    if (!query) return base;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    }
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
};

export async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (opts.body !== undefined) headers["Content-Type"] = "application/json";
    if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;

    const res = await fetch(buildUrl(path, opts.query), {
        method: opts.method ?? "GET",
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        signal: opts.signal,
    });

    if (!res.ok) {
        let title = res.statusText;
        let detail: string | undefined;
        try {
            const body = await res.json();
            title = body.title ?? title;
            detail = body.detail;
        } catch {
            /* not a problem+json body */
        }
        throw new ApiError(res.status, title, detail);
    }

    if (res.status === 204) return undefined as T;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) return undefined as T;
    return (await res.json()) as T;
}
