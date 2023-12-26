import { debug, error, info, log, warn } from "./log-utils.js";

chrome.webNavigation.onCreatedNavigationTarget.addListener(onCreatedNavigationTargetHandler);
chrome.tabs.onRemoved.addListener(onTabRemovedHandler);

async function onTabRemovedHandler(tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) {
    let prefix = `onTabRemovedHandler: ${exeSeq++}:`;
    debug(prefix, 'Start');
    debug(prefix, 'Event Data', { tabId, removeInfo });
    await ungroupSingleTabGroups()
    debug(prefix, 'End');
}

var exeSeq = 0;
function onCreatedNavigationTargetHandler(details: chrome.webNavigation.WebNavigationSourceCallbackDetails) {
    let prefix = `onCreatedNavigationTargetHandler: ${exeSeq++}:`;
    debug(prefix, 'Start');
    debug(prefix, 'Event Data', details);
    groupTabs(details.sourceTabId, details.tabId);
    debug(prefix, 'End');
}

/**
 * Query all tabGroups and for each tabGroup, query all tabs in the group.
 * If number of tabs in the group is 1, ungroup the tab.
 */
async function ungroupSingleTabGroups() {
    let tabGroups = await chrome.tabGroups.query({});
    for (let tabGroup of tabGroups) {
        let tabs = await chrome.tabs.query({ groupId: tabGroup.id });
        if (tabs.length == 1 && tabs[0].id != undefined) {
            await chrome.tabs.ungroup(tabs[0].id);
        }
    }
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