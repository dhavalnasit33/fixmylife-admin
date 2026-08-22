import { API_BASE_URL } from '@/config';
import { getToken } from './authUtils';

interface ApiOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}


// interface ApiOptions extends Omit<RequestInit, 'body'> {
//   params?: Record<string, string | number | boolean | undefined>;
//   body?: any;
// }


async function apiService<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});
  const token = getToken();

  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  if (!(fetchOptions.body instanceof FormData) && typeof fetchOptions.body === 'object' && fetchOptions.body !== null) {
     headers.append('Content-Type', 'application/json');
     fetchOptions.body = JSON.stringify(fetchOptions.body);
  } else if (fetchOptions.body instanceof FormData) {
    // Don't set Content-Type for FormData, browser does it
  }


  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
  }
  
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: response.statusText };
    }
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  // Handle cases where response might be empty (e.g., DELETE, PATCH toggle)
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }
  // For non-JSON responses or empty body (like 204 No Content)
  return {} as Promise<T>; // Or handle specific status codes like 204 returning null/undefined
}

export default apiService;
