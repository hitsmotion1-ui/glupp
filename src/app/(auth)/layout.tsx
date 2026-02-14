export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-glupp-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-glupp-accent mb-2">
            Glupp
          </h1>
          <p className="text-glupp-text-soft text-sm">Every gulp counts.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
