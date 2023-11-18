// ===== This is a script to determine if the user is really concentrating on reading the news =======//

let apiKey = "";

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
// キーワードの抽出方法について
let extractedKeywords = [];

let nowURL = location.href;

async function getKeywordFromNews(url){
    let newsTextContent = document.getElementsByClassName("highLightSearchTarget")[0].innerText;
    console.log(newsTextContent);

    //テキストからキーワードを抽出する
    messages = [
        {role: "system", content:`
        あなたは洞察力に優れており与えられた文章からキーワードを抜き出すことでユーザーを助けます．
        あなたの仕事内容はまず以下でニュース記事のテキスト内容が与えられます．

        #ニュース記事のテキスト内容
        ${newsTextContent}

        そこでこのテキストから重要かつ意味のあるキーワードを3つ抜き出してください．

        #制約条件
        - 必ず3つのキーワードをリスト形式で生成すること
        - 人名や固有名詞などは含めても構いません
        - 助詞や助動詞など意味のないものは含めないでください．

        #出力形式
        ["keyword1", "keyword2", "keyword3"]

        以下に例を示します．参考にしてください．
        #ニュース記事のテキスト内容
        米大リーグ、エンゼルスからフリーエージェント（FA）となった大谷翔平選手（29）が16日（日本時間17日）、今季のアメリカン・リーグの最優秀選手（MVP）に選ばれた。日本選手初の本塁打王となる44本塁打、投手で10勝5敗で史上初の2年連続「2桁本塁打、2桁勝利」を達成し、2年ぶり2度目の満票での受賞となった。\n\n【写真まとめ】MVP大谷翔平、犬の手を握り笑顔;\" data-cl_cl_index=\"31\">【写真まとめ】MVP大谷翔平、犬の手を握り笑顔</a>\n\n　9月に戦列を離れて右肘の手術に踏み切るまで、大谷選手はほぼ休みなく、投げて、打って、走った。いつも明るく、楽しそうに。\n\n　圧倒的なパフォーマンスだった。6月30日の試合で、今季メジャー最長となる150・3メートルの一発でパワーを見せつけると、7月27日のダブルヘッダーでは1試合目で投手としてメジャー初完封を飾り、1時間もたたずに始まった第2試合で2打席連続本塁打を放ってみせる――。「常識」を覆し続けた。\n\n　大リーグ挑戦4年目の2021年、打者としてリーグ3位の46本塁打、投手として9勝（2敗）をマークし、投打二刀流で米球史を塗り替えたと評価されたのが1度目のMVPだった。誰も追随できない活躍は、「大谷だから」という見方や慣れを生み出す恐れもあるが、今季はその完成度をさらに高めて過去の自分を超える結果とインパクトを残した。2度目の満票受賞に、誰も文句のつけようもないだろう。\n\n　「彼の向上心。そして周りがその可能性をつぶさなかったこと」\n\n　プロ野球・日本ハム時代に投手として大谷選手と共に汗を流してきた斎藤佑樹さん（35）は、大谷選手の活躍に感慨深いものがある。\n\n　あの頃、投打二刀流に懐疑的な目を向けられながらも栗山英樹監督（当時）の理解のもとで、自分自身の道を歩もうとする大谷選手の努力を目の当たりにしてきた。そして今、多くの子どもたちから憧れられる存在になった姿を見て思う。\n\n　「今までは『そういうの無理だよ』と言われていたようなことも、大谷選手の存在によって『（無理だと思われることを）もうやった人間がいるんだから』と理解されるようになってきた。子どもたちにとってもすごくいい影響ですよね」\n\n　かつて、大谷選手はこう話していた。\n\n　「投打の二つをやることは誰もやったことがないことを選んだのではなく、やれることをやるうちに結果的にそうなっているのだと思う。やらなければならないことが多くなる分、伸びたり、できるようになることが増えたりするのはすごく楽しい」\n\n　特別なことをしているつもりはない。自らがやりたいことを続けるために、睡眠を長く取り、節制してコンディションを整え、できることの全てをつぎ込んで試合に臨むのは当たり前のこと。それを続けてきた先にあったのがMVPという結果であり、これもまた一つの通過点にすぎない。\n\n　右肘手術の影響で来季は打者に専念する予定の大谷選手は「今までよりも強くなって戻ってこられるように、ベストを尽くしたい」と自身のインスタグラムに投稿している。11月には、野球の楽しさを「おすそ分け」するかのように、全国の小学校にグラブを送る企画も明らかにした。\n\n　大谷選手がさまざまな形でまいてきた「可能性の種」。いつかどこかで色とりどりの花を咲かせる日が、きっと来る。【中村有花】

        #出力
        ["大谷翔平","MVP","二刀流"]
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
      model: "gpt-3.5-turbo-0613",
      messages: messages,
      max_tokens: 256,
      temperature: 0.9,
    }),
  });
  if (!extractKeywordByLLM.ok) {
    const errorData = await extractKeywordByLLM.json();
    console.error(`Error: ${errorData.error.message}`);
    throw new Error(`API request failed: ${extractKeywordByLLM.status}`);
  }

  let ans = await extractKeywordByLLM.json();
  extractedKeywords = ans.choices[0].message.content;
  console.log("================");
  console.log(extractedKeywords);
  return extractedKeywords;

    //textContent = await Ix(url);
}


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

        // backgroundとの通信
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

