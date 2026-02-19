// 📱 인스타그램 모듈 (Instagram Module)
export class InstagramModule {
    // Constants
    static DAYS_TO_MS = 24 * 60 * 60 * 1000;
    static DM_EXPIRY_DAYS = 7;
    static FOLLOWER_DECAY_THRESHOLD_DAYS = 7;
    
    // DM 템플릿
    static DM_TEMPLATES = [
        { from: "@sweet_lover", message: "마카롱 주문 가능할까요?" },
        { from: "@cake_fan99", message: "생일케이크 커스텀 문의요!" },
        { from: "@dessert_daily", message: "쿠키 선물세트 가능한가요?" },
        { from: "@baking_love", message: "다음주 행사용 디저트 대량 주문 문의드려요" },
        { from: "@sweet_tooth22", message: "인스타에서 보고 연락드려요! 마카롱 10개 주문 가능한가요?" },
        { from: "@party_planner", message: "파티용 디저트 50인분 견적 부탁드립니다" },
        { from: "@cafe_owner", message: "카페에 디저트 납품 가능한지 문의드립니다" },
        { from: "@foodie_gram", message: "디저트 협찬 리뷰 제안드려요!" },
        { from: "@wedding_prep", message: "웨딩 답례품으로 쿠키 200개 가능할까요?" },
        { from: "@mom_baking", message: "아이 생일파티에 쓸 마카롱 20개 주문하고 싶어요" },
        { from: "@office_treat", message: "회사 간식으로 쿠키 30개 주문 문의요!" },
        { from: "@gift_idea", message: "선물용 마카롱 포장 가능한가요?" },
        { from: "@local_market", message: "주말 플리마켓 참여 관심 있으신가요?" },
        { from: "@dessert_review", message: "디저트 리뷰 블로거입니다. 협업 제안드려요!" },
        { from: "@sweet_couple", message: "기념일 케이크 커스텀 가능할까요?" }
    ];
    
    constructor(settings, saveCallback, getGlobalSettings, getRpDate, balanceModule, todoModule) {
        this.settings = settings;
        this.saveCallback = saveCallback;
        this.getGlobalSettings = getGlobalSettings;
        this.getRpDate = getRpDate;
        this.balanceModule = balanceModule;
        this.todoModule = todoModule;
        this.moduleName = 'instagram';
        this.idCounter = Date.now();
        
        // Initialize instagram data structure if not exists
        if (!this.settings.instagram) {
            this.settings.instagram = {
                username: "sia_bakes",
                bio: "디저트 만드는 제과학과생 🧁",
                followers: 12340,
                followerChange: 0,  // This month's change
                lastPostDate: null,
                posts: [],
                dms: [],
                incomeRanges: [
                    { maxFollowers: 5000, min: 1000000, max: 3000000 },
                    { maxFollowers: 15000, min: 3000000, max: 8000000 },
                    { maxFollowers: 30000, min: 6000000, max: 12000000 },
                    { maxFollowers: Infinity, min: 10000000, max: 20000000 }
                ],
                subAccordionState: {
                    accountStats: false,
                    posts: false,
                    dms: false
                }
            };
        }
        
        // Initialize ID counter from existing data
        this.idCounter = this.getMaxId();
        
        // Process expired DMs
        this.processExpiredDMs();
        
        // Process follower decay if no posts for 7+ days
        this.processFollowerDecay();
        
        // Initialize SNS income on first load
        this.updateSNSIncome();
    }
    
    // Get maximum ID from existing data
    getMaxId() {
        let maxId = Date.now();
        
        if (this.settings.instagram) {
            const allIds = [
                ...this.settings.instagram.posts.map(p => p.id || 0),
                ...this.settings.instagram.dms.map(d => d.id || 0)
            ];
            
            if (allIds.length > 0) {
                maxId = Math.max(maxId, ...allIds);
            }
        }
        
        return maxId;
    }
    
