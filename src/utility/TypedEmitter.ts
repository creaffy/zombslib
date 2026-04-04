import { EventEmitter } from "ws";

type EventMap = Record<string, (...args: any[]) => void>;

export class TypedEmitter<Events extends EventMap> extends EventEmitter {
    on<K extends keyof Events>(event: K, listener: Events[K]): this;
    on(event: string, listener: (...args: any[]) => void): this;
    on(event: string, listener: (...args: any[]) => void) {
        return super.on(event, listener);
    }

    once<K extends keyof Events>(event: K, listener: Events[K]): this;
    once(event: string, listener: (...args: any[]) => void): this;
    once(event: string, listener: (...args: any[]) => void) {
        return super.once(event, listener);
    }

    off<K extends keyof Events>(event: K, listener: Events[K]): this;
    off(event: string, listener: (...args: any[]) => void): this;
    off(event: string, listener: (...args: any[]) => void) {
        return super.off(event, listener);
    }

    removeListener<K extends keyof Events>(event: K, listener: Events[K]): this;
    removeListener(event: string, listener: (...args: any[]) => void): this;
    removeListener(event: string, listener: (...args: any[]) => void) {
        return super.removeListener(event, listener);
    }

    removeAllListeners<K extends keyof Events>(event?: K): this;
    removeAllListeners(event?: string): this;
    removeAllListeners(event?: string) {
        return super.removeAllListeners(event);
    }
}
