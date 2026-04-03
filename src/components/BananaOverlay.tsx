import { useBananaStore } from "../store/bananaStore";

const BANANA_ASCII = `
    _
   //\\
  // \\\\
 //   \\\\
||     ||
||     ||
||     ||
 \\\\   //
  \\\\ //
   \\\\/
    ||
    ||
   _||_
  /    \\
 |  🍌  |
  \\____/
`;

export function BananaOverlay() {
  const visible = useBananaStore((s) => s.visible);
  const hide = useBananaStore((s) => s.hide);

  if (!visible) return null;

  return (
    <div className="banana-overlay" onClick={hide} role="presentation">
      <div className="banana-content">
        <pre className="banana-ascii">{BANANA_ASCII}</pre>
        <p className="banana-text">B A N A N A</p>
      </div>
    </div>
  );
}
