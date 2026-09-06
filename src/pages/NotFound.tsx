import { Link } from "react-router-dom";
import { StateBlock } from "../components/StateBlock";

export function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <StateBlock title="Page not found">
        That page doesn't exist. <Link to="/wallet">Go to your wallet</Link>.
      </StateBlock>
    </div>
  );
}
