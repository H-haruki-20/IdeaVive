// ===== This is a script to determine if the user is really concentrating on reading the news =======//

console.log("YahooニュースもしくはBBC NEWSが読まれていることを検知");
const startDate = Date.now();
let scrollCount = 0;
// LLMへの問い合わせを行うかどうか
let isConcentrated = false;
let everCall = false;

// 集中検知 : 10sec以上 and 5スクロール以上
const basicTime = 10000;
const basicScrollCount = 4;

// スクレイピングとかするならここで関数作る



if(!everCall){
    document.addEventListener("scrollend", (event) => {
        let scrolledDate = Date.now();
        let readingTime = scrolledDate - startDate;
        scrollCount += 1;
        console.log(readingTime);

        //集中検知
        if(scrollCount > basicScrollCount){
            if(readingTime > basicTime){
                isConcentrated = true;
            }
        }

        // backgroundとの通信
        if (isConcentrated){
            chrome.runtime.sendMessage("",{
                type: "concentrated",
                options: {
                    isConcentrated : isConcentrated,
                    // 内容とか入れたい
                }
            })
            isConcentrated = false;
            everCall = true;
        }
    });
}