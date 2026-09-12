declare module "drift-zoom" {
    export default class Drift {
        constructor(
            element: Element,
            options?: Record<string, unknown>
        );
        disable(): void;
    }
}
