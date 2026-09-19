import{useAuth}from"../auth";
export default function Profile(){const{user}=useAuth();return <><div className="title"><div><small>ACCOUNT</small><h2>Profile</h2></div></div><div className="card profile"><div className="avatar big-avatar">{user.name[0]}</div><h3>{user.name}</h3><p>{user.email}</p><em className="pill">{user.role}</em></div></>}
