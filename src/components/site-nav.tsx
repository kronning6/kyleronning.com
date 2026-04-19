import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "home" },
  { href: "/about", label: "about" },
  { href: "/devlog", label: "devlog" },
  { href: "/posts", label: "posts" },
];

export function SiteNav() {
  return (
    <nav
      aria-label="Primary navigation"
      className="flex flex-wrap gap-x-4 gap-y-2"
    >
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center gap-1 no-underline"
        >
          <span aria-hidden="true">&bull;</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
