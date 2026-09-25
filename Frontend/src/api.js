import axios from "axios";
const api=axios.create({baseURL:import.meta.env.VITE_API_URL||"http://localhost:5000/api/v1",withCredentials:true});
export { api };
let token=localStorage.getItem("carepulse_access_token");
export function setAccessToken(v){token=v;if(v)localStorage.setItem("carepulse_access_token",v);else localStorage.removeItem("carepulse_access_token")}
api.interceptors.request.use(c=>{if(token)c.headers.Authorization=`Bearer ${token}`;return c});
api.interceptors.response.use(r=>r,async e=>{const o=e.config;if(e.response?.status===401&&!o?._retry&&!o?.url?.includes("/auth/refresh")){o._retry=true;try{const r=await api.post("/auth/refresh");setAccessToken(r.data.data.accessToken);o.headers.Authorization=`Bearer ${r.data.data.accessToken}`;return api(o)}catch{setAccessToken(null)}}return Promise.reject(e)});
export default api;