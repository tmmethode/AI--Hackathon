export function Footer() {
  return (
    <footer className="mt-auto flex flex-col items-start justify-between gap-2 border-t border-line bg-white px-4 py-4 text-xs text-ink-muted md:flex-row md:items-center md:px-8">
      <p>© 2026 Umurava Screening. All rights reserved.</p>
      <nav aria-label="Legal" className="flex items-center gap-6">
        <a href="#" className="hover:text-ink">Terms of Service</a>
        <a href="#" className="hover:text-ink">Privacy Policy</a>
        <a href="#" className="hover:text-ink">System Status</a>
      </nav>
    </footer>
  );
}
