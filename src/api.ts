import axios from "axios";

// ใช้ค่า env หรือ fallback เป็น URL จริงของ backend
const BASE_URL =
  import.meta.env.VITE_API_BASE ||
  "https://banana-ai-farm-production.up.railway.app";

export const detectBanana = async (file: Blob) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(`${BASE_URL}/detect`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};
