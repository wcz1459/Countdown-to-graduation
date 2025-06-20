// public/script.js

import PhotoSwipeLightbox from './vendor/photoswipe/photoswipe-lightbox.esm.js';
import PhotoSwipe from './vendor/photoswipe/photoswipe.esm.js';

document.addEventListener('DOMContentLoaded', () => {
    const app = {
        // DOM 元素
        els: {
            body: document.body,
            loadingOverlay: document.getElementById('loading-overlay'),
            themeToggleBtn: document.getElementById('theme-toggle-btn'),
            musicToggleBtn: document.getElementById('music-toggle-btn'),
            fullscreenBtn: document.getElementById('fullscreen-btn'),
            shareBtn: document.getElementById('share-btn'),
            bgAudio: document.getElementById('background-audio'),
            timer: document.getElementById('timer'),
            mainText: document.getElementById('main-text'),
            hitokotoText: document.getElementById('hitokoto-text'),
            hitokotoFrom: document.getElementById('hitokoto-from'),
            verificationGate: document.getElementById('verification-gate'),
            verifyBtn: document.getElementById('verify-btn'),
            verificationInput: document.getElementById('verification-input'),
            unlockedContent: document.getElementById('unlocked-content'),
            infoCard: document.getElementById('info-card'),
            tabsContainer: document.querySelector('.tabs'),
            tabContentContainer: document.getElementById('tab-content-container'),
            photoGallery: document.getElementById('photo-gallery'),
            messageList: document.getElementById('message-list'),
            messageForm: document.getElementById('message-form'),
            msgUsername: document.getElementById('message-username'),
            msgContent: document.getElementById('message-content'),
        },
        // 状态
        state: {
            isMusicPlaying: false,
            graduationDate: new Date(siteConfig.graduationDate),
            likedMessages: new Set(JSON.parse(localStorage.getItem('likedMessages') || '[]')),
            timerInterval: null,
            hitokotoInterval: null,
        },
        // 初始化
        init() {
            this.initTheme();
            this.initTimer();
            this.initHitokoto();
            this.initEventListeners();
            this.initParticles();
            this.registerServiceWorker();
            window.addEventListener('load', () => this.els.loadingOverlay.style.display = 'none');
        },
        // 事件监听器
        initEventListeners() {
            this.els.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
            this.els.musicToggleBtn.addEventListener('click', () => this.toggleMusic());
            this.els.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
            this.els.shareBtn.addEventListener('click', () => this.handleShare());
            this.els.verifyBtn.addEventListener('click', () => this.handleVerification());
            this.els.messageForm.addEventListener('submit', (e) => this.handleMessageSubmit(e));
        },
        // 主题切换
        initTheme() {
            const savedTheme = localStorage.getItem('theme') || 'dark';
            if (savedTheme === 'light') {
                this.els.body.classList.replace('theme-dark', 'theme-light');
                this.els.themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
            }
        },
        toggleTheme() {
            const isDark = this.els.body.classList.toggle('theme-dark');
            this.els.body.classList.toggle('theme-light', !isDark);
            this.els.themeToggleBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        },
        // 音乐播放
        async toggleMusic() {
            if (!this.els.bgAudio.src) {
                this.els.bgAudio.src = siteConfig.backgroundMusicUrl;
            }

            if (this.state.isMusicPlaying) {
                this.els.bgAudio.pause();
                this.state.isMusicPlaying = false;
                this.els.musicToggleBtn.innerHTML = '<i class="fas fa-music"></i>';
            } else {
                try {
                    await this.els.bgAudio.play();
                    this.state.isMusicPlaying = true;
                    this.els.musicToggleBtn.innerHTML = '<i class="fas fa-pause"></i>';
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        console.error("音乐播放失败:", error);
                    }
                    this.state.isMusicPlaying = false;
                    this.els.musicToggleBtn.innerHTML = '<i class="fas fa-music"></i>';
                }
            }
        },
        // 全屏
        toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => alert(`无法进入全屏模式: ${err.message}`));
            } else if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        },
        // 分享
        handleShare() {
            if (navigator.share) {
                navigator.share({
                    title: '我们的小学毕业纪念册',
                    text: '快来看看我们的数字时光胶囊！',
                    url: window.location.href,
                }).catch(console.error);
            } else {
                navigator.clipboard.writeText(window.location.href)
                    .then(() => alert('链接已复制到剪贴板！'))
                    .catch(() => alert('复制链接失败！'));
            }
        },
        // 验证逻辑
        handleVerification() {
            const inputCode = this.els.verificationInput.value;
            const isValid = siteConfig.verificationCodes.some(code => inputCode.startsWith(code));
            if (isValid) {
                this.els.verificationGate.classList.add('hidden');
                this.els.unlockedContent.classList.remove('hidden');
                this.els.unlockedContent.classList.add('unlocked-content-visible');
                this.initUnlockedContent();
            } else {
                alert('时光之钥不正确，请重试！');
            }
        },
        // 解锁后初始化
        initUnlockedContent() {
            this.renderInfoCard();
            this.renderTabs();
            this.loadTabContent('tab-photos'); // 默认加载照片墙
        },
        // 渲染模块
        renderInfoCard() {
            const { name, motto, contact, avatarUrl } = siteConfig.personalInfo;
            this.els.infoCard.innerHTML = `
                <img src="${avatarUrl}" alt="头像" class="avatar" style="width:80px; height:80px; border-radius:50%; border:2px solid var(--primary-accent); flex-shrink: 0;">
                <div style="text-align:left; margin-left:20px;">
                    <h3 style="margin:0 0 5px; color:var(--primary-accent);">${this.escapeHTML(name)}</h3>
                    <p style="margin:0 0 10px; font-style:italic;">${this.escapeHTML(motto)}</p>
                    <p style="margin:0; font-size:0.9rem;">${this.escapeHTML(contact)}</p>
                </div>
            `;
            this.els.infoCard.style.display = 'flex';
        },
        renderTabs() {
            const tabs = [
                { id: 'tab-photos', name: '照片墙' },
                { id: 'tab-messages', name: '留言板' },
            ];
            let tabsHTML = '';
            tabs.forEach((tab, index) => {
                tabsHTML += `<button class="tab-link ${index === 0 ? 'active' : ''}" data-tab="${tab.id}">${tab.name}</button>`;
            });
            this.els.tabsContainer.innerHTML = tabsHTML;
            this.els.tabsContainer.addEventListener('click', e => {
                if (e.target.matches('.tab-link')) {
                    this.els.tabsContainer.querySelector('.active').classList.remove('active');
                    e.target.classList.add('active');
                    this.loadTabContent(e.target.dataset.tab);
                }
            });
        },
        // 加载Tab内容
        loadTabContent(tabId) {
            Array.from(this.els.tabContentContainer.children).forEach(el => el.style.display = 'none');
            const activeTab = document.getElementById(tabId);
            if (!activeTab) return;
            activeTab.style.display = 'block';
            activeTab.style.animation = 'fadeIn 0.5s';

            if (activeTab.dataset.loaded === 'true') return;

            switch (tabId) {
                case 'tab-photos': this.loadPhotoGallery(); break;
                case 'tab-messages': this.loadMessages(); break;
            }
            activeTab.dataset.loaded = 'true';
        },
        
        // 功能模块
        async loadPhotoGallery() {
            this.els.photoGallery.innerHTML = '<div class="spinner" style="margin: 40px auto;"></div>';
            try {
                const response = await fetch('/api/gallery');
                if (!response.ok) throw new Error('网络响应错误');
                const images = await response.json();
                this.els.photoGallery.innerHTML = '';
                if(images.length === 0) {
                    this.els.photoGallery.innerHTML = '<p>照片墙还是空的，快去上传照片吧！</p>';
                    return;
                }
                
                images.forEach(img => {
                    const item = document.createElement('a');
                    item.href = img.src;
                    item.dataset.pswpWidth = img.width;
                    item.dataset.pswpHeight = img.height;
                    item.target = '_blank';
                    item.className = 'gallery-item';
                    item.innerHTML = `<img src="${img.src}" alt="${this.escapeHTML(img.alt || '')}">`;
                    this.els.photoGallery.appendChild(item);
                });

                const lightbox = new PhotoSwipeLightbox({
                    gallery: '#photo-gallery', children: 'a', pswpModule: PhotoSwipe
                });
                lightbox.init();

            } catch (error) {
                console.error('照片加载失败:', error);
                this.els.photoGallery.innerHTML = '<p>照片加载失败，请稍后重试。</p>';
            }
        },
        async loadMessages() {
            this.els.messageList.innerHTML = '<div class="spinner" style="margin: 40px auto;"></div>';
            try {
                const response = await fetch('/api/messages');
                if (!response.ok) throw new Error(`网络响应错误: ${response.statusText}`);
                const messages = await response.json();
                this.els.messageList.innerHTML = '';
                if(messages.length === 0){
                    this.els.messageList.innerHTML = '<p>还没有人留言，快来抢沙发吧！</p>';
                    return;
                }
                messages.forEach(msg => {
                    const item = document.createElement('div');
                    item.className = 'message-item';
                    
                    // --- 核心修复: 健壮的日期时间格式化 ---
                    const date = msg.timestamp ? new Date(msg.timestamp).toLocaleString('zh-CN', {
                        year: 'numeric', month: 'numeric', day: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                        hour12: false
                    }) : '未知时间';

                    const isLiked = this.state.likedMessages.has(msg.id);
                    item.innerHTML = `
                        <div class="message-header">
                            <span class="message-user">${this.escapeHTML(msg.username)}</span>
                            <span class="message-time">${date}</span>
                        </div>
                        <p class="message-body">${this.escapeHTML(msg.content)}</p>
                        <div class="message-footer">
                            <button class="like-btn ${isLiked ? 'liked' : ''}" data-id="${msg.id}" ${isLiked ? 'disabled' : ''}>
                                <i class="fas fa-heart"></i>
                                <span>${msg.likes || 0}</span>
                            </button>
                        </div>
                    `;
                    this.els.messageList.appendChild(item);
                });
                this.els.messageList.querySelectorAll('.like-btn').forEach(btn => {
                    btn.addEventListener('click', e => this.handleLike(e.currentTarget));
                });
            } catch (error) {
                console.error('加载留言失败:', error);
                this.els.messageList.innerHTML = `<p>加载留言失败: ${error.message}</p>`;
            }
        },
        async handleMessageSubmit(e) {
            e.preventDefault();
            const username = this.els.msgUsername.value.trim();
            const content = this.els.msgContent.value.trim();
            if (!username || !content) return alert('名字和留言内容都不能为空哦！');

            e.target.querySelector('button').disabled = true;
            e.target.querySelector('button').textContent = '提交中...';

            try {
                const response = await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, content }),
                });
                if (!response.ok) throw new Error('提交失败');
                this.els.msgContent.value = '';
                await this.loadMessages();
            } catch (error) {
                alert('提交留言失败，请稍后重试。');
            } finally {
                e.target.querySelector('button').disabled = false;
                e.target.querySelector('button').textContent = '提交留言';
            }
        },
        async handleLike(btn) {
            const id = btn.dataset.id;
            if (this.state.likedMessages.has(Number(id))) return;
            
            btn.disabled = true;
            try {
                const response = await fetch(`/api/messages?like=${id}`, { method: 'PUT' });
                if (!response.ok) throw new Error('点赞失败');

                this.state.likedMessages.add(Number(id));
                localStorage.setItem('likedMessages', JSON.stringify(Array.from(this.state.likedMessages)));
                
                const countSpan = btn.querySelector('span');
                countSpan.textContent = parseInt(countSpan.textContent) + 1;
                btn.classList.add('liked');

            } catch (error) {
                console.error('点赞失败:', error);
                btn.disabled = false;
            }
        },
        
        // 核心计时器
        initTimer() {
            this.updateTimer();
            this.state.timerInterval = setInterval(() => this.updateTimer(), 1000);
        },
        updateTimer() {
            const now = new Date();
            const diff = this.state.graduationDate - now;
            let html = '';
            if (diff > 0) {
                this.els.mainText.textContent = siteConfig.texts.countdown;
                const d = Math.floor(diff / 86400000);
                const h = Math.floor((diff % 86400000) / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                html = `
                    <div class="time-block"><span>${d}</span><label>天</label></div>
                    <div class="time-block"><span>${String(h).padStart(2,'0')}</span><label>时</label></div>
                    <div class="time-block"><span>${String(m).padStart(2,'0')}</span><label>分</label></div>
                    <div class="time-block"><span>${String(s).padStart(2,'0')}</span><label>秒</label></div>`;
            } else {
                this.els.mainText.textContent = siteConfig.texts.countup;
                let years = now.getFullYear() - this.state.graduationDate.getFullYear();
                let months = now.getMonth() - this.state.graduationDate.getMonth();
                let days = now.getDate() - this.state.graduationDate.getDate();
                if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
                if (months < 0) { years--; months += 12; }
                const timeDiff = now - this.state.graduationDate;
                const h = Math.floor((timeDiff % 86400000) / 3600000);
                const m = Math.floor((timeDiff % 3600000) / 60000);
                const s = Math.floor((timeDiff % 60000) / 1000);
                html = `
                    <div class="time-block"><span>${years}</span><label>年</label></div>
                    <div class="time-block"><span>${months}</span><label>月</label></div>
                    <div class="time-block"><span>${days}</span><label>天</label></div>
                    <div class="time-block"><span>${String(h).padStart(2,'0')}</span><label>时</label></div>
                    <div class="time-block"><span>${String(m).padStart(2,'0')}</span><label>分</label></div>
                    <div class="time-block"><span>${String(s).padStart(2,'0')}</span><label>秒</label></div>`;
            }
            this.els.timer.innerHTML = html;
        },
        // 一言
        initHitokoto() {
            this.fetchHitokoto();
            this.state.hitokotoInterval = setInterval(() => this.fetchHitokoto(), 30000);
        },
        async fetchHitokoto() {
            try {
                const response = await fetch('https://international.v1.hitokoto.cn');
                const data = await response.json();
                this.els.hitokotoText.textContent = `『 ${data.hitokoto} 』`;
                this.els.hitokotoFrom.textContent = `-- ${data.from_who || ''} 「${data.from}」`;
            } catch (error) {
                this.els.hitokotoText.textContent = siteConfig.texts.hitokoto_fallback;
                this.els.hitokotoFrom.textContent = '';
            }
        },
        // 其他工具函数
        initParticles() {
            particlesJS('particles-js', { particles: { number: { value: 40, density: { enable: true, value_area: 800 } }, color: { value: "#ffffff" }, shape: { type: "circle" }, opacity: { value: 0.5, random: true }, size: { value: 3, random: true }, line_linked: { enable: false }, move: { enable: true, speed: 1, direction: "none", random: true, straight: false, out_mode: "out" } }, retina_detect: true });
        },
        registerServiceWorker() {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').catch(err => console.error('Service Worker registration failed:', err));
            }
        },
        escapeHTML(str) {
            return str.replace(/[&<>'"]/g, tag => ({'&': '&amp;','<': '&lt;','>': '&gt;',"'": '&#39;','"': '&quot;'}[tag] || tag));
        }
    };

    app.init();
});