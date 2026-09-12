"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ClientBootstrap() {
  const pathname = usePathname();

  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.esm");
  }, []);

  useEffect(() => {
    const closeUI = async () => {
      const bootstrap = await import("bootstrap");

      document.querySelectorAll(".modal.show").forEach((modalEl) => {
        const el = modalEl as HTMLElement;
        const modalInstance = bootstrap.Modal.getInstance(el);
        if (modalInstance) modalInstance.hide();
      });

      document.querySelectorAll(".offcanvas.show").forEach((offcanvasEl) => {
        const el = offcanvasEl as HTMLElement;
        const offcanvasInstance = bootstrap.Offcanvas.getInstance(el);
        if (offcanvasInstance) offcanvasInstance.hide();
      });
    };

    closeUI();
  }, [pathname]);

  return null;
}