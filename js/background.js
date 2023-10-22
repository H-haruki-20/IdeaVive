// この拡張機能がオンになっているときはindex.htmlを表示し，テーマとアイデア出しを行ってもらう


// index.htmlで登録されたアイデアのテーマを取得
const theme = "「高齢者の多くが孤独を感じている」";

// index.htmlで登録されたアイデアを取得
const original_idea = "高齢者にとっても使いやすいSNS";

// 現在開いているタブを取得しそのurlがyahooニュースのときはキーワードを取得する
let activeTabId, lastUrl, lastTitle;

function getTabInfo(tabId) {
  const yahoo_news_pattern = /^https?:\/\/news\.yahoo\.co\.jp\/[\w/:%#\$&\?\(\)~\.=\+\-]+$/
  chrome.tabs.get(tabId, function(tab) {
    if(lastUrl != tab.url || lastTitle != tab.title)
      if(yahoo_news_pattern.test(tab.url)){
        console.log(tab.title);
        // extracting keyword from yahoo news
        keyword = tab.title;
      }
  });
}

chrome.tabs.onActivated.addListener(function(activeInfo) {
  getTabInfo(activeTabId = activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if(activeTabId == tabId) {
    getTabInfo(tabId);
  }
});


// LLMによってアイデア✖️キーワードで新しいアイデアを生成する
async function NewIdeaFromLLM(theme,keyword,original_idea){
  const apiKey = "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"
  const IdeaCreatedByLLM = await fetch("https://api.openai.com/v1/chat/completions",{
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: theme + "というテーマでアイデアを考えています．"},
        { role: "system", content: "「" + keyword + "」と以下のアイデアを組み合わせた新しいアイデアを提案してください．"},
        { role: "user", content: original_idea },
      ],
      max_tokens: 256,
      temperature: 0.9,
    }),
  });
  if (!IdeaCreatedByLLM.ok) {
    const errorData = await IdeaCreatedByLLM.json();
    console.error(`Error: ${errorData.error.message}`);
    throw new Error(`API request failed: ${IdeaCreatedByLLM.status}`);
  }

  const new_idea = await IdeaCreatedByLLM.json();
  LLM_proposed_idea =  new_idea.choices[0].message.content;
  console.log(LLM_proposed_idea);

}

// notificationを行う (とりあえずタイミングはボタンが押されたとき)
chrome.runtime.onMessage.addListener(data => {
  if (data.type === 'notification') {
    console.log("notificationが呼び出されました");
    NewIdeaFromLLM(theme,keyword,original_idea);
    chrome.notifications.create('', data.options);
  }
});
