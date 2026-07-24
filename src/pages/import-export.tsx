import { useState } from "react";
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

const EXPORT_TYPES = [
  { id: "assets", label: "Assets", description: "All hardware assets with full details", icon: FileSpreadsheet, records: 64 },
  { id: "inventory", label: "Inventory", description: "Current stock levels and reorder data", icon: FileSpreadsheet, records: 48 },
  { id: "users", label: "Users", description: "All team members and their roles", icon: FileSpreadsheet, records: 32 },
  { id: "maintenance", label: "Maintenance", description: "Maintenance tasks and schedules", icon: FileSpreadsheet, records: 28 },
  { id: "repairs", label: "Repairs", description: "Repair tickets and SLA data", icon: FileSpreadsheet, records: 20 },
  { id: "licenses", label: "Software Licenses", description: "License entitlements and compliance", icon: FileText, records: 10 },
];

export function ImportExportPage() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const simulateImport = () => {
    setImporting(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setImporting(false);
          toast.success("Import completed successfully!");
          return 0;
        }
        return p + 10;
      });
    }, 300);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import / Export"
        description="Bulk data operations — import from CSV or export your data in multiple formats."
        icon={<FileDown className="h-5 w-5" />}
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
                Choose a data type and format to export your records.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Export format</Label>
                  <Select defaultValue="csv">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV (.csv)</SelectItem>
                      <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                      <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                      <SelectItem value="json">JSON (.json)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date range</Label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All time</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="12m">Last 12 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {EXPORT_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => toast.success(`Exporting ${type.label} (demo)`)}
                      className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 text-left transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary ring-1 ring-primary/10 transition-all group-hover:bg-primary/12">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{type.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {type.description}
                        </p>
                        <p className="mt-1 text-xs font-medium text-primary">
                          {type.records} records
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
                <Select defaultValue="assets">
                  <SelectTrigger className="max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assets">Assets</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="users">Users</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border-2 border-dashed border-border/60 bg-muted/20 p-8 text-center transition-colors hover:border-primary/30">
                <Upload className="mx-auto h-10 w-10 text-muted-foreground/60" />
                <p className="mt-3 text-sm font-medium">
                  Drag and drop your CSV file here
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  or click to browse — max file size 10MB
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={simulateImport}
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
                      onClick={() => toast.info(`Downloading ${t} template (demo)`)}
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
