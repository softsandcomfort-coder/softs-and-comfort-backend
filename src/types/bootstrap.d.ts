declare module "bootstrap/dist/js/bootstrap.esm" {
    const bootstrap: unknown;
    export default bootstrap;
}

declare module "bootstrap" {
    export class Modal {
        static getInstance(element: HTMLElement): { hide: () => void } | null;
    }
    export class Offcanvas {
        static getInstance(element: HTMLElement): { hide: () => void } | null;
    }
}
