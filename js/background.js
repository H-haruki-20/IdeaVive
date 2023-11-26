// import OPENAI API KEY as apiKey
try{
  importScripts("./env.js")
}catch(error){
  console.log("OPENAI APIKEY is not defined! : " + error);
}

console.log("======= Start IdeaVive ========");
console.log(apiKey);

// local storageをclearにする
chrome.storage.local.clear();

// ***** 実験用 : 順番は変更すること ****** //
const proposed_method = 0;
const controlled_method = 1;
const none_method = 2;

/**
 * 提案手法と制御手法のどちらを動作させるかの閾値 (0~9)
 * 0 ~ proposed_or_controlled => controlled
 * proposed_or_controlled ~ 9 => proposed
 */
const PROPOSED_OR_CONTROLLED = 4;


// ============ ここから本体部分 ============================== //
let theme = "";

//連想配列を要素に持つ配列 (構造 : {original_idea : "..", id : ".."})
let DATA = []; 
let max_id = -1;
let original_idea_pool = [];
let original_idea = "";
let target_id = "";
let isJapanese = true;
let isConcentrated = false;
let tt = [];
let llm_ids = [];
let tab_ids = [];
let p = -1;
chrome.runtime.onMessage.addListener(data => {

  // ===== 言語とテーマ名とタブid(0,1,2)を取得 ========= //
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
      "ideas" : []
    }
    DATA.push(room_init_data);
    console.log(DATA);
    max_id = id;

    // tab-id関連
    let getTabId = data.options.tab_id;
    tab_ids.push(getTabId);

  }

  // ===== テーマごとにアイデアを格納したデータ DATAを作成 =======//
  else if(data.type === "idea-post"){
    let target_id = data.options.id;
    var added_idea = {
      original_idea : data.options.idea,
      id : data.options.target_id,
      proposed_ideas : [],
    };
    try{
      DATA[target_id].ideas.push(added_idea);
    }catch(error){
      console.log("データが作成できてないよエラー : " + error );
      chrome.tabs.update(errorTabId[0],{active:true});
      chrome.scripting.executeScript({

        target: { tabId: errorTabId[0] },
      
        func: () => window.alert("データの生成でエラーが生じました！\n実験をやり直してください")
      
      });
    }
    console.log(DATA);
  }

  // ==== 集中検知! notificationを出す！ =========== //
  else if(data.type === "concentrated"){

    // proposed or controlled
    p = getRandomInt(10);
    if(p >= PROPOSED_OR_CONTROLLED){
      try{
        keywords = JSON.parse(data.options.keywords);
        keyword = keywords[0];
      }catch(error){
        console.log("キーワードがJSON形式じゃないよエラー : " + error);
        keyword = {
          keyword : a,
          info : a
        } 
      }
      console.log("抽出されたキーワード : " + keyword.keyword);
  
      data = {
        options: {
          title: "新しいアイデアが発明されました！",
          message: "",
          iconUrl: "/img/icon.png",
          type: "basic",
          eventTime: 5000
        }
      }
  
      // どのアイデアをターゲットとするか選定
      // id_xは実験では固定する！
      id_x = proposed_method;
      try{
        original_idea_pool = DATA[id_x].ideas;
      }catch(e){
        chrome.scripting.executeScript({

          target: { tabId: errorTabId[0] },
        
          func: () => window.alert("データの生成でエラーが生じました！\n実験をやり直してください")
        
        }); 
      }
      t = original_idea_pool.length;
      x = getRandomInt(t);
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
  
      console.log(theme);
      console.log(target_id);
      console.log(id_x);
  
      // LLMによるアイデアとnotificationの実施
      NewIdeaFromLLM(data,isJapanese,theme,original_idea,target_id,id_x,keyword);
    }else{
      try{
        callControlledMethod();
      }catch(e){
        chrome.scripting.executeScript({

          target: { tabId: errorTabId[0] },
        
          func: () => window.alert("アイデア創出タスクを全て終えていません！")
        
        });
      }
    }
  }
  
  // 実験終了
  else if(data.type === "stop"){
    console.log("実験終了!");
    console.log(DATA);
    console.log(`提案手法の通知のタップ回数は${proposedNotificationTapCount}`);
    console.log(`制御手法の通知のタップ回数は${controlledNotificationTapCount}`);

  }
})

/**
 * プロンプトの作成
 * @param {boolean} isJapanese 
 * @param {string} theme 
 * @param {string[]} keyword 
 * @param {string} original_idea 
 * @returns 
 */
