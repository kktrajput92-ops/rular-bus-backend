import { useEffect, useState } from "react";
import api from "../api/api";
import { RBTable } from "../rds/components";
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
const columns = [
  { key: "id", header: "ID" },
  { key: "role_name", header: "Role" },
  { key: "permission_code", header: "Permission Code" },
  { key: "permission_name", header: "Permission Name" },
];
  return (
    <div style={{ padding: 30 }}>
      <h1>🔑 Role Permission Management</h1>

     <RBTable
  columns={columns}
  data={data}
/>
    </div>
  );
}
