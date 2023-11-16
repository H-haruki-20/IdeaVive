let apiKey = "";


// ============ index.htmlとのやりとり ============================== //
// 1. Get theme
// 2. Get original idea if exsisted
// 3. Set language : Japanese or English
// 4. Prepare Japanese or English Prompt
let theme = "";

//連想配列を要素に持つ配列 (構造 : {original_idea : "..", id : ".."})
let DATA = []; 
let max_id = -1;
let original_idea_pool = [];
let original_idea = "";
let target_id = "";
let isJapanese = true;
let isConcentrated = false;
chrome.runtime.onMessage.addListener(data => {
  if(data.type === "init"){
    lang = data.options.language;
    if(lang === "jp"){
      isJapanese = true;
    }else{
      isJapanese = false;
    }
    theme = data.options.theme;
    id = data.options.id;
    let room_init_data = {
      "id" : id,
      "lang" : lang,
      "theme" : theme,
      ideas : []
    }
    DATA.push(room_init_data);
    max_id = id;
  }

  //テーマごとにアイデアを格納したデータ DATAを作成し，保存しておく
  else if(data.type === "idea-post"){
    let target_id = data.options.id;
    var added_idea = {original_idea : data.options.idea, id : data.options.target_id};
    DATA[target_id].ideas.push(added_idea);
    console.log(DATA);
  }
  else if(data.type === "concentrated"){
    console.log("User concentrated");
    isConcentrated = data.options.isConcentrated;
    if(isConcentrated){
      console.log("Users concentrated on reading this article.");
      data = {
        options: {
          title: "新しいアイデアが発明されました！",
          message: "",
          iconUrl: "/img/icon.png",
          type: "basic",
          eventTime: 6000
        }
      }

      // どのアイデアをターゲットとするか選定
      // idの決定　→ DATA[id].ideas
      id_x = getRandomInt(max_id + 1);
      original_idea_pool = DATA[id_x].ideas;
      t = original_idea_pool.length;
      x = getRandomInt(t);
      console.log(x);
      original_idea = original_idea_pool[x].original_idea;
      target_id = original_idea_pool[x].id;
      console.log("選ばれたアイデア : " + original_idea);

      theme = DATA[id_x].theme;
      lang = DATA[id_x].lang;
      if(lang === "jp"){
        isJapanese = true;
      }else{
        isJapanese = false;
      }

      // LLMによるアイデアとnotificationの実施
      NewIdeaFromLLM(data,isJapanese,theme,original_idea,target_id,id_x);
    }
  }
})

// 日本語用のプロンプト + English用のプロンプトを用意
function MakePrompt(isJapanese,theme,keyword,original_idea){
  if(isJapanese){
    // 日本語用のプロンプト
    messages = [
      {role: "system", content: `
      あなたは優秀な発明家でユーザーを助けます．
      ユーザーの興味を引き出すアイデアを提示することが目標です．
      あなたの仕事内容を指示します．まず以下でユーザーが設定したテーマとそれに関するユーザーのアイデア，さらにユーザーが今読んでいるニュースのキーワードが与えられます．

      #テーマ
      ${theme}

      #ユーザーのアイデア
      ${original_idea}

      #キーワード
      ${keyword}

      そこでユーザーのアイデアとキーワードを組み合わせた新たなアイデアの案を一つ生成してください．制約条件は以下の通りです．

      #制約条件
      - 必ず一つのアイデアのみを生成すること
      - 生成したアイデアは以下の構成をとること
      - テーマに沿う内容にすること．特に誰がターゲットとなっていてその問題点は何かをできる限り挙げ，どれかを解決できるように考えること．
      
      #生成するアイデアの構成
      「アイデアのタイトル名」
      その詳しい内容，もしくは発想に至った流れを説明
      - アイデアのタイトル名は15字以下
      - その説明は全体で60字以下

      以下に例を示します．出力方法の参考にしてください．

      #テーマ
      「面白い本の内容について」

      #ユーザーのアイデア
      「女子高生が主人公として出てくるストーリー」

      #キーワード
      「ドラッカーの問い「あなたは何者か」にどう答えるか」

      => 生成する内容
      「もしドラ」
      もし高校野球の女子マネージャーがドラッカーの『マネジメント』を読んだらどう活かせるのか

      `
    }
    ];
  }else{
    // English用のプロンプト
    messages = [
      {role:"system", content: `
      You are a brilliant inventor who helps users.
      Your goal is to present ideas that will interest the user.
      Here are the instructions for your job. First, below you will be given a theme that the user has set, the user's idea for that theme, and keywords from the news that the user is reading right now.

      #theme
      ${theme}

      #user_idea
      ${original_idea}

      #Keyword
      ${keyword}

      Now generate one new idea that combines the user's idea and the keyword. The constraints are as follows.

      #Constraints
      - Only one idea must be generated.
      - The generated idea must have the following structure.
      
      #Constraints Only one idea must be generated.
      "Title of the new idea"
      A detailed description of the idea or the process that led to the idea
      - The title of the idea should be no more than 20 words long.
      - The description should be no more than 100 words in total.

      An example is shown below. Please refer to the output method.

      #Theme
      Development of New Electrical Products

      #User's idea
      Headphones Equipped with New Features

      #Keyword
      Beating noise pollution with smart tech

      => Generated content
      "Noise-cancelling Headphones"
      a type of headphones designed to reduce or cancel out external noise.
      `}
    ];

  }
  return messages
}