    // ===== 게시물 관리 =====
    // 게시물 추가
    addPost(data) {
        const currentDate = this.formatDate(this.getRpDate());
        const followers = this.settings.instagram.followers;
        const reaction = this.generateReaction(followers, data.type);
        
        const newPost = {
            id: ++this.idCounter,
            date: currentDate,
            type: data.type || "photo",  // "photo" | "reel" | "story"
            content: data.content,
            tags: data.tags || [],
            likes: reaction.likes,
            comments: reaction.comments,
            shares: reaction.shares,
            reaction: reaction.reaction,  // "hot2" | "hot" | "normal" | "low"
            linkedBaking: data.linkedBaking || null,
            createdAt: currentDate
        };
        
        this.settings.instagram.posts.unshift(newPost);  // Add to beginning
        this.settings.instagram.lastPostDate = currentDate;
        
        // Update followers based on reaction
        const followerGrowth = this.updateFollowers(reaction.reaction);
        this.settings.instagram.followerChange += followerGrowth;
        
        // Check for random DM generation after post
        this.checkRandomDM(reaction.reaction);
        
        // Update balance module SNS income
        this.updateSNSIncome();
        
        this.saveCallback();
        return { post: newPost, followerGrowth };
    }
    
    // 랜덤 DM 생성 체크
    checkRandomDM(postReaction) {
        const followers = this.settings.instagram.followers;
        
        // 기본 확률: 10% (게시물 반응에 따라 DM 발생)
        const baseChance = 0.10;
        
        // 팔로워 보너스: 10만 팔로워당 +1%, 최대 +15%
        // 팔로워가 많을수록 주문 문의 확률 증가
        const followerBonus = Math.min(followers / 100000, 0.15);
        
        // 게시물 반응별 보너스:
        // 🔥🔥 대박 반응: +15% (매우 높은 관심도)
        // 🔥 좋은 반응: +10% (평균 이상 관심)
        // 보통: +5% (일반 반응)
        // 저조: +0% (관심 부족)
        const reactionBonus = {
            'hot2': 0.15,
            'hot': 0.10,
            'normal': 0.05,
            'low': 0
        };
        const hotPostBonus = reactionBonus[postReaction] || 0;
        
        const totalChance = baseChance + followerBonus + hotPostBonus;
        
        // 랜덤 확률 체크
        if (Math.random() < totalChance) {
            this.generateRandomDM();
        }
    }
    
    // 랜덤 DM 생성
    generateRandomDM() {
        const templates = InstagramModule.DM_TEMPLATES;
        // 이미 존재하는 from은 제외
        const existingFroms = this.settings.instagram.dms
            .filter(d => d.status === 'pending')
            .map(d => d.from);
        const available = templates.filter(t => !existingFroms.includes(t.from));
        
        if (available.length === 0) return;
        
        const template = available[Math.floor(Math.random() * available.length)];
        
        // DM 추가
        this.addDM({
            from: template.from,
            message: template.message
        });
    }
    
    // 반응 생성 (좋아요, 댓글, 공유)
    generateReaction(followers, postType) {
        const baseRate = 0.10;  // 10% base engagement
        const minRate = 0.08;
        const maxRate = 0.12;
        
        // Type multipliers
        const typeMultiplier = {
            photo: 1.0,
            reel: 1.5,
            story: 0  // Stories don't have likes
        };
        
        const rate = minRate + Math.random() * (maxRate - minRate);
        const multiplier = typeMultiplier[postType] || 1.0;
        const likes = postType === 'story' ? 0 : Math.round(followers * rate * multiplier);
        const comments = Math.round(likes * (0.01 + Math.random() * 0.02));
        const shares = Math.round(likes * (0.01 + Math.random() * 0.04));
        
        // Determine reaction level
        const avgLikes = followers * baseRate;
        let reaction;
        if (likes > avgLikes * 1.5) reaction = "hot2";      // 🔥🔥 Amazing
        else if (likes > avgLikes * 1.1) reaction = "hot";   // 🔥 Good
        else if (likes > avgLikes * 0.7) reaction = "normal"; // Normal
        else reaction = "low";                                // 📉 Low
        
        return { likes, comments, shares, reaction };
    }
    
    // 팔로워 업데이트
    updateFollowers(postReaction) {
        const growthRanges = {
            hot2: { min: 300, max: 800 },
            hot: { min: 100, max: 300 },
            normal: { min: 30, max: 100 },
            low: { min: 0, max: 30 }
        };
        
        const range = growthRanges[postReaction] || growthRanges.normal;
        const growth = range.min + Math.floor(Math.random() * (range.max - range.min + 1));
        
        this.settings.instagram.followers += growth;
        return growth;
    }
    
