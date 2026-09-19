import {createContext,useContext,useEffect,useState} from "react";
import {api,setAccessToken} from "./api";
const C=createContext(null);
export function AuthProvider({children}){
 const[user,setUser]=useState(null),[loading,setLoading]=useState(true);
 useEffect(()=>{api.get("/auth/me").then(r=>setUser(r.data.data.user)).catch(()=>api.post("/auth/refresh").then(r=>{setAccessToken(r.data.data.accessToken);setUser(r.data.data.user)}).catch(()=>{})).finally(()=>setLoading(false))},[]);
 const login=async(email,password)=>{const r=await api.post("/auth/login",{email,password});setAccessToken(r.data.data.accessToken);setUser(r.data.data.user)};
 const register=async(payload)=>{const r=await api.post("/auth/register",payload);setAccessToken(r.data.data.accessToken);setUser(r.data.data.user)};
 const logout=async()=>{await api.post("/auth/logout");setAccessToken(null);setUser(null)};
 return <C.Provider value={{user,loading,login,register,logout}}>{children}</C.Provider>;
}
export const useAuth=()=>useContext(C);
