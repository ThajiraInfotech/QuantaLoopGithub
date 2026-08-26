import { getAxiosErrorMessage, isApiError, isApiSuccess } from "@/lib/api-result";
import type { ContactSupportPayload } from "@/validations/support";

import { apiClient } from "../api/client";

export async function submitContactSupportRequest(
  payload: ContactSupportPayload
): Promise<{ message: string }> {
  try {
    const { data } = await apiClient.post<unknown>("/support/contact", payload);
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ submitted: boolean }>(data)) {
      throw new Error("Unexpected response");
    }
    return { message: data.message || "Message sent" };
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}
