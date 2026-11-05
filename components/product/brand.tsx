'use client';
import { Sprout } from 'lucide-react';

function closePublicNav() {
  document.querySelectorAll('.public-nav-mobile[open]').forEach((el) => {
    if (el instanceof HTMLDetailsElement) el.open = false;
  });
}

export function Brand() {
  return (
    <a href="/" className="brand" aria-label="Nesta · 格鲁吉亚代孕协调" onClick={closePublicNav}>
      <span className="brand-icon">
        <Sprout size={24} />
      </span>
      <span>
        <strong>
          奈斯 <span>NESTA</span>
        </strong>
        <small>格鲁吉亚代孕协调</small>
      </span>
    </a>
  );
}
