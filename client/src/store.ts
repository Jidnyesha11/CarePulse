import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
export type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "DOCTOR" | "PATIENT";
  department?: string;
};
type Auth = { user: User | null; token: string | null };
const saved = sessionStorage.getItem("carepulse-session");
let initial: Auth = { user: null, token: null };
try {
  if (saved) initial = JSON.parse(saved) as Auth;
} catch {
  sessionStorage.removeItem("carepulse-session");
}
const authSlice = createSlice({
  name: "auth",
  initialState: initial,
  reducers: {
    setSession: (s, a: PayloadAction<Auth>) => {
      s.user = a.payload.user;
      s.token = a.payload.token;
      sessionStorage.setItem("carepulse-session", JSON.stringify(a.payload));
    },
    clearSession: (s) => {
      s.user = null;
      s.token = null;
      sessionStorage.removeItem("carepulse-session");
    },
  },
});
export const { setSession, clearSession } = authSlice.actions;
export const store = configureStore({ reducer: { auth: authSlice.reducer } });
export type RootState = ReturnType<typeof store.getState>;
