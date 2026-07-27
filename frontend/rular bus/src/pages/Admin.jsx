import { useEffect, useState } from "react";
import api from "../api/api";

import AdminSidebar from "../components/admin/AdminSidebar";
import AdminHeader from "../components/admin/AdminHeader";
import DashboardCard from "../components/admin/DashboardCard";
import QuickActions from "../components/admin/QuickActions";
import RevenueChart from "../components/admin/RevenueChart";
import DashboardAnalytics from "../components/admin/dashboard/DashboardAnalytics";
import RecentBookingsContainer from "../components/admin/RecentBookingsContainer";
export default function Admin() {

const [stats,setStats]=useState({

total_buses:0,
total_drivers:0,
total_routes:0,
total_schedules:0,
total_passengers:0,
total_bookings:0,
total_tickets:0,
total_revenue:0,
total_staff:0,
total_users:0,
total_branches:0,
total_offices:0,
total_assets:0,
pending_leaves:0,
today_attendance:0,
});
const [recentBookings, setRecentBookings] = useState([]);
useEffect(()=>{

loadDashboard();

},[]);

const loadDashboard=async()=>{

try{

const res=await api.get("/dashboard");
setStats(res.data.dashboard);

const recent = await api.get("/dashboard/recent-bookings");
setRecentBookings(recent.data.bookings);

}catch(err){

console.log(err);

}

};

return(

<div
style={{
display:"flex",
background:"var(--erp-bg)",
minHeight:"100vh"
}}
>

<AdminSidebar/>

<div
style={{
flex:1,
padding:25
}}
>

<AdminHeader/>

<div
style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",
gap:20
}}
>

<DashboardCard
title="Total Buses"
value={stats.total_buses}
icon="🚌"
color="#0B3D91"
/>

<DashboardCard
title="Drivers"
value={stats.total_drivers}
icon="👨‍✈️"
color="#198754"
/>

<DashboardCard
title="Routes"
value={stats.total_routes}
icon="🛣️"
color="#D62828"
/>

<DashboardCard
title="Schedules"
value={stats.total_schedules}
icon="⏰"
color="#6f42c1"
/>
<DashboardCard
title="Passengers"
value={stats.total_passengers}
icon="👥"
color="#FD7E14"
/>

<DashboardCard
title="Bookings"
value={stats.total_bookings}
icon="📚"
color="#20C997"
/>

<DashboardCard
title="Tickets"
value={stats.total_tickets}
icon="🎫"
color="#6F42C1"
/>

<DashboardCard
title="Revenue"
value={`₹ ${stats.total_revenue}`}
icon="💰"
color="#D4AF37"
/>
<DashboardCard
title="Staff"
value={stats.total_staff}
icon="👨‍💼"
color="#0D6EFD"
/>

<DashboardCard
title="Users"
value={stats.total_users}
icon="👤"
color="#198754"
/>

<DashboardCard
title="Branches"
value={stats.total_branches}
icon="🏢"
color="#FD7E14"
/>

<DashboardCard
title="Offices"
value={stats.total_offices}
icon="🏬"
color="#6F42C1"
/>

<DashboardCard
title="Assets"
value={stats.total_assets}
icon="💻"
color="#20C997"
/>

<DashboardCard
title="Pending Leaves"
value={stats.pending_leaves}
icon="📝"
color="#DC3545"
/>

<DashboardCard
title="Today's Attendance"
value={stats.today_attendance}
icon="✅"
color="#198754"
/>
</div>

<div
style={{
marginTop:30
}}
>

<QuickActions/>

</div>

<div
style={{
marginTop:30,
background:"var(--erp-surface)",
borderRadius:20,
padding:25,
boxShadow:"var(--erp-shadow-md)"
}}
>

<h2
  style={{
    marginBottom: 25,
    color: "var(--erp-heading)",
    fontSize: "30px",
    fontWeight: "700",
    borderBottom: "3px solid #0B3D91",
    paddingBottom: "12px",
  }}
>
  📈 Business Analytics Dashboard
</h2>
<div
style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",
gap:20
}}
>
<div
  style={{
    background:"var(--erp-surface-muted)",
    borderRadius:"16px",
    padding:"20px",
    boxShadow:"var(--erp-shadow-sm)"
  }}
>

<h3
  style={{
    color:"var(--erp-heading)",
    fontSize:"22px",
    marginBottom:"15px"
  }}
>
  🚌 Fleet Statistics
</h3>

<p>Total Buses : {stats.total_buses}</p>

<p>Total Drivers : {stats.total_drivers}</p>

<p>Total Routes : {stats.total_routes}</p>

</div>

<div
  style={{
    background:"var(--erp-surface-muted)",
    borderRadius:"16px",
    padding:"20px",
    boxShadow:"var(--erp-shadow-sm)"
  }}
>

<h3
  style={{
    color:"#198754",
    fontSize:"22px",
    marginBottom:"15px"
  }}
>
  🎫 Booking Statistics
</h3>

<p>Total Bookings : {stats.total_bookings}</p>

<p>Total Tickets : {stats.total_tickets}</p>

<p>Passengers : {stats.total_passengers}</p>

</div>

<div
  style={{
    background:"var(--erp-surface-muted)",
    borderRadius:"16px",
    padding:"20px",
    boxShadow:"var(--erp-shadow-sm)"
  }}
>

<h3
  style={{
    color:"#D4AF37",
    fontSize:"22px",
    marginBottom:"15px"
  }}
>
  💰 Revenue Summary
</h3>

<h1
style={{
color:"#198754"
}}
>

₹ {stats.total_revenue}

</h1>

</div>

</div>
<DashboardAnalytics stats={stats} />

<RevenueChart />

<RecentBookingsContainer bookings={recentBookings} />
</div>

</div>

</div>

);

}
