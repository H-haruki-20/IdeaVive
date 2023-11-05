// ---------- This script is for popup menu ----------- //

const button = document.getElementById("start-ideavive");
button.addEventListener("click", () => {
    console.log("click");
    chrome.tabs.create({url :"html/index.html"});
})
