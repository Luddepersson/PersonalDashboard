export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden p-4"
      style={{
        background: "linear-gradient(145deg, #b8d4e8 0%, #c8ddef 20%, #d5e3ef 40%, #c0d6e8 60%, #b0cce2 80%, #a8c8de 100%)",
      }}
    >
      {/* Frost orbs */}
      <div className="absolute top-[-15%] left-[-8%] w-[55%] h-[55%] rounded-full bg-gradient-to-br from-[#8bb8d4]/30 to-transparent blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-8%] w-[45%] h-[45%] rounded-full bg-gradient-to-tl from-[#6aa0be]/25 to-transparent blur-[80px] pointer-events-none" />
      <div className="absolute top-[20%] right-[15%] w-[30%] h-[30%] rounded-full bg-gradient-to-b from-white/15 to-transparent blur-[60px] pointer-events-none" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(46,148,190,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(46,148,190,0.4) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 w-full max-w-[420px] px-1 sm:px-0">{children}</div>
    </div>
  );
}
