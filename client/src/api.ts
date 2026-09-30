import axios from "axios";
import { store, clearSession } from "./store";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1",
  withCredentials: true,
});
api.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original?._retried) {
      original._retried = true;
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1"}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        store.dispatch({
          type: "auth/setSession",
          payload: { user: data.data.user, token: data.data.accessToken },
        });
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        store.dispatch(clearSession());
      }
    }
    return Promise.reject(error);
  },
);
