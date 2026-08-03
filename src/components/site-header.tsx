"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { schedules } from "@/data/schedules";

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.classList.add("menu-open");
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.classList.remove("menu-open");
    };
  }, [isOpen]);

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" href="/" aria-label="Ir al inicio">
            <span className="brand-mark" aria-hidden="true">MH</span>
            <span>Mi horario</span>
          </Link>
          <button
            className="menu-button"
            type="button"
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isOpen}
            aria-controls="main-menu"
            onClick={() => setIsOpen((open) => !open)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
      </header>
      <div className="menu-layer" data-open={isOpen} aria-hidden={!isOpen}>
        <button className="menu-backdrop" type="button" aria-label="Cerrar menú" tabIndex={isOpen ? 0 : -1} onClick={() => setIsOpen(false)} />
        <nav className="menu-drawer" id="main-menu" aria-label="Horarios">
          <div className="menu-heading">
            <div>
              <p className="eyebrow">Navegación</p>
              <h2>Elige un horario</h2>
            </div>
            <button className="menu-close" type="button" aria-label="Cerrar menú" onClick={() => setIsOpen(false)}>×</button>
          </div>
          <Link className="menu-link" data-active={pathname === "/"} href="/" tabIndex={isOpen ? 0 : -1} onClick={() => setIsOpen(false)}>
            <span>Inicio</span><small>Actividad actual</small>
          </Link>
          <Link className="menu-link" data-active={pathname === "/metricas"} href="/metricas" tabIndex={isOpen ? 0 : -1} onClick={() => setIsOpen(false)}>
            <span>Métricas</span><small>Distribución de tu día</small>
          </Link>
          <div className="menu-divider" />
          {schedules.map((schedule) => {
            const href = `/horario/${schedule.id}`;
            return (
              <Link className="menu-link" data-active={pathname === href} href={href} key={schedule.id} tabIndex={isOpen ? 0 : -1} onClick={() => setIsOpen(false)}>
                <span>{schedule.label}</span><small>{schedule.description}</small>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
