import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./RequireAuth";
import { Landing } from "../pages/Landing";
import { Login } from "../pages/Login";
import { AuthCallback } from "../pages/AuthCallback";
import { Wallet } from "../pages/Wallet";
import { Deposit } from "../pages/Deposit";
import { Withdraw } from "../pages/Withdraw";
import { NotFound } from "../pages/NotFound";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/wallet"
          element={
            <RequireAuth>
              <Wallet />
            </RequireAuth>
          }
        />
        <Route
          path="/wallet/deposit"
          element={
            <RequireAuth>
              <Deposit />
            </RequireAuth>
          }
        />
        <Route
          path="/wallet/withdraw"
          element={
            <RequireAuth>
              <Withdraw />
            </RequireAuth>
          }
        />
        <Route path="/dashboard" element={<Navigate to="/wallet" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
