// outro.js
//const cards = window.cards;
const rewardExplanationTrial = {
      type: jsPsychHtmlButtonResponse,
      stimulus: function() {
        // survey.jsと同様に、最後に獲得したカードの価値を取得
        const arr = jsPsych.data.get().filter({category: "SurveyData", result: 1}).values();
          console.log("Last card data array:", arr);
      
          // 最後の要素を安全に取り出す
          const last = (arr && arr.length > 0) ? arr[arr.length - 1] : null;
      
          // 値がどこに入るかはデータ構造によるのでいくつかの候補をチェック
          let value = null;
          if (last) {
            // 例: last.value、last.score、last.response.value などを順に確認
            if (last.value !== undefined) value = last.value;
            else if (last.score !== undefined) value = last.score;
            else if (last.response && last.response.value !== undefined) value = last.response.value;
            else if (last.response && typeof last.response === 'object') {
              // response がオブジェクトで、キー名が未知の場合は代表的なキーを探す
              const possibleKeys = ['value','amount','points','score'];
              for (const k of possibleKeys) {
                if (last.response[k] !== undefined) { value = last.response[k]; break; }
              }
            }
          }

        let html = "<h3>報酬のご案内</h3><h5>お疲れさまでした！これで本実験は終了です。<br>以下であなたが受け取る報酬についてご説明しますので、よくお読みください。<br></h5>";
        if (value < 300) {
          html += `
            <p>あなたが実験で最終的に獲得したカードの金額は、<b>${value}円</b>でした。</p>
            <p><b>実験で獲得したカードの金額が<b>300円未満</b>の場合、<br>実験にご参加いただいた時間を考慮して、ゲーム報酬として300円をお支払いします。</b></p>
            <p>したがって、あなたに支払われる報酬は参加報酬(100円)、アンケート報酬(100円)と合わせて、<br><b style="font-size: 24px;">100 + 300 + 100 = 500円</b>になります。</p>
          `;
        } else {
          html += `
            <p>あなたに支払われる報酬は、参加報酬(100円)、アンケート報酬(100円)と合わせて、<br><b style="font-size: 24px;">100 + ${value} + 100 = ${value + 200}円</b> になります。</p>
          `;
        }
        html += `
          <p>報酬は後日、当センターに登録されているメールアドレスへ、Amazonギフトでお送りします。</p>
        `;
        return html;
      },
      choices: ["次へ"],
      button_html: '<button class="jspsych-btn">%choice%</button>'
    };

