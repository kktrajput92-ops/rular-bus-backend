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
        background: "var(--erp-surface)",
        borderRadius: 20,
        padding: 20,
        marginTop: 30,
        boxShadow: "var(--erp-shadow-sm)",
      }}
    >
      <h2 style={{ color: "var(--erp-heading)", marginBottom: 20 }}>
        📊 Monthly Revenue
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid stroke="var(--erp-border)" strokeDasharray="3 3" />
          <XAxis dataKey="month" stroke="var(--erp-text-secondary)" />
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
