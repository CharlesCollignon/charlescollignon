/**
 * Slide-up reveal behind a mask, done entirely in CSS and rendered on the
 * server. Used for the hero title, the page's largest element: it stays a
 * single text block (so it counts as the LCP element) and paints immediately
 * instead of waiting for JavaScript. See `.css-reveal` in globals.css.
 */
export function CssReveal({
  text,
  as: Tag = "h1",
  delay = 0.3,
  className,
}: {
  text: string;
  as?: "h1" | "h2" | "p";
  delay?: number;
  className?: string;
}) {
  return (
    <Tag className={className}>
      <span className="css-reveal-mask">
        <span className="css-reveal" style={{ animationDelay: `${delay}s` }}>
          {text}
        </span>
      </span>
    </Tag>
  );
}
