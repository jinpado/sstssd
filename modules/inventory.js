// 📦 재고 모듈 (Inventory Module)
export class InventoryModule {
    // 자주 쓰는 재료 프리셋
    static COMMON_INGREDIENTS = [
        { name: "박력분", unit: "g", category: "가루류", defaultQty: 1000, defaultPrice: 3000 },
        { name: "강력분", unit: "g", category: "가루류", defaultQty: 1000, defaultPrice: 3500 },
        { name: "아몬드가루", unit: "g", category: "가루류", defaultQty: 500, defaultPrice: 8000 },
        { name: "슈가파우더", unit: "g", category: "가루류", defaultQty: 500, defaultPrice: 4000 },
        { name: "코코아파우더", unit: "g", category: "가루류", defaultQty: 200, defaultPrice: 5000 },
        { name: "무염버터", unit: "g", category: "유지류", defaultQty: 450, defaultPrice: 8000 },
        { name: "생크림", unit: "ml", category: "유지류", defaultQty: 500, defaultPrice: 5000 },
        { name: "크림치즈", unit: "g", category: "유지류", defaultQty: 200, defaultPrice: 4000 },
        { name: "우유", unit: "ml", category: "유지류", defaultQty: 1000, defaultPrice: 2500 },
        { name: "달걀", unit: "개", category: "달걀/기타", defaultQty: 10, defaultPrice: 3500 },
        { name: "바닐라 익스트랙", unit: "ml", category: "달걀/기타", defaultQty: 30, defaultPrice: 10000 },
        { name: "설탕", unit: "g", category: "달걀/기타", defaultQty: 1000, defaultPrice: 2000 },
        { name: "소금", unit: "g", category: "달걀/기타", defaultQty: 500, defaultPrice: 1000 },
        { name: "다크 커버춰 초콜릿", unit: "g", category: "초콜릿류", defaultQty: 500, defaultPrice: 12000 },
        { name: "화이트 초콜릿", unit: "g", category: "초콜릿류", defaultQty: 300, defaultPrice: 8000 },
        { name: "딸기", unit: "g", category: "과일류", defaultQty: 500, defaultPrice: 6000 },
        { name: "블루베리", unit: "g", category: "과일류", defaultQty: 200, defaultPrice: 5000 },
        { name: "레몬즙", unit: "ml", category: "과일류", defaultQty: 100, defaultPrice: 3000 },
        { name: "젤라틴", unit: "g", category: "기타", defaultQty: 50, defaultPrice: 5000 },
        { name: "베이킹파우더", unit: "g", category: "기타", defaultQty: 100, defaultPrice: 3000 },
    ];
    
    constructor(settings, saveCallback, getGlobalSettings, getRpDate, balanceModule = null) {
        this.settings = settings;
        this.saveCallback = saveCallback;
        this.getGlobalSettings = getGlobalSettings;
        this.getRpDate = getRpDate;
        this.balanceModule = balanceModule;
        this.moduleName = 'inventory';
        this.idCounter = Date.now();
        
        // Initialize inventory data structure if not exists
        if (!this.settings.inventory) {
            this.settings.inventory = {
                items: [],
                history: [],
                categories: ["가루류", "유지류", "달걀/기타", "초콜릿류", "과일류", "기타"]
            };
        }
        
        // Initialize sub-accordion state if not exists
        if (!this.settings.inventory.subAccordionState) {
            this.settings.inventory.subAccordionState = {
                ingredients: true,
                products: false,
                alerts: false,
                history: false
            };
        }
        
        // Initialize ID counter from existing data
        this.idCounter = this.getMaxId();
    }
    
    // Get maximum ID from existing data
    getMaxId() {
        let maxId = Date.now();
        
        if (this.settings.inventory) {
            const allIds = [
                ...this.settings.inventory.items.map(i => i.id || 0),
                ...this.settings.inventory.history.map(h => h.id || 0)
            ];
            
            if (allIds.length > 0) {
                maxId = Math.max(maxId, ...allIds);
            }
        }
        
        return maxId;
    }
    
