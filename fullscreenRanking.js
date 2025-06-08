// 全画面ランキング表示用のハンドラ
document.addEventListener('DOMContentLoaded', function() {
  // 必要な要素の参照を取得
  const usernameInput = document.getElementById('username-input-fullscreen');
  const submitBtn = document.getElementById('submit-btn-fullscreen');
  const rankingError = document.getElementById('ranking-error-fullscreen');
  const restartBtn = document.getElementById('restart-btn');
  
  if (usernameInput && submitBtn) {
    // フォーカス時の処理
    usernameInput.addEventListener('focus', function() {
      setTimeout(() => this.select(), 10);
    });
    
    // Enterキー処理
    usernameInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.isComposing) {
        submitBtn.click();
        e.preventDefault();
        return false;
      }
    });
    
    // 送信ボタンのクリック処理
    submitBtn.addEventListener('click', async function() {
      const username = usernameInput.value.trim();
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
          usernameInput.value = ''; // 入力欄をクリア
          fetchAndShowRankingFullscreen();
        }
      } catch (err) {
        rankingError.textContent = '送信エラー: ' + err.message;
      } finally {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '';
      }
    });
    
    // リスタートボタンのクリック処理
    if (restartBtn) {
      restartBtn.addEventListener('click', function() {
        // ランキング画面を非表示にする
        const rankingFullscreen = document.getElementById('ranking-fullscreen');
        if (rankingFullscreen) {
          rankingFullscreen.style.display = 'none';
        }
        
        // ゲームをリスタート
        if (typeof startGame === 'function') {
          startGame();
        } else {
          // フォールバック: ページをリロード
          window.location.reload();
        }
      });
    }
    
    console.log('Fullscreen ranking handler initialized');
  } else {
    console.error('Required fullscreen ranking elements not found');
  }
});

// 全画面用のランキング取得・表示関数
function fetchAndShowRankingFullscreen() {
  const rankingList = document.getElementById('ranking-list-fullscreen');
  if (!rankingList) return;
  
  rankingList.innerHTML = '<div style="text-align:center;color:#39f3ff;">ランキング取得中...</div>';
  
  fetchRanking()
    .then(data => {
      if (data.error) {
        rankingList.innerHTML = '<div style="text-align:center;color:#e63946;">ランキング取得エラー</div>';
        return;
      }
      
      if (!data.data || data.data.length === 0) {
        rankingList.innerHTML = '<div style="text-align:center;color:#999;">ランキングデータがありません</div>';
        return;
      }
      
      // ランキングデータを表示
      let html = '';
      data.data.forEach((item, index) => {
        const rank = index + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
        
        html += `<div style="display:flex;justify-content:space-between;margin-bottom:6px;${rank <= 3 ? 'font-weight:bold;' : ''}">
          <span style="color: white;">${rankEmoji} ${item.username}</span>
          <span style="color:#39f3ff;">${item.score.toLocaleString()}</span>
        </div>`;
      });
      
      rankingList.innerHTML = html;
    })
    .catch(err => {
      console.error('Ranking fetch error:', err);
      rankingList.innerHTML = '<div style="text-align:center;color:#e63946;">ランキング取得エラー</div>';
    });
}
