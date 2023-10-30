export default function waitForAnyKey(keyCode) {
    return new Promise((resolve : Function)  => {
        process.stdin.resume();
        process.stdin.on('data', process.exit.bind(process, 0));
    });
}