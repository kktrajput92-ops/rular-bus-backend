import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function RevenueChart() {
  const data = [
    { month: "Jan", revenue: 12000 },
    { month: "Feb", revenue: 18000 },
    { month: "Mar", revenue: 15000 },
    { month: "Apr", revenue: 24000 },
    { month: "May", revenue: 28000 },
    { month: "Jun", revenue: 32000 },
  ];

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        padding: 20,
        marginTop: 30,
        boxShadow: "0 10px 25px rgba(0,0,0,.08)",
      }}
    >
      <h2 style={{ color: "#0B3D91", marginBottom: 20 }}>
        📊 Monthly Revenue
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="revenue" fill="#0B3D91" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
