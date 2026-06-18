import Image from "next/image";

/**
 * The lobbycat wordmark: cat-3 illustration + "lobbycat" lockup.
 * Defaults to header-size (h-6). Pass `size` to override for larger contexts.
 */
export function Wordmark({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className ?? ""}`}>
      <Image
        src="/cat/lobbycat.png"
        alt=""
        width={size}
        height={size}
        priority
        className="self-center"
      />
      <span>lobbycat</span>
    </span>
  );
}

/**
 * Just the cat head, no wordmark — for panel headers, empty states, etc.
 */
export function CatMark({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/cat/lobbycat.png"
      alt=""
      width={size}
      height={size}
      className={className}
    />
  );
}