    // 팔로워 자연 감소 (7일 이상 게시물 없음)
    processFollowerDecay() {
        if (!this.settings.instagram.lastPostDate) return;
        
        const today = this.getRpDate();
        const lastPost = new Date(this.settings.instagram.lastPostDate);
        const daysSincePost = Math.floor((today - lastPost) / InstagramModule.DAYS_TO_MS);
        
        if (daysSincePost >= InstagramModule.FOLLOWER_DECAY_THRESHOLD_DAYS) {
            const decay = Math.floor(10 + Math.random() * 41);  // 10 to 50
            this.settings.instagram.followers = Math.max(0, this.settings.instagram.followers - decay);
            this.settings.instagram.followerChange -= decay;
            this.saveCallback();
            
            // Update SNS income after follower decay
            this.updateSNSIncome();
        }
    }
    
    // SNS 수입 범위 업데이트 (balance 모듈 연동)
    updateSNSIncome() {
        if (!this.balanceModule) return;
        
        const followers = this.settings.instagram.followers;
        const ranges = this.settings.instagram.incomeRanges;
        
        // Find applicable range
        let incomeRange = ranges[ranges.length - 1];  // Default to highest
        for (const range of ranges) {
            if (followers <= range.maxFollowers) {
                incomeRange = range;
                break;
            }
        }
        
        // Update balance module's SNS recurring income
        const balanceData = this.balanceModule.settings.balance;
        if (balanceData) {
            let snsIncome = balanceData.recurringIncome.find(i => i.source === 'SNS');
            let previousRange = null;
            
            if (snsIncome) {
                // Check if tier changed
                previousRange = ranges.find(r => 
                    r.min === snsIncome.minAmount && r.max === snsIncome.maxAmount
                );
                
                // Update amounts
                snsIncome.minAmount = incomeRange.min;
                snsIncome.maxAmount = incomeRange.max;
                
                // Ensure required fields exist (migration for old data)
                if (!snsIncome.name) snsIncome.name = '📱 인스타 수익';
                if (!snsIncome.type) snsIncome.type = 'range';
                if (!snsIncome.dayOfMonth && snsIncome.day) snsIncome.dayOfMonth = snsIncome.day;
                if (!snsIncome.dayOfMonth) snsIncome.dayOfMonth = 25;
                if (snsIncome.enabled === undefined) snsIncome.enabled = true;
            } else {
                // Create SNS income if doesn't exist
                balanceData.recurringIncome.push({
                    id: ++this.balanceModule.idCounter,
                    name: '📱 인스타 수익',
                    type: 'range',
                    source: 'SNS',
                    minAmount: incomeRange.min,
                    maxAmount: incomeRange.max,
                    dayOfMonth: 25,  // Monthly on 25th
                    enabled: true,
                    createdAt: this.formatDate(this.getRpDate())
                });
            }
            
            // Notify if tier changed
            if (previousRange && (previousRange.min !== incomeRange.min || previousRange.max !== incomeRange.max)) {
                this.showTierChangeNotification(previousRange, incomeRange, followers);
            }
            
            this.saveCallback();
        }
    }
    
    // Show tier change notification
    showTierChangeNotification(previousRange, newRange, currentFollowers) {
        const formatCurrency = (amount) => {
            return `${(amount / 10000).toFixed(0)}만원`;
        };
        
        const message = `📊 팔로워 구간 변경!\n` +
            `현재 팔로워: ${currentFollowers.toLocaleString()}명\n` +
            `이전 수익: ${formatCurrency(previousRange.min)}~${formatCurrency(previousRange.max)}/월\n` +
            `새로운 수익: ${formatCurrency(newRange.min)}~${formatCurrency(newRange.max)}/월`;
        
        // Use toastr if available, otherwise console
        if (typeof toastr !== 'undefined') {
            toastr.success(message, '인스타그램 수익 변경', { timeOut: 5000 });
        } else {
            console.log(message);
        }
    }
    
