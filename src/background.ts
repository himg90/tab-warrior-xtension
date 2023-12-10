import { TabData } from "./definitions.js";
import { isWithinXSeconds, logEvent } from "./utils.js";

chrome.tabs.onCreated.addListener(onTabCreatedHandler);
chrome.tabs.onRemoved.addListener(onTabRemovedHandler);
chrome.tabs.onUpdated.addListener(onTabUpdatedHandler);

var tabs = new Map<number, TabData>();

function onTabRemovedHandler(tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) {
    if (tabs.get(tabId) != undefined) {
        tabs.delete(tabId);
    } else {
        console.log("Tab not found in onTabRemovedHandler");
    }
}

function onTabCreatedHandler(tab: chrome.tabs.Tab) {
    if (tab.id == undefined) {
        logEvent('Tab id is undefined', tab);
        return;
    }
    tabGroupAlgo(tab.id);

    // print id, url, title and openerTabId of tab
    let event_data = { event: 'onTabCreated',
    id : tab.id,
    url : tab.url,
    title : tab.title,
    openerTabId : tab.openerTabId};
    console.log(JSON.stringify(event_data));
}

function onTabUpdatedHandler(tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
    if (changeInfo.url != undefined) {
        return;
    }
    tabGroupAlgo(tabId);

    // print id, url, title and status of tab
    //logEvent('onTabUpdated', {tabId : tabId, changeInfo : changeInfo, tab : tab});
    logEvent('onTabUpdated', {tabId : tabId});
}

async function getReleventVisits(url: string, maxAgeSeconds: number = 5, limit : number = 3) {
    let visits: chrome.history.VisitItem[] = [];
    try {
        visits = await chrome.history.getVisits({ url: url});
    } catch (e) {
        logEvent('Error getting visits', { url, e });
        return [];
    }
    
    visits = visits.filter((visit) => visit.visitTime != undefined);
    visits.sort((a, b) => (b.visitTime||0) - (a.visitTime||0))

    let ret = [];
    for (let visit of visits) {
        if ((visit as any).isLocal && isWithinXSeconds(visit.visitTime || 0, maxAgeSeconds))
            ret.push(visit);
    
        if (ret.length >= limit)
            break;
    }

    return ret;
}

var algoRunCount = 0;
async function tabGroupAlgo(tabId: number) {
    let logTag = `${algoRunCount++}: tabGroupAlgo(${tabId}) :`;
    logEvent(`${logTag} start`);

    let tab;
    try {
        tab = await chrome.tabs.get(tabId)
    } catch (e) {
        logEvent(`${logTag} Error getting tab`, { tabId, e });
        logEvent(`${logTag} : end`);
        return;
    }

    let tabUrl = tab.pendingUrl || tab.url;
    if (tabUrl == undefined || tabUrl == "") {
        return;
    }
    
    let visits = await getReleventVisits(tabUrl, 10, 1);
    if (visits.length == 0) {
        logEvent(`${logTag} No visits found`, { tabId, tabUrl });
        logEvent(`${logTag} : end`);
        return;
    }

    if (tab.groupId > 0) {
        logEvent('Tab is in a group', { tabId, groupId: tab.groupId });
        if(visits[0].transition == "typed") {
            logEvent('ungrouping', { tabId, groupId: tab.groupId });
            chrome.tabs.ungroup(tabId)
        } else {
            logEvent('Tab is in a group and not typed', visits[0]);
        }
    } else {
        if(visits[0].transition == "link" || visits[0].transition == "form_submitted") {
            if (tab.openerTabId != undefined) {
                try {
                    let openerTab = await chrome.tabs.get(tab.openerTabId)
                    if (openerTab.groupId > 0) {
                        chrome.tabs.group({tabIds: [tabId], groupId: openerTab.groupId})
                    } else {
                        chrome.tabs.group({tabIds: [tabId, tab.openerTabId]})
                    }
                } catch (e) {
                    logEvent('Error getting opener tab', { openerTabId: tab.openerTabId, e });
                }
            }
        }
    }
    logEvent(`${logTag} : end`);
}