// ===== This is a script to determine if the user is really concentrating on reading the news =======//

console.log("YahooニュースもしくはBBC NEWSが読まれていることを検知");
const startDate = Date.now();
let scrollCount = 0;
// LLMへの問い合わせを行うかどうか
let isConcentrated = false;

// スクレイピングとかするならここで関数作る



// 集中検知 + backgroundとの通信
document.addEventListener("scrollend", (event) => {
    let scrolledDate = Date.now();
    let readingTime = scrolledDate - startDate;
    scrollCount += 1;
    console.log(readingTime);
    // ここの判定をもっと考える！
    if(scrollCount == 10){
        isConcentrated = true;
    }

    if (isConcentrated){
        chrome.runtime.sendMessage("",{
            type: "concentrated",
            options: {
                isConcentrated : isConcentrated,
                // 内容とか入れたい
            }
        })
        isConcentrated = false;
    }
});