import { useEffect, useState } from "react";
import api from "../api/api";

export default function AdminRolePermission() {
  const [data, setData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get("/role-permissions");
      setData(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>🔑 Role Permission Management</h1>

      <table
        border="1"
        cellPadding="10"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 20,
        }}
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>Role</th>
            <th>Permission Code</th>
            <th>Permission Name</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.role_name}</td>
              <td>{item.permission_code}</td>
              <td>{item.permission_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
