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

// High-volume EVM/Solana token batch (asset-count expansion, 2026-10-08) --
// see CoinDrop's schema.sql comment block above the matching INSERTs for
// selection methodology. Icons downloaded directly from CoinGecko (each
// token's own `image` field) and resized to 250x250 to match every icon
// above. USDT/USDC already had icons (usdt.png/usdc.png above) -- reused,
// not refetched.
import usd1 from "./usd1.png";
import uni from "./uni.png";
import usdg from "./usdg.png";
import ena from "./ena.png";
import link from "./link.png";
import aave from "./aave.png";
import xaut from "./xaut.png";
import usds from "./usds.png";
import sand from "./sand.png";
import wld from "./wld.png";
import dai from "./dai.png";
import qnt from "./qnt.png";
import pepe from "./pepe.png";
import ray from "./ray.png";
import pengu from "./pengu.png";
import trump from "./trump.png";
import ondo from "./ondo.png";
import paxg from "./paxg.png";
import arb from "./arb.png";
import inj from "./inj.png";
import fdusd from "./fdusd.png";
import met from "./met.png";
import orca from "./orca.png";
import fet from "./fet.png";
import u from "./u.png";
import aster from "./aster.png";
import zro from "./zro.png";
import jup from "./jup.png";
import render from "./render.png";
import wbt from "./wbt.png";
import pyusd from "./pyusd.png";
import lit from "./lit.png";
import virtual from "./virtual.png";
import nmr from "./nmr.png";
import shib from "./shib.png";
import icp from "./icp.png";
import cake from "./cake.png";
import htx from "./htx.png";
import okb from "./okb.png";
import pendle from "./pendle.png";
import crv from "./crv.png";
import ldo from "./ldo.png";
import ethfi from "./ethfi.png";
import wif from "./wif.png";
import strk from "./strk.png";
import usde from "./usde.png";
import bonk from "./bonk.png";
import mana from "./mana.png";
import cap from "./cap.png";
import jto from "./jto.png";

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
  // High-volume EVM/Solana token batch (2026-10-08) -- see the import block
  // above for provenance. POL deliberately excluded: config.CURRENCY_ALIASES
  // on the bot already maps "POL" -> "MATIC" (Polygon's ticker migration),
  // so it's the same currency as MATIC above, not a second one.
  USD1: usd1, UNI: uni, USDG: usdg, ENA: ena, LINK: link, AAVE: aave,
  XAUT: xaut, USDS: usds, SAND: sand, WLD: wld, DAI: dai, QNT: qnt,
  PEPE: pepe, RAY: ray, PENGU: pengu, TRUMP: trump, ONDO: ondo,
  PAXG: paxg, ARB: arb, INJ: inj, FDUSD: fdusd, MET: met, ORCA: orca,
  FET: fet, U: u, ASTER: aster, ZRO: zro, JUP: jup, RENDER: render,
  WBT: wbt, PYUSD: pyusd, LIT: lit, VIRTUAL: virtual, NMR: nmr, SHIB: shib,
  ICP: icp, CAKE: cake, HTX: htx, OKB: okb, PENDLE: pendle, CRV: crv,
  LDO: ldo, ETHFI: ethfi, WIF: wif, STRK: strk, USDE: usde, BONK: bonk,
  MANA: mana, CAP: cap, JTO: jto,
};
