import { Smartphone } from "lucide-react";

export function ChiPhoneFrame({ children, note = true }: { children: React.ReactNode; note?: boolean }) {
  return (
    <div>
      {note && (
        <p className="mb-3 hidden items-center gap-2 text-xs text-muted-foreground md:flex">
          <Smartphone className="h-3.5 w-3.5" aria-hidden />
          Field CHI workspace — shown in a phone preview on desktop. On a field tablet or phone it opens full-screen.
        </p>
      )}
      <div className="mx-auto w-full max-w-[430px] md:my-6 md:rounded-[2.2rem] md:border-[10px] md:border-sidebar md:shadow-xl">
        <div className="min-h-[640px] overflow-hidden rounded-xl bg-background md:rounded-[1.6rem]">
          {children}
        </div>
      </div>
    </div>
  );
}
