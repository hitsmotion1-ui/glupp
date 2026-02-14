export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-glupp-bg/95 backdrop-blur-lg border-b border-glupp-border">
      <div className="flex items-center justify-between px-4 h-14">
        <h1 className="font-display text-xl font-bold text-glupp-accent">
          Glupp
        </h1>
        <div className="flex items-center gap-2">
          {/* Search & notifications will go here post-MVP */}
        </div>
      </div>
    </header>
  );
}
