import axios from "axios";

export const API_BASE = "http://192.168.31.204:5000/api";

const api = axios.create({
  baseURL: API_BASE,
});

export default api;
