// ===== This is a script to determine if the user is really concentrating on reading the news =======//
// import OPENAI API KEY as apiKey
// これは無理でした．．
try{
    importScripts("./env.js");
}catch(error){
    console.log("**Get Context and extract keyword!**");
    apiKey = "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";
}

const startDate = Date.now();
let scrollCount = 0;
// LLMへの問い合わせを行うかどうか
let isConcentrated = false;
let everCall = false;

// 集中検知 : 8sec以上 and 3スクロール以上
const basicTime = 8000;
const basicScrollCount = 4;

// ================ extract keyword from yahoo news ================ //
let extractedKeywords = [];

let nowURL = location.href;

/**
 * Yahoo!ニュースの記事からキーワードを3つ取り出す
 * @param {string} url 
 * @returns 
 */
async function getKeywordFromNews(url){
    let mainTextContent = "";
    try{
        // yahooニュースの場合
        mainTextContent = document.getElementsByClassName("highLightSearchTarget")[0].innerText;
        console.log(mainTextContent);
    }catch(e){
        // window.alert("ニュースのテキストを取得出来てません");
        // それ以外の場合
        mainTextContent = document.body.innerText;
        console.log(mainTextContent);
    }

    //テキストからキーワードを抽出するプロンプト
    messages = [
        {role: "system", content:`
        あなたは洞察力に優れており与えられた文章からキーワードを抜き出すことでユーザーを助けます．
        また様々な知識を持ち合わせており有益な情報をユーザーに提示することができます．
        あなたの仕事内容について紹介します．
        まず以下でニュース記事のテキスト内容が与えられます．

        #ニュース記事のテキスト内容
        ${mainTextContent}

        このテキストから重要かつ意味のあるキーワードを3つ抜き出してください
        さらに各キーワードに関する情報もつけてください．

        #制約条件
        - 人名や固有名詞などは含めても構いません
        - 助詞や助動詞など意味のないものは含めないでください．
        - 各キーワードに関する情報は20字以下としてください
        - 必ず以下に示すリスト形式で出力してください
        - リストの各要素はkeywordとinfoをkeyとするJSON形式にしてください

        #出力形式
        [{
            keyword : "keyword1",
            info : "keyword1に関する情報"
        },{
            keyword : "keyword2",
            info : "keyword2に関する情報" 
        },{
            keyword : "keyword3",
            info : "keyword3に関する情報"  
        }]


        以下に例を示します．参考にしてください．
        #ニュース記事のテキスト内容
        米大リーグ、エンゼルスからフリーエージェント（FA）となった大谷翔平選手（29）が16日（日本時間17日）、今季のアメリカン・リーグの最優秀選手（MVP）に選ばれた。日本選手初の本塁打王となる44本塁打、投手で10勝5敗で史上初の2年連続「2桁本塁打、2桁勝利」を達成し、2年ぶり2度目の満票での受賞となった。\n\n【写真まとめ】MVP大谷翔平、犬の手を握り笑顔;\" data-cl_cl_index=\"31\">【写真まとめ】MVP大谷翔平、犬の手を握り笑顔</a>\n\n　9月に戦列を離れて右肘の手術に踏み切るまで、大谷選手はほぼ休みなく、投げて、打って、走った。いつも明るく、楽しそうに。\n\n　圧倒的なパフォーマンスだった。6月30日の試合で、今季メジャー最長となる150・3メートルの一発でパワーを見せつけると、7月27日のダブルヘッダーでは1試合目で投手としてメジャー初完封を飾り、1時間もたたずに始まった第2試合で2打席連続本塁打を放ってみせる――。「常識」を覆し続けた。\n\n　大リーグ挑戦4年目の2021年、打者としてリーグ3位の46本塁打、投手として9勝（2敗）をマークし、投打二刀流で米球史を塗り替えたと評価されたのが1度目のMVPだった。誰も追随できない活躍は、「大谷だから」という見方や慣れを生み出す恐れもあるが、今季はその完成度をさらに高めて過去の自分を超える結果とインパクトを残した。2度目の満票受賞に、誰も文句のつけようもないだろう。\n\n　「彼の向上心。そして周りがその可能性をつぶさなかったこと」\n\n　プロ野球・日本ハム時代に投手として大谷選手と共に汗を流してきた斎藤佑樹さん（35）は、大谷選手の活躍に感慨深いものがある。\n\n　あの頃、投打二刀流に懐疑的な目を向けられながらも栗山英樹監督（当時）の理解のもとで、自分自身の道を歩もうとする大谷選手の努力を目の当たりにしてきた。そして今、多くの子どもたちから憧れられる存在になった姿を見て思う。\n\n　「今までは『そういうの無理だよ』と言われていたようなことも、大谷選手の存在によって『（無理だと思われることを）もうやった人間がいるんだから』と理解されるようになってきた。子どもたちにとってもすごくいい影響ですよね」\n\n　かつて、大谷選手はこう話していた。\n\n　「投打の二つをやることは誰もやったことがないことを選んだのではなく、やれることをやるうちに結果的にそうなっているのだと思う。やらなければならないことが多くなる分、伸びたり、できるようになることが増えたりするのはすごく楽しい」\n\n　特別なことをしているつもりはない。自らがやりたいことを続けるために、睡眠を長く取り、節制してコンディションを整え、できることの全てをつぎ込んで試合に臨むのは当たり前のこと。それを続けてきた先にあったのがMVPという結果であり、これもまた一つの通過点にすぎない。\n\n　右肘手術の影響で来季は打者に専念する予定の大谷選手は「今までよりも強くなって戻ってこられるように、ベストを尽くしたい」と自身のインスタグラムに投稿している。11月には、野球の楽しさを「おすそ分け」するかのように、全国の小学校にグラブを送る企画も明らかにした。\n\n　大谷選手がさまざまな形でまいてきた「可能性の種」。いつかどこかで色とりどりの花を咲かせる日が、きっと来る。【中村有花】

        #出力
        [
            {
                "keyword": "大谷翔平",
                "info": "MLBのエンゼルス所属、投打の二刀流選手。異例の才能と成績で注目を浴びる。"
            },
            {
                "keyword": "MVP",
                "info": "Most Valuable Player。リーグで最も価値のある選手に贈られる栄誉。大谷はアメリカン・リーグMVP受賞。"
            },
            {
                "keyword": "二刀流",
                "info": "投手と打者の両方の役割を果たす選手。大谷は投打両方で圧倒的な実績を築く。"
            }
        ]

        `}
    ];

    let extractKeywordByLLM = await fetch("https://api.openai.com/v1/chat/completions",{
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      // CORSエラーが出ないように
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo-1106",
      messages: messages,
      max_tokens: 256,
      temperature: 0.6,
    }),
  });
  if (!extractKeywordByLLM.ok) {
    const errorData = await extractKeywordByLLM.json();
    console.error(`Error: ${errorData.error.message}`);
    chrome.tabs.create({url:"html/error.html"});
    throw new Error(`API request failed: ${extractKeywordByLLM.status}`);
  }

  let ans = await extractKeywordByLLM.json();
  extractedKeywords = ans.choices[0].message.content;
  console.log("================");
  console.log(extractedKeywords);
  return extractedKeywords;

}

// ============== 集中判定 ================ //




// ============== 集中検知 + backgroundへ送信 =============== //
document.addEventListener("scrollend", (event) => {
    if(!everCall){
        let scrolledDate = Date.now();
        let readingTime = scrolledDate - startDate;
        scrollCount += 1;
        console.log(readingTime);

        //集中検知
        if(scrollCount > basicScrollCount){
            if(readingTime > basicTime){
                isConcentrated = true;
                everCall = true;
            }
        }

        // キーワードを抽出してからbackgroundに通信
        if (isConcentrated){
            console.log("キーワードの抽出");
            getKeywordFromNews(nowURL).then(value => {
                console.log(value);

                chrome.runtime.sendMessage("",{
                    type: "concentrated",
                    options: {
                        isConcentrated : isConcentrated,
                        // 内容とか入れたい
                        keywords : value
                    }
                })
                isConcentrated = false;
            })
        }
    }
});

