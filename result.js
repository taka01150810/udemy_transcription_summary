
console.log('start')

// transcriptsをグローバルに宣言
const transcripts = [];

await clickAllSectionsAndLectures(page);

console.log('transcripts', transcripts);

await summarizeTranscriptsWithChatGPT(page, transcripts);

async function clickAllSectionsAndLectures(page) {
  try {
    console.log('全てのセクションのレクチャーを順番にクリックします');
    
    // コースの内容タブをクリック
    console.log('1. コースの内容タブをクリックします');
    const courseContentTab = await page.waitForSelector('#tabs--7-tab-1', { 
      timeout: 10000 
    });
    
    if (courseContentTab) {
      await courseContentTab.click();
      console.log('✓ コースの内容タブをクリックしました');
      
      // ページの読み込みを待機
      await page.waitForTimeout(5000);
      
      // 全てのセクションを取得
      const allSections = await page.evaluate(() => {
        const sections = document.querySelectorAll('[data-purpose^="section-panel-"]');
        const sectionData = [];
        
        sections.forEach((section, sectionIndex) => {
          const sectionTitleElement = section.querySelector('[data-purpose="section-heading"] .ud-accordion-panel-title');
          const sectionTitle = sectionTitleElement ? sectionTitleElement.textContent.trim() : `セクション${sectionIndex + 1}`;
          
          sectionData.push({
            sectionIndex: sectionIndex,
            title: sectionTitle
          });
        });
        
        return sectionData;
      });
      
      console.log(`✓ ${allSections.length}個のセクションを発見しました`);
      
      // 各セクションのレクチャーを順番にクリック
      for (const section of allSections) {
        console.log(`\n【セクション${section.sectionIndex + 1}】: ${section.title}`);
        
        // セクションが開いているかどうかを確認
        const isSectionOpen = await page.evaluate((sectionIndex) => {
          const section = document.querySelector(`[data-purpose="section-panel-${sectionIndex}"]`);
          if (section) {
            const contentWrapper = section.querySelector('.accordion-panel-module--content-wrapper--TkHqe');
            return contentWrapper && contentWrapper.getAttribute('aria-hidden') === 'false';
          }
          return false;
        }, section.sectionIndex);
        
        if (!isSectionOpen) {
          console.log(`  ${section.title}が閉じているので開きます`);
          const sectionToggle = await page.waitForSelector(`[data-purpose="section-panel-${section.sectionIndex}"] .ud-accordion-panel-toggler`, {
            timeout: 5000
          });
          
          if (sectionToggle) {
            await sectionToggle.click();
            console.log(`  ✓ ${section.title}を開きました`);
            await page.waitForTimeout(5000);
          }
        } else {
          console.log(`  ✓ ${section.title}は既に開いています`);
        }
        
        // セクションを開いた後にレクチャー情報を再取得
        const lectures = await page.evaluate((sectionIndex) => {
          const section = document.querySelector(`[data-purpose="section-panel-${sectionIndex}"]`);
          if (section) {
            const lectureLinks = section.querySelectorAll('[data-purpose^="curriculum-item-"]');
            const lectures = [];
            
            lectureLinks.forEach((link, lectureIndex) => {
              const lectureTitleElement = link.querySelector('[data-purpose="item-title"]');
              const lectureTitle = lectureTitleElement ? lectureTitleElement.textContent.trim() : `レクチャー${lectureIndex + 1}`;
              
              lectures.push({
                index: lectureIndex,
                title: lectureTitle,
                selector: link.getAttribute('data-purpose')
              });
            });
            
            return lectures;
          }
          return [];
        }, section.sectionIndex);
        
        console.log(`レクチャー数: ${lectures.length}`);
        
        // 各レクチャーを順番にクリック
        for (const lecture of lectures) {
          console.log(`  ${lecture.index + 1}. ${lecture.title}をクリックします`);
          
          try {
            // レクチャーをクリック
            const lectureElement = await page.waitForSelector(`[data-purpose="${lecture.selector}"]`, {
              timeout: 5000
            });
            
            if (lectureElement) {
              await lectureElement.click();
              console.log(`    ✓ ${lecture.title}をクリックしました`);
              
              // ページの読み込みを待機
              await page.waitForTimeout(5000);
              
              // レクチャーをクリックした後にトランスクリプトパネルを表示し内容を取得
              console.log(`    ${lecture.title}のトランスクリプトを取得します`);
              const transcriptText = await showTranscriptPanel(page);
              transcripts.push({ title: lecture.title, transcript: transcriptText });
              
              // コースの内容タブに戻る
              const courseContentTabAgain = await page.waitForSelector('#tabs--7-tab-1', { 
                timeout: 5000 
              });
              
              if (courseContentTabAgain) {
                await courseContentTabAgain.click();
                console.log(`    ✓ コースの内容タブに戻りました`);
                await page.waitForTimeout(5000);
                
                // セクションが再度開いているか確認
                const isSectionStillOpen = await page.evaluate((sectionIndex) => {
                  const section = document.querySelector(`[data-purpose="section-panel-${sectionIndex}"]`);
                  if (section) {
                    const contentWrapper = section.querySelector('.accordion-panel-module--content-wrapper--TkHqe');
                    return contentWrapper && contentWrapper.getAttribute('aria-hidden') === 'false';
                  }
                  return false;
                }, section.sectionIndex);
                
                if (!isSectionStillOpen) {
                  console.log(`    ${section.title}を再度開きます`);
                  const sectionToggleAgain = await page.waitForSelector(`[data-purpose="section-panel-${section.sectionIndex}"] .ud-accordion-panel-toggler`, {
                    timeout: 5000
                  });
                  
                  if (sectionToggleAgain) {
                    await sectionToggleAgain.click();
                    console.log(`    ✓ ${section.title}を再度開きました`);
                    await page.waitForTimeout(5000);
                  }
                }
              } else {
                console.log(`    ✗ コースの内容タブに戻れませんでした`);
              }
            } else {
              console.log(`    ✗ ${lecture.title}の要素が見つかりませんでした`);
            }
          } catch (error) {
            console.log(`    ✗ ${lecture.title}のクリックでエラーが発生しました: ${error.message}`);
          }
        }
      }
      
      console.log('\n✓ 全てのセクションのレクチャーのクリックが完了しました');
      
      // すべてのトランスクリプトとレクチャータイトルの配列を出力
      console.log('\n=== 全レクチャーのトランスクリプト配列 ===');
      console.log(JSON.stringify(transcripts, null, 2));
      console.log('=== 配列出力終了 ===');
      
    } else {
      console.log('✗ コースの内容タブの要素が見つかりませんでした');
    }
    
  } catch (error) {
    console.error('エラーが発生しました:', error.message);
  }
}

