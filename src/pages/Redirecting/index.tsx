import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export const useTokenFromURL = () => {
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      window.history.replaceState({}, "", "/dashboard");
    }
  }, []);
};

export const Redirecting = () => {
  useTokenFromURL();
  return <div>Redirecting...</div>;
};
