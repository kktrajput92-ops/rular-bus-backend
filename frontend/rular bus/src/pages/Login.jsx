import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { usePermission } from "../context/PermissionContext";
import ThemeToggle from "../theme/ThemeToggle";
export default function Login(){

const navigate=useNavigate();
const { setPermissions } = usePermission();
const[email,setEmail]=useState("");

const[password,setPassword]=useState("");

const login=async()=>{

try{

const res = await api.post("/auth/login", {
  email,
  password,
});



localStorage.setItem("token",res.data.token);
localStorage.setItem("user", JSON.stringify(res.data.user));

if (res.data.permissions) {
  setPermissions(res.data.permissions);
  localStorage.setItem(
    "permissions",
    JSON.stringify(res.data.permissions)
  );
}
navigate("/admin");

} catch (err) {
  console.error("Login error:", err);

  alert(
    err.response?.data?.message ||
    err.message ||
    "Login Failed"
  );
}

};

return(

<div
style={{
display:"flex",
justifyContent:"center",
alignItems:"center",
minHeight:"100vh",
background:"var(--erp-bg)",
color:"var(--erp-text)",
position:"relative",
padding:"20px",
boxSizing:"border-box",
transition:"background 0.25s ease, color 0.25s ease"
}}
>

<div
style={{
position:"absolute",
top:16,
right:16,
zIndex:10
}}
>
<ThemeToggle />
</div>

<div
style={{
width:"min(380px, 100%)",
padding:30,
background:"var(--erp-surface)",
color:"var(--erp-text)",
border:"1px solid var(--erp-border)",
borderRadius:15,
boxShadow:"var(--erp-shadow-lg)"
}}
>

<h2 style={{ color: "var(--erp-heading)", marginTop: 0 }}>Admin Login</h2>

<input
placeholder="Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
style={{
width:"100%",
padding:12,
marginTop:15,
boxSizing:"border-box",
background:"var(--erp-input-bg)",
color:"var(--erp-text)",
border:"1px solid var(--erp-border)",
borderRadius:8
}}
/>

<input
type="password"
placeholder="Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
style={{
width:"100%",
padding:12,
marginTop:15,
boxSizing:"border-box",
background:"var(--erp-input-bg)",
color:"var(--erp-text)",
border:"1px solid var(--erp-border)",
borderRadius:8
}}
/>

<button
onClick={login}
style={{
width:"100%",
marginTop:20,
padding:12,
background:"#0B3D91",
color:"#fff",
border:"none",
borderRadius:8,
cursor:"pointer"
}}
>

Login

</button>

</div>

</div>

);

}