async function showTranscriptPanel(page) {
  try {
    console.log('トランスクリプトパネルの取得を開始します');
    
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
        return transcriptText;
      } else {
        console.log('トランスクリプトのテキストが見つかりませんでした');
        return '';
      }

    } else {
      console.log('トランスクリプトパネルが見つかりませんでした');
      return '';
    }
  } catch (error) {
    console.error('トランスクリプト取得でエラーが発生しました:', error.message);
    return '';
  }
}

async function summarizeTranscriptsWithChatGPT(page, transcripts) {
  try {
    console.log('\n=== ChatGPTでトランスクリプトを要約開始 ===');
    
    // ChatGPTに遷移
    await page.goto('https://chatgpt.com/');
    console.log("transcripts", transcripts);
    
    // ページの読み込みを待機
    await page.waitForTimeout(3000);
    
    // 各トランスクリプトを順番に要約
    for (let i = 0; i < transcripts.length; i++) {
      const transcript = transcripts[i];
      console.log(`\n【${i + 1}/${transcripts.length}】${transcript.title}を要約中...`);
      
      try {
        // テキストエリアを待機（contenteditableのdiv）
        const textArea = await page.waitForSelector('#prompt-textarea', {
          timeout: 10000
        });
        
        if (textArea) {
          // テキストエリアをクリックしてフォーカス
          await textArea.click();
          
          // 既存のテキストをクリア
          await page.evaluate(() => {
            const textArea = document.querySelector('#prompt-textarea');
            if (textArea) {
              textArea.innerHTML = '';
            }
          });
          
          // トランスクリプトの内容を高速入力
          await page.evaluate((transcriptText) => {
            const textArea = document.querySelector('#prompt-textarea');
            if (textArea) {
              textArea.innerHTML = transcriptText;
              // 入力イベントを発火
              const event = new Event('input', { bubbles: true });
              textArea.dispatchEvent(event);
            }
          }, transcript.transcript);
          console.log(`    ✓ ${transcript.title}のトランスクリプトを高速入力しました`);
          
          // 送信ボタンを待機してクリック
          const sendButton = await page.waitForSelector('[data-testid="send-button"]', {
            timeout: 5000
          });
          
          if (sendButton) {
            await sendButton.click();
            console.log(`    ✓ ${transcript.title}の要約リクエストを送信しました`);
            
            // レスポンスを待機（ChatGPTの応答を待つ）
            await page.waitForTimeout(8000);
            
            // 次の要約のために15秒待機
            await page.waitForTimeout(15000);
            
          } else {
            console.log(`    ✗ 送信ボタンが見つかりませんでした`);
          }
          
        } else {
          console.log(`    ✗ テキストエリアが見つかりませんでした`);
        }
        
      } catch (error) {
        console.log(`    ✗ ${transcript.title}の要約でエラーが発生しました: ${error.message}`);
      }
    }
    
    console.log('\n✓ 全てのトランスクリプトの要約が完了しました');
    
  } catch (error) {
    console.error('ChatGPTでの要約でエラーが発生しました:', error.message);
  }
}


