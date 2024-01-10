// ---------- This script is for popup menu ----------- //

const button = document.getElementById("start-ideavive");
button.addEventListener("click", start_ideavive);

const stop_button = document.getElementById("stop-ideavive");
stop_button.addEventListener("click",stop_ideavive);

const i = document.getElementById("PROPOSED_OR_CONTROLLED");

/**
 * Start IdeaVive
 */
async function start_ideavive(){
    await chrome.runtime.sendMessage("",{
        type:"start",
        options:{
            PROPOSED_OR_CONTROLLED : i.value
        }
    });
    chrome.tabs.create({url:"html/index.html"});
}

/**
 * Stop IdeaVive
 */
async function stop_ideavive(){
    await chrome.runtime.sendMessage("",{
        type:"stop"
    });
    chrome.tabs.create({url:"html/thanks.html"});
}