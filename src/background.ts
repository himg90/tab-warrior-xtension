import {isWithinXSeconds} from "./utils.js";
import { debug, error, info, log, warn } from "./utils.js";

chrome.tabs.onCreated.addListener(onTabCreatedHandler);
chrome.tabs.onUpdated.addListener(onTabUpdatedHandler);
chrome.webNavigation.onCreatedNavigationTarget.addListener(onCreatedNavigationTargetHandler);

function onCreatedNavigationTargetHandler(details: chrome.webNavigation.WebNavigationSourceCallbackDetails) {
    let prefix = `onCreatedNavigationTargetHandler: ${exeSeq++}:`;
    debug(prefix, 'Start');
    debug(prefix, 'Event Data', details);
    groupTabs(details.sourceTabId, details.tabId);
    debug(prefix, 'End');
}

var exeSeq = 0;
function onTabCreatedHandler(tab: chrome.tabs.Tab) {
    let prefix = `onTabCreatedHandler: ${exeSeq++}:`;
    info(prefix, 'Start');
    debug(prefix, 'Event Data', tab);

    if (tab.id == undefined) {
        warn(prefix, 'tab.id is undefined');
        return;
    }
    tabGroupAlgo(tab.id);
    info(prefix, 'End');
}

function onTabUpdatedHandler(tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
    let prefix = `onTabUpdateHandler: ${exeSeq++}:`;
    debug(prefix, 'Start');
    debug(prefix, 'Event Data', { tabId, changeInfo, tab });
    if (changeInfo.url === undefined) {
        return;
    }
    tabGroupAlgo(tabId);
    info(prefix, 'End');
}

async function getReleventVisits(url: string, maxAgeSeconds: number = 5, limit : number = 3) {
    let visits: chrome.history.VisitItem[] = [];
    try {
        visits = await chrome.history.getVisits({ url: url});
    } catch (e) {
        error("", 'Error getting visits', { url, e });
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

async function tabGroupAlgo(tabId: number) {
    return;
    let prefix = `tabGroupAlgo: ${exeSeq++}:`;
    info(prefix, `Start for tabID ${tabId}`);

    let tab;
    try {
        tab = await chrome.tabs.get(tabId)
    } catch (e) {
        error(prefix, 'Error getting tab', { tabId, e });
        return;
    }

    debug(prefix, 'Tab Data', tab);

    let tabUrl = tab.pendingUrl || tab.url;
    if (tabUrl == undefined || tabUrl == "") {
        return;
    }
    
    let visits = await getReleventVisits(tabUrl, 10, 2);
    if (visits.length == 0) {
        info(prefix, 'No visits found');
        return;
    }

    if (tab.groupId > 0) {
        info(prefix, 'Tab already in a group. Checking if it needs to be ungrouped');

        if(visits[0].transition == "typed" || visits[0].transition == "generated") {
            info(prefix, 'Tab is in a group and typed. Ungrouping');
            chrome.tabs.ungroup(tabId)
        } else {
            debug(prefix, 'Tab is in a group and not typed. Ignoring', { tabId, visits });
        }
    } else {
        let v0 = visits[0];
        if((v0.transition == "link" || v0.transition == "form_submitted") && v0.referringVisitId !== '0') {
            if (tab.openerTabId != undefined) {
                groupTabs(tab.openerTabId, tabId)
            }
        } else {
            debug(prefix, 'Transition is not "link" or "form_submitted"');
        }
    }
    debug(prefix, 'End');
}

async function groupTabs(parentTabId: number, childTabId: number) {
    info("", "Grouping tabs", { parentTabId, childTabId })
    try {
        let parentTab = await chrome.tabs.get(parentTabId)

        if (parentTab.groupId > 0) {
            chrome.tabs.group({tabIds: [childTabId], groupId: parentTab.groupId})
        } else {
            chrome.tabs.group({tabIds: [parentTabId, childTabId]}, (groupId) => {
                chrome.tabGroups.update( groupId, {title: parentTab.title})
            })
        }
    } catch (e) {
        error("", 'Error grouping tabs', { parentTabId, childTabId, e });
    }
}