    // Get current income range
    getCurrentIncomeRange() {
        const followers = this.settings.instagram.followers;
        const ranges = this.settings.instagram.incomeRanges;
        
        for (const range of ranges) {
            if (followers <= range.maxFollowers) {
                return range;
            }
        }
        return ranges[ranges.length - 1];
    }
    
    // ===== DM 관리 =====
    // DM 추가
    addDM(data) {
        const newDM = {
            id: ++this.idCounter,
            from: data.from,
            message: data.message,
            date: this.formatDate(this.getRpDate()),
            status: "pending",  // "pending" | "accepted" | "declined" | "expired"
            memo: "",
            createdAt: this.formatDate(this.getRpDate())
        };
        
        this.settings.instagram.dms.unshift(newDM);
        this.saveCallback();
        return newDM;
    }
    
    // DM 상태 업데이트
    updateDMStatus(id, status, memo = "") {
        const dm = this.settings.instagram.dms.find(d => d.id === id);
        if (!dm) return null;
        
        dm.status = status;
        if (memo) dm.memo = memo;
        
        // If accepted, add to todo module
        if (status === "accepted" && this.todoModule) {
            const todoTitle = `${dm.message.substring(0, 30)}${dm.message.length > 30 ? '...' : ''} (${dm.from})`;
            this.todoModule.addItem({
                title: todoTitle,
                deadline: this.formatDate(new Date(this.getRpDate().getTime() + 7 * InstagramModule.DAYS_TO_MS)), // +7 days
                estimatedTime: "",
                memo: `Instagram DM 주문: ${dm.message}`
            });
        }
        
        this.saveCallback();
        return dm;
    }
    
    // DM 삭제
    deleteDM(id) {
        const index = this.settings.instagram.dms.findIndex(d => d.id === id);
        if (index !== -1) {
            this.settings.instagram.dms.splice(index, 1);
            this.saveCallback();
            return true;
        }
        return false;
    }
    
    // 만료된 DM 처리 (7일 이상 미응답)
    processExpiredDMs() {
        const today = this.getRpDate();
        let updated = false;
        
        this.settings.instagram.dms.forEach(dm => {
            if (dm.status === "pending") {
                const dmDate = new Date(dm.date);
                const daysSince = Math.floor((today - dmDate) / InstagramModule.DAYS_TO_MS);
                
                if (daysSince >= InstagramModule.DM_EXPIRY_DAYS) {
                    dm.status = "expired";
                    updated = true;
                }
            }
        });
        
        if (updated) {
            this.saveCallback();
        }
    }
    
    // ===== 통계 =====
    // 평균 좋아요 수
    getAverageLikes() {
        const posts = this.settings.instagram.posts.filter(p => p.type !== 'story');
        if (posts.length === 0) return 0;
        
        const total = posts.reduce((sum, p) => sum + p.likes, 0);
        return Math.round(total / posts.length);
    }
    
    // Pending DM 수
    getPendingDMCount() {
        return this.settings.instagram.dms.filter(d => d.status === 'pending').length;
    }
    
    // ===== UI 렌더링 =====
    render(container) {
        const instaData = this.settings.instagram;
        const contentEl = container.querySelector('.sstssd-module-content');
        let isOpen = contentEl ? contentEl.classList.contains('sstssd-module-open') : false;
        
        if (!contentEl && this.getGlobalSettings) {
            const globalSettings = this.getGlobalSettings();
            isOpen = globalSettings.openModules.includes(this.moduleName);
        }
        
        const pendingDMCount = this.getPendingDMCount();
        
        container.innerHTML = `
            <div class="sstssd-module-header" data-module="${this.moduleName}">
                <div class="sstssd-module-title">
                    <span class="sstssd-module-icon">📱</span>
                    <span class="sstssd-insta-header">Instagram</span>
                    ${pendingDMCount > 0 ? `<span class="sstssd-badge sstssd-badge-warning">${pendingDMCount}📬</span>` : ''}
                </div>
                <button class="sstssd-module-toggle">${isOpen ? '▲' : '▼'}</button>
            </div>
            <div class="sstssd-module-content ${isOpen ? 'sstssd-module-open' : ''}" data-module="${this.moduleName}">
                <div class="sstssd-insta-profile">
                    <div class="sstssd-insta-username">👤 @${this.escapeHtml(instaData.username)}</div>
                    <div class="sstssd-insta-followers">팔로워 ${instaData.followers.toLocaleString('ko-KR')}</div>
                    <div class="sstssd-insta-bio">📝 ${this.escapeHtml(instaData.bio)}</div>
                </div>
                
                ${this.renderAccountStats()}
                ${this.renderPosts()}
                ${this.renderDMs()}
            </div>
        `;
        
        this.attachEventListeners(container);
        
        if (typeof window.sstsdUpdateSummary === 'function') {
            window.sstsdUpdateSummary();
        }
    }
    
