// contenteditable div用の入力フィールドハンドラ
document.addEventListener('DOMContentLoaded', function() {
  // 必要な要素の参照を取得
  const usernameInput = document.getElementById('username-input');
  const submitBtn = document.getElementById('submit-btn');
  const rankingError = document.getElementById('ranking-error');
  
  if (usernameInput && submitBtn) {
    // プレースホルダー表示処理
    function updatePlaceholder() {
      const content = usernameInput.textContent.trim();
      if (content === '') {
        usernameInput.classList.add('empty');
      } else {
        usernameInput.classList.remove('empty');
      }
    }
    
    // スタイルを追加
    const style = document.createElement('style');
    style.textContent = `
      #username-input.empty:before {
        content: attr(data-placeholder);
        color: rgba(255, 255, 255, 0.5);
        pointer-events: none;
      }
      #username-input:focus {
        border-color: #39f3ff;
        box-shadow: 0 0 12px #39f3ff;
      }
    `;
    document.head.appendChild(style);
    
    // 初期状態でプレースホルダーを表示
    updatePlaceholder();
    
    // 入力制限（最大文字数）
    usernameInput.addEventListener('input', function() {
      const maxLength = parseInt(this.getAttribute('data-maxlength') || '12');
      if (this.textContent.length > maxLength) {
        this.textContent = this.textContent.substring(0, maxLength);
        // カーソル位置を最後に設定
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(this.childNodes[0], maxLength);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      updatePlaceholder();
    });
    
    // フォーカス時の処理
    usernameInput.addEventListener('focus', function() {
      // フォーカス時のスタイル調整
      updatePlaceholder();
    });
    
    // フォーカスを失った時の処理
    usernameInput.addEventListener('blur', function() {
      updatePlaceholder();
    });
    
    // Enterキー処理
    usernameInput.addEventListener('keydown', function(e) {
      // Enterキーで送信
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        submitBtn.click();
        return false;
      }
    });
    
    // 送信ボタンのクリック処理
    submitBtn.addEventListener('click', async function() {
      const username = usernameInput.textContent.trim();
      if (!username) {
        rankingError.textContent = 'ユーザ名を入力してください';
        usernameInput.focus();
        return;
      }
      
      const lastScore = window.lastScore || 0;
      if (lastScore <= 0) {
        rankingError.textContent = 'スコアがありません';
        return;
      }
      
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.6';
      
      try {
        const { error } = await submitScore(username, lastScore);
        if (error) {
          rankingError.textContent = '送信失敗: ' + error.message;
        } else {
          rankingError.textContent = '送信完了！';
          usernameInput.textContent = ''; // 入力欄をクリア
          updatePlaceholder();
          fetchAndShowRanking();
        }
      } catch (err) {
        rankingError.textContent = '送信エラー: ' + err.message;
      } finally {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '';
      }
    });
    
    console.log('Contenteditable input handler initialized');
  } else {
    console.error('Required elements not found');
  }
});
