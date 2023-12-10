```
tab_id
    - openerTabId
    - tab_history[]
        - url,
        - visitId
        - visitTime


VisitItem
    - visitId
    - referringVisitId
    - visitTime
    - id : historyId
    - transition
        - link

TransitionType
    - link : add to previousTabGroup
    - typed: remove from TabGroup
    - form_submit: add to previousTabGroup
    - reload: ignore
```