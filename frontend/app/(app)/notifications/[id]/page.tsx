import Link from "next/link";
import { ArrowLeft, Zap, Briefcase, FileDown, AlertCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type NotifType = "screening" | "job" | "export" | "system";

interface NotifDetail {
  id: number; type: NotifType; title: string;
  body: string; detail: string; time: string; date: string;
}

const notifications: NotifDetail[] = [
  { id: 1, type: "screening", title: "Screening completed", body: "AI screening for QA Automation Lead finished with 91% avg match. 20 candidates shortlisted.", detail: "The AI screening run for QA Automation Lead (JOB-004) has completed successfully. A total of 210 candidates were evaluated and 20 were shortlisted based on your configured weights. The top candidate scored 97% match. You can now review the shortlist and move candidates to interview.", time: "2 minutes ago", date: "Oct 24, 2023 · 14:22" },
  { id: 2, type: "job", title: "New applicants detected", body: "14 new candidates matched Senior Full Stack Engineer via Umurava Platform.", detail: "14 new candidates from the Umurava Platform have been automatically matched to the Senior Full Stack Engineer (JOB-001) role. These candidates meet your minimum skill requirements. Consider triggering a new screening run to rank them against your existing shortlist.", time: "1 hour ago", date: "Oct 24, 2023 · 13:05" },
  { id: 3, type: "export", title: "Export ready", body: "Your shortlist CSV export for Product Designer was generated successfully.", detail: "Your requested CSV export for the Product Designer (JOB-003) shortlist is ready. The file contains 12 candidates with their AI match scores, skills, and summaries. The file will be available for 7 days before it is automatically deleted.", time: "3 hours ago", date: "Oct 24, 2023 · 11:00" },
  { id: 4, type: "screening", title: "Screening started", body: "AI screening for Senior Frontend Engineer has been triggered with 142 candidates.", detail: "A new AI screening run has been initiated for Senior Frontend Engineer (JOB-001) with 142 ingested candidates. Estimated completion time is 45–60 seconds. You will receive a notification once the results are ready.", time: "5 hours ago", date: "Oct 24, 2023 · 09:15" },
  { id: 5, type: "job", title: "Job status updated", body: "DevOps Architect (JOB-005) has been marked as Closed by Marcus Chen.", detail: "The job requisition DevOps Architect (JOB-005) has been updated to Closed status by hiring manager Marcus Chen. No further applicants will be accepted for this role. Existing shortlisted candidates remain accessible in the Shortlists section.", time: "Yesterday", date: "Oct 23, 2023 · 16:30" },
  { id: 6, type: "system", title: "Weekly usage alert", body: "You have used 75 of 100 screening credits this week.", detail: "You have consumed 75 out of your 100 weekly screening credits. At your current pace, you may run out before the week resets on Sunday. Consider upgrading your plan to Pro or Enterprise for unlimited screenings.", time: "Yesterday", date: "Oct 23, 2023 · 08:00" },
  { id: 7, type: "screening", title: "Screening completed", body: "Full Stack Engineer (L5) screening done. Top candidate: Michael Chen at 94% match.", detail: "The screening run for Full Stack Engineer (L5) has completed. Michael Chen ranked #1 with a 94% match score. 18 candidates were shortlisted out of 124 evaluated. Review the shortlist to proceed with interviews.", time: "2 days ago", date: "Oct 22, 2023 · 18:45" },
  { id: 8, type: "export", title: "Export ready", body: "JSON export for Senior DevOps Engineer shortlist is available for download.", detail: "Your JSON export for the Senior DevOps Engineer shortlist is ready. The file includes full candidate profiles, AI scores, and reasoning summaries in machine-readable format suitable for ATS integrations.", time: "2 days ago", date: "Oct 22, 2023 · 14:00" },
  { id: 9, type: "job", title: "New applicants detected", body: "8 new candidates matched UX Researcher - Mobile role.", detail: "8 new candidates have been matched to the UX Researcher - Mobile role via the Umurava Platform. These candidates have relevant mobile UX experience. You may want to trigger a screening run to evaluate them.", time: "3 days ago", date: "Oct 21, 2023 · 10:30" },
  { id: 10, type: "system", title: "System maintenance", body: "Scheduled maintenance on Oct 28 from 02:00–04:00 UTC.", detail: "Umurava Screening will undergo scheduled maintenance on October 28, 2023 from 02:00 to 04:00 UTC. During this window, AI screening runs may be delayed or unavailable. Please plan your screening activities accordingly.", time: "4 days ago", date: "Oct 20, 2023 · 09:00" },
  { id: 11, type: "screening", title: "Screening failed", body: "Marketing Lead screening encountered an error. Please re-trigger the run.", detail: "The AI screening run for Marketing Lead encountered an unexpected error during processing. This may be due to a malformed candidate file or a temporary API issue. Please review your ingested files and re-trigger the screening run.", time: "5 days ago", date: "Oct 19, 2023 · 15:20" },
  { id: 12, type: "job", title: "Job created", body: "New job requisition 'Data Scientist' (JOB-006) was created by Priya Nair.", detail: "A new job requisition for Data Scientist (JOB-006) has been created by Priya Nair in the Analytics department. The role is currently in Draft status. You can begin ingesting candidates once the job is activated.", time: "6 days ago", date: "Oct 18, 2023 · 11:00" },
];

const typeIcon: Record<NotifType, React.ReactNode> = {
  screening: <Zap className="h-5 w-5 text-brand" />,
  job: <Briefcase className="h-5 w-5 text-success" />,
  export: <FileDown className="h-5 w-5 text-info-deep" />,
  system: <AlertCircle className="h-5 w-5 text-amber-500" />,
};

const typeTone: Record<NotifType, React.ComponentProps<typeof Badge>["tone"]> = {
  screening: "brand", job: "success", export: "info", system: "warning",
};

export default function NotificationDetailPage({ params }: { params: { id: string } }) {
  const notif = notifications.find((n) => n.id === Number(params.id));

  if (!notif) {
    return (
      <div className="w-full px-6 py-5">
        <Link href="/notifications" className="mb-6 flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to Notifications
        </Link>
        <Card className="p-12 text-center text-sm text-ink-muted">Notification not found.</Card>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-5">
      <Link href="/notifications" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Notifications
      </Link>

      <div className="w-full">
        {/* Hero header */}
        <div className={`mb-4 rounded-xl p-6 ${
          notif.type === "screening" ? "bg-brand-soft" :
          notif.type === "job" ? "bg-success/10" :
          notif.type === "export" ? "bg-brand/5" : "bg-amber-50"
        }`}>
          <div className="flex items-start gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${
              notif.type === "screening" ? "bg-brand/10" :
              notif.type === "job" ? "bg-success/20" :
              notif.type === "export" ? "bg-brand/10" : "bg-amber-100"
            }`}>
              <span className="scale-125">{typeIcon[notif.type]}</span>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={typeTone[notif.type]} pill className="capitalize">{notif.type}</Badge>
              </div>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">{notif.title}</h1>
              <div className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
                <Clock className="h-3.5 w-3.5" />
                <span>{notif.date}</span>
              </div>
            </div>
          </div>
        </div>

        <Card className="p-6">
          {/* Summary */}
          <div className="flex items-start gap-3 rounded-md border border-line bg-surface-soft/40 px-4 py-3">
            <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
            <p className="text-sm font-medium text-ink">{notif.body}</p>
          </div>

          {/* Detail */}
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Full Details</p>
            <p className="text-sm leading-7 text-ink">{notif.detail}</p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <p className="text-xs text-ink-muted">Received {notif.time}</p>
            <div className="flex gap-2">
              {notif.type === "screening" && <Link href="/shortlists"><Button>View Shortlist</Button></Link>}
              {notif.type === "job" && <Link href="/jobs"><Button>View Jobs</Button></Link>}
              {notif.type === "export" && <Link href="/exports"><Button>Go to Exports</Button></Link>}
              {notif.type === "system" && <Link href="/profile?tab=preferences"><Button>Manage Settings</Button></Link>}
              <Link href="/notifications"><Button variant="secondary">Back to All</Button></Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