    // ===== 재료 관리 =====
    // 재료 추가
    addItem(data) {
        const newItem = {
            id: ++this.idCounter,
            name: data.name,
            qty: data.qty || 0,
            unit: data.unit || "g",
            category: data.category || "기타",
            type: data.type || "ingredient",  // "ingredient" | "product"
            minStock: data.minStock || 0,
            createdAt: this.formatDate(this.getRpDate())
        };
        
        this.settings.inventory.items.push(newItem);
        
        // 이력 추가
        this.addHistory({
            itemName: newItem.name,
            change: newItem.qty,
            afterQty: newItem.qty,
            reason: data.reason || "직접 추가",
            source: data.source || "manual"
        });
        
        this.saveCallback();
        return newItem;
    }
    
    // 재료 수정
    updateItem(id, data) {
        const item = this.settings.inventory.items.find(i => i.id === id);
        if (!item) return null;
        
        const oldQty = item.qty;
        Object.assign(item, data);
        
        // 수량이 변경되었으면 이력 추가
        if (data.qty !== undefined && data.qty !== oldQty) {
            const change = data.qty - oldQty;
            this.addHistory({
                itemName: item.name,
                change: change,
                afterQty: data.qty,
                reason: data.reason || "수량 변경",
                source: data.source || "manual"
            });
        }
        
        this.saveCallback();
        return item;
    }
    
    // 재료 삭제
    deleteItem(id) {
        const index = this.settings.inventory.items.findIndex(i => i.id === id);
        if (index !== -1) {
            this.settings.inventory.items.splice(index, 1);
            this.saveCallback();
            return true;
        }
        return false;
    }
    
    // 퍼지 매칭으로 재료 찾기
    findIngredientFuzzy(name) {
        const ingredients = this.settings.inventory.items.filter(i => i.type === "ingredient");
        
        // 1순위: 완전 일치
        let match = ingredients.find(i => i.name === name);
        if (match) return match;
        
        // 2순위: 대소문자 무시 완전 일치
        const nameLower = name.toLowerCase();
        match = ingredients.find(i => i.name.toLowerCase() === nameLower);
        if (match) return match;
        
        // 3순위: 포함 관계 매칭
        // 규칙: 재고 이름이 요청 이름을 포함하거나, 요청 이름이 재고 이름보다 길고 재고 이름을 포함
        // "딸기" 요청 → "설향딸기" 재고 매칭 ✓
        // "설향딸기" 요청 → "딸기" 재고 매칭 ✓ (더 구체적인 것을 일반적인 것으로 대체)
        // "딸기잼" 요청 → "딸기" 재고 매칭 ✗ (접미사가 다른 재료)
        match = ingredients.find(i => {
            // 재고 이름이 요청을 포함: "설향딸기" includes "딸기"
            if (i.name.includes(name)) return true;
            // 요청이 재고 이름을 포함하고, 요청이 재고보다 길고, 재고가 요청의 시작 부분과 일치
            // "설향딸기" includes "딸기" AND "설향딸기" starts with "딸기" (for reversed case)
            if (name.includes(i.name) && name.startsWith(i.name)) return true;
            return false;
        });
        if (match) return match;
        
        // 4순위: 공백/특수문자 제거 후 포함 관계
        const nameNormalized = name.replace(/[\s\-_]/g, '').toLowerCase();
        match = ingredients.find(i => {
            const itemNormalized = i.name.replace(/[\s\-_]/g, '').toLowerCase();
            if (itemNormalized.includes(nameNormalized)) return true;
            if (nameNormalized.includes(itemNormalized) && nameNormalized.startsWith(itemNormalized)) return true;
            return false;
        });
        if (match) return match;
        
        return null;
    }
    
    // 재료 수량 변경 (베이킹 모듈에서 사용)
    changeItemQty(itemName, change, reason, source = "baking") {
        const item = this.findIngredientFuzzy(itemName);
        
        if (!item) {
            console.warn(`Inventory item not found: ${itemName}`);
            return false;
        }
        
        item.qty += change;
        
        this.addHistory({
            itemName: item.name,
            change: change,
            afterQty: item.qty,
            reason: reason,
            source: source
        });
        
        this.saveCallback();
        return true;
    }
    
