import axios from "axios";

const envApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const API_URL = (envApiUrl && envApiUrl.trim().length > 0 ? envApiUrl : "http://localhost:4000").replace(/\/+$/, "");
if (!envApiUrl) {
  // eslint-disable-next-line no-console
  console.warn("VITE_API_URL is not set; using default http://localhost:4000");
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem("sbs_token", token);
  else localStorage.removeItem("sbs_token");
}

export function getAuthToken() {
  return localStorage.getItem("sbs_token");
}

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

