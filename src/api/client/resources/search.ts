import type { ApiResponse, SearchFileResult } from "../types";
import { IPC_COMMANDS } from "../commands";
import {
  extractData,
  handleApiError,
  hasTauriRuntime,
  httpGet,
  invokeCommand,
} from "../utils";

export async function queryFiles(
  query: string,
): Promise<SearchFileResult[]> {
  try {
    if (!hasTauriRuntime()) {
      return httpGet<SearchFileResult[]>(`/search/files?q=${encodeURIComponent(query)}`);
    }

    const response = await invokeCommand<ApiResponse<SearchFileResult[]>>(
      IPC_COMMANDS.search.queryFiles,
      { query },
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}