    // 완제품 추가 (베이킹 모듈에서 호출)
    addProduct(data) {
        const existingProduct = this.settings.inventory.items.find(i => 
            i.name === data.name && i.type === "product"
        );
        
        if (existingProduct) {
            // 기존 제품이 있으면 수량 추가
            existingProduct.qty += data.qty;
            existingProduct.createdAt = this.formatDate(this.getRpDate());
            
            this.addHistory({
                itemName: existingProduct.name,
                change: data.qty,
                afterQty: existingProduct.qty,
                reason: data.reason || "베이킹 완료",
                source: "baking"
            });
        } else {
            // 새 제품 추가
            const newProduct = {
                id: ++this.idCounter,
                name: data.name,
                qty: data.qty || 0,
                unit: data.unit || "개",
                category: "완제품",
                type: "product",
                minStock: 0,
                createdAt: this.formatDate(this.getRpDate())
            };
            
            this.settings.inventory.items.push(newProduct);
            
            this.addHistory({
                itemName: newProduct.name,
                change: newProduct.qty,
                afterQty: newProduct.qty,
                reason: data.reason || "베이킹 완료",
                source: "baking"
            });
        }
        
        this.saveCallback();
    }
    
    // ===== 이력 관리 =====
    addHistory(data) {
        const newHistory = {
            id: ++this.idCounter,
            itemName: data.itemName,
            change: data.change,
            afterQty: data.afterQty,
            reason: data.reason || "",
            source: data.source || "manual",  // "baking" | "purchase" | "manual" | "gift"
            date: this.formatDate(this.getRpDate())
        };
        
        this.settings.inventory.history.unshift(newHistory);  // Add to beginning
        
        // 이력은 최근 50건만 유지
        if (this.settings.inventory.history.length > 50) {
            this.settings.inventory.history = this.settings.inventory.history.slice(0, 50);
        }
        
        this.saveCallback();
        return newHistory;
    }
    
    // ===== 재료 분류 =====
    // 재료를 카테고리별로 분류
    categorizeIngredients() {
        const ingredients = this.settings.inventory.items.filter(i => i.type === "ingredient");
        const categorized = {};
        
        this.settings.inventory.categories.forEach(category => {
            categorized[category] = ingredients.filter(i => i.category === category);
        });
        
        return categorized;
    }
    
    // 완제품 가져오기
    getProducts() {
        return this.settings.inventory.items.filter(i => i.type === "product");
    }
    
    // 부족/없음 알림
    getAlerts() {
        const ingredients = this.settings.inventory.items.filter(i => i.type === "ingredient");
        const low = [];
        const out = [];
        
        ingredients.forEach(item => {
            if (item.qty <= 0) {
                // minStock이 0이거나 설정 안 된 재료는 부족 알림에서 제외
                // (딱 필요한 만큼 사서 다 쓴 재료 = 알림 불필요)
                if (item.minStock > 0) {
                    out.push(item);
                }
                // minStock이 0이면 알림에 안 뜸
            } else if (item.minStock && item.qty <= item.minStock) {
                low.push(item);
            }
        });
        
        return { low, out };
    }
    