function MakePrompt(isJapanese,theme,keyword,original_idea){
  if(isJapanese){
    // 日本語用のプロンプト
    messages = [
      {role: "system", content: `
      あなたは優秀な発明家でユーザーを助けます．
      ユーザーの興味を引き出すアイデアを提示することが目標です．
      あなたの仕事内容を指示します．まず以下でユーザーが設定したテーマとそれに関するユーザーのアイデア，さらにユーザーが今読んでいるニュースのキーワードとそれに関する情報が与えられます．

      #テーマ
      ${theme}

      #ユーザーのアイデア
      ${original_idea}

      #キーワードとその情報
      ${keyword.keyword}
      ${keyword.info}

      そこでユーザーのアイデアとキーワードを組み合わせた新たなアイデアの案を一つ生成してください．制約条件は以下の通りです．

      #制約条件
      - 必ず一つのアイデアのみを生成すること
      - 生成したアイデアは以下の構成をとること
      - テーマに沿う内容にすること．特に誰がターゲットとなっていてその問題点は何かをできる限り挙げ，それらを解決できるように考えること．
      - キーワードの情報も考慮してください．
      - キーワードはできるだけそのまま含めるようにしてください．
      
      #生成するアイデアの構成
      「アイデアのタイトル名」
      その詳しい内容を説明
      - アイデアのタイトル名は15字以下
      - その説明は全体で60字以下

      以下に例を示します．出力方法の参考にしてください．

      #テーマ
      スポーツ教育の問題

      #ユーザーのアイデア
      VRによってコーチの指導を場所に縛られず受けられるようにする

      #キーワードとその情報
      大谷翔平
      MLBのエンゼルス所属、投打の二刀流選手。異例の才能と成績で注目を浴びる。

      => 生成する内容
      「大谷翔平の野球教室VR」
      VR上で大谷翔平のバッティングおよびピッチングのモーションを再現し，ユーザーがそれを体験できるようにすることで練習できる．

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
  console.log(messages);
  return messages
}

// ============ タブの読み取り ============================== //
let activeTabId, lastUrl, lastTitle;
let a = "";
let errorTabId = [];

function getJapaneseTab(tabId) {
  const yahoo_news_pattern = /^https?:\/\/news\.yahoo\.co\.jp\/[\w/:%#\$&\?\(\)~\.=\+\-]+$/
  chrome.tabs.get(tabId, function(tab) {
    if(lastUrl != tab.url || lastTitle != tab.title)
      if(yahoo_news_pattern.test(tab.url)){
        console.log(tab.title);
        a = tab.title;
      }
  });
}

function getEnglishTab(tabId){
  const bbc_news_pattern = /^https?:\/\/www\.bbc\.com\/news\/[\w/:%#\$&\?\(\)~\.=\+\-]+$/
  chrome.tabs.get(tabId, function(tab) {
    if(lastUrl != tab.url || lastTitle != tab.title)
      if(bbc_news_pattern.test(tab.url)){
        console.log(tab.title);
      }
  }); 
}

chrome.tabs.onActivated.addListener(function(activeInfo) {
  errorTabId.push(activeInfo.tabId);
  
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

/**
 * 0からmax-1までの乱数を生成
 * @param {number} max 
 * @returns 
 */
function getRandomInt(max){
  return Math.floor(Math.random() * max);
}

/**
 * 提案手法 : LLMにより生成されたアイデアを通知する
 * @param {json} data 
 * @param {boolean} isJapanese 
 * @param {string} theme 
 * @param {string} original_idea 
 * @param {number} target_id 
 * @param {number} id_x 
 * @param {string} keyword 
 */
async function NewIdeaFromLLM(data,isJapanese,theme,original_idea,target_id,id_x,keyword){
  messages = await MakePrompt(isJapanese,theme,keyword,original_idea);
  const IdeaCreatedByLLM = await fetch("https://api.openai.com/v1/chat/completions",{
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      // CORSエラーが出ないように
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo-1106", //gpt4
      messages: messages,
      max_tokens: 256,
      temperature: 0.9,
    }),
  });
  if (!IdeaCreatedByLLM.ok) {
    const errorData = await IdeaCreatedByLLM.json();
    console.error(`Error: ${errorData.error.message}`);
    window.alert("アイデア生成フェーズにおいてAPIエラー");
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
  tt.push(id_x);
  llm_ids.push(target_id);
  llm_json = {
    id : tt,
    new_idea : LLM_proposed_idea,
    target_id : llm_ids
  }
  console.log("保存するデータ");
  console.log(llm_json);

  // 生成されたアイデアをDATAに保存
  DATA[id_x].ideas[x].proposed_ideas.push({
    keyword : keyword,
    proposed_idea : LLM_proposed_idea
  })
  
  // 生成されたアイデアをlocal storageに保存
  chrome.storage.local.set(llm_json).then(() => {
    console.log("storageに保存完了");
  });

}

/**
 * 制御用の動作
 */
function callControlledMethod(){
  chrome.notifications.create("",{
    title : "アイデアを考えてみよう！",
    message : `「${DATA[controlled_method].theme}」について考えてみませんか`,
    iconUrl : "/img/icon.png",
    type : "basic",
    eventTime : 3000
  }
  )
}

// =========== notificationを押したときの動作============//

let proposedNotificationTapCount = 0;
let controlledNotificationTapCount = 0;
chrome.notifications.onClicked.addListener(function(notifId){
  if(p>=PROPOSED_OR_CONTROLLED){
    tabId = tab_ids[proposed_method];
    proposedNotificationTapCount += 1;
  }else{
    tabId = tab_ids[controlled_method];
    controlledNotificationTapCount += 1;
  }
  console.log(`tabIdは${tabId}です`);
  chrome.tabs.update(tabId,{active:true});
});