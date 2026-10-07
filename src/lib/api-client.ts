export interface ContactSubmissionPayload {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface ContactSubmissionResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    name: string;
    email: string;
    status: string;
    createdAt: string;
  };
  errors?: string[];
}

/**
 * Client-side utility for communicating with the backend API.
 * Uses the Next.js internal proxy endpoint `/api/contacts` by default,
 * ensuring no CORS constraints and consistent header forwarding.
 */
export async function submitContactInquiry(
  payload: ContactSubmissionPayload
): Promise<ContactSubmissionResponse> {
  const endpoint = "/api/contacts";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: payload.name.trim(),
      email: payload.email.trim(),
      phone: payload.phone?.trim() || "",
      message: payload.message.trim(),
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors && Array.isArray(data.errors) ? data.errors.join(", ") : "") ||
      `Submission failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return (
    data || {
      success: true,
      message: "Thank you! Your message has been received.",
    }
  );
}

/**
 * Check backend service connectivity.
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch("/api/backend-health");
    return await res.json();
  } catch (err) {
    return {
      frontend: "UP",
      backendStatus: "DOWN",
      error: err instanceof Error ? err.message : "Health check failed",
    };
  }
}
