import { Download } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function ExportsPage() {
  return (
    <div className="w-full px-6 py-5">
      <PageHeader
        title="Exports"
        description="Generate and download reports from screening runs."
        actions={<Button leftIcon={<Download className="h-4 w-4" />}>Export All</Button>}
      />
      <Card className="mt-8 p-8 text-center text-sm text-ink-muted">
        No exports yet. Complete a screening run to generate exportable reports.
      </Card>
    </div>
  );
}
