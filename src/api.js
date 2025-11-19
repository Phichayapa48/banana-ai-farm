import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE ||
  "https://banana-ai-farm-production.up.railway.app";

export const detectBanana = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(`${BASE_URL}/predict`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};
