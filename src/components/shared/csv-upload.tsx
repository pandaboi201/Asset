import { useRef, useState } from "react";
import Papa from "papaparse";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CsvUploadProps {
  onDataParsed: (data: any[]) => Promise<void>;
  label?: string;
  className?: string;
}

export function CsvUpload({ onDataParsed, label = "Import CSV", className }: CsvUploadProps) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          if (results.errors.length > 0) {
            console.error("CSV Parse Errors:", results.errors);
            toast.error("Failed to parse CSV file exactly.");
            return;
          }
          await onDataParsed(results.data);
          // reset input
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        } catch (err: any) {
          toast.error(err.message || "Failed to import data");
        } finally {
          setLoading(false);
        }
      },
      error: (err) => {
        toast.error("Error reading CSV file");
        setLoading(false);
      }
    });
  };

  return (
    <div className={className}>
      <input
        type="file"
        accept=".csv"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        disabled={loading}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mr-2 h-4 w-4" />
        {loading ? "Importing..." : label}
      </Button>
    </div>
  );
}
