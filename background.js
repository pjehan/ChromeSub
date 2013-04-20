
chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.sendMessage(tab.id, {action: 'displaySubtitles'});
    });
});

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.getLocalStorage) {
        sendResponse(localStorage.getItem(request.getLocalStorage));
    } else if (request.setLocalStorage) {
        sendResponse(localStorage.setItem(request.setLocalStorage, request.value));
    }
});
