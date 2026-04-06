import API from "./client";

export const getBalances = async () => {
  const res = await API.get("/wallet/balances");
  return res.data;
};