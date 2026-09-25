import { ISimplifiedDebt, SplitType } from "@/types";

export interface PayerInput {
  userId: string;
  amount: number; // in integer minor units
}

export interface SplitInput {
  userId: string;
  amount?: number; // in integer minor units
  percentage?: number;
  shares?: number;
}

export interface CalculatedSplitResult {
  userId: string;
  amount: number; // in integer minor units
  percentage?: number;
  shares?: number;
}

/**
 * Calculates splits with 100% mathematical precision in integer minor units (paise/cents).
 * Ensures sum of splits strictly equals the total expense amount without any rounding drift.
 */
export function calculateSplits(
  splitType: SplitType,
  totalAmountMinor: number,
  participants: SplitInput[]
): CalculatedSplitResult[] {
  if (totalAmountMinor <= 0) {
    throw new Error("Total expense amount must be greater than zero");
  }
  if (!participants || participants.length === 0) {
    throw new Error("At least one participant is required for an expense split");
  }

  const n = participants.length;

  switch (splitType) {
    case "EQUAL": {
      const baseAmount = Math.floor(totalAmountMinor / n);
      const remainder = totalAmountMinor % n;

      return participants.map((p, index) => ({
        userId: p.userId,
        amount: index < remainder ? baseAmount + 1 : baseAmount,
        percentage: Number(((1 / n) * 100).toFixed(2)),
      }));
    }

    case "EXACT": {
      let sum = 0;
      const results: CalculatedSplitResult[] = [];

      for (const p of participants) {
        const amt = Math.round(p.amount || 0);
        if (amt < 0) throw new Error("Split amount cannot be negative");
        sum += amt;
        results.push({
          userId: p.userId,
          amount: amt,
        });
      }

      if (sum !== totalAmountMinor) {
        throw new Error(
          `The sum of individual splits (${sum}) does not match the total expense (${totalAmountMinor})`
        );
      }
      return results;
    }

    case "PERCENTAGE": {
      let totalPercentage = 0;
      for (const p of participants) {
        totalPercentage += p.percentage || 0;
      }

      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new Error(`Total percentage must equal 100%. Current sum: ${totalPercentage}%`);
      }

      let allocatedSum = 0;
      const initialResults: { userId: string; amount: number; percentage: number; fraction: number }[] = [];

      for (const p of participants) {
        const pct = p.percentage || 0;
        const exactFloat = (totalAmountMinor * pct) / 100;
        const floorAmount = Math.floor(exactFloat);
        const fraction = exactFloat - floorAmount;

        allocatedSum += floorAmount;
        initialResults.push({
          userId: p.userId,
          amount: floorAmount,
          percentage: pct,
          fraction,
        });
      }

      // Distribute leftover minor units to participants with highest rounding fractions
      let discrepancy = totalAmountMinor - allocatedSum;
      const sortedByFraction = [...initialResults].sort((a, b) => b.fraction - a.fraction);

      for (let i = 0; i < discrepancy; i++) {
        const target = sortedByFraction[i % sortedByFraction.length];
        const match = initialResults.find((r) => r.userId === target.userId);
        if (match) {
          match.amount += 1;
        }
      }

      return initialResults.map((r) => ({
        userId: r.userId,
        amount: r.amount,
        percentage: r.percentage,
      }));
    }

    case "SHARES": {
      let totalShares = 0;
      for (const p of participants) {
        const s = p.shares || 1;
        if (s <= 0) throw new Error("Shares must be positive numbers");
        totalShares += s;
      }

      let allocatedSum = 0;
      const initialResults: { userId: string; amount: number; shares: number; fraction: number }[] = [];

      for (const p of participants) {
        const s = p.shares || 1;
        const exactFloat = (totalAmountMinor * s) / totalShares;
        const floorAmount = Math.floor(exactFloat);
        const fraction = exactFloat - floorAmount;

        allocatedSum += floorAmount;
        initialResults.push({
          userId: p.userId,
          amount: floorAmount,
          shares: s,
          fraction,
        });
      }

      let discrepancy = totalAmountMinor - allocatedSum;
      const sortedByFraction = [...initialResults].sort((a, b) => b.fraction - a.fraction);

      for (let i = 0; i < discrepancy; i++) {
        const target = sortedByFraction[i % sortedByFraction.length];
        const match = initialResults.find((r) => r.userId === target.userId);
        if (match) {
          match.amount += 1;
        }
      }

      return initialResults.map((r) => ({
        userId: r.userId,
        amount: r.amount,
        shares: r.shares,
      }));
    }

    default:
      throw new Error(`Unsupported split type: ${splitType}`);
  }
}

