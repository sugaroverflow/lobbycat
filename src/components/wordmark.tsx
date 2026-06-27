import Image from "next/image";

/**
 * The lobbycat wordmark: cat-3 illustration + "lobbycat" lockup.
 * Defaults to header-size (h-6). Pass `size` to override for larger contexts.
 *
 * v0.8.3: optional `textOnly` mode skips the PNG. Used on the login page,
 * where the auth-walled `/cat/*` middleware route makes the image 404
 * pre-login (broken-icon glyph). Once Techie's middleware fix lands the
 * PNG will be reachable; until then `textOnly` keeps the login page clean.
 */
export function Wordmark({
  size = 24,
  className,
  textOnly = false,
}: {
  size?: number;
  className?: string;
  textOnly?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      {!textOnly && (
        <Image
          src="/cat/lobbycat.png"
          alt=""
          width={size}
          height={size}
          priority
          className="self-center"
        />
      )}
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
