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
        background: "var(--erp-surface)",
        borderRadius: 20,
        padding: 25,
        boxShadow: "var(--erp-shadow-sm)",
      }}
    >
      <h2
        style={{
          color: "var(--erp-heading)",
          marginBottom: 20,
        }}
      >
        📊 Weekly Revenue Analytics
      </h2>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data}>
          <CartesianGrid stroke="var(--erp-border)" strokeDasharray="3 3" />
          <XAxis dataKey="name" stroke="var(--erp-text-secondary)" />
          <YAxis stroke="var(--erp-text-secondary)" />
          <Tooltip
              contentStyle={{
                background: "var(--erp-surface)",
                border: "1px solid var(--erp-border)",
                borderRadius: 10,
                color: "var(--erp-text)",
              }}
              labelStyle={{ color: "var(--erp-heading)" }}
            />
          <Bar dataKey="revenue" fill="#0B3D91" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