const saveOutroDataTrial = {
      type: jsPsychHtmlButtonResponse,
      stimulus: "<p>データを保存しています。<br>しばらくお待ちください。</p>",
      choices: [],
      trial_duration: 1000,
      on_load: function() {
        // survey-html-form と survey-likert を対象に抽出（最後の9件を取得）
        const outroData = jsPsych.data.get().filter({trial_type: "survey-html-form"}).last(9).values();

        // 期待するキー（必要に応じて追加・編集）
        const expectedKeys = ["q1","q2","q3","q4","q5","q6","q7","q8"];

        // キー集合を作る（id を先頭に）
        const keySet = new Set(["id", ...expectedKeys]);

        // 実際のデータからのキーも追加
        outroData.forEach(d => {
          if (d.response && typeof d.response === "object") {
            Object.keys(d.response).forEach(k => keySet.add(k));
          }
        });

        const keys = Array.from(keySet);

        // merged を初期化し、回答がないキーは null にする
        const merged = {};
        keys.forEach(k => {
          merged[k] = null;
        });
        merged.id = window.id || "";

        // 実際の回答で上書き（後の回答が優先）
        outroData.forEach(d => {
          if (d.response && typeof d.response === "object") {
            Object.entries(d.response).forEach(([k, v]) => {
              merged[k] = v;
            });
          }
        });

         // q2の複数選択チェックボックスを統合
        const q3Selected = [];
        for (let i = 0; i <= 4; i++) {
          if (merged[`q2_${i}`] === i.toString()) {
            q3Selected.push(i.toString());
          }
        }
        merged.q3 = q3Selected.length > 0 ? q3Selected.join(",") : null;

        // CSV化（値が null の場合は文字列 null を入れる）
        function escapeForCSV(val) {
          if (val === null) return "null";
          const s = String(val);
          if (s.includes('"') || s.includes(',') || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        }

        const header = keys.join(",");
        const row = keys.map(k => escapeForCSV(merged[k])).join(",");
        const raw_outro_csv = header + "\n" + row;

        // BOM付き文字列として送信
        const outro_csv = '\uFEFF' + raw_outro_csv;
        uploadData(`${window.id}_OutroData.csv`, outro_csv);
      }
 };
// ...existing code...
var outro = {
  timeline: [
    {
      type: jsPsychInstructions,
      pages: [
        `<div style="text-align:center; max-width:750px; margin:auto; line-height:1.0;">
          <h1>事後アンケート</h1>
          <p>次のページから始まる質問にお答えください。</p>
          <p>最後までご回答いただくと、<b>アンケート報酬として100円</b>が支払われます。</p>
          <p>回答は約5分程度で終わります。</p>
          <p>質問の回答内容は、実験の報酬には影響しませんので、</p>
          <p>安心して正直な回答をお願いいたします。</p>
        </div>`,
      ],
      show_clickable_nav: true,
      allow_backward: false,
      button_label_previous: '戻る',
      button_label_next: '実験を始める',
    },
　　{
      type: jsPsychSurveyHtmlForm,
      html: `
          <div style="max-width:800px; margin:0 auto; text-align:center;">
            <p style="font-weight:600; margin-bottom:12px;">最終的に獲得したカードの金額にどの程度満足していますか？</p>
            <div style="display:flex; justify-content:space-between; gap:8px; margin:12px 24px;">
              <label style="flex:1; text-align:center;">
                <input type="radio" name="q1" value="1" required>
                <div>1<br><small>非常に不満</small></div>
              </label>
              <label style="flex:1; text-align:center;">
                <input type="radio" name="q1" value="2">
                <div>2</div>
              </label>
              <label style="flex:1; text-align:center;">
                <input type="radio" name="q1" value="3">
                <div>3<br><small>どちらともいえない</small></div>
              </label>
              <label style="flex:1; text-align:center;">
                <input type="radio" name="q1" value="4">
                <div>4</div>
              </label>
              <label style="flex:1; text-align:center;">
                <input type="radio" name="q1" value="5">
                <div>5<br><small>非常に満足</small></div>
              </label>
            </div>
          </div>
        `,
      button_label: "次へ"
    },
    {
      type: jsPsychSurveyHtmlForm,
      html: `
        <div style="margin-bottom: 24px;">
          <p><b>2. あなたは実験開始時に、ゲームで獲得する目標金額をどのくらいに設定しましたか？</b></p>
          <p style= font-size:0.9em;>スライダーのボタンを動かして金額をお答えください。</p>
          <label for="q2">金額 (0～1000円):</label>
          <input type="range" id="q2" name="q2" min="0" max="1000" step="50" value="500"
                 oninput="document.getElementById('q2_value').innerText=this.value">
          <span id="q2_value">500</span> 円
        </div>
      `,
      button_label: "次へ"
    },
    {
      type: jsPsychSurveyHtmlForm,
      html: `
        <div style="margin-bottom: 24px;">
          <p><b>3. あなたがカードを決定する際、どんなことを考慮しましたか？（複数選択可）</b></p>
          <label><input type="checkbox" name="q3_0" value="0"> 目標金額（○○円以上なら決定 など）</label><br>
          <label><input type="checkbox" name="q3_1" value="1"> これまで選択したカードとの比較</label><br>
          <label><input type="checkbox" name="q3_2" value="2"> 残っている選択肢の数</label><br>
          <label><input type="checkbox" name="q3_3" value="3"> 残りのラウンド数</label><br>
          <label><input type="checkbox" name="q3_4" value="4"> その他</label>
        </div>
      `,
      button_label: "次へ"
    },
    {
      type: jsPsychSurveyHtmlForm,
      html: `
        <div style="margin-bottom: 24px;">
          <p><b>4. その他、カードを決定する際に、考えたこと・悩んだことはありましたか？</b></p>
          <textarea name="q4" rows="3" cols="60"></textarea>
        </div>
      `,
      button_label: "次へ"
    },
    {
      type: jsPsychSurveyHtmlForm,
      html: `
        <div style="margin-bottom: 24px;">
          <p><b>5. ラウンドが進むにつれ、意識や判断基準は変化しましたか？</b></p>
          <label><input type="radio" name="q5" value="0"> 変化した</label><br>
          <label><input type="radio" name="q5" value="1"> 変化しなかった</label>
        </div>
      `,
      button_label: "次へ"
    },
    {
      type: jsPsychSurveyHtmlForm,
      html: `
        <div style="margin-bottom: 24px;">
          <p><b>6. 獲得したいと思っていたカードを他の参加者にとられることがありましたか？</b></p>
          <label><input type="radio" name="q6" value="0" > はい</label><br>
          <label><input type="radio" name="q6" value="1"> いいえ</label>
        </div>
      `,
      button_label: "次へ"
    },
    {
      type: jsPsychSurveyHtmlForm,
      html: `
        <div style="margin-bottom: 24px;">
          <p><b>7. 本実験の目的は何だと思いますか？あなたの考えをお聞かせください。</b></p>
          <textarea name="q7" rows="4" cols="60"></textarea>
        </div>
      `,
      button_label: "次へ"
    },
    {
      type: jsPsychSurveyHtmlForm,
      html: `
        <div style="margin-bottom: 24px;">
          <p><b>8. 本実験に関して、その他の感想やコメント等があれば、自由にお書きください。</b></p>
          <textarea name="q8" rows="4" cols="60"></textarea>
        </div>
      `,
      button_label: "次へ"
    },
    { //デブリーフィング
      type: jsPsychSurveyHtmlForm,
      html: `
        <div style="margin-bottom: 24px; max-width:700px; font-size:0.9em; text-align:left;">
          <h3 style="text-align:center;">本実験の目的の解説</h3>
          <p style="color:red;">（<b>※お願い</b>：本研究は今後もしばらく継続される予定です。研究の目的が事前に知られてしまうと、参加者の反応に影響を及ぼす可能性があります。そのため、ここに記載された内容を他の方に伝えたり、SNS等に掲載したりすることのないよう、お願い申し上げます。）</p>
          <p>本研究の目的は、競合的な場面において意思決定をするとき、良い選択肢を求めることはどの程度適応的であるかを検討することでした。</p>
          <p>意思決定をする場面において、より良い選択肢を強く求めるほど、幸福度や人生満足度が下がることが、社会心理学の研究から示されています（Schwartz et al. 2002）。</p>
          <p>しかし、このようにより良い選択肢を求める人が、実際により良い選択肢を獲得しているのか、という点については未だ十分な検討がされていません。本研究ではここに着目し、より良い選択肢を求める人が、同じ選択肢を複数の人が求める場面において、実際に良い選択肢を獲得できるのかを、確率的に行動するエージェントとの競合によるオンライン実験によって検討しました。</p>
          <p>本実験に関してご質問やご意見等がある場合には、以下のメールアドレスまでご連絡ください。</p>
          <p>seplab@let.hokudai.ac.jp（担当：結城雅樹）</p>
          <p><br>読み終わった方は「次へ」ボタンを押して進んでください。</p>
        </div>
      `,
      button_label: "次へ"
    },
    // 報酬説明trialをoutro.jsに追加*/
    rewardExplanationTrial,
    saveOutroDataTrial,
    {
      type: jsPsychHtmlButtonResponse,
      stimulus: `
        <p style="color:red;"><b>この画面下の「終了」ボタンはまだ押さないでください。</b></p>
        <p><b>Escキーを押して全画面表示を解除し、ZoomウェビナーのQ&A機能で<br>実験スタッフに実験が終了したことを連絡してください。</b></p>
        <p>実験データが正常に保存されたことを確認した後、<br>実験者からZoomのチャット機能で連絡があります。</p>
        <p>連絡があるまでは、この画面を閉じたり、更新したりしないでください。</p>
      `,
      return: function() {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
      },
      choices: ['終了'],
      onload: function() {
        pauseGlobalTimeout(); // タイマー再開
      },

    }
  ],
};  // outro.jsのtimelineに追加
















