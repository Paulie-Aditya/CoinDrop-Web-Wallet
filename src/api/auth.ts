import API from "./client";

export const getMe = async () => {
  const res = await API.get("/auth/me");
  return res.data;
};

export const logout = async () => {
  await API.post("/auth/logout");
};