"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypedEmitter = void 0;
const ws_1 = require("ws");
class TypedEmitter extends ws_1.EventEmitter {
    on(event, listener) {
        return super.on(event, listener);
    }
    once(event, listener) {
        return super.once(event, listener);
    }
    off(event, listener) {
        return super.off(event, listener);
    }
    removeListener(event, listener) {
        return super.removeListener(event, listener);
    }
    removeAllListeners(event) {
        return super.removeAllListeners(event);
    }
}
exports.TypedEmitter = TypedEmitter;
