import QueryProvider from "@/providers/QueryProvider";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      {children}
    </QueryProvider>
  );
}
