import { useRef, useState } from "react";
import {
  Download,
  FileDown,
  FileSpreadsheet,
  FileText,
  Upload,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import { exportCsv, importRows } from "@/services";

const EXPORT_TYPES: {
  id: "assets" | "inventory" | "users" | "maintenance" | "repairs" | "software-licenses";
  label: string;
  description: string;
  icon: typeof FileSpreadsheet;
}[] = [
  { id: "assets", label: "Assets", description: "All hardware assets with full details", icon: FileSpreadsheet },
  { id: "inventory", label: "Inventory", description: "Current stock levels and reorder data", icon: FileSpreadsheet },
  { id: "users", label: "Users", description: "All team members and their roles", icon: FileSpreadsheet },
  { id: "maintenance", label: "Maintenance", description: "Maintenance tasks and schedules", icon: FileSpreadsheet },
  { id: "repairs", label: "Repairs", description: "Repair tickets and SLA data", icon: FileSpreadsheet },
  { id: "software-licenses", label: "Software Licenses", description: "License entitlements and compliance", icon: FileText },
];

/** Minimal CSV parser: handles quoted fields, commas inside quotes, and CRLF/LF. */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  function parseLine(line: string): string[] {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out;
  }

  const header = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const row: Record<string, string> = {};
    header.forEach((key, i) => {
      row[key] = cells[i] ?? "";
    });
    return row;
  });
}

const IMPORT_TYPES = [
  { value: "assets", label: "Assets" },
  { value: "inventory", label: "Inventory" },
  { value: "users", label: "Users" },
  { value: "maintenance", label: "Maintenance" },
] as const;

export function ImportExportPage() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importType, setImportType] = useState<(typeof IMPORT_TYPES)[number]["value"]>("assets");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = (type: (typeof EXPORT_TYPES)[number]["id"]) => {
    exportCsv(type);
    toast.success(`Downloading ${type}.csv`);
  };

  const handleFileSelected = async (file: File) => {
    setImporting(true);
    setProgress(10);
    try {
      const text = await file.text();
      setProgress(40);
      const rows = parseCsv(text);
      if (rows.length === 0) {
        toast.error("The CSV file has no data rows");
        return;
      }
      setProgress(70);
      const result = await importRows(importType, rows);
      setProgress(100);
      toast.success(`Imported ${result.imported} ${importType} record${result.imported === 1 ? "" : "s"}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Import failed — check the file format",
      );
    } finally {
      setTimeout(() => {
        setImporting(false);
        setProgress(0);
      }, 400);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
    e.target.value = "";
  };

  const downloadTemplate = (type: string) => {
    const templates: Record<string, string> = {
      Assets: "assetTag,name,category,manufacturer,model,serialNumber,status,condition,location,department,supplier\n",
      Inventory: "sku,name,category,quantity,reorderLevel,location,warehouse,supplier,status\n",
      Users: "name,email,role,department,jobTitle,phone,location,status\n",
      Maintenance: "reference,assetTag,assetName,title,type,status,priority,scheduledDate,description\n",
    };
    const blob = new Blob([templates[type] ?? ""], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type.toLowerCase()}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import / Export"
        description="Bulk data operations — import from CSV or export your data in multiple formats."
        icon={<FileDown className="h-5 w-5" />}
        tone="teal"
      />

      <Tabs defaultValue="export" className="space-y-6">
        <TabsList>
          <TabsTrigger value="export" className="gap-2">
            <Download className="h-4 w-4" /> Export Data
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2">
            <Upload className="h-4 w-4" /> Import Data
          </TabsTrigger>
        </TabsList>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>
                Download a live CSV snapshot of any resource, generated directly from the database.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {EXPORT_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => handleExport(type.id)}
                      className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 text-left transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3 ring-1 ring-chart-3/15 transition-all group-hover:bg-chart-3/15">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{type.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {type.description}
                        </p>
                        <p className="mt-1 text-xs font-medium text-primary">
                          Download CSV
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Import Data</CardTitle>
              <CardDescription>
                Upload a CSV file to bulk-import records into the system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Data type</Label>
                <Select value={importType} onValueChange={(v) => setImportType(v as typeof importType)}>
                  <SelectTrigger className="max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMPORT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div
                className="rounded-xl border-2 border-dashed border-border/60 bg-muted/20 p-8 text-center transition-colors hover:border-primary/30"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileSelected(file);
                }}
              >
                <Upload className="mx-auto h-10 w-10 text-muted-foreground/60" />
                <p className="mt-3 text-sm font-medium">
                  Drag and drop your CSV file here
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  or click to browse — max file size 10MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={onFileInputChange}
                />
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                >
                  {importing ? "Importing..." : "Select File"}
                </Button>
              </div>

              {importing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Processing...</span>
                    <span className="text-muted-foreground tabular-nums">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">Download templates</p>
                <p className="text-xs text-muted-foreground">
                  Use these templates to ensure your data matches the expected format.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Assets", "Inventory", "Users", "Maintenance"].map((t) => (
                    <Button
                      key={t}
                      variant="outline"
                      size="sm"
                      onClick={() => downloadTemplate(t)}
                    >
                      <Download className="h-3.5 w-3.5" /> {t} Template
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