// ============ タブの読み取りと他作業の検知 (タイミング) ============================== //
let activeTabId, lastUrl, lastTitle;

function getJapaneseTab(tabId) {
  const yahoo_news_pattern = /^https?:\/\/news\.yahoo\.co\.jp\/[\w/:%#\$&\?\(\)~\.=\+\-]+$/
  chrome.tabs.get(tabId, function(tab) {
    if(lastUrl != tab.url || lastTitle != tab.title)
      if(yahoo_news_pattern.test(tab.url)){
        console.log(tab.title);
        // extracting keyword from yahoo news's title
        keyword = tab.title;
      }
  });
}

function getEnglishTab(tabId){
  const bbc_news_pattern = /^https?:\/\/www\.bbc\.com\/news\/[\w/:%#\$&\?\(\)~\.=\+\-]+$/
  chrome.tabs.get(tabId, function(tab) {
    if(lastUrl != tab.url || lastTitle != tab.title)
      if(bbc_news_pattern.test(tab.url)){
        console.log(tab.title);
        // extracting keyword from yahoo news's title
        keyword = tab.title;
      }
  }); 
}

chrome.tabs.onActivated.addListener(function(activeInfo) {
  if(isJapanese){
    getJapaneseTab(activeTabId = activeInfo.tabId);
  }else{
    getEnglishTab(activeTabId = activeInfo.tabId);
  }
});

chrome.tabs.onUpdated.addListener(function(tabId) {
  if(activeTabId == tabId) {
    if(isJapanese){
      getJapaneseTab(tabId);
    }else{
      getEnglishTab(tabId);
    }
  }
});

// 0 ~ MAX-1までの乱数生成
function getRandomInt(max){
  return Math.floor(Math.random() * max);
}




// ========== LLMによってアイデア✖️キーワードで新しいアイデアを生成する ================= //

async function NewIdeaFromLLM(data,isJapanese,theme,original_idea,target_id,id_x){
  messages = await MakePrompt(isJapanese,theme,keyword,original_idea);
  const IdeaCreatedByLLM = await fetch("https://api.openai.com/v1/chat/completions",{
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo-0613",
      messages: messages,
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
  data.options.message = LLM_proposed_idea;
  if(!isJapanese){
    data.options.title = "A new idea was invented!";
  }
  data.options.eventTime += Date.now();
  // make a notification to user
  await chrome.notifications.create("",data.options);

  // proposed idea made by LLM をindex.htmlに表示させる
  llm_json = {
    id : id_x,
    new_idea : LLM_proposed_idea,
    target_id : target_id
  }
  chrome.storage.local.set(llm_json).then(() => {
    console.log("storageに保存完了");
  });

}

// notificationを行う 
chrome.runtime.onMessage.addListener(data => {
  if (data.type === 'notification') {
    console.log("notificationが呼び出されました");
    NewIdeaFromLLM(data);
  }
});

// =========== notificationを押したときの動作============//

chrome.notifications.onClicked.addListener(function(notifId){
  if(notifId === "idea"){
    console.log("元のページに遷移");
  }
});