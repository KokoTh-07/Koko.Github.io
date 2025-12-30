/* Enhanced frontend chat behavior: math solving (mathjs) + KaTeX rendering + practice mode */
(function () {
  const form = document.getElementById('chatForm');
  const input = document.getElementById('messageInput');
  const messages = document.getElementById('messages');
  const chatWindow = document.getElementById('chatWindow');

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  function appendMessage(content, who='bot', isHtml=false){
    const li = document.createElement('li');
    li.className = `message ${who}`;
    const wrap = document.createElement('div');
    if(isHtml) wrap.innerHTML = content; else wrap.textContent = content;
    li.appendChild(wrap);
    // timestamp
    const ts = document.createElement('span');
    ts.className = 'ts';
    ts.textContent = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    li.appendChild(ts);
    messages.appendChild(li);
    // render math using KaTeX auto-render if available
    if(typeof renderMathInElement === 'function'){
      try{ renderMathInElement(li, {delimiters:[{left:'$$',right:'$$',display:true},{left:'\\(',right:'\\)',display:false}]}); }catch(e){}
    }
    // animate in
    requestAnimationFrame(() => setTimeout(()=> li.classList.add('show'), 8));
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function genArithmetic(level='easy'){
    const a = Math.floor(Math.random()*20)+1;
    const b = Math.floor(Math.random()*20)+1;
    const ops = ['+','-','*','/'];
    const op = ops[Math.floor(Math.random()*ops.length)];
    const expr = op==='/' ? `${a*b}/${b}` : `${a} ${op} ${b}`;
    return expr;
  }

  function checkAnswer(expected, given){
    try{
      if(typeof math !== 'undefined'){
        const e = math.evaluate(expected);
        const g = math.evaluate(given);
        return Math.abs(e - g) < 1e-9;
      }
      return expected.trim() === given.trim();
    }catch(e){ return false; }
  }

  function handleUser(text){
    const lower = text.trim().toLowerCase();

    // If currently a pending problem, attempt answer check first
    if(window.currentProblem && !lower.startsWith('practice')){
      const ok = checkAnswer(window.currentProblem.answerExpr, text);
      if(ok){
        appendMessage('Correct! 🎉', 'bot');
        // update score
        const score = Number(localStorage.getItem('chat_score')||0)+1;
        localStorage.setItem('chat_score', score);
        appendMessage(`Score: ${score}`, 'bot');
        window.currentProblem = null;
        return;
      } else {
        appendMessage('Not quite — try again or type `give up` to see the answer.', 'bot');
        return;
      }
    }

    if(lower.startsWith('practice')){
      // generate simple arithmetic problem
      const expr = genArithmetic();
      window.currentProblem = {expr, answerExpr: expr};
      appendMessage(`Practice problem: $$${escapeHtml(expr)}$$`, 'bot', true);
      appendMessage('Reply with your answer (just the value).', 'bot');
      return;
    }

    if(lower==='give up' && window.currentProblem){
      appendMessage(`Answer: $$${escapeHtml(window.currentProblem.answerExpr)}$$`, 'bot', true);
      window.currentProblem = null;
      return;
    }

    if(lower.startsWith('solve') || /[0-9()\.+\-*/^]/.test(text)){
      // attempt to evaluate as math expression (strip leading 'solve')
      let expr = text.replace(/^solve\s*:?\s*/i, '');
      try{
        if(typeof math !== 'undefined'){
          const result = math.evaluate(expr);
          appendMessage(`$$${escapeHtml(expr)} = ${escapeHtml(String(result))}$$`, 'bot', true);
        }else{
          appendMessage('Math library not loaded.', 'bot');
        }
      }catch(err){
        appendMessage("I couldn't parse that expression. Try a simple arithmetic expression.", 'bot');
      }
      return;
    }

    if(lower.includes('hello')||lower.includes('hi')){ appendMessage('Hello! You can type `solve 2+2` or `practice` to get a math problem.', 'bot'); return; }
    if(lower.includes('help')){ appendMessage('Commands: `solve <expr>`, `practice`, `give up`, or ask normal questions.', 'bot'); return; }
    appendMessage("I can help with simple math. Try `solve 12/3` or `practice`.", 'bot');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if(!text) return;
    appendMessage(text, 'user');
    input.value = '';
    setTimeout(() => handleUser(text), 300);
  });

  // lift form when input is focused/clicked
  try{
    const chatFormEl = document.getElementById('chatForm');
    input.addEventListener('focus', ()=> chatFormEl.classList.add('active'));
    input.addEventListener('blur', ()=> { if(!input.value) chatFormEl.classList.remove('active'); });
    // clicking anywhere on the form focuses the input and activates motion
    chatFormEl.addEventListener('click', (e)=>{ if(e.target !== input) input.focus(); chatFormEl.classList.add('active'); });
  }catch(e){}

  // theme toggle
  const themeToggle = document.getElementById('themeToggle');
  function applyTheme(theme){
    if(theme==='dark'){ document.body.classList.add('dark'); themeToggle.textContent = '☀️'; }
    else { document.body.classList.remove('dark'); themeToggle.textContent = '🌙'; }
    localStorage.setItem('chat_theme', theme);
  }
  if(themeToggle){
    const saved = localStorage.getItem('chat_theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(saved);
    themeToggle.addEventListener('click', ()=> applyTheme(document.body.classList.contains('dark') ? 'light' : 'dark'));
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      const score = localStorage.getItem('chat_score') || 0;
      appendMessage('Hi, I am a math demo chatbot. Type `practice` to begin.', 'bot');
      appendMessage(`Your score: ${score}`, 'bot');
    }, 200);
  });
})();
