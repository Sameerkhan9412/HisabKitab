import {
  calculateSplits,
  calculateNetBalances,
  simplifyDebts,
} from "../lib/services/splitEngine";
import { toMinorUnits, fromMinorUnits, formatCurrency } from "../lib/utils";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failed++;
  }
}

console.log("=========================================");
console.log("🧪 RUNNING FINANCIAL & SPLIT ENGINE TESTS");
console.log("=========================================\n");

// 1. Currency minor unit tests
console.log("--- 1. Currency Minor-Unit Tests ---");
assert(toMinorUnits(100) === 10000, "100.00 converts to 10000 minor units");
assert(toMinorUnits("125.50") === 12550, "'125.50' converts to 12550 minor units");
assert(toMinorUnits(0.01) === 1, "0.01 converts to 1 minor unit");
assert(fromMinorUnits(12550) === 125.5, "12550 minor units converts back to 125.5");

// 2. Equal Split Tests (Remainder Allocation)
console.log("\n--- 2. Equal Split & Remainder Precision Tests ---");
// ₹100 split among 3 users (10000 minor units)
const split100 = calculateSplits("EQUAL", 10000, [
  { userId: "userA" },
  { userId: "userB" },
  { userId: "userC" },
]);

assert(split100.length === 3, "Split produces 3 participants");
const sum100 = split100.reduce((acc, s) => acc + s.amount, 0);
assert(sum100 === 10000, `Sum of equal split strictly equals 10000 minor units (got ${sum100})`);
assert(split100[0].amount === 3334, `First participant gets remainder (3334, got ${split100[0].amount})`);
assert(split100[1].amount === 3333, `Second participant gets base (3333, got ${split100[1].amount})`);
assert(split100[2].amount === 3333, `Third participant gets base (3333, got ${split100[2].amount})`);

// ₹1 split among 3 users (100 minor units)
const split1 = calculateSplits("EQUAL", 100, [
  { userId: "userA" },
  { userId: "userB" },
  { userId: "userC" },
]);
const sum1 = split1.reduce((acc, s) => acc + s.amount, 0);
assert(sum1 === 100, `₹1 (100 paise) split among 3 equals strictly 100 (got ${sum1})`);
assert(split1[0].amount === 34 && split1[1].amount === 33 && split1[2].amount === 33, "Remainder allocated cleanly: 34 + 33 + 33 == 100");

// 3. Exact Split Tests
console.log("\n--- 3. Exact Split Tests ---");
const exactSplits = calculateSplits("EXACT", 300000, [
  { userId: "userA", amount: 50000 },
  { userId: "userB", amount: 100000 },
  { userId: "userC", amount: 150000 },
]);
const sumExact = exactSplits.reduce((acc, s) => acc + s.amount, 0);
assert(sumExact === 300000, "Exact split validation matches total");

let exactThrew = false;
try {
  calculateSplits("EXACT", 300000, [
    { userId: "userA", amount: 50000 },
    { userId: "userB", amount: 100000 },
  ]);
} catch {
  exactThrew = true;
}
assert(exactThrew, "Exact split throws error when sum does not match total expense");

// 4. Percentage Split Tests
console.log("\n--- 4. Percentage Split Tests ---");
const pctSplits = calculateSplits("PERCENTAGE", 10000, [
  { userId: "userA", percentage: 33.33 },
  { userId: "userB", percentage: 33.33 },
  { userId: "userC", percentage: 33.34 },
]);
const sumPct = pctSplits.reduce((acc, s) => acc + s.amount, 0);
assert(sumPct === 10000, `Percentage split strictly equals 10000 (got ${sumPct})`);

// 5. Shares Split Tests
console.log("\n--- 5. Shares / Weight Split Tests ---");
// 1 share + 1 share + 2 shares = 4 shares of ₹12,000 (1200000 minor units)
const shareSplits = calculateSplits("SHARES", 1200000, [
  { userId: "userA", shares: 1 },
  { userId: "userB", shares: 1 },
  { userId: "userC", shares: 2 },
]);
assert(shareSplits[0].amount === 300000, "User A gets 1/4 (3,000)");
assert(shareSplits[1].amount === 300000, "User B gets 1/4 (3,000)");
assert(shareSplits[2].amount === 600000, "User C gets 2/4 (6,000)");

// 6. Net Balances & Multiple Payers
console.log("\n--- 6. Net Balances Calculation Tests ---");
// Dinner = ₹3,000. Harbir paid ₹3,000. Split between Harbir, Aman, Rahul (₹1,000 each)
const members = ["harbir", "aman", "rahul"];
const sampleExpenses = [
  {
    payers: [{ userId: "harbir", amount: 300000 }],
    splits: [
      { userId: "harbir", amount: 100000 },
      { userId: "aman", amount: 100000 },
      { userId: "rahul", amount: 100000 },
    ],
  },
];
const balances = calculateNetBalances(members, sampleExpenses, []);
assert(balances["harbir"] === 200000, `Harbir is owed ₹2,000 (got ${balances["harbir"]})`);
assert(balances["aman"] === -100000, `Aman owes ₹1,000 (got ${balances["aman"]})`);
assert(balances["rahul"] === -100000, `Rahul owes ₹1,000 (got ${balances["rahul"]})`);

// Zero sum invariant: sum of all balances in a room must be 0
const totalNet = Object.values(balances).reduce((a, b) => a + b, 0);
assert(totalNet === 0, `Zero-sum invariant preserved: sum(balances) === 0 (got ${totalNet})`);

// 7. Settlement Effect on Balances
console.log("\n--- 7. Settlement Rebalancing Tests ---");
// Aman settles ₹1,000 with Harbir
const sampleSettlements = [
  {
    fromUserId: "aman",
    toUserId: "harbir",
    amount: 100000,
  },
];
const updatedBalances = calculateNetBalances(members, sampleExpenses, sampleSettlements);
assert(updatedBalances["aman"] === 0, `Aman is now fully settled (got ${updatedBalances["aman"]})`);
assert(updatedBalances["harbir"] === 100000, `Harbir is now owed ₹1,000 (got ${updatedBalances["harbir"]})`);
assert(updatedBalances["rahul"] === -100000, `Rahul still owes ₹1,000 (got ${updatedBalances["rahul"]})`);

// 8. Debt Simplification Algorithm Tests
console.log("\n--- 8. Debt Simplification Algorithm Tests ---");
// Scenario: A owes B ₹1,000, B owes C ₹1,000.
// Net: A = -1000, B = 0, C = +1000.
// Simplified: A owes C ₹1,000 directly.
const testNet = {
  A: -100000,
  B: 0,
  C: 100000,
};
const userNames = { A: "Alice", B: "Bob", C: "Charlie" };
const simplified = simplifyDebts(testNet, userNames);

assert(simplified.length === 1, `Simplified from 2 transactions to 1 (got ${simplified.length})`);
assert(simplified[0].fromUserId === "A" && simplified[0].toUserId === "C", "A pays C directly");
assert(simplified[0].amount === 100000, `Amount is ₹1,000 (got ${simplified[0].amount})`);

console.log("\n=========================================");
console.log(`🏁 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("=========================================\n");

if (failed > 0) {
  process.exit(1);
}
