import { EventEmitter } from "ws";
type EventMap = Record<string, (...args: any[]) => void>;
export declare class TypedEmitter<Events extends EventMap> extends EventEmitter {
    on<K extends keyof Events>(event: K, listener: Events[K]): this;
    on(event: string, listener: (...args: any[]) => void): this;
    once<K extends keyof Events>(event: K, listener: Events[K]): this;
    once(event: string, listener: (...args: any[]) => void): this;
    off<K extends keyof Events>(event: K, listener: Events[K]): this;
    off(event: string, listener: (...args: any[]) => void): this;
    removeListener<K extends keyof Events>(event: K, listener: Events[K]): this;
    removeListener(event: string, listener: (...args: any[]) => void): this;
    removeAllListeners<K extends keyof Events>(event?: K): this;
    removeAllListeners(event?: string): this;
}
export {};
