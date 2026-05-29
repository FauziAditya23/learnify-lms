import { db } from "../lib/db";

async function main() {
  console.log("Running getRevenueData test with query and aggregate...");
  const searchStr = "test"; // test search keyword

  const baseWhere = { isDeleted: 0, invoiceStatus: "paid" };

  const filterWhere: any = {
    ...baseWhere,
  };

  if (searchStr && searchStr.trim()) {
    filterWhere.OR = [
      { invoiceNumber: { contains: searchStr, mode: "insensitive" } },
      { user: { name: { contains: searchStr, mode: "insensitive" } } },
      { user: { email: { contains: searchStr, mode: "insensitive" } } },
      { course: { title: { contains: searchStr, mode: "insensitive" } } },
    ];
  }

  try {
    const agg = await db.invoice.aggregate({
      where: filterWhere,
      _sum: { totalAmount: true },
    });
    console.log("Success! Aggregate value:", agg._sum.totalAmount);
  } catch (err) {
    console.error("Prisma aggregate failed with error:", err);
  }
}

main();
