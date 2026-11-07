import { describe, it, expect } from "vitest";
import { parseTransactionsCsv, detectDelimiter, splitCsvLine, parseAmount, parseDate } from "../csv-parser";

const SAMPLE_CSV = `Date,Account,Category,Subcategory,Note,IDR,Income/Expense,Tag,Description,Amount,Currency,Account
2026-10-29 23:38:03,Cash,Jajan,,Paket Rahul,12000,Expense,,,12000.0,IDR,12000
2026-10-29 23:37:47,Cash,Warkop,,Teh Dingin,7000,Expense,,,7000.0,IDR,7000
2026-10-29 23:37:14,Cash,Makan,,Nasi Goreng,14000,Expense,,,14000.0,IDR,14000
2026-10-29 23:35:52,Cash,Jajan,,Golda + Roti,7000,Expense,,,7000.0,IDR,7000
2026-10-29 23:34:42,Card,🏅 Bonus,,Sampingan,2700000,Income,,,2700000.0,IDR,2700000
2026-10-28 16:18:20,Cash,Warkop,,Kukubima,7000,Expense,,,7000.0,IDR,7000
2026-10-28 16:18:01,Cash,Makan,,Tahu,10000,Expense,,,10000.0,IDR,10000
2026-10-28 11:53:54,Cash,Warkop,,Teh Dingin,7000,Expense,,,7000.0,IDR,7000
2026-10-28 11:53:35,Cash,Makan,,Nasi + Tempe 2,10000,Expense,,,10000.0,IDR,10000
2026-10-27 08:19:35,Cash,Jajan,,Roti Nusa,2000,Expense,,,2000.0,IDR,2000
2026-10-27 08:19:17,Cash,Rokok,,Chief,22000,Expense,,,22000.0,IDR,22000
2026-10-27 08:18:52,Cash,Rokok,,Juara,13000,Expense,,,13000.0,IDR,13000
2026-10-27 08:18:30,Cash,Warkop,,Teh Hangat,6000,Expense,,,6000.0,IDR,6000
2026-10-27 08:18:00,Cash,Makan,,Nasi Goreng,13000,Expense,,,13000.0,IDR,13000
2026-10-26 02:32:02,Card,🏅 Bonus,,Sampingan,1000000,Income,,,1000000.0,IDR,1000000
2026-10-26 02:31:13,Cash,Jajan,,Indomaret ke air panas,100000,Expense,,,100000.0,IDR,100000
2026-10-26 02:31:00,Cash,Honda,,Ganti Ban,600000,Expense,,,600000.0,IDR,600000
2026-10-26 02:30:02,Cash,Honda,,6 Liter,100000,Expense,,,100000.0,IDR,100000
2026-10-26 02:29:34,Cash,Warkop,,Kopimix + Roti,10000,Expense,,,10000.0,IDR,10000
2026-10-26 02:29:18,Cash,Warkop,,Cappuccino Panas,7000,Expense,,,7000.0,IDR,7000
2026-10-26 02:28:56,Cash,Rokok,,Chief 2,30000,Expense,,,30000.0,IDR,30000
2026-10-22 23:07:44,Cash,Jajan,,ExtraJoss,7000,Expense,,,7000.0,IDR,7000
2026-10-22 23:07:28,Cash,Warkop,,Cappuccino Panas,6000,Expense,,,6000.0,IDR,6000
2026-10-22 23:06:46,Cash,Makan,,Nasi Ayam,13000,Expense,,,13000.0,IDR,13000
2026-10-22 23:06:31,Cash,Jajan,,Aqua,4000,Expense,,,4000.0,IDR,4000
2026-10-22 23:06:12,Cash,Rokok,,Chief,22000,Expense,,,22000.0,IDR,22000
2026-10-20 23:04:11,Cash,Paket Data,,Tri 150GB,150000,Expense,,,150000.0,IDR,150000
2026-10-20 21:45:14,Cash,Rumah,,Listrik,45000,Expense,,,45000.0,IDR,45000
2026-10-20 21:45:01,Cash,Jajan,,Roti Nusa,2000,Expense,,,2000.0,IDR,2000
2026-10-20 21:44:47,Cash,Rokok,,Magnum,25000,Expense,,,25000.0,IDR,25000
2026-10-20 16:09:44,Cash,Makan,,Tahu,10000,Expense,,,10000.0,IDR,10000
2026-10-20 16:09:33,Cash,Warkop,,Kopi,5000,Expense,,,5000.0,IDR,5000
2026-10-19 23:22:48,Cash,Honda,,6 Liter,100000,Expense,,,100000.0,IDR,100000
2026-10-19 23:21:49,Cash,Warkop,,Kopi + Es Kosong,8000,Expense,,,8000.0,IDR,8000
2026-10-19 23:21:28,Cash,Makan,,Nasi + Tempe 2,10000,Expense,,,10000.0,IDR,10000
2026-10-19 08:33:20,Cash,Rokok,,Magnum Kretek,5000,Expense,,,5000.0,IDR,5000
2026-10-19 08:33:04,Cash,Warkop,,Teh Hangat,5000,Expense,,,5000.0,IDR,5000
2026-10-19 08:32:35,Cash,Rumah,,Tepung,6000,Expense,,,6000.0,IDR,6000
2026-10-19 08:32:16,Cash,Jajan,,Oreo,10000,Expense,,,10000.0,IDR,10000
2026-10-19 08:31:57,Cash,Rokok,,Juara Klik,17000,Expense,,,17000.0,IDR,17000
2026-10-18 02:37:34,Cash,Jajan,,Beng-Beng Dan Roma Kelapa,5000,Expense,,,5000.0,IDR,5000
2026-10-18 02:37:07,Cash,Rumah,,Kasih Ke Nek Bit,100000,Expense,,,100000.0,IDR,100000
2026-10-17 20:52:48,Cash,Warkop,,Cappuccino Panas,7000,Expense,,,7000.0,IDR,7000
2026-10-17 13:27:25,Cash,Warkop,,Teh Hangat,5000,Expense,,,5000.0,IDR,5000
2026-10-17 13:27:10,Cash,Jajan,,Somay,5000,Expense,,,5000.0,IDR,5000
2026-10-17 13:26:39,Cash,Rokok,,Juara Klik,17000,Expense,,,17000.0,IDR,17000
2026-10-15 18:02:04,Cash,Makan,,Nasi Gurih Pagi,10000,Expense,,,10000.0,IDR,10000
2026-10-14 19:24:38,Cash,Rokok,,Chief,22000,Expense,,,22000.0,IDR,22000
2026-10-14 13:22:18,Cash,Warkop,,Teh Hangat,6000,Expense,,,6000.0,IDR,6000
2026-10-14 13:22:02,Cash,Makan,,Nasi Goreng,13000,Expense,,,13000.0,IDR,13000
2026-10-13 17:51:24,Cash,Jajan,,Oreo,10000,Expense,,,10000.0,IDR,10000
2026-10-13 17:50:45,Cash,Rumah,,Minyak Goreng,46000,Expense,,,46000.0,IDR,46000
2026-10-13 12:20:28,Cash,Rokok,,Magnum,25000,Expense,,,25000.0,IDR,25000
2026-10-12 15:00:34,Card,🤑 Allowance,,Uang Saku MagangHub,4162000,Income,,,4162000.0,IDR,4162000
2026-10-12 14:56:45,Cash,Warkop,,Kopi,5000,Expense,,,5000.0,IDR,5000
2026-10-12 14:56:27,Cash,Makan,,Geprek,12000,Expense,,,12000.0,IDR,12000
2026-10-11 19:53:36,Cash,Warkop,,Kopi,6000,Expense,,,6000.0,IDR,6000
2026-10-11 13:32:20,Cash,Honda,,3 Liter,50000,Expense,,,50000.0,IDR,50000
2026-10-11 13:31:30,Cash,Jajan,,Oreo,13000,Expense,,,13000.0,IDR,13000
2026-10-11 13:29:20,Cash,Rokok,,Juara Klik,17000,Expense,,,17000.0,IDR,17000`;

