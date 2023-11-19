// --------- ROOM作成画面 --------------- //
// テーマ / 言語情報 / タブidの管理

console.log("Start IdeaVive!");

// ========= set language & theme ======== //
let lang = document.getElementById("lang");
let theme = document.getElementById("theme");
let init = document.getElementById("init");
let start_button = document.getElementById("start");
let room_display = document.getElementById("list");

start_button.addEventListener("click",btn_clicked);

let id = 0;
async function btn_clicked(){
  url = `../html/idea.html?id=${id}&lang=${lang.value}&theme=${theme.value}`;
  // window.open(url, '_blank');
  let lan = lang.value;
  let th = theme.value;
  let iid = id;
  await chrome.tabs.create({url : url},(tab)=>{
    chrome.runtime.sendMessage("",
    {
      type: "init",
      options:{
        language : lan,
        theme : th,
        id : iid,
        tab_id : tab.id,
      }
    });
  });
  createNewButton(url,theme.value);
  theme.value = "";
  id += 1;
}

function createNewButton(targetURL,title){
  init.style.display = "none";
  background.style.display = "none";
  // テーマ名をタイトルとしたパネルを作成
  const div = document.createElement("div");
  div.className = "room-display";
  const new_box = document.createElement("a");
  new_box.className = "new-box";
  new_box.href = `${targetURL}`
  new_box.innerText = title;
  div.appendChild(new_box); 
  room_display.appendChild(div);
}

// === 暗い部分を押したときにポップアップをキャンセル ===== //
// 11/18 未実装


// ========= create new room ============== //
let setInit = document.getElementById("init");
let create_button = document.getElementById("create");
let home_menu = document.getElementById("home");
let background = document.getElementById("popup-background");

create_button.addEventListener("click",create_new_room);

function create_new_room(){
  background.style.display = "block";
  init.style.display = "inline-block";
}