/**
 * Calculates net balances for all members in a room across all expenses and settlements.
 * Net > 0: user is owed money (creditor)
 * Net < 0: user owes money (debtor)
 * Net === 0: settled
 */
export function calculateNetBalances(
  memberUserIds: string[],
  sharedExpenses: Array<{
    payers: Array<{ userId: any; amount: number }>;
    splits: Array<{ userId: any; amount: number }>;
  }>,
  settlements: Array<{
    fromUserId: any;
    toUserId: any;
    amount: number;
  }>
): Record<string, number> {
  const balances: Record<string, number> = {};

  for (const uid of memberUserIds) {
    balances[uid] = 0;
  }

  // 1. Process Shared Expenses
  for (const expense of sharedExpenses) {
    // Credit payers for amounts paid
    for (const payer of expense.payers) {
      const payerId = typeof payer.userId === "object" ? payer.userId._id.toString() : payer.userId.toString();
      balances[payerId] = (balances[payerId] || 0) + payer.amount;
    }

    // Debit split participants for amounts owed
    for (const split of expense.splits) {
      const splitId = typeof split.userId === "object" ? split.userId._id.toString() : split.userId.toString();
      balances[splitId] = (balances[splitId] || 0) - split.amount;
    }
  }

  // 2. Process Settlements
  for (const settlement of settlements) {
    const fromId =
      typeof settlement.fromUserId === "object"
        ? settlement.fromUserId._id.toString()
        : settlement.fromUserId.toString();
    const toId =
      typeof settlement.toUserId === "object"
        ? settlement.toUserId._id.toString()
        : settlement.toUserId.toString();

    // Debtor paid settlement -> increases their net balance toward 0
    balances[fromId] = (balances[fromId] || 0) + settlement.amount;
    // Creditor received settlement -> decreases their credit toward 0
    balances[toId] = (balances[toId] || 0) - settlement.amount;
  }

  return balances;
}

/**
 * Debt Simplification Algorithm (Min Cash Flow Transitive Reduction)
 * Preserves exact net balance of every user while minimizing total transaction count.
 */
export function simplifyDebts(
  netBalances: Record<string, number>,
  userNames: Record<string, string>
): ISimplifiedDebt[] {
  // Separate into debtors and creditors
  interface PersonBalance {
    userId: string;
    amount: number; // positive for creditor, positive magnitude for debtor
  }

  const creditors: PersonBalance[] = [];
  const debtors: PersonBalance[] = [];

  for (const [userId, balance] of Object.entries(netBalances)) {
    if (balance > 0) {
      creditors.push({ userId, amount: balance });
    } else if (balance < 0) {
      debtors.push({ userId, amount: Math.abs(balance) });
    }
  }

  const transactions: ISimplifiedDebt[] = [];

  // Greedy match largest debtor with largest creditor
  while (creditors.length > 0 && debtors.length > 0) {
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const maxCreditor = creditors[0];
    const maxDebtor = debtors[0];

    const settledAmount = Math.min(maxCreditor.amount, maxDebtor.amount);

    transactions.push({
      fromUserId: maxDebtor.userId,
      fromUserName: userNames[maxDebtor.userId] || "Member",
      toUserId: maxCreditor.userId,
      toUserName: userNames[maxCreditor.userId] || "Member",
      amount: settledAmount,
    });

    maxCreditor.amount -= settledAmount;
    maxDebtor.amount -= settledAmount;

    if (maxCreditor.amount === 0) creditors.shift();
    if (maxDebtor.amount === 0) debtors.shift();
  }

  return transactions;
}
