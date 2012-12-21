
chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.sendMessage(tab.id, {action: 'displaySubtitles'});
    });
});

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.localStorage) {
        sendResponse(localStorage.getItem(request.localStorage));
    }
});
