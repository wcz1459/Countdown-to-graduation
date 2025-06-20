document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM元素获取 ----
    const mainText = document.getElementById('main-text');
    const timerEl = document.getElementById('timer');
    const verificationGate = document.getElementById('verification-gate');
    const unlockedContent = document.getElementById('unlocked-content');
    const verifyBtn = document.getElementById('verify-btn');
    const verificationInput = document.getElementById('verification-input');
    
    // ---- 配置信息填充 ----
    const graduationDate = new Date(siteConfig.graduationDate);
    document.getElementById('info-name').textContent = siteConfig.personalInfo.name;
    document.getElementById('info-motto').textContent = siteConfig.personalInfo.motto;
    document.getElementById('info-contact').textContent = siteConfig.personalInfo.contact;
    document.getElementById('info-avatar').src = siteConfig.personalInfo.avatarUrl;

    // ---- 粒子背景初始化 ----
    particlesJS('particles-js', { particles: { number: { value: 60, density: { enable: true, value_area: 800 } }, color: { value: "#ffffff" }, shape: { type: "circle" }, opacity: { value: 0.5, random: true }, size: { value: 3, random: true }, line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.4, width: 1 }, move: { enable: true, speed: 1, direction: "none", random: true, straight: false, out_mode: "out" } }, interactivity: { detect_on: "canvas", events: { onhover: { enable: true, mode: "repulse" }, onclick: { enable: true, mode: "push" } }, modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 } } }, retina_detect: true });

    // ---- 计时器逻辑 ----
    function updateTimer() {
        const now = new Date();
        const diff = graduationDate - now;

        let html = '';
        if (diff > 0) { // 毕业前倒计时
            mainText.textContent = siteConfig.countdownText;
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            html = `
                <div class="time-block"><span>${d}</span><label>天</label></div>
                <div class="time-block"><span>${String(h).padStart(2,'0')}</span><label>时</label></div>
                <div class="time-block"><span>${String(m).padStart(2,'0')}</span><label>分</label></div>
                <div class="time-block"><span>${String(s).padStart(2,'0')}</span><label>秒</label></div>`;
        } else { // 毕业后正计时
            mainText.textContent = siteConfig.countupText;
            let years = now.getFullYear() - graduationDate.getFullYear();
            let months = now.getMonth() - graduationDate.getMonth();
            let days = now.getDate() - graduationDate.getDate();
            if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
            if (months < 0) { years--; months += 12; }
            
            const timeDiff = now - graduationDate;
            const h = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((timeDiff % (1000 * 60)) / 1000);
            html = `
                <div class="time-block"><span>${years}</span><label>年</label></div>
                <div class="time-block"><span>${months}</span><label>月</label></div>
                <div class="time-block"><span>${days}</span><label>天</label></div>
                <div class="time-block"><span>${String(h).padStart(2,'0')}</span><label>时</label></div>
                <div class="time-block"><span>${String(m).padStart(2,'0')}</span><label>分</label></div>
                <div class="time-block"><span>${String(s).padStart(2,'0')}</span><label>秒</label></div>`;
        }
        timerEl.innerHTML = html;
    }

    // ---- 一言 API ----
    async function fetchHitokoto() {
        try {
            const response = await fetch('https://v1.hitokoto.cn');
            const data = await response.json();
            document.getElementById('hitokoto-text').textContent = `『 ${data.hitokoto} 』`;
            document.getElementById('hitokoto-from').textContent = `-- ${data.from_who || ''} 「${data.from}」`;
        } catch (error) {
            console.error('获取一言失败:', error);
            document.getElementById('hitokoto-text').textContent = '『 生活的理想，就是为了理想的生活。 』';
            document.getElementById('hitokoto-from').textContent = '-- 张闻天';
        }
    }

    // ---- 留言板逻辑 ----
    const messageList = document.getElementById('message-list');
    const messageForm = document.getElementById('message-form');
    const msgUsername = document.getElementById('message-username');
    const msgContent = document.getElementById('message-content');

    async function loadMessages() {
        try {
            const response = await fetch('/api/messages');
            if (!response.ok) throw new Error('网络响应错误');
            const messages = await response.json();
            messageList.innerHTML = '';
            messages.forEach(msg => {
                const item = document.createElement('div');
                item.className = 'message-item';
                const date = new Date(msg.timestamp).toLocaleString();
                item.innerHTML = `
                    <div class="message-header">
                        <span class="message-user">${escapeHTML(msg.username)}</span>
                        <span class="message-time">${date}</span>
                    </div>
                    <p class="message-body">${escapeHTML(msg.content)}</p>
                `;
                messageList.appendChild(item);
            });
        } catch (error) {
            console.error('加载留言失败:', error);
            messageList.innerHTML = '<p>加载留言失败，请刷新页面重试。</p>';
        }
    }

    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = msgUsername.value.trim();
        const content = msgContent.value.trim();
        if (!username || !content) {
            alert('名字和留言内容都不能为空哦！');
            return;
        }

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, content }),
            });
            if (!response.ok) throw new Error('提交失败');
            msgContent.value = '';
            await loadMessages();
        } catch (error) {
            alert('提交留言失败，请稍后重试。');
        }
    });
    
    // 防止XSS攻击的简单函数
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;',
                "'": '&#39;', '"': '&quot;'
            }[tag] || tag)
        );
    }

    // ---- 验证逻辑 ----
    verifyBtn.addEventListener('click', () => {
        const inputCode = verificationInput.value;
        const isValid = siteConfig.verificationCodes.some(code => inputCode.startsWith(code));
        
        if (isValid) {
            verificationGate.classList.add('hidden');
            unlockedContent.classList.remove('hidden');
            loadMessages(); // 验证成功后加载留言
        } else {
            alert('板子编号错误！是不是记错啦？');
            verificationInput.value = '';
        }
    });

    // ---- 初始化执行 ----
    updateTimer();
    fetchHitokoto();
    setInterval(updateTimer, 1000);
    setInterval(fetchHitokoto, 30000); // 每30秒更新一次一言
});