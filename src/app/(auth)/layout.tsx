export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-teal-600">ApriFlow</h1>
        <p className="mt-1 text-sm text-gray-500">
          Cash flow pribadi lebih jelas, otomatis, dan terkontrol.
        </p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
