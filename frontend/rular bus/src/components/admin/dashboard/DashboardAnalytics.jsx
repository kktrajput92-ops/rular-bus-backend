import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function DashboardAnalytics() {
  const data = [
    { name: "Mon", revenue: 12000 },
    { name: "Tue", revenue: 18000 },
    { name: "Wed", revenue: 14000 },
    { name: "Thu", revenue: 22000 },
    { name: "Fri", revenue: 26000 },
    { name: "Sat", revenue: 31000 },
    { name: "Sun", revenue: 28000 },
  ];

  return (
    <div
      style={{
        marginTop: 30,
        background: "#fff",
        borderRadius: 20,
        padding: 25,
        boxShadow: "0 10px 25px rgba(0,0,0,.08)",
      }}
    >
      <h2
        style={{
          color: "#0B3D91",
          marginBottom: 20,
        }}
      >
        📊 Weekly Revenue Analytics
      </h2>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="revenue" fill="#0B3D91" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
