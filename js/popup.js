// ---------- This script is for starting IdeaVive ----------- //

const button = document.getElementById("start-ideavive");
button.addEventListener("click", () => {
    console.log("click");
    chrome.tabs.create({url :"html/index.html"});
})
