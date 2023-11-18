// --------- IdeaVive本体のjavascript --------------- //
// 目的1 : (仮)notificationを出すボタンの設置
// 目的2 : ユーザーがテーマとアイデアを設定することができる
// 目的3 : 日本語 (yahooニュース)と英語(BCCニュース)の選択ができる

console.log("Start IdeaVive!");

// language & theme
let idea_generation = document.getElementById("idea-generation");
let post_button = document.getElementById("post");
let idea = document.getElementById("idea");
let idea_room = document.getElementById("idea_display");
let theme_room = document.getElementById("theme");
let instruction = document.getElementById("write-idea");
let submit = document.getElementById("submit");

post_button.addEventListener("click",post_clicked);

// テーマの表示と言語情報
const searchParams = new URLSearchParams(window.location.search);
const lang = searchParams.get("lang");
const theme = searchParams.get("theme");
const id = searchParams.get("id");
theme_room.innerText = theme;
if(lang === "en"){
    instruction.innerText = "Write down your idea!";
    submit.innerText = "Submit";
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
  const room = document.createElement("div");
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
      id : id,
      idea : idea.value,
      target_id : llm_info.id
    }
  });

  idea.value = "";
}


let iid;
let array = [];
// get new ideas made by llm from local storage
chrome.storage.onChanged.addListener(function(changes,namespace) {
  console.log("call onchanged");
  if(namespace === "local"){
    if(changes.new_idea){
      array = changes.id.newValue;
      iid = array[array.length - 1];
      console.log("=============");
      console.log(changes.new_idea.newValue);
      console.log(iid);
      console.log(changes.target_id.newValue);
      console.log(iid - id);
      if(iid-id === 0){
        display(changes.target_id.newValue,changes.new_idea.newValue);
      }
    }
  }
})

function display(newId,newIdea){
  target = document.getElementById(newId);
  target.innerText = newIdea;
}

