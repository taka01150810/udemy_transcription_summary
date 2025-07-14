console.log('start')
// メソッドを呼び出す
await showTranscriptPanel(page);

async function showTranscriptPanel(page) {
  try {
    console.log('start');
    // トランスクリプトパネルを待機
    const transcriptPanel = await page.waitForSelector('.transcript--transcript-panel--JLceZ', {
      timeout: 10000
    });

    if (transcriptPanel) {
      // トランスクリプトパネル内のすべてのテキストを取得
      const transcriptText = await page.evaluate(() => {
        const panel = document.querySelector('.transcript--transcript-panel--JLceZ');
        if (panel) {
          // パネル内のすべてのテキストを取得
          const textContent = panel.textContent || panel.innerText;
          return textContent.trim();
        }
        return null;
      });

      if (transcriptText) {
        console.log('=== トランスクリプトの内容 ===');
        console.log(transcriptText);
        console.log('=== トランスクリプト終了 ===');
      } else {
        console.log('トランスクリプトのテキストが見つかりませんでした');
      }

    } else {
      console.log('トランスクリプトパネルが見つかりませんでした');
    }
  } catch (error) {
    console.error('エラーが発生しました:', error.message);
  } finally {
    // ブラウザを閉じる
    await page.close();
  }
}

