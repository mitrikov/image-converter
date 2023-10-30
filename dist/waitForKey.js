"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function waitForAnyKey(keyCode) {
    return new Promise((resolve) => {
        process.stdin.resume();
        process.stdin.on('data', process.exit.bind(process, 0));
    });
}
exports.default = waitForAnyKey;
//# sourceMappingURL=waitForKey.js.map