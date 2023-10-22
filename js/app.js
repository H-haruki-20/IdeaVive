// --------- Yahooニュースにアクセスしたときに実行されるスクリプト --------------- //
// (tab apiは使えないよ)

console.log("Yahooニュースが読まれていることを検知しました!");


const button = document.createElement('button');
button.textContent = 'Greet me!'
document.body.insertAdjacentElement('afterbegin', button);
button.addEventListener('click', () => {
  chrome.runtime.sendMessage('', {
    type: 'notification',
    options: {
      title: '新しいアイデアが発明されました！',
      message: '',
      iconUrl: '/icon.png',
      type: 'basic'
    }
  });
});