describe("CSV Parser for User's Transfer Data", () => {
  it("should parse the exact user CSV data accurately without missing any row", () => {
    const result = parseTransactionsCsv(SAMPLE_CSV);

    expect(result.validRows).toBe(60);
    expect(result.skippedRows).toBe(0);
    expect(result.items.length).toBe(60);

    // Check first item
    const first = result.items[0];
    expect(first.date).toBe("2026-10-29");
    expect(first.rawTimestamp).toBe("2026-10-29T23:38:03.000Z");
    expect(first.categoryName).toBe("Jajan");
    expect(first.note).toBe("Paket Rahul");
    expect(first.amount).toBe(12000);
    expect(first.type).toBe("expense");
    expect(first.paymentMethod).toBe("cash");

    // Check income item (🏅 Bonus)
    const bonus = result.items.find((item) => item.categoryName === "🏅 Bonus");
    expect(bonus).toBeDefined();
    expect(bonus?.type).toBe("income");
    expect(bonus?.amount).toBe(2700000);
    expect(bonus?.paymentMethod).toBe("debit_card"); // mapped from "Card"

    // Check another income item (🤑 Allowance)
    const allowance = result.items.find((item) => item.categoryName === "🤑 Allowance");
    expect(allowance).toBeDefined();
    expect(allowance?.type).toBe("income");
    expect(allowance?.amount).toBe(4162000);
    expect(allowance?.note).toBe("Uang Saku MagangHub");

    // Total income: 2,700,000 + 1,000,000 + 4,162,000 = 7,862,000
    expect(result.totalIncome).toBe(7862000);

    // Verify categories list contains expected items
    const catNames = result.categories.map((c) => c.name);
    expect(catNames).toContain("Jajan");
    expect(catNames).toContain("Warkop");
    expect(catNames).toContain("Makan");
    expect(catNames).toContain("🏅 Bonus");
    expect(catNames).toContain("Rokok");
    expect(catNames).toContain("Honda");
    expect(catNames).toContain("Paket Data");
    expect(catNames).toContain("Rumah");
    expect(catNames).toContain("🤑 Allowance");
  });

  it("should handle amounts formatted as IDR, commas, decimals", () => {
    expect(parseAmount("12000.0").amount).toBe(12000);
    expect(parseAmount("Rp 12.000").amount).toBe(12000);
    expect(parseAmount("2,700,000.00").amount).toBe(2700000);
    expect(parseAmount("7000").amount).toBe(7000);
  });

  it("should handle semicolon delimiters", () => {
    const csv = `Date;Category;Amount;Type;Note\n2026-10-29;Makan;25000;Expense;Soto Ayam`;
    const res = parseTransactionsCsv(csv);
    expect(res.validRows).toBe(1);
    expect(res.items[0].categoryName).toBe("Makan");
    expect(res.items[0].amount).toBe(25000);
    expect(res.items[0].note).toBe("Soto Ayam");
  });
});

