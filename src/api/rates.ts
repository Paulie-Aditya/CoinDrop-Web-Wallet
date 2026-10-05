import { http } from "./http";
import type { RatesResponse } from "./types";

/** GET /rates — not under /wallet, no session needed. Always hits the real
 *  backend directly, same as deposit/withdraw/send (not covered by mock mode). */
export async function fetchRates(): Promise<RatesResponse> {
  const { data } = await http.get<RatesResponse>("/rates");
  return data;
}
