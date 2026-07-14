import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Login(){

const navigate=useNavigate();

const[email,setEmail]=useState("");

const[password,setPassword]=useState("");

const login=async()=>{

try{

const res=await api.post("/auth/login",{

email,
password

});

localStorage.setItem("token",res.data.token);

navigate("/admin");

}catch(err){

alert(err.response?.data?.message || "Login Failed");

}

};

return(

<div
style={{
display:"flex",
justifyContent:"center",
alignItems:"center",
height:"100vh",
background:"#F5F7FA"
}}
>

<div
style={{
width:380,
padding:30,
background:"#fff",
borderRadius:15,
boxShadow:"0 10px 25px rgba(0,0,0,.08)"
}}
>

<h2>Admin Login</h2>

<input
placeholder="Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
style={{
width:"100%",
padding:12,
marginTop:15
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
marginTop:15
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
cursor:"pointer"
}}
>

Login

</button>

</div>

</div>

);

}
