import Image from "next/image";
import { cn } from "@/lib/utils";

type Img = { src: string; width: number; height: number };

/**
 * A minimal browser window. The page inside is the full-height capture: it
 * sits at the top, and scrolls to the bottom while hovered (pure CSS, using
 * container query units so the travel matches the frame's real height).
 */
export function BrowserFrame({
  image,
  url,
  alt,
  className,
}: {
  image: Img;
  url: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group/frame overflow-hidden rounded-xl bg-zinc-200 shadow-[0_40px_80px_-20px_rgb(0_0_0/0.45)] ring-1 ring-black/10 md:rounded-2xl dark:bg-zinc-800 dark:ring-white/10",
        className,
      )}
    >
      <div className="flex h-7 items-center gap-1.5 px-3 md:h-9 md:px-4">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-2 rounded-full bg-zinc-400/70 md:size-2.5" />
        ))}
        <span className="mx-auto max-w-[60%] truncate rounded-md bg-white/70 px-3 py-0.5 text-[10px] text-zinc-600 md:text-xs dark:bg-zinc-900/70 dark:text-zinc-400">
          {url.replace(/^https?:\/\/(www\.)?/, "")}
        </span>
      </div>
      <div className="relative aspect-16/10 overflow-hidden bg-white [container-type:size]">
        <Image
          src={image.src}
          width={image.width}
          height={image.height}
          alt={alt}
          sizes="(min-width: 1024px) 50vw, 90vw"
          className="absolute inset-x-0 top-0 h-auto w-full transition-transform duration-[1.2s] ease-in-out-quart group-hover/frame:translate-y-[calc(-100%+100cqh)] group-hover/frame:duration-[9s]"
        />
      </div>
    </div>
  );
}

/** A phone with a slim bezel and a dynamic-island pill. */
export function PhoneFrame({
  image,
  alt,
  className,
}: {
  image: Img;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-1170/2532 overflow-hidden rounded-[14%/6.5%] bg-zinc-950 p-[3.5%] shadow-[0_40px_80px_-20px_rgb(0_0_0/0.55)] ring-1 ring-white/10",
        className,
      )}
    >
      <div className="relative size-full overflow-hidden rounded-[11%/5%]">
        <Image
          src={image.src}
          width={image.width}
          height={image.height}
          alt={alt}
          sizes="(min-width: 1024px) 14vw, 30vw"
          className="size-full object-cover object-top"
        />
        <span className="absolute left-1/2 top-[1.6%] h-[3%] w-[30%] -translate-x-1/2 rounded-full bg-black" />
      </div>
    </div>
  );
}
