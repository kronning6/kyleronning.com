import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "home" },
  { href: "/about", label: "about" },
  { href: "/devlog", label: "devlog" },
  { href: "/posts", label: "posts" },
];

export function SiteNav() {
  return (
    <nav aria-label="Primary navigation" className="journal-nav">
      {NAV_ITEMS.map((item) => (
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
