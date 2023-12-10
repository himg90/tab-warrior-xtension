export type TabData = {
    tabId: number;
    openerTabId: number;
    history: TabHistoryItem[];
}

export type TabHistoryItem = {
    url: string;
    visitId: string;
    visitTime: number;
};