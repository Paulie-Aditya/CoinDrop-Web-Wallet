import btc from "./btc.png";
import eth from "./eth.png";
import usdt from "./usdt.png";
import bnb from "./bnb.png";
import xrp from "./xrp.png";
import usdc from "./usdc.png";
import sol from "./sol.png";
import trx from "./trx.png";
import doge from "./doge.png";
import xlm from "./xlm.jpg";
import ltc from "./ltc.png";
import avax from "./avax.png";
import cro from "./cro.png";
import waxp from "./waxp.png";
import ban from "./ban.png";
import shic from "./shic.png";
import matic from "./matic.png";
import dork from "./dork.webp";
import bc3 from "./bc3.webp";
import cthulhu from "./cthulhu.webp";
import dc2 from "./dc2.webp";
import ethii from "./eth2.png";
import krgn from "./krgn.webp";
import lc2 from "./lc2.png";
import rin from "./rincoin.webp";
import shit from "./shit.webp";
import smt from "./smt.webp";
import solusdt from "./solusdt.png";
import busd from "./busd.png";
import op from "./op.png";
import bsdeth from "./bsdeth.png";
import choctopus from "./choctopus.jpg";
import cascoin from "./cascoin.webp";
import noba from "./nobacoin.webp";
import bmn from "./bmn.webp";

/** Real icons fetched from CoinGecko, matched by coin **name**, not symbol —
 *  several CoinDrop symbols collide with unrelated CoinGecko listings that
 *  happen to share the same ticker.
 *
 *  DORK was originally a medium-confidence CoinGecko match; replaced with a
 *  user-supplied icon (2026-09-28).
 *
 *  BC3, CTHULHU, DC2, ETHII, KRGN, LC2, RIN, SHIT, SMT, SOLUSDT are
 *  custom/rare coins with no CoinGecko listing — icons supplied directly by
 *  the user (2026-09-28).
 *
 *  BUSD, OP, BSDETH (CoinGecko: "Based ETH"), CHOCTOPUS matched confidently
 *  on CoinGecko once the full currency list clarified they exist (2026-09-28).
 *
 *  CAS icon supplied directly by the user (2026-09-28, `cascoin.webp`).
 *  OPETH is ETH bridged to the Optimism chain — same underlying asset, reuses
 *  the ETH icon rather than a separate lookup (2026-09-28), same pattern as
 *  the POLUSDC/SOLUSDC → USDC aliasing above.
 *
 *  NOBA and BMN have no CoinGecko listing under their real name — icons
 *  supplied directly by the user (2026-10-07, `nobacoin.webp`, `bmn.webp`).
 *  Keep the monogram fallback in CoinChip.tsx for any future coin without one. */
export const COIN_ICONS: Record<string, string> = {
  BTC: btc,
  ETH: eth,
  USDT: usdt,
  BNB: bnb,
  XRP: xrp,
  USDC: usdc,
  // same underlying asset, bridged to another chain — same icon
  POLUSDC: usdc,
  SOLUSDC: usdc,
  SOL: sol,
  TRX: trx,
  DOGE: doge,
  XLM: xlm,
  LTC: ltc,
  AVAX: avax,
  CRO: cro,
  WAXP: waxp,
  BAN: ban,
  SHIC: shic,
  MATIC: matic,
  DORK: dork,
  BC3: bc3,
  CTHULHU: cthulhu,
  DC2: dc2,
  ETHII: ethii,
  KRGN: krgn,
  LC2: lc2,
  RIN: rin,
  SHIT: shit,
  SMT: smt,
  SOLUSDT: solusdt,
  BUSD: busd,
  OP: op,
  BSDETH: bsdeth,
  CHOCTOPUS: choctopus,
  CAS: cascoin,
  NOBA: noba,
  BMN: bmn,
  // ETH bridged to the Optimism chain — same underlying asset, same icon
  OPETH: eth,
};
