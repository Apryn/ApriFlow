"use client";

import { useState, useRef } from "react";
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
  ClipboardPaste,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parseTransactionsCsv, type ParseResult, type ParsedTransactionRow } from "@/lib/data-sync/csv-parser";
import {
  importTransactionsAction,
  exportTransactionsCsvAction,
  exportFullBackupJsonAction,
  restoreFullBackupJsonAction,
  type ImportResponse,
} from "@/actions/data-sync.actions";
import { formatRupiah } from "@/lib/utils/currency";

export function BackupManager() {
  const [activeTab, setActiveTab] = useState<"import" | "export">("import");
  const [inputMode, setInputMode] = useState<"file" | "paste">("file");

  // Import State
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isJsonBackup, setIsJsonBackup] = useState(false);
  const [jsonBackupData, setJsonBackupData] = useState<any | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importReport, setImportReport] = useState<ImportResponse | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Export State
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger file download helper
  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportReport(null);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith(".json")) {
        try {
          const parsed = JSON.parse(content);
          setIsJsonBackup(true);
          setJsonBackupData(parsed);
          setParseResult(null);
        } catch (err: any) {
          setImportError("File JSON tidak dapat dibaca: " + err.message);
        }
      } else {
        setIsJsonBackup(false);
        setJsonBackupData(null);
        const res = parseTransactionsCsv(content);
        setParseResult(res);
      }
    };
    reader.readAsText(file);
  };

  // Handle direct text paste
  const handleParseText = (text: string) => {
    setRawText(text);
    setImportReport(null);
    setImportError(null);

    const trimmed = text.trim();
    if (!trimmed) {
      setParseResult(null);
      setIsJsonBackup(false);
      return;
    }

    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        setIsJsonBackup(true);
        setJsonBackupData(parsed);
        setParseResult(null);
        return;
      } catch (e) {
        // Continue to CSV parsing
      }
    }

    setIsJsonBackup(false);
    setJsonBackupData(null);
    const res = parseTransactionsCsv(text);
    setParseResult(res);
  };

  // Execute Import
  const handleExecuteImport = async () => {
    setIsImporting(true);
    setImportError(null);
    setImportReport(null);

    try {
      if (isJsonBackup && jsonBackupData) {
        const res = await restoreFullBackupJsonAction(JSON.stringify(jsonBackupData));
        if (res.success) {
          setImportReport({
            success: true,
            totalProcessed: jsonBackupData.transactions?.length || 0,
            importedCount: jsonBackupData.transactions?.length || 0,
            skippedDuplicates: 0,
          });
        } else {
          setImportError(res.error || "Gagal memulihkan cadangan.");
        }
      } else if (parseResult && parseResult.items.length > 0) {
        const res = await importTransactionsAction(parseResult.items, { skipDuplicates });
        if (res.success) {
          setImportReport(res);
        } else {
          setImportError(res.error || "Gagal mengimpor data transaksi.");
        }
      }
    } catch (err: any) {
      setImportError(err.message || "Terjadi kesalahan sistem saat proses impor.");
    } finally {
      setIsImporting(false);
    }
  };

  // Handle Export CSV
  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    setExportMessage(null);
    try {
      const res = await exportTransactionsCsvAction();
      if (res.success && res.data && res.filename) {
        triggerDownload(res.data, res.filename, "text/csv;charset=utf-8;");
        setExportMessage({ type: "success", text: `File ${res.filename} berhasil diunduh.` });
      } else {
        setExportMessage({ type: "error", text: res.error || "Gagal mengunduh file CSV." });
      }
    } catch (err: any) {
      setExportMessage({ type: "error", text: err.message || "Terjadi galat saat ekspor CSV." });
    } finally {
      setIsExportingCsv(false);
    }
  };

  // Handle Export JSON
  const handleExportJson = async () => {
    setIsExportingJson(true);
    setExportMessage(null);
    try {
      const res = await exportFullBackupJsonAction();
      if (res.success && res.data && res.filename) {
        triggerDownload(res.data, res.filename, "application/json;charset=utf-8;");
        setExportMessage({ type: "success", text: `Cadangan lengkap ${res.filename} berhasil diunduh.` });
      } else {
        setExportMessage({ type: "error", text: res.error || "Gagal mengunduh file cadangan JSON." });
      }
    } catch (err: any) {
      setExportMessage({ type: "error", text: err.message || "Terjadi galat saat ekspor JSON." });
    } finally {
      setIsExportingJson(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Tab Switcher */}
      <div className="flex p-1 bg-surface-1 rounded-2xl border border-zinc-800">
        <button
          onClick={() => setActiveTab("import")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] ${
            activeTab === "import"
              ? "bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Upload className="h-4 w-4" />
          <span>Impor Data HP</span>
        </button>
        <button
          onClick={() => setActiveTab("export")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] ${
            activeTab === "export"
              ? "bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Download className="h-4 w-4" />
          <span>Ekspor & Cadangan</span>
        </button>
      </div>

      {/* TAB 1: IMPORT DATA */}
      {activeTab === "import" && (
        <div className="space-y-4">
          {/* Instruction Card */}
          <Card className="p-4 bg-surface-1 border-zinc-800/80 space-y-2">
            <div className="flex items-center gap-2.5 text-teal-400">
              <Smartphone className="h-4 w-4" />
              <h2 className="text-sm font-semibold text-zinc-100">Pindah Data Antar HP Mulus</h2>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Mendukung file CSV dari aplikasi lain (1Money, Money Manager, Catatan Keuangan, atau ekspor ApriFlow) serta file cadangan JSON. Seluruh riwayat transaksi, tanggal, jam, nominal, dan kategori akan dipindahkan tanpa ada data yang terlewat.
            </p>
          </Card>

          {/* Input Method Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setInputMode("file")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium border transition-all ${
                inputMode === "file"
                  ? "bg-zinc-800 border-zinc-600 text-zinc-100"
                  : "bg-surface-1 border-zinc-800 text-zinc-400 hover:bg-zinc-800/40"
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Upload File (.csv / .json)
            </button>
            <button
              onClick={() => setInputMode("paste")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium border transition-all ${
                inputMode === "paste"
                  ? "bg-zinc-800 border-zinc-600 text-zinc-100"
                  : "bg-surface-1 border-zinc-800 text-zinc-400 hover:bg-zinc-800/40"
              }`}
            >
              <ClipboardPaste className="h-3.5 w-3.5" />
              Tempel Teks CSV
            </button>
          </div>

          {/* Mode 1: File Upload */}
          {inputMode === "file" && (
            <Card className="p-5 border-dashed border-2 border-zinc-700/80 bg-surface-1/50 hover:bg-surface-1 transition-colors text-center space-y-3 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Upload className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-zinc-200">
                  {fileName ? fileName : "Pilih atau Seret File CSV / JSON"}
                </p>
                <p className="text-[11px] text-zinc-500">
                  Klik untuk memilih file cadangan dari memori HP Anda
                </p>
              </div>
              {fileName && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs text-zinc-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                  <span>File terpilih: {fileName}</span>
                </div>
              )}
            </Card>
          )}

          {/* Mode 2: Direct Text Paste */}
          {inputMode === "paste" && (
            <div className="space-y-2">
              <textarea
                value={rawText}
                onChange={(e) => handleParseText(e.target.value)}
                placeholder="Tempelkan baris CSV Anda di sini (contoh: Date,Account,Category,Note,Amount...)"
                rows={6}
                className="w-full text-xs font-mono p-3 rounded-2xl bg-surface-1 border border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500"
              />
              {rawText && (
                <button
                  onClick={() => handleParseText("")}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 underline"
                >
                  Bersihkan teks
                </button>
              )}
            </div>
          )}

          {/* Parsed Result Preview (CSV) */}
          {parseResult && parseResult.items.length > 0 && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2">
                <Card className="p-3 bg-surface-1 border-zinc-800">
                  <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Total Data</p>
                  <p className="text-base font-bold text-zinc-100 mt-0.5">{parseResult.validRows}</p>
                  <p className="text-[10px] text-zinc-500">Baris siap diimpor</p>
                </Card>
                <Card className="p-3 bg-surface-1 border-zinc-800">
                  <p className="text-[10px] text-emerald-500 font-medium uppercase tracking-wider">Pemasukan</p>
                  <p className="text-xs font-bold text-emerald-400 mt-0.5 truncate">{formatRupiah(parseResult.totalIncome)}</p>
                  <p className="text-[10px] text-zinc-500">{parseResult.items.filter(i => i.type === "income").length} transaksi</p>
                </Card>
                <Card className="p-3 bg-surface-1 border-zinc-800">
                  <p className="text-[10px] text-rose-500 font-medium uppercase tracking-wider">Pengeluaran</p>
                  <p className="text-xs font-bold text-rose-400 mt-0.5 truncate">{formatRupiah(parseResult.totalExpense)}</p>
                  <p className="text-[10px] text-zinc-500">{parseResult.items.filter(i => i.type === "expense").length} transaksi</p>
                </Card>
              </div>

              {/* Detected Categories Pill List */}
              <Card className="p-3 bg-surface-1 border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-300">Kategori Terdeteksi ({parseResult.categories.length})</span>
                  <span className="text-[11px] text-zinc-500">Akan disinkron otomatis</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {parseResult.categories.map((cat, idx) => (
                    <Badge
                      key={idx}
                      variant={cat.type === "income" ? "success" : "secondary"}
                      className="text-[10px] py-0.5 px-2"
                    >
                      {cat.name} ({cat.count})
                    </Badge>
                  ))}
                </div>
              </Card>

              {/* Deduplication Option */}
              <div
                onClick={() => setSkipDuplicates(!skipDuplicates)}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-1 border border-zinc-800 cursor-pointer hover:bg-zinc-800/40 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 bg-surface-2 text-teal-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-zinc-200">Lewati Transaksi Duplikat (Rekomendasi)</p>
                  <p className="text-[11px] text-zinc-500">Mencegah data tercatat dua kali jika tanggal, jumlah, dan catatan persis sama.</p>
                </div>
              </div>

              {/* Transaction Sample Preview */}
              <Card className="p-3 bg-surface-1 border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-300">Pratinjau Data (5 dari {parseResult.validRows})</span>
                  <span className="text-[11px] text-zinc-500">Periksa format sebelum simpan</span>
                </div>
                <div className="space-y-1.5 divide-y divide-zinc-800/60">
                  {parseResult.items.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-200 truncate">{item.note}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{item.categoryName}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500">{item.date} • {item.paymentMethod.toUpperCase()}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`font-semibold ${item.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                          {item.type === "income" ? "+" : "-"}{formatRupiah(item.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Execute Import Button */}
              <Button
                onClick={handleExecuteImport}
                disabled={isImporting}
                className="w-full bg-teal-500 hover:bg-teal-400 text-zinc-950 font-semibold py-3 rounded-2xl shadow-lg shadow-teal-500/10 active:scale-[0.98] transition-all"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Sedang Menyimpan Transaksi...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Impor {parseResult.validRows} Transaksi Sekarang</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Parsed JSON Backup Preview */}
          {isJsonBackup && jsonBackupData && (
            <Card className="p-4 bg-surface-1 border-zinc-800 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-teal-400">
                <FileCode className="h-5 w-5" />
                <h3 className="text-sm font-semibold text-zinc-100">File Cadangan Lengkap ApriFlow</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-surface-2 border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block">Transaksi</span>
                  <span className="text-sm font-bold text-zinc-200">{jsonBackupData.transactions?.length || 0} data</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-2 border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block">Kategori</span>
                  <span className="text-sm font-bold text-zinc-200">{jsonBackupData.categories?.length || 0} item</span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                File cadangan ini akan memulihkan data transaksi, aset, target, dan kategori ke akun Anda saat ini.
              </p>
              <Button
                onClick={handleExecuteImport}
                disabled={isImporting}
                className="w-full bg-teal-500 hover:bg-teal-400 text-zinc-950 font-semibold py-3 rounded-2xl shadow-lg shadow-teal-500/10 active:scale-[0.98]"
              >
                {isImporting ? "Memulihkan..." : "Pulihkan Cadangan Sekarang"}
              </Button>
            </Card>
          )}

          {/* Error Message */}
          {importError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Gagal Memproses Data</p>
                <p className="text-zinc-400 mt-0.5">{importError}</p>
              </div>
            </div>
          )}

          {/* Success Report */}
          {importReport && importReport.success && (
            <Card className="p-4 bg-emerald-500/10 border-emerald-500/20 space-y-2.5 text-xs animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="h-5 w-5" />
                <span>Impor Data Berhasil Sempurna!</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                Sebanyak <strong className="text-emerald-300">{importReport.importedCount} transaksi</strong> telah berhasil dimasukkan ke sistem Anda.
                {importReport.skippedDuplicates ? (
                  <span> ({importReport.skippedDuplicates} transaksi duplikat dilewati).</span>
                ) : null}
              </p>
              {importReport.createdCategories && importReport.createdCategories.length > 0 && (
                <p className="text-zinc-400 text-[11px]">
                  Kategori baru yang otomatis dibuat: {importReport.createdCategories.join(", ")}.
                </p>
              )}
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: EXPORT & BACKUP */}
      {activeTab === "export" && (
        <div className="space-y-4">
          {/* Notification Message */}
          {exportMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                exportMessage.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                  : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
              }`}
            >
              {exportMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <p>{exportMessage.text}</p>
            </div>
          )}

          {/* Option 1: CSV Export */}
          <Card className="p-4 bg-surface-1 border-zinc-800 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-zinc-100">Ekspor File CSV</h3>
                  <p className="text-xs text-zinc-500">Kompatibel dengan Microsoft Excel & Google Sheets</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Unduh seluruh riwayat transaksi Anda dalam format CSV terstruktur (Tanggal, Kategori, Nominal, Akun, Catatan). Cocok untuk pelaporan pajak, analisa spreadsheet, atau dipindahkan ke aplikasi lain.
            </p>
            <Button
              onClick={handleExportCsv}
              disabled={isExportingCsv}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {isExportingCsv ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Membuat File CSV...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Semua Transaksi (.csv)</span>
                </>
              )}
            </Button>
          </Card>

          {/* Option 2: Full Backup JSON */}
          <Card className="p-4 bg-surface-1 border-zinc-800 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <FileCode className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-zinc-100">Cadangan Penuh (Full JSON)</h3>
                  <p className="text-xs text-zinc-500">Paling direkomendasikan saat ganti HP</p>
                </div>
              </div>
              <Badge variant="info" className="text-[10px]">Lengkap 100%</Badge>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Mencadangkan seluruh isi aplikasi Anda: riwayat transaksi, kategori khusus, daftar aset, target impian finansial, dan anggaran bulanan. Saat pindah ke HP baru, cukup restore file ini.
            </p>
            <Button
              onClick={handleExportJson}
              disabled={isExportingJson}
              className="w-full bg-teal-500 hover:bg-teal-400 text-zinc-950 font-semibold rounded-xl py-2.5 text-xs flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {isExportingJson ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Mempersiapkan Cadangan...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Download Cadangan Penuh (.json)</span>
                </>
              )}
            </Button>
          </Card>

          {/* Migration Guide */}
          <Card className="p-4 bg-surface-1/60 border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-zinc-300">
              <HelpCircle className="h-4 w-4 text-teal-400" />
              <h4 className="text-xs font-semibold">Langkah Mudah Pindah HP Tanpa Miss Data</h4>
            </div>
            <ol className="text-xs text-zinc-400 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                <strong className="text-zinc-200">Di HP Lama:</strong> Tekan tombol <em>Download Semua Transaksi (.csv)</em> atau <em>Download Cadangan Penuh (.json)</em> di atas.
              </li>
              <li>
                <strong className="text-zinc-200">Kirim File:</strong> Kirim file hasil download melalui WhatsApp, Google Drive, atau Bluetooth ke HP baru Anda.
              </li>
              <li>
                <strong className="text-zinc-200">Di HP Baru:</strong> Buka menu ini, pilih tab <em>Impor Data HP</em>, lalu upload file tadi.
              </li>
              <li>
                <strong className="text-zinc-200">Selesai:</strong> Seluruh data langsung tampil rapi dengan kalkulasi ringkasan yang akurat!
              </li>
            </ol>
          </Card>
        </div>
      )}
    </div>
  );
}