    // 재고 상태 아이콘
    getStockIcon(item) {
        if (item.qty <= 0) return "❌";
        if (item.qty <= item.minStock) return "⚠️";
        return "✅";
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
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 샵 모드 활성화 여부 확인
    getShopModeEnabled() {
        const chatData = this.balanceModule?.settings;
        return chatData?.balance?.shopMode?.enabled || false;
    }
    
    // ===== UI 렌더링 =====
    render(container) {
        const categorized = this.categorizeIngredients();
        const products = this.getProducts();
        const { low, out } = this.getAlerts();
        const history = this.settings.inventory.history.slice(0, 10);  // 최근 10건만
        
        // Preserve accordion state
        const contentEl = container.querySelector('.sstssd-module-content');
        let isOpen = contentEl ? contentEl.classList.contains('sstssd-module-open') : false;
        
        // Check global settings if available and content element doesn't exist yet
        if (!contentEl && this.getGlobalSettings) {
            const globalSettings = this.getGlobalSettings();
            isOpen = globalSettings.openModules.includes(this.moduleName);
        }
        
        // Get sub-accordion states
        const subState = this.settings.inventory.subAccordionState;
        
        container.innerHTML = `
            <div class="sstssd-module-header" data-module="${this.moduleName}">
                <div class="sstssd-module-title">
                    <span class="sstssd-module-icon">📦</span>
                    <span>재고</span>
                    ${(low.length + out.length) > 0 ? `<span class="sstssd-badge sstssd-badge-urgent">${low.length + out.length}⚠️</span>` : ''}
                </div>
                <button class="sstssd-module-toggle">${isOpen ? '▲' : '▼'}</button>
            </div>
            <div class="sstssd-module-content ${isOpen ? 'sstssd-module-open' : ''}" data-module="${this.moduleName}">
                <!-- 재료 섹션 -->
                <div class="sstssd-sub-section">
                    <div class="sstssd-sub-header" data-section="ingredients">
                        <span>🥄 재료</span>
                        <button class="sstssd-sub-toggle">${subState.ingredients ? '▲' : '▼'}</button>
                    </div>
                    <div class="sstssd-sub-content ${subState.ingredients ? 'sstssd-sub-open' : ''}">
                        ${Object.keys(categorized).map(category => `
                            ${categorized[category].length > 0 ? `
                                <div class="sstssd-category-group">
                                    <div class="sstssd-category-title">${category}</div>
                                    ${categorized[category].map(item => this.renderIngredientItem(item)).join('')}
                                </div>
                            ` : ''}
                        `).join('')}
                        ${Object.values(categorized).every(arr => arr.length === 0) ? `
                            <div class="sstssd-empty">재료가 없습니다</div>
                        ` : ''}
                        <div style="display: flex; gap: 8px;">
                            <button class="sstssd-btn sstssd-btn-add" data-action="quick-add-ingredient" style="flex: 1;">⚡ 빠른 추가</button>
                            <button class="sstssd-btn sstssd-btn-add" data-action="add-ingredient" style="flex: 1;">+ 재료 추가</button>
                        </div>
                    </div>
                </div>
                
                <!-- 완제품 섹션 -->
                <div class="sstssd-sub-section">
                    <div class="sstssd-sub-header" data-section="products">
                        <span>🧁 완제품</span>
                        <button class="sstssd-sub-toggle">${subState.products ? '▲' : '▼'}</button>
                    </div>
                    <div class="sstssd-sub-content ${subState.products ? 'sstssd-sub-open' : ''}">
                        ${products.length > 0 ? `
                            ${products.map(item => this.renderProductItem(item)).join('')}
                        ` : `
                            <div class="sstssd-empty">완제품이 없습니다</div>
                        `}
                    </div>
                </div>
                
                <!-- 부족 알림 섹션 -->
                ${(low.length + out.length) > 0 ? `
                    <div class="sstssd-sub-section">
                        <div class="sstssd-sub-header" data-section="alerts">
                            <span>⚠️ 부족 알림</span>
                            <button class="sstssd-sub-toggle">${subState.alerts ? '▲' : '▼'}</button>
                        </div>
                        <div class="sstssd-sub-content ${subState.alerts ? 'sstssd-sub-open' : ''}">
                            ${low.length > 0 ? `
                                <div class="sstssd-alert-section">
                                    <div class="sstssd-alert-title">⚠️ 부족 (${low.length}건)</div>
                                    ${low.map(item => `
                                        <div class="sstssd-alert-item sstssd-alert-low">
                                            ${item.name} ${item.qty}${item.unit} (최소 ${item.minStock}${item.unit})
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                            ${out.length > 0 ? `
                                <div class="sstssd-alert-section">
                                    <div class="sstssd-alert-title">❌ 없음 (${out.length}건)</div>
                                    ${out.map(item => `
                                        <div class="sstssd-alert-item sstssd-alert-out">
                                            ${item.name}
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
                
                <!-- 변동 이력 섹션 -->
                <div class="sstssd-sub-section">
                    <div class="sstssd-sub-header" data-section="history">
                        <span>📜 변동 이력</span>
                        <button class="sstssd-sub-toggle">${subState.history ? '▲' : '▼'}</button>
                    </div>
                    <div class="sstssd-sub-content ${subState.history ? 'sstssd-sub-open' : ''}">
                        ${history.length > 0 ? `
                            ${history.map(h => this.renderHistoryItem(h)).join('')}
                        ` : `
                            <div class="sstssd-empty">이력이 없습니다</div>
                        `}
                    </div>
                </div>
            </div>
        `;
        
        this.attachEventListeners(container);
        
        // Update summary after rendering
        if (typeof window.sstsdUpdateSummary === 'function') {
            window.sstsdUpdateSummary();
        }
    }
    
    // 재료 항목 렌더링
    renderIngredientItem(item) {
        const icon = this.getStockIcon(item);
        return `
            <div class="sstssd-inventory-item" data-id="${item.id}">
                <div class="sstssd-inventory-info">
                    <span class="sstssd-inventory-name">${this.escapeHtml(item.name)}</span>
                    <span class="sstssd-inventory-qty">${item.qty}${item.unit}</span>
                    <span class="sstssd-inventory-icon">${icon}</span>
                </div>
                <div class="sstssd-inventory-actions">
                    <button class="sstssd-btn sstssd-btn-sm" data-action="edit-item" data-id="${item.id}">✏️</button>
                    <button class="sstssd-btn sstssd-btn-sm" data-action="delete-item" data-id="${item.id}">🗑</button>
                </div>
            </div>
        `;
    }
    
    // 완제품 항목 렌더링
    renderProductItem(item) {
        return `
            <div class="sstssd-inventory-item sstssd-product-item" data-id="${item.id}">
                <div class="sstssd-inventory-info">
                    <span class="sstssd-inventory-name">${this.escapeHtml(item.name)}</span>
                    <span class="sstssd-inventory-qty">${item.qty}${item.unit}</span>
                    <span class="sstssd-inventory-date">(${item.createdAt} 제작)</span>
                </div>
                <div class="sstssd-inventory-actions">
                    <button class="sstssd-btn sstssd-btn-sm" data-action="edit-product" data-id="${item.id}">수량 수정</button>
                    <button class="sstssd-btn sstssd-btn-sm" data-action="delete-product" data-id="${item.id}">삭제</button>
                </div>
            </div>
        `;
    }
    
    // 이력 항목 렌더링
    renderHistoryItem(h) {
        const changeText = h.change > 0 ? `+${h.change}` : h.change;
        const changeClass = h.change > 0 ? 'sstssd-history-increase' : 'sstssd-history-decrease';
        return `
            <div class="sstssd-history-item">
                <span class="sstssd-history-date">${h.date}</span>
                <span class="sstssd-history-name">${this.escapeHtml(h.itemName)}</span>
                <span class="sstssd-history-change ${changeClass}">${changeText}</span>
                <span class="sstssd-history-reason">(${this.escapeHtml(h.reason)})</span>
            </div>
        `;
    }
    
    // ===== 이벤트 리스너 =====
    attachEventListeners(container) {
        // 서브 아코디언 토글
        const subHeaders = container.querySelectorAll('.sstssd-sub-header');
        subHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                if (e.target.classList.contains('sstssd-sub-toggle') || e.target.closest('.sstssd-sub-toggle')) {
                    return;
                }
                
                const section = header.dataset.section;
                const content = header.nextElementSibling;
                const toggle = header.querySelector('.sstssd-sub-toggle');
                
                if (content && toggle) {
                    const isOpen = content.classList.contains('sstssd-sub-open');
                    content.classList.toggle('sstssd-sub-open');
                    toggle.textContent = isOpen ? '▼' : '▲';
                    
                    this.settings.inventory.subAccordionState[section] = !isOpen;
                    this.saveCallback();
                }
            });
        });
        
        // 빠른 추가 버튼
        const quickAddBtn = container.querySelector('[data-action="quick-add-ingredient"]');
        if (quickAddBtn) {
            quickAddBtn.addEventListener('click', () => this.showQuickAddModal());
        }
        
        // 재료 추가 버튼
        const addIngredientBtn = container.querySelector('[data-action="add-ingredient"]');
        if (addIngredientBtn) {
            addIngredientBtn.addEventListener('click', () => this.showAddItemModal());
        }
        
        // 재료 수정 버튼
        const editBtns = container.querySelectorAll('[data-action="edit-item"]');
        editBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.showEditItemModal(id);
            });
        });
        
        // 재료 삭제 버튼
        const deleteBtns = container.querySelectorAll('[data-action="delete-item"]');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                if (confirm('정말 삭제하시겠습니까?')) {
                    this.deleteItem(id);
                    this.render(container);
                }
            });
        });
        
        // 완제품 수정 버튼
        const editProductBtns = container.querySelectorAll('[data-action="edit-product"]');
        editProductBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.showEditProductModal(id);
            });
        });
        
        // 완제품 삭제 버튼
        const deleteProductBtns = container.querySelectorAll('[data-action="delete-product"]');
        deleteProductBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                const item = this.settings.inventory.items.find(i => i.id === id);
                if (item && confirm(`${item.name}을(를) 정말 삭제하시겠습니까?`)) {
                    this.deleteItem(id);
                    this.render(container);
                }
            });
        });
    }
    
    // ===== 모달 =====
    // 빠른 추가 모달
    showQuickAddModal() {
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        
        // 카테고리별로 재료 그룹화
        const ingredientsByCategory = {};
        InventoryModule.COMMON_INGREDIENTS.forEach(ing => {
            if (!ingredientsByCategory[ing.category]) {
                ingredientsByCategory[ing.category] = [];
            }
            ingredientsByCategory[ing.category].push(ing);
        });
        
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content" style="max-width: 600px;">
                <h3>⚡ 빠른 추가</h3>
                <div style="margin-bottom: 16px; color: #9ca3af; font-size: 14px;">
                    자주 쓰는 재료를 빠르게 추가할 수 있습니다. 재료를 클릭하면 기본 수량으로 추가됩니다.
                </div>
                ${Object.keys(ingredientsByCategory).map(category => `
                    <div style="margin-bottom: 16px;">
                        <div style="font-weight: bold; margin-bottom: 8px; color: #10b981;">${category}</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${ingredientsByCategory[category].map(ing => `
                                <button 
                                    class="sstssd-btn sstssd-btn-sm sstssd-quick-add-item" 
                                    data-name="${this.escapeHtml(ing.name)}"
                                    data-unit="${ing.unit}"
                                    data-category="${ing.category}"
                                    data-qty="${ing.defaultQty}"
                                    data-price="${ing.defaultPrice || 0}"
                                    style="background: #1e1e3a; border: 1px solid #10b981; padding: 6px 12px;"
                                >
                                    ${this.escapeHtml(ing.name)} (${ing.defaultQty}${ing.unit})
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
                <div class="sstssd-form-actions">
                    <button type="button" class="sstssd-btn sstssd-btn-cancel">닫기</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const cancelBtn = modal.querySelector('.sstssd-btn-cancel');
        const overlay = modal.querySelector('.sstssd-modal-overlay');
        const quickAddBtns = modal.querySelectorAll('.sstssd-quick-add-item');
        
        // 재료 버튼 클릭 이벤트
        quickAddBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.dataset.name;
                const unit = btn.dataset.unit;
                const category = btn.dataset.category;
                const defaultQty = parseFloat(btn.dataset.qty);
                const defaultPrice = parseFloat(btn.dataset.price) || 0;
                
                // 수량 입력 프롬프트
                const qty = prompt(`${name}의 수량을 입력하세요 (기본값: ${defaultQty}${unit})`, defaultQty);
                
                if (qty !== null && qty !== '') {
                    const parsedQty = parseFloat(qty);
                    if (!isNaN(parsedQty) && parsedQty > 0) {
                        // 가격 입력 프롬프트 (수량 입력 후)
                        const priceInput = prompt(`${name}의 가격을 입력하세요 (기본값: ${defaultPrice}원)\n가격을 입력하면 잔고에서 차감됩니다.`, defaultPrice);
                        const price = parseFloat(priceInput) || 0;
                        
                        this.addItem({
                            name: name,
                            qty: parsedQty,
                            unit: unit,
                            category: category,
                            minStock: 0,
                            type: 'ingredient',
                            reason: '빠른 추가',
                            source: 'manual'
                        });
                        
                        // 가격이 입력되면 잔고에서 차감
                        if (price > 0 && this.balanceModule) {
                            this.balanceModule.addTransaction({
                                type: "expense",
                                source: this.getShopModeEnabled() ? "shop" : "personal",
                                category: "재료비",
                                description: `재료 구매: ${name} ${parsedQty}${unit}`,
                                amount: price,
                                memo: "빠른 추가"
                            });
                        }
                        
                        const moduleContainer = document.querySelector('.sstssd-module[data-module="inventory"]');
                        if (moduleContainer) {
                            this.render(moduleContainer);
                        }
                        
                        // 성공 피드백
                        btn.style.background = '#10b981';
                        btn.textContent = '✓ 추가됨';
                        setTimeout(() => {
                            btn.style.background = '#1e1e3a';
                            btn.textContent = `${name} (${defaultQty}${unit})`;
                        }, 1000);
                    } else {
                        alert('올바른 수량을 입력해주세요.');
                    }
                }
            });
        });
        
        cancelBtn.addEventListener('click', () => modal.remove());
        overlay.addEventListener('click', () => modal.remove());
    }
    
    // 재료 추가 모달
    showAddItemModal() {
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>📦 재료 추가</h3>
                <form id="sstssd-add-item-form">
                    <div class="sstssd-form-group">
                        <label>품명</label>
                        <input type="text" name="name" class="sstssd-input" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>수량</label>
                        <input type="number" name="qty" class="sstssd-input" value="0" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>단위</label>
                        <input type="text" name="unit" class="sstssd-input" value="g" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>카테고리</label>
                        <select name="category" class="sstssd-input">
                            ${this.settings.inventory.categories.map(cat => `
                                <option value="${cat}">${cat}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="sstssd-form-group">
                        <label>최소 재고량</label>
                        <input type="number" name="minStock" class="sstssd-input" value="0" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>예상 가격 (선택사항)</label>
                        <input type="number" name="price" class="sstssd-input" value="0" placeholder="가격을 입력하면 잔고에서 차감됩니다">
                    </div>
                    <div class="sstssd-form-actions">
                        <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                        <button type="submit" class="sstssd-btn sstssd-btn-primary">추가</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#sstssd-add-item-form');
        const cancelBtn = modal.querySelector('.sstssd-btn-cancel');
        const overlay = modal.querySelector('.sstssd-modal-overlay');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            const name = formData.get('name');
            const qty = parseFloat(formData.get('qty'));
            const unit = formData.get('unit');
            const price = parseFloat(formData.get('price')) || 0;
            
            this.addItem({
                name: name,
                qty: qty,
                unit: unit,
                category: formData.get('category'),
                minStock: parseFloat(formData.get('minStock')),
                type: 'ingredient',
                reason: '직접 추가',
                source: 'manual'
            });
            
            // 가격이 입력되면 잔고에서 차감
            if (price > 0 && this.balanceModule) {
                this.balanceModule.addTransaction({
                    type: "expense",
                    source: this.getShopModeEnabled() ? "shop" : "personal",
                    category: "재료비",
                    description: `재료 구매: ${name} ${qty}${unit}`,
                    amount: price,
                    memo: "재고 직접 추가"
                });
            }
            
            const moduleContainer = document.querySelector('.sstssd-module[data-module="inventory"]');
            if (moduleContainer) {
                this.render(moduleContainer);
            }
            
            modal.remove();
        });
        
        cancelBtn.addEventListener('click', () => modal.remove());
        overlay.addEventListener('click', () => modal.remove());
    }
    
    // 재료 수정 모달
    showEditItemModal(id) {
        const item = this.settings.inventory.items.find(i => i.id === id);
        if (!item) return;
        
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>✏️ 재료 수정</h3>
                <form id="sstssd-edit-item-form">
                    <div class="sstssd-form-group">
                        <label>품명</label>
                        <input type="text" name="name" class="sstssd-input" value="${this.escapeHtml(item.name)}" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>수량</label>
                        <input type="number" name="qty" class="sstssd-input" value="${item.qty}" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>단위</label>
                        <input type="text" name="unit" class="sstssd-input" value="${item.unit}" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>카테고리</label>
                        <select name="category" class="sstssd-input">
                            ${this.settings.inventory.categories.map(cat => `
                                <option value="${cat}" ${cat === item.category ? 'selected' : ''}>${cat}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="sstssd-form-group">
                        <label>최소 재고량</label>
                        <input type="number" name="minStock" class="sstssd-input" value="${item.minStock}" required>
                    </div>
                    <div class="sstssd-form-actions">
                        <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                        <button type="submit" class="sstssd-btn sstssd-btn-primary">저장</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#sstssd-edit-item-form');
        const cancelBtn = modal.querySelector('.sstssd-btn-cancel');
        const overlay = modal.querySelector('.sstssd-modal-overlay');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            this.updateItem(id, {
                name: formData.get('name'),
                qty: parseFloat(formData.get('qty')),
                unit: formData.get('unit'),
                category: formData.get('category'),
                minStock: parseFloat(formData.get('minStock')),
                reason: '수량 변경',
                source: 'manual'
            });
            
            const moduleContainer = document.querySelector('.sstssd-module[data-module="inventory"]');
            if (moduleContainer) {
                this.render(moduleContainer);
            }
            
            modal.remove();
        });
        
        cancelBtn.addEventListener('click', () => modal.remove());
        overlay.addEventListener('click', () => modal.remove());
    }
    
    // 완제품 수정 모달
    showEditProductModal(id) {
        const item = this.settings.inventory.items.find(i => i.id === id);
        if (!item) return;
        
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>🧁 완제품 수량 수정</h3>
                <form id="sstssd-edit-product-form">
                    <div class="sstssd-form-group">
                        <label>제품명</label>
                        <div>${this.escapeHtml(item.name)}</div>
                    </div>
                    <div class="sstssd-form-group">
                        <label>현재 수량: ${item.qty}${item.unit}</label>
                    </div>
                    <div class="sstssd-form-group">
                        <label>새 수량</label>
                        <input type="number" name="qty" class="sstssd-input" value="${item.qty}" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>사유</label>
                        <input type="text" name="reason" class="sstssd-input" placeholder="예: 선물, 판매, 소비" required>
                    </div>
                    <div class="sstssd-form-actions">
                        <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                        <button type="submit" class="sstssd-btn sstssd-btn-primary">저장</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#sstssd-edit-product-form');
        const cancelBtn = modal.querySelector('.sstssd-btn-cancel');
        const overlay = modal.querySelector('.sstssd-modal-overlay');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            this.updateItem(id, {
                qty: parseFloat(formData.get('qty')),
                reason: formData.get('reason'),
                source: 'manual'
            });
            
            const moduleContainer = document.querySelector('.sstssd-module[data-module="inventory"]');
            if (moduleContainer) {
                this.render(moduleContainer);
            }
            
            modal.remove();
        });
        
        cancelBtn.addEventListener('click', () => modal.remove());
        overlay.addEventListener('click', () => modal.remove());
    }
}
