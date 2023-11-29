// ---------- This script is for popup menu ----------- //

const button = document.getElementById("start-ideavive");
button.addEventListener("click", () => {
    console.log("click");
    chrome.runtime.sendMessage("",
    {
        type : "start"
    });
    chrome.tabs.create({url :"html/index.html"});
})

const stop_button = document.getElementById("stop-ideavive");
stop_button.addEventListener("click",()=>{
    chrome.runtime.sendMessage("",
    {
        type : "stop"
    });
    chrome.tabs.create({url :"html/thanks.html"});
})
