import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CoinLoader } from "../../components/CoinLoader";
import { StateBlock } from "../../components/StateBlock";
import { Icon } from "../../components/Icon";
import { toApiError } from "../../api/http";
import { queryClient } from "../../lib/queryClient";
import { formatUnits, formatUsd } from "../../lib/format";
import { useWithdrawStatus } from "./useWithdraw";
import styles from "../../pages/WalletActions.module.css";

const IN_FLIGHT_COPY: Record<string, string> = {
  queued: "Your withdrawal is queued and will go out shortly.",
  processing: "Your withdrawal is broadcasting — this can take a few minutes.",
};

interface WithdrawStatusPanelProps {
  id: string;
  decimals: number;
}

export function WithdrawStatusPanel({ id, decimals }: WithdrawStatusPanelProps) {
  const { data, isPending, isError, error, refetch } = useWithdrawStatus(id);

  useEffect(() => {
    if (data?.status === "done" || data?.status === "failed") {
      void queryClient.invalidateQueries({ queryKey: ["wallet", "balances"] });
      void queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] });
    }
  }, [data?.status]);

  if (isPending) {
    return <CoinLoader label="Checking your withdrawal" />;
  }

  if (isError) {
    return (
      <StateBlock
        tone="error"
        title="Couldn't check withdrawal status"
        onRetry={() => void refetch()}
      >
        {toApiError(error).message}
      </StateBlock>
    );
  }

  if (data.status === "done") {
    return (
      <div className={styles.doneWrap}>
        <StateBlock title="Withdrawal complete">
          {formatUnits(data.sendAmount, decimals)} {data.currency} (
          {formatUsd(data.sendAmountUsd)}) sent to {data.toAddress}.
        </StateBlock>
        {data.explorerUrl && (
          <a
            className="btn btn--outline"
            href={data.explorerUrl}
            target="_blank"
            rel="noreferrer"
          >
            View on explorer
            <Icon name="external" size={15} />
          </a>
        )}
        <Link to="/wallet" className="btn btn--primary">
          Back to wallet
        </Link>
      </div>
    );
  }

  if (data.status === "failed") {
    return (
      <div className={styles.doneWrap}>
        <StateBlock tone="error" title="Withdrawal failed">
          Something went wrong broadcasting this withdrawal. Your balance isn't
          automatically refunded — contact support with withdrawal ID {data.id}.
        </StateBlock>
        <Link to="/wallet" className="btn btn--primary">
          Back to wallet
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.doneWrap}>
      <CoinLoader label={data.status === "processing" ? "Processing" : "Queued"} />
      <p className={styles.lede}>{IN_FLIGHT_COPY[data.status] ?? "Working on it…"}</p>
      <Link to="/wallet" className="btn btn--outline">
        Back to wallet
      </Link>
    </div>
  );
}
