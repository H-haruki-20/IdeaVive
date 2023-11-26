// ========== アイデア創出画面 ==============//

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

/**
 * ランダムなIDを生成します．
 */
function getUniqueStr(myStrong){
  var strong = 1000;
  if (myStrong) strong = myStrong;
  return new Date().getTime().toString(16)  + Math.floor(strong*Math.random()).toString(16)
 }


/**
 * ユーザーがアイデアを送信したときに呼び出される
 */
function post_clicked(){
  displayIdeaInGUI();
  idea.value = "";
}


/**
 * GUI表示
 */
function displayIdeaInGUI(){
  const div = document.createElement("div");
  const ideaContent = document.createTextNode(idea.value);
  const node_cover = document.createElement("div");
  const node_title = document.createElement("h4")
  node_title.className = "room_title";
  node_title.appendChild(ideaContent);
  node_cover.className = "node_cover";
  node_cover.appendChild(node_title);
  div.appendChild(node_cover);

  // LLMで生成されたアイデアを表示するためのエリア
  const create_node_cover = document.createElement("div");
  create_node_cover.className = "llm_node_cover";
  const generatedIdea = document.createElement("h4");
  generatedIdea.id = getUniqueStr();
  generatedIdea.className = "generated_idea";
  create_node_cover.appendChild(generatedIdea);
  const trash = document.createElement("img");
  trash.src = "../img/trash.png";
  trash.className = "tool_box";
  trash.width = "0";
  create_node_cover.appendChild(trash);
  div.appendChild(create_node_cover);

  idea_room.appendChild(div);

  // backgroundに送信
  chrome.runtime.sendMessage("",
  {
    type: "idea-post",
    options:{
      id : id,
      idea : idea.value,
      target_id : generatedIdea.id
    }
  });

}

/**
 * パネル表示
 */
function displayIdeaInPanel(){
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
      if(iid-id === 0){
        try{
          a = changes.target_id.newValue;
          targetNewId = a[a.length - 1];
          displayNewIdeaInPanel(targetNewId,changes.new_idea.newValue);
          addNewIdeaInGUI(targetNewId);
        }catch(error){
          console.log(error);
        }
      }
    }
  }
})

/**
 * LLMによって生成された新たなアイデアをパネルに表示します．
 */
function displayNewIdeaInPanel(newId,newIdea){
  target = document.getElementById(newId);
  target.innerText = newIdea;
  var parentTarget = target.parentElement;
  parentTarget.style.display = "flex";
}

/**
 * LLMによって生成された新たなアイデアをGUIに追加
 */
function addNewIdeaInGUI(newId){
  var target = document.getElementById(newId);
  var parent = target.parentElement.parentElement;
  const create_node_cover = document.createElement("div");
  create_node_cover.className = "llm_node_cover";
  const generatedIdea = document.createElement("h4");
  generatedIdea.id = newId;
  generatedIdea.className = "generated_idea";
  create_node_cover.appendChild(generatedIdea);
  const trash = document.createElement("img");
  trash.src = "../img/trash.png";
  trash.className = "tool_box";
  trash.width = "0";
  create_node_cover.appendChild(trash);
  parent.appendChild(create_node_cover);

  //元のidと新たなidが被らないようにする
  target.id = "hahaha";
}


