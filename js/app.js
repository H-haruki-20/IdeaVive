// --------- IdeaVive本体のjavascript --------------- //
// 目的1 : (仮)notificationを出すボタンの設置
// 目的2 : ユーザーがテーマとアイデアを設定することができる
// 目的3 : 日本語 (yahooニュース)と英語(BCCニュース)の選択ができる

console.log("Start IdeaVive!");

// language & theme
let lang = document.getElementById("lang");
let theme = document.getElementById("theme");
let init = document.getElementById("init");
let start_button = document.getElementById("start");
let idea_generation = document.getElementById("idea-generation");
let post_button = document.getElementById("post");
let idea = document.getElementById("idea");
let idea_room = document.getElementById("idea_display");
let api_key = document.getElementById("api_key");

start_button.addEventListener("click",btn_clicked);

post_button.addEventListener("click",post_clicked);

function btn_clicked(){
  chrome.runtime.sendMessage("",
  {
    type: "init",
    options:{
      language : lang.value,
      theme : theme.value,
      apiKey : api_key.value
    }
  });
  init.style.display = "none";
  idea_generation.style.display = "block";
}

// ランダムなIDの生成用
function getUniqueStr(myStrong){
  var strong = 1000;
  if (myStrong) strong = myStrong;
  return new Date().getTime().toString(16)  + Math.floor(strong*Math.random()).toString(16)
 }
 

// send ideas which user post
function post_clicked(){
  // ideaをリスト形式で表示
  const ideaContent = document.createTextNode(idea.value);
  const room_cover = document.createElement("div");
  room_cover.className = "room_cover";
  const room = document.createElement("a");
  room.href = "idea.html";
  room.className = "room";
  const headline = document.createElement("h3");
  headline.className = "room_title";
  headline.appendChild(ideaContent);
  room.appendChild(headline);
  const llm_info = document.createElement("h3");
  llm_info.id = getUniqueStr();
  room.appendChild(llm_info);
  room_cover.appendChild(room);
  idea_room.appendChild(room_cover);

  // backgroundに送信
  chrome.runtime.sendMessage("",
  {
    type: "idea-post",
    options:{
      idea : idea.value,
      target_id : llm_info.id
    }
  });

  idea.value = "";
}



// get new ideas made by llm from local storage
chrome.storage.onChanged.addListener(function(changes,namespace) {
  console.log("call onchanged");
  if(namespace === "local"){
    if(changes.new_idea){
      console.log("detect change");
      display(changes.target_id.newValue,changes.new_idea.newValue);
    }
  }
})

function display(newId,newIdea){
  target = document.getElementById(newId);
  target.innerText = newIdea;
}

