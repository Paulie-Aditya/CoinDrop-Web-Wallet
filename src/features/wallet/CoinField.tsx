import { useState } from "react";
import { Icon } from "../../components/Icon";
import { CoinMark, CoinPicker, type PickerCoin } from "./CoinPicker";
import { chainKey } from "./swapLabels";
import styles from "./CoinPicker.module.css";

interface CoinFieldProps {
  id?: string;
  /** the picker's title, e.g. "Deposit" */
  title: string;
  coins: PickerCoin[];
  value: string | null;
  onChange: (symbol: string) => void;
  chainIcons: Map<string, string>;
  placeholder?: string;
}

/** A form field that shows the chosen coin with its icon and opens the coin picker. */
export function CoinField({ id, title, coins, value, onChange, chainIcons, placeholder = "Choose a coin" }: CoinFieldProps) {
  const [open, setOpen] = useState(false);
  const coin = coins.find((c) => c.symbol === value);

  return (
    <>
      <button
        id={id}
        type="button"
        className={styles.field}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {coin ? (
          <>
            <CoinMark coin={coin} size={28} chainIcon={chainIcons.get(chainKey(coin))} />
            <span className={styles.fieldText}>
              <strong>{coin.symbol}</strong>
              {coin.chainName && <small>{coin.isToken ? `Token on ${coin.chainName}` : coin.chainName}</small>}
            </span>
          </>
        ) : (
          <span className={styles.fieldPlaceholder}>{placeholder}</span>
        )}
        <Icon name="chevronDown" size={16} className={styles.fieldChevron} />
      </button>
      {open && (
        <CoinPicker
          title={title}
          coins={coins}
          selected={value ?? undefined}
          chainIcons={chainIcons}
          onPick={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
