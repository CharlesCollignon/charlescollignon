/**
 * A still frame of the 3D scene, shown instead of the live 3D robot on
 * devices where it would cost too much (Data Saver, low memory or CPU) or
 * when the user prefers reduced motion. One frame per theme and orientation.
 */
export function ScenePoster() {
  const frame = (device: "desktop" | "mobile", theme: "dark" | "light") =>
    `/scene/robot-${device}-${theme}.webp`;

  return (
    <div aria-hidden className="fixed inset-0 -z-10 bg-white dark:bg-black">
      {(["dark", "light"] as const).map((theme) => (
        <picture
          key={theme}
          className={theme === "dark" ? "hidden dark:contents" : "contents dark:hidden"}
        >
          <source media="(orientation: portrait)" srcSet={frame("mobile", theme)} />
          <img
            src={frame("desktop", theme)}
            alt=""
            decoding="async"
            className="size-full object-cover object-top"
          />
        </picture>
      ))}
    </div>
  );
}
