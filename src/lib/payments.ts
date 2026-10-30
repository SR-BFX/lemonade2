import { randomToken } from "./tokens";

export type ChargeInput = {
  userId: string;
  sku: string;
  amountCents: number;
};

export type ChargeResult = { ok: true; ref: string } | { ok: false; error: string };

export interface PaymentProvider {
  readonly name: string;
  charge(input: ChargeInput): Promise<ChargeResult>;
}

export class StubPaymentProvider implements PaymentProvider {
  readonly name = "stub";

  async charge(input: ChargeInput): Promise<ChargeResult> {
    if (input.amountCents <= 0) return { ok: false, error: "Price missing." };
    return { ok: true, ref: `stub_${randomToken().slice(0, 12)}` };
  }
}

export function getPaymentProvider(): PaymentProvider {
  return new StubPaymentProvider();
}
