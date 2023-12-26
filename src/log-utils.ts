export enum LogLevel {
    Error = 1,
    Warn,
    Info,
    Debug,
}

var logLevel = LogLevel.Info;
export function info(prefix: string, msg: string, data?: any) {
    if (logLevel < LogLevel.Info) {
        return;
    }
    log(LogLevel.Info, prefix, msg, data);
}
export function debug(prefix: string, msg: string, data?: any) {
    if (logLevel < LogLevel.Debug) {
        return;
    }
    log(LogLevel.Debug, prefix, msg, data);
}
export function warn(prefix: string, msg: string, data?: any) {
    if (logLevel < LogLevel.Warn) {
        return;
    }
    log(LogLevel.Warn, prefix, msg, data);
}
export function error(prefix: string, msg: string, data?: any) {
    if (logLevel < LogLevel.Error) {
        return;
    }
    log(LogLevel.Error, prefix, msg, data);
}   
export function log(level:LogLevel, prefix: string, msg: string, data?: any) {
    let DEBUG = true;
    if (DEBUG ) {
        if (data == undefined) {
            console.log(prefix, JSON.stringify({ msg }));
        } else {
            console.log(prefix, JSON.stringify({msg, ...data }, null, 2));
        }
    }
}
