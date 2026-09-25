import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongoose";
import { Transaction, Account, Category } from "@/models";
import { format } from "date-fns";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const exportFormat = searchParams.get("format") || "csv";

    await connectDB();

    const transactions = await Transaction.find({
      userId: session.user.id,
      isDeleted: false,
    })
      .sort({ date: -1 })
      .populate("categoryId", "name type")
      .populate("accountId", "name type currency")
      .populate("toAccountId", "name type")
      .lean();

    if (exportFormat === "json") {
      return new NextResponse(JSON.stringify(transactions, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="transactions_${format(new Date(), "yyyy-MM-dd")}.json"`,
        },
      });
    }

    // Generate RFC-compliant CSV
    const headers = [
      "Date",
      "Type",
      "Description",
      "Amount",
      "Currency",
      "Category",
      "Account",
      "Destination Account",
      "Merchant",
      "Tags",
      "Notes",
    ];

    const escapeCsv = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = transactions.map((t) => {
      const cat = t.categoryId as unknown as { name?: string };
      const acc = t.accountId as unknown as { name?: string };
      const toAcc = t.toAccountId as unknown as { name?: string };

      return [
        escapeCsv(format(new Date(t.date), "yyyy-MM-dd")),
        escapeCsv(t.type),
        escapeCsv(t.description),
        escapeCsv((t.amount / 100).toFixed(2)),
        escapeCsv(t.currency),
        escapeCsv(cat?.name || "Uncategorized"),
        escapeCsv(acc?.name || "Main"),
        escapeCsv(toAcc?.name || ""),
        escapeCsv(t.merchant || ""),
        escapeCsv(t.tags?.join("; ") || ""),
        escapeCsv(t.notes || ""),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="financial_export_${format(new Date(), "yyyy-MM-dd")}.csv"`,
      },
    });
  } catch (error: unknown) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
