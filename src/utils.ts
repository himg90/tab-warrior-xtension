export function isWithinXSeconds(visitTime: number, threshold: number): boolean {
    const currentTime = Date.now();
    const differenceInSeconds = (currentTime - visitTime) / 1000;
    return differenceInSeconds <= threshold;
}
export function logEvent(msg: string, data?: any) {
    let DEBUG = true;
    if (DEBUG ) {
        if (data == undefined) {
            console.log(JSON.stringify({ msg }));
        } else {
            console.log(JSON.stringify({ msg, ...data }, null, 2));
        }
    }
}