    // 계정 현황 섹션
    renderAccountStats() {
        const instaData = this.settings.instagram;
        const isOpen = instaData.subAccordionState?.accountStats || false;
        const avgLikes = this.getAverageLikes();
        const incomeRange = this.getCurrentIncomeRange();
        
        return `
            <div class="sstssd-sub-section">
                <div class="sstssd-sub-header" data-sub="accountStats">
                    <span>📊 계정 현황</span>
                    <button class="sstssd-sub-toggle">${isOpen ? '▲' : '▼'}</button>
                </div>
                <div class="sstssd-sub-content ${isOpen ? 'sstssd-sub-open' : ''}">
                    <div class="sstssd-insta-stats">
                        <div class="sstssd-stat-item">
                            <span class="sstssd-stat-label">팔로워</span>
                            <span class="sstssd-stat-value">${instaData.followers.toLocaleString('ko-KR')} ${instaData.followerChange > 0 ? `(+${instaData.followerChange} 이번달)` : instaData.followerChange < 0 ? `(${instaData.followerChange} 이번달)` : ''}</span>
                        </div>
                        <div class="sstssd-stat-item">
                            <span class="sstssd-stat-label">게시물</span>
                            <span class="sstssd-stat-value">${instaData.posts.length}개</span>
                        </div>
                        <div class="sstssd-stat-item">
                            <span class="sstssd-stat-label">평균 좋아요</span>
                            <span class="sstssd-stat-value">${avgLikes.toLocaleString('ko-KR')}</span>
                        </div>
                        <div class="sstssd-stat-item">
                            <span class="sstssd-stat-label">SNS 수입 범위</span>
                            <span class="sstssd-stat-value">${incomeRange.min.toLocaleString('ko-KR')}~${incomeRange.max.toLocaleString('ko-KR')}원</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // 게시물 섹션
    renderPosts() {
        const instaData = this.settings.instagram;
        const isOpen = instaData.subAccordionState?.posts || false;
        const recentPosts = instaData.posts.slice(0, 10);  // Show 10 most recent
        
        return `
            <div class="sstssd-sub-section">
                <div class="sstssd-sub-header" data-sub="posts">
                    <span>📸 최근 게시물</span>
                    <button class="sstssd-sub-toggle">${isOpen ? '▲' : '▼'}</button>
                </div>
                <div class="sstssd-sub-content ${isOpen ? 'sstssd-sub-open' : ''}">
                    ${recentPosts.length > 0 ? recentPosts.map(post => this.renderPostItem(post)).join('') : '<div class="sstssd-empty">게시물이 없습니다</div>'}
                </div>
            </div>
        `;
    }
    
    // 게시물 항목
    renderPostItem(post) {
        const reactionIcon = {
            hot2: '🔥🔥',
            hot: '🔥',
            normal: '😐',
            low: '📉'
        };
        
        const reactionText = {
            hot2: '대박',
            hot: '평균 이상',
            normal: '보통',
            low: '저조'
        };
        
        const typeIcon = {
            photo: '📷',
            reel: '🎬',
            story: '📖'
        };
        
        return `
            <div class="sstssd-insta-post">
                <div class="sstssd-post-header">
                    <span class="sstssd-post-date">${post.date}</span>
                    <span class="sstssd-post-type">${typeIcon[post.type] || '📷'}</span>
                </div>
                <div class="sstssd-post-content">${this.escapeHtml(post.content)}</div>
                ${post.tags.length > 0 ? `<div class="sstssd-post-tags">${post.tags.map(tag => `<span class="sstssd-tag">#${this.escapeHtml(tag)}</span>`).join(' ')}</div>` : ''}
                ${post.type !== 'story' ? `
                    <div class="sstssd-post-stats">
                        <span>❤️ ${post.likes.toLocaleString('ko-KR')}</span>
                        <span>💬 ${post.comments.toLocaleString('ko-KR')}</span>
                        <span>📤 ${post.shares.toLocaleString('ko-KR')}</span>
                    </div>
                ` : ''}
                <div class="sstssd-post-reaction sstssd-reaction-${post.reaction}">
                    └ 반응: ${reactionIcon[post.reaction]} ${reactionText[post.reaction]}
                </div>
                ${post.linkedBaking ? `<div class="sstssd-post-link">🧁 연결: ${this.escapeHtml(post.linkedBaking)}</div>` : ''}
            </div>
        `;
    }
    
    // DM 섹션
    renderDMs() {
        const instaData = this.settings.instagram;
        const isOpen = instaData.subAccordionState?.dms || false;
        const dms = instaData.dms.slice(0, 20);  // Show 20 most recent
        
        return `
            <div class="sstssd-sub-section">
                <div class="sstssd-sub-header" data-sub="dms">
                    <span>📬 DM 주문</span>
                    <button class="sstssd-sub-toggle">${isOpen ? '▲' : '▼'}</button>
                </div>
                <div class="sstssd-sub-content ${isOpen ? 'sstssd-sub-open' : ''}">
                    ${dms.length > 0 ? dms.map(dm => this.renderDMItem(dm)).join('') : '<div class="sstssd-empty">📬 새 DM이 없습니다</div>'}
                </div>
            </div>
        `;
    }
    
    // DM 항목
    renderDMItem(dm) {
        const statusIcon = {
            pending: '⬜',
            accepted: '✅',
            declined: '❌',
            expired: '⏰'
        };
        
        const statusText = {
            pending: '대기중',
            accepted: '수락됨',
            declined: '거절됨',
            expired: '만료됨'
        };
        
        return `
            <div class="sstssd-insta-dm sstssd-dm-${dm.status}">
                <div class="sstssd-dm-header">
                    <span class="sstssd-dm-status">${statusIcon[dm.status]} ${statusText[dm.status]}</span>
                    <span class="sstssd-dm-from">${this.escapeHtml(dm.from)}</span>
                    <span class="sstssd-dm-date">(${dm.date})</span>
                </div>
                <div class="sstssd-dm-message">"${this.escapeHtml(dm.message)}"</div>
                ${dm.memo ? `<div class="sstssd-dm-memo">메모: ${this.escapeHtml(dm.memo)}</div>` : ''}
                ${dm.status === 'pending' ? `
                    <div class="sstssd-dm-actions">
                        <button class="sstssd-btn sstssd-btn-sm sstssd-btn-success" data-action="accept-dm" data-id="${dm.id}">수락</button>
                        <button class="sstssd-btn sstssd-btn-sm sstssd-btn-danger" data-action="decline-dm" data-id="${dm.id}">거절</button>
                    </div>
                ` : ''}
                ${dm.status === 'expired' || dm.status === 'declined' ? `
                    <button class="sstssd-btn sstssd-btn-sm" data-action="delete-dm" data-id="${dm.id}">삭제</button>
                ` : ''}
            </div>
        `;
    }
    
    // ===== 이벤트 리스너 =====
    attachEventListeners(container) {
        // Sub-accordion toggles
        container.querySelectorAll('.sstssd-sub-header').forEach(header => {
            header.addEventListener('click', (e) => {
                e.stopPropagation();
                const subName = header.dataset.sub;
                const content = header.nextElementSibling;
                const toggle = header.querySelector('.sstssd-sub-toggle');
                
                if (content && toggle) {
                    const isOpen = content.classList.toggle('sstssd-sub-open');
                    toggle.textContent = isOpen ? '▲' : '▼';
                    
                    // Save state
                    if (!this.settings.instagram.subAccordionState) {
                        this.settings.instagram.subAccordionState = {};
                    }
                    this.settings.instagram.subAccordionState[subName] = isOpen;
                    this.saveCallback();
                }
            });
        });
        
        // Accept DM buttons
        container.querySelectorAll('[data-action="accept-dm"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.updateDMStatus(id, 'accepted');
                this.render(container);
            });
        });
        
        // Decline DM buttons
        container.querySelectorAll('[data-action="decline-dm"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.showDeclineDMModal(id, container);
            });
        });
        
        // Delete DM buttons
        container.querySelectorAll('[data-action="delete-dm"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                if (confirm('이 DM을 삭제하시겠습니까?')) {
                    this.deleteDM(id);
                    this.render(container);
                }
            });
        });
    }
    
    // ===== 모달 =====
    // 게시물 추가 모달
    showAddPostModal(linkedBaking = null) {
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>📸 게시물 작성</h3>
                <form id="sstssd-add-post-form">
                    <div class="sstssd-form-group">
                        <label>종류</label>
                        <div class="sstssd-radio-group">
                            <label><input type="radio" name="type" value="photo" checked> 📷 사진</label>
                            <label><input type="radio" name="type" value="reel"> 🎬 릴스</label>
                            <label><input type="radio" name="type" value="story"> 📖 스토리</label>
                        </div>
                    </div>
                    <div class="sstssd-form-group">
                        <label>내용</label>
                        <textarea name="content" class="sstssd-input" rows="3" required placeholder="게시물 내용을 입력하세요"></textarea>
                    </div>
                    <div class="sstssd-form-group">
                        <label>태그 (쉼표로 구분)</label>
                        <input type="text" name="tags" class="sstssd-input" placeholder="예: 마카롱, 딸기, 신메뉴">
                    </div>
                    ${linkedBaking ? `<input type="hidden" name="linkedBaking" value="${this.escapeHtml(linkedBaking)}">` : ''}
                    <div class="sstssd-form-actions">
                        <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                        <button type="submit" class="sstssd-btn sstssd-btn-primary">게시</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#sstssd-add-post-form');
        const cancelBtn = modal.querySelector('.sstssd-btn-cancel');
        const overlay = modal.querySelector('.sstssd-modal-overlay');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            const tagsStr = formData.get('tags');
            const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : [];
            
            const result = this.addPost({
                type: formData.get('type'),
                content: formData.get('content'),
                tags: tags,
                linkedBaking: formData.get('linkedBaking') || null
            });
            
            // Show result notification
            if (result.followerGrowth > 0) {
                alert(`게시물이 업로드되었습니다!\n\n팔로워 +${result.followerGrowth}명 증가 🎉\n반응: ${result.post.reaction === 'hot2' ? '🔥🔥 대박!' : result.post.reaction === 'hot' ? '🔥 좋음' : result.post.reaction === 'normal' ? '보통' : '📉 저조'}`);
            }
            
            const moduleContainer = document.querySelector('.sstssd-module[data-module="instagram"]');
            if (moduleContainer) {
                this.render(moduleContainer);
            }
            
            modal.remove();
        });
        
        cancelBtn.addEventListener('click', () => modal.remove());
        overlay.addEventListener('click', () => modal.remove());
    }
    
    // DM 거절 모달
    showDeclineDMModal(id, container) {
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>DM 거절</h3>
                <form id="sstssd-decline-dm-form">
                    <div class="sstssd-form-group">
                        <label>거절 사유 (선택)</label>
                        <textarea name="memo" class="sstssd-input" rows="3" placeholder="사유를 입력하세요 (선택)"></textarea>
                    </div>
                    <div class="sstssd-form-actions">
                        <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                        <button type="submit" class="sstssd-btn sstssd-btn-primary">거절</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#sstssd-decline-dm-form');
        const cancelBtn = modal.querySelector('.sstssd-btn-cancel');
        const overlay = modal.querySelector('.sstssd-modal-overlay');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            this.updateDMStatus(id, 'declined', formData.get('memo'));
            this.render(container);
            modal.remove();
        });
        
        cancelBtn.addEventListener('click', () => modal.remove());
        overlay.addEventListener('click', () => modal.remove());
    }
    
    // ===== 유틸리티 =====
    formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
