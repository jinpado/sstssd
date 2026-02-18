// 🧁 베이킹 모듈 (Baking Module)
export class BakingModule {
    // Default ingredient ratios for fallback recipe generation
    static DEFAULT_INGREDIENT_RATIOS = {
        FLOUR_PER_UNIT: 10,     // 10g flour per unit
        SUGAR_PER_UNIT: 5,      // 5g sugar per unit
        BUTTER_PER_UNIT: 3,     // 3g butter per unit
        EGG_PER_10_UNITS: 1     // 1 egg per 10 units
    };
    
    constructor(settings, saveCallback, getGlobalSettings, getRpDate, inventoryModule, instagramModule = null) {
        this.settings = settings;
        this.saveCallback = saveCallback;
        this.getGlobalSettings = getGlobalSettings;
        this.getRpDate = getRpDate;
        this.inventoryModule = inventoryModule;
        this.instagramModule = instagramModule;
        this.moduleName = 'baking';
        this.idCounter = Date.now();
        
        // Initialize baking data structure if not exists
        if (!this.settings.baking) {
            this.settings.baking = {
                recipes: [],
                bakingHistory: [],
                shoppingList: []
            };
        }
        
        // Initialize shopping list if not exists
        if (!this.settings.baking.shoppingList) {
            this.settings.baking.shoppingList = [];
        }
        
        // Initialize ID counter from existing data
        this.idCounter = this.getMaxId();
    }
    
    // Get maximum ID from existing data
    getMaxId() {
        let maxId = Date.now();
        
        if (this.settings.baking) {
            const allIds = [
                ...this.settings.baking.recipes.map(r => r.id || 0),
                ...this.settings.baking.bakingHistory.map(h => h.id || 0),
                ...(this.settings.baking.shoppingList || []).flatMap(list => [
                    list.id || 0,
                    ...(list.items || []).map(item => item.id || 0)
                ])
            ];
            
            if (allIds.length > 0) {
                maxId = Math.max(maxId, ...allIds);
            }
        }
        
        return maxId;
    }
    
    // ===== 레시피 관리 =====
    // 레시피 추가
    addRecipe(data) {
        const newRecipe = {
            id: ++this.idCounter,
            name: data.name,
            ingredients: data.ingredients || [],  // [{ name: "아몬드가루", qty: 300, unit: "g" }]
            yieldQty: data.yieldQty || 1,
            yieldUnit: data.yieldUnit || "개",
            createdAt: this.formatDate(this.getRpDate())
        };
        
        this.settings.baking.recipes.push(newRecipe);
        this.saveCallback();
        return newRecipe;
    }
    
    // 레시피 수정
    updateRecipe(id, data) {
        const recipe = this.settings.baking.recipes.find(r => r.id === id);
        if (recipe) {
            Object.assign(recipe, data);
            this.saveCallback();
        }
        return recipe;
    }
    
    // 레시피 삭제
    deleteRecipe(id) {
        const index = this.settings.baking.recipes.findIndex(r => r.id === id);
        if (index !== -1) {
            this.settings.baking.recipes.splice(index, 1);
            this.saveCallback();
            return true;
        }
        return false;
    }
    
    // ===== 베이킹 실행 =====
    // 베이킹 수행
    performBaking(recipeId, multiplier = 1) {
        const recipe = this.settings.baking.recipes.find(r => r.id === recipeId);
        if (!recipe) {
            return { success: false, error: "레시피를 찾을 수 없습니다" };
        }
        
        // 재료 확인
        if (this.inventoryModule) {
            for (const ingredient of recipe.ingredients) {
                const requiredQty = ingredient.qty * multiplier;
                const item = this.inventoryModule.settings.inventory.items.find(i => 
                    i.name === ingredient.name && i.type === "ingredient"
                );
                
                if (!item || item.qty < requiredQty) {
                    return { 
                        success: false, 
                        error: `재료 부족: ${ingredient.name} (필요: ${requiredQty}${ingredient.unit}, 보유: ${item ? item.qty : 0}${ingredient.unit})` 
                    };
                }
            }
            
            // 재료 차감
            for (const ingredient of recipe.ingredients) {
                const requiredQty = ingredient.qty * multiplier;
                this.inventoryModule.changeItemQty(
                    ingredient.name,
                    -requiredQty,
                    `${recipe.name} ×${recipe.yieldQty * multiplier} 제작`,
                    "baking"
                );
            }
            
            // 완제품 추가
            this.inventoryModule.addProduct({
                name: recipe.name,
                qty: recipe.yieldQty * multiplier,
                unit: recipe.yieldUnit,
                reason: `${recipe.name} ×${recipe.yieldQty * multiplier} 제작`
            });
        }
        
        // 베이킹 이력 추가
        const historyEntry = {
            id: ++this.idCounter,
            recipeName: recipe.name,
            multiplier: multiplier,
            yieldQty: recipe.yieldQty * multiplier,
            yieldUnit: recipe.yieldUnit,
            date: this.formatDate(this.getRpDate())
        };
        this.settings.baking.bakingHistory.unshift(historyEntry);
        
        // 이력은 최근 30건만 유지
        if (this.settings.baking.bakingHistory.length > 30) {
            this.settings.baking.bakingHistory = this.settings.baking.bakingHistory.slice(0, 30);
        }
        
        this.saveCallback();
        return { success: true };
    }
    
    // ===== 구매 리스트 관리 =====
    // 구매 리스트에 항목 추가
    addToShoppingList(ingredientName, qty, unit, location = "온라인", estimatedPrice = 0, sources = []) {
        // 같은 장소의 기존 리스트 찾기
        let locationList = this.settings.baking.shoppingList.find(list => list.location === location);
        
        if (!locationList) {
            // 새 장소 리스트 생성
            locationList = {
                id: ++this.idCounter,
                location: location,
                items: [],
                totalPrice: 0,
                status: "pending"
            };
            this.settings.baking.shoppingList.push(locationList);
        }
        
        // 같은 재료가 이미 있는지 확인
        const existingItem = locationList.items.find(item => item.name === ingredientName);
        
        if (existingItem) {
            // 기존 항목에 수량 합산
            existingItem.qty += qty;
            existingItem.price = estimatedPrice || existingItem.price;
            if (sources.length > 0) {
                existingItem.sources = [...new Set([...existingItem.sources, ...sources])];
            }
        } else {
            // 새 항목 추가
            locationList.items.push({
                id: ++this.idCounter,
                name: ingredientName,
                qty: qty,
                unit: unit,
                price: estimatedPrice,
                sources: sources
            });
        }
        
        // 총액 재계산
        // 주의: item.price는 해당 항목의 총 구매 가격 (수량 × 단가)
        // 예: 밀가루 400g의 price가 4000원이면, 그것이 총 비용
        locationList.totalPrice = locationList.items.reduce((sum, item) => sum + item.price, 0);
        
        this.saveCallback();
    }
    
    // 구매 리스트 항목 수정
    updateShoppingListItem(locationId, itemId, updates) {
        const locationList = this.settings.baking.shoppingList.find(list => list.id === locationId);
        if (!locationList) return false;
        
        const item = locationList.items.find(i => i.id === itemId);
        if (!item) return false;
        
        Object.assign(item, updates);
        
        // 총액 재계산
        locationList.totalPrice = locationList.items.reduce((sum, item) => sum + item.price, 0);
        
        this.saveCallback();
        return true;
    }
    
    // 구매 리스트 항목 삭제
    deleteShoppingListItem(locationId, itemId) {
        const locationList = this.settings.baking.shoppingList.find(list => list.id === locationId);
        if (!locationList) return false;
        
        const index = locationList.items.findIndex(i => i.id === itemId);
        if (index === -1) return false;
        
        locationList.items.splice(index, 1);
        
        // 항목이 없으면 리스트 자체 삭제
        if (locationList.items.length === 0) {
            const listIndex = this.settings.baking.shoppingList.findIndex(list => list.id === locationId);
            this.settings.baking.shoppingList.splice(listIndex, 1);
        } else {
            // 총액 재계산
            locationList.totalPrice = locationList.items.reduce((sum, item) => sum + item.price, 0);
        }
        
        this.saveCallback();
        return true;
    }
    
    // 항목 장소 변경
    moveShoppingListItem(fromLocationId, itemId, toLocation) {
        const fromList = this.settings.baking.shoppingList.find(list => list.id === fromLocationId);
        if (!fromList) return false;
        
        const itemIndex = fromList.items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return false;
        
        const item = fromList.items[itemIndex];
        fromList.items.splice(itemIndex, 1);
        
        // 원래 리스트 총액 재계산
        fromList.totalPrice = fromList.items.reduce((sum, i) => sum + i.price, 0);
        
        // 원래 리스트가 비었으면 삭제
        if (fromList.items.length === 0) {
            const listIndex = this.settings.baking.shoppingList.findIndex(list => list.id === fromLocationId);
            this.settings.baking.shoppingList.splice(listIndex, 1);
        }
        
        // 새 장소에 추가
        this.addToShoppingList(item.name, item.qty, item.unit, toLocation, item.price, item.sources);
        
        return true;
    }
    
    // 장소별 구매 완료
    completePurchase(locationId) {
        const locationList = this.settings.baking.shoppingList.find(list => list.id === locationId);
        if (!locationList) return { success: false, error: "리스트를 찾을 수 없습니다" };
        
        const location = locationList.location;
        const totalPrice = locationList.totalPrice;
        
        // 1. 재고에 전부 추가
        if (this.inventoryModule) {
            locationList.items.forEach(item => {
                const existingItem = this.inventoryModule.settings.inventory.items.find(i => 
                    i.name === item.name && i.type === "ingredient"
                );
                
                if (existingItem) {
                    // 기존 재료 수량 증가
                    this.inventoryModule.updateItem(existingItem.id, {
                        qty: existingItem.qty + item.qty,
                        reason: `구매 (${location})`,
                        source: "purchase"
                    });
                } else {
                    // 새 재료 추가
                    this.inventoryModule.addItem({
                        name: item.name,
                        qty: item.qty,
                        unit: item.unit,
                        category: "기타",
                        minStock: 0,
                        type: "ingredient",
                        reason: `구매 (${location})`,
                        source: "purchase"
                    });
                }
            });
        }
        
        // 2. 잔고에서 차감
        if (this.settings.balance) {
            const shopEnabled = this.settings.balance.shopMode?.enabled;
            
            if (shopEnabled) {
                // 가게 모드: 가게 운영비에서 차감
                this.settings.balance.shopMode.operatingFund -= totalPrice;
            } else {
                // 개인 모드: 생활비에서 차감
                this.settings.balance.living -= totalPrice;
            }
            
            // 3. 거래 내역 추가
            if (!this.settings.balance.transactions) {
                this.settings.balance.transactions = [];
            }
            
            this.settings.balance.transactions.unshift({
                id: ++this.idCounter,
                type: "expense",
                category: "재료 구매",
                description: `재료 구매 (${location})`,
                amount: totalPrice,
                date: this.formatDate(this.getRpDate()),
                source: shopEnabled ? "shop" : "personal"
            });
        }
        
        // 4. 구매 리스트에서 제거
        const listIndex = this.settings.baking.shoppingList.findIndex(list => list.id === locationId);
        this.settings.baking.shoppingList.splice(listIndex, 1);
        
        this.saveCallback();
        return { success: true, totalPrice, itemCount: locationList.items.length };
    }
    
    // 전체 구매 완료
    completeAllPurchases() {
        let totalPrice = 0;
        let totalItems = 0;
        const locations = [...this.settings.baking.shoppingList];
        
        locations.forEach(list => {
            const result = this.completePurchase(list.id);
            if (result.success) {
                totalPrice += result.totalPrice;
                totalItems += result.itemCount;
            }
        });
        
        return { success: true, totalPrice, totalItems };
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
    
    formatCurrency(amount) {
        return amount.toLocaleString('ko-KR');
    }
    
    // ===== UI 렌더링 =====
    render(container) {
        const recipes = this.settings.baking.recipes;
        const history = this.settings.baking.bakingHistory.slice(0, 10);  // 최근 10건만
        
        // Preserve accordion state
        const contentEl = container.querySelector('.sstssd-module-content');
        let isOpen = contentEl ? contentEl.classList.contains('sstssd-module-open') : false;
        
        // Check global settings if available and content element doesn't exist yet
        if (!contentEl && this.getGlobalSettings) {
            const globalSettings = this.getGlobalSettings();
            isOpen = globalSettings.openModules.includes(this.moduleName);
        }
        
        container.innerHTML = `
            <div class="sstssd-module-header" data-module="${this.moduleName}">
                <div class="sstssd-module-title">
                    <span class="sstssd-module-icon">🧁</span>
                    <span>베이킹</span>
                </div>
                <button class="sstssd-module-toggle">${isOpen ? '▲' : '▼'}</button>
            </div>
            <div class="sstssd-module-content ${isOpen ? 'sstssd-module-open' : ''}" data-module="${this.moduleName}">
                <!-- 레시피 목록 -->
                <div class="sstssd-section">
                    <div class="sstssd-section-title">📖 레시피</div>
                    ${recipes.length > 0 ? `
                        ${recipes.map(recipe => this.renderRecipeItem(recipe)).join('')}
                    ` : `
                        <div class="sstssd-empty">레시피가 없습니다</div>
                    `}
                    <button class="sstssd-btn sstssd-btn-add" data-action="add-recipe">+ 레시피 추가</button>
                </div>
                
                <!-- 구매 리스트 -->
                ${this.renderShoppingList()}
                
                <!-- 베이킹 이력 -->
                ${history.length > 0 ? `
                    <div class="sstssd-section">
                        <div class="sstssd-section-title">📜 베이킹 이력</div>
                        ${history.map(h => this.renderHistoryItem(h)).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        this.attachEventListeners(container);
        
        // Update summary after rendering
        if (typeof window.sstsdUpdateSummary === 'function') {
            window.sstsdUpdateSummary();
        }
    }
    
    // 레시피 항목 렌더링
    renderRecipeItem(recipe) {
        return `
            <div class="sstssd-baking-item" data-id="${recipe.id}">
                <div class="sstssd-baking-header">
                    <span class="sstssd-baking-name">${this.escapeHtml(recipe.name)}</span>
                    <span class="sstssd-baking-yield">(${recipe.yieldQty}${recipe.yieldUnit})</span>
                </div>
                <div class="sstssd-baking-ingredients">
                    ${recipe.ingredients.map(ing => `
                        <span class="sstssd-ingredient-tag">${ing.name} ${ing.qty}${ing.unit}</span>
                    `).join('')}
                </div>
                <div class="sstssd-baking-actions">
                    <button class="sstssd-btn sstssd-btn-sm sstssd-btn-primary" data-action="bake" data-id="${recipe.id}">🧁 베이킹</button>
                    <button class="sstssd-btn sstssd-btn-sm" data-action="edit-recipe" data-id="${recipe.id}">✏️</button>
                    <button class="sstssd-btn sstssd-btn-sm" data-action="delete-recipe" data-id="${recipe.id}">🗑</button>
                </div>
            </div>
        `;
    }
    
    // 이력 항목 렌더링
    renderHistoryItem(h) {
        return `
            <div class="sstssd-history-item">
                <span class="sstssd-history-date">${h.date}</span>
                <span>${this.escapeHtml(h.recipeName)} ×${h.yieldQty}${h.yieldUnit} 제작</span>
            </div>
        `;
    }
    
    // 구매 리스트 렌더링
    renderShoppingList() {
        const shoppingList = this.settings.baking.shoppingList || [];
        
        if (shoppingList.length === 0) {
            return '';
        }
        
        const totalPrice = shoppingList.reduce((sum, list) => sum + list.totalPrice, 0);
        
        return `
            <div class="sstssd-section">
                <div class="sstssd-section-title">🛒 구매 리스트</div>
                ${shoppingList.map(locationList => this.renderShoppingListLocation(locationList)).join('')}
                
                <div class="sstssd-shopping-total">
                    <span>총 예상:</span>
                    <span class="sstssd-amount">${this.formatCurrency(totalPrice)}</span>
                </div>
                
                <div class="sstssd-shopping-actions">
                    <button class="sstssd-btn sstssd-btn-sm" data-action="add-shopping-item">+ 수동 추가</button>
                    <button class="sstssd-btn sstssd-btn-primary" data-action="complete-all-purchases">전체 구매 완료</button>
                </div>
            </div>
        `;
    }
    
    // 장소별 구매 리스트 렌더링
    renderShoppingListLocation(locationList) {
        const locationIcon = locationList.location === "온라인" ? "🌐" : "🏪";
        
        return `
            <div class="sstssd-shopping-location" data-location-id="${locationList.id}">
                <div class="sstssd-shopping-location-header">
                    ${locationIcon} ${this.escapeHtml(locationList.location)}
                </div>
                ${locationList.items.map(item => this.renderShoppingListItem(item, locationList.id, locationList.location)).join('')}
                <div class="sstssd-shopping-subtotal">
                    <span>소계:</span>
                    <span class="sstssd-amount">${this.formatCurrency(locationList.totalPrice)}</span>
                </div>
                <button class="sstssd-btn sstssd-btn-sm sstssd-btn-primary" 
                        data-action="complete-purchase" 
                        data-location-id="${locationList.id}">
                    ${locationList.location} 구매 완료
                </button>
            </div>
        `;
    }
    
    // 구매 리스트 항목 렌더링
    renderShoppingListItem(item, locationId, currentLocation) {
        const newLocation = currentLocation === "온라인" ? "시장/마트" : "온라인";
        
        return `
            <div class="sstssd-shopping-item" data-item-id="${item.id}">
                <div class="sstssd-shopping-item-main">
                    <span class="sstssd-shopping-checkbox">⬜</span>
                    <div class="sstssd-shopping-item-info">
                        <div class="sstssd-shopping-item-name">
                            ${this.escapeHtml(item.name)} ${item.qty}${item.unit}
                        </div>
                        ${item.sources.length > 0 ? `
                            <div class="sstssd-shopping-item-sources">
                                └ ${item.sources.join(' + ')}
                            </div>
                        ` : ''}
                    </div>
                    <span class="sstssd-shopping-price">${this.formatCurrency(item.price)}</span>
                </div>
                <div class="sstssd-shopping-item-actions">
                    <button class="sstssd-btn sstssd-btn-xs" 
                            data-action="edit-shopping-qty" 
                            data-location-id="${locationId}" 
                            data-item-id="${item.id}">수량 수정</button>
                    <button class="sstssd-btn sstssd-btn-xs" 
                            data-action="edit-shopping-price" 
                            data-location-id="${locationId}" 
                            data-item-id="${item.id}">가격 수정</button>
                    <button class="sstssd-btn sstssd-btn-xs" 
                            data-action="delete-shopping-item" 
                            data-location-id="${locationId}" 
                            data-item-id="${item.id}">삭제</button>
                    <button class="sstssd-btn sstssd-btn-xs" 
                            data-action="move-shopping-item" 
                            data-location-id="${locationId}" 
                            data-item-id="${item.id}"
                            data-new-location="${newLocation}">장소 변경 →</button>
                </div>
            </div>
        `;
    }
    
    // ===== 이벤트 리스너 =====
    attachEventListeners(container) {
        // 레시피 추가 버튼
        const addRecipeBtn = container.querySelector('[data-action="add-recipe"]');
        if (addRecipeBtn) {
            addRecipeBtn.addEventListener('click', () => this.showAddRecipeModal());
        }
        
        // 베이킹 버튼
        const bakeBtns = container.querySelectorAll('[data-action="bake"]');
        bakeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.showBakeModal(id);
            });
        });
        
        // 레시피 수정 버튼
        const editBtns = container.querySelectorAll('[data-action="edit-recipe"]');
        editBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.showEditRecipeModal(id);
            });
        });
        
        // 레시피 삭제 버튼
        const deleteBtns = container.querySelectorAll('[data-action="delete-recipe"]');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                if (confirm('정말 삭제하시겠습니까?')) {
                    this.deleteRecipe(id);
                    this.render(container);
                }
            });
        });
        
        // 구매 리스트 - 장소별 구매 완료 버튼
        const completePurchaseBtns = container.querySelectorAll('[data-action="complete-purchase"]');
        completePurchaseBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const locationId = parseInt(btn.dataset.locationId);
                if (confirm('이 장소의 구매를 완료하시겠습니까?')) {
                    const result = this.completePurchase(locationId);
                    if (result.success) {
                        alert(`구매 완료! ${result.itemCount}개 항목, 총 ${this.formatCurrency(result.totalPrice)}원`);
                        this.render(container);
                        
                        // 재고 모듈도 다시 렌더링
                        const inventoryContainer = document.querySelector('.sstssd-module[data-module="inventory"]');
                        if (inventoryContainer && this.inventoryModule) {
                            this.inventoryModule.render(inventoryContainer);
                        }
                        
                        // 잔고 모듈도 다시 렌더링
                        const balanceContainer = document.querySelector('.sstssd-module[data-module="balance"]');
                        if (balanceContainer && this.settings.balance) {
                            // Trigger balance module re-render via event or direct call
                            if (typeof window.sstsdUpdateSummary === 'function') {
                                window.sstsdUpdateSummary();
                            }
                        }
                    } else {
                        alert('구매 실패: ' + result.error);
                    }
                }
            });
        });
        
        // 구매 리스트 - 전체 구매 완료 버튼
        const completeAllBtn = container.querySelector('[data-action="complete-all-purchases"]');
        if (completeAllBtn) {
            completeAllBtn.addEventListener('click', () => {
                if (confirm('전체 구매를 완료하시겠습니까?')) {
                    const result = this.completeAllPurchases();
                    if (result.success) {
                        alert(`전체 구매 완료! ${result.totalItems}개 항목, 총 ${this.formatCurrency(result.totalPrice)}원`);
                        this.render(container);
                        
                        // 재고 모듈도 다시 렌더링
                        const inventoryContainer = document.querySelector('.sstssd-module[data-module="inventory"]');
                        if (inventoryContainer && this.inventoryModule) {
                            this.inventoryModule.render(inventoryContainer);
                        }
                    }
                }
            });
        }
        
        // 구매 리스트 - 항목 삭제
        const deleteShoppingBtns = container.querySelectorAll('[data-action="delete-shopping-item"]');
        deleteShoppingBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const locationId = parseInt(btn.dataset.locationId);
                const itemId = parseInt(btn.dataset.itemId);
                if (confirm('항목을 삭제하시겠습니까?')) {
                    this.deleteShoppingListItem(locationId, itemId);
                    this.render(container);
                }
            });
        });
        
        // 구매 리스트 - 장소 변경
        const moveShoppingBtns = container.querySelectorAll('[data-action="move-shopping-item"]');
        moveShoppingBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const locationId = parseInt(btn.dataset.locationId);
                const itemId = parseInt(btn.dataset.itemId);
                const newLocation = btn.dataset.newLocation;
                this.moveShoppingListItem(locationId, itemId, newLocation);
                this.render(container);
            });
        });
        
        // 구매 리스트 - 수량 수정
        const editQtyBtns = container.querySelectorAll('[data-action="edit-shopping-qty"]');
        editQtyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const locationId = parseInt(btn.dataset.locationId);
                const itemId = parseInt(btn.dataset.itemId);
                this.showEditShoppingQtyModal(locationId, itemId, container);
            });
        });
        
        // 구매 리스트 - 가격 수정
        const editPriceBtns = container.querySelectorAll('[data-action="edit-shopping-price"]');
        editPriceBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const locationId = parseInt(btn.dataset.locationId);
                const itemId = parseInt(btn.dataset.itemId);
                this.showEditShoppingPriceModal(locationId, itemId, container);
            });
        });
        
        // 구매 리스트 - 수동 추가
        const addShoppingBtn = container.querySelector('[data-action="add-shopping-item"]');
        if (addShoppingBtn) {
            addShoppingBtn.addEventListener('click', () => this.showAddShoppingItemModal(container));
        }
    }
    
    // ===== 모달 =====
    // 베이킹 계획 추가 모달 (AI 버전)
    showAddRecipeModal() {
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>🧁 베이킹 계획</h3>
                <form id="sstssd-add-recipe-form">
                    <div class="sstssd-form-group">
                        <label>메뉴</label>
                        <input type="text" name="name" class="sstssd-input" required placeholder="예: 딸기 마카롱">
                    </div>
                    <div class="sstssd-form-group">
                        <label>수량</label>
                        <div style="display: flex; gap: 8px;">
                            <input type="number" name="yieldQty" class="sstssd-input" value="30" required style="flex: 2;">
                            <input type="text" name="yieldUnit" class="sstssd-input" value="개" required style="flex: 1;">
                        </div>
                    </div>
                    <div class="sstssd-form-group">
                        <label>납품일 (선택)</label>
                        <input type="date" name="deadline" class="sstssd-input">
                    </div>
                    <div class="sstssd-form-actions">
                        <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                        <button type="button" class="sstssd-btn" id="simple-add-btn">간단 추가</button>
                        <button type="button" class="sstssd-btn sstssd-btn-primary" id="ai-plan-btn">AI에게 계획 요청</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#sstssd-add-recipe-form');
        const cancelBtn = modal.querySelector('.sstssd-btn-cancel');
        const simpleAddBtn = modal.querySelector('#simple-add-btn');
        const aiPlanBtn = modal.querySelector('#ai-plan-btn');
        const overlay = modal.querySelector('.sstssd-modal-overlay');
        
        // Simple add without AI
        simpleAddBtn.addEventListener('click', () => {
            const formData = new FormData(form);
            const name = formData.get('name');
            const yieldQty = parseInt(formData.get('yieldQty'));
            const yieldUnit = formData.get('yieldUnit');
            
            if (!name || !yieldQty) {
                alert('메뉴와 수량을 입력해주세요.');
                return;
            }
            
            this.addRecipe({
                name: name,
                yieldQty: yieldQty,
                yieldUnit: yieldUnit,
                ingredients: []  // No ingredients for simple add
            });
            
            const moduleContainer = document.querySelector('.sstssd-module[data-module="baking"]');
            if (moduleContainer) {
                this.render(moduleContainer);
            }
            
            modal.remove();
        });
        
        // AI plan request
        aiPlanBtn.addEventListener('click', async () => {
            const formData = new FormData(form);
            const name = formData.get('name');
            const yieldQty = parseInt(formData.get('yieldQty'));
            const yieldUnit = formData.get('yieldUnit');
            
            if (!name || !yieldQty) {
                alert('메뉴와 수량을 입력해주세요.');
                return;
            }
            
            modal.remove();
            await this.showAIPlanningModal(name, yieldQty, yieldUnit);
        });
        
        cancelBtn.addEventListener('click', () => modal.remove());
        overlay.addEventListener('click', () => modal.remove());
    }
    
    // AI 계획 생성 모달
    async showAIPlanningModal(recipeName, yieldQty, yieldUnit) {
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <div class="sstssd-baking-ai-loading">
                    <h3>🧁 AI가 계획을 세우고 있어요...</h3>
                    <p>${this.escapeHtml(recipeName)} ${yieldQty}${yieldUnit} 제작 계획</p>
                    <div class="sstssd-loading-spinner">⏳</div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        try {
            // Call AI to generate plan
            const plan = await this.generateBakingPlan(recipeName, yieldQty, yieldUnit);
            modal.remove();
            
            if (plan) {
                this.showAIPlanConfirmationModal(recipeName, yieldQty, yieldUnit, plan);
            } else {
                throw new Error('AI 응답을 받지 못했습니다.');
            }
        } catch (error) {
            modal.remove();
            this.showAIFailureModal(recipeName, yieldQty, yieldUnit, error.message);
        }
    }
    
    // AI 호출 함수
    async generateBakingPlan(recipeName, yieldQty, yieldUnit) {
        try {
            // Try to use SillyTavern's generation API
            let context = null;
            try {
                context = typeof window !== 'undefined' && typeof window.getContext === 'function' ? window.getContext() : null;
            } catch (e) {
                // getContext not available
            }
            
            if (!context || !context.generateRaw) {
                throw new Error('AI generation API not available');
            }
            
            const prompt = `${recipeName} ${yieldQty}${yieldUnit}를 만들기 위한 베이킹 계획을 세워줘.
다음 형식으로 답변해:

<BAKE_PLAN>
steps:
- name: "재료 계량"
  estimatedTime: "14:00~14:15"
- name: "반죽 만들기"
  estimatedTime: "14:15~14:45"
ingredients:
- name: "밀가루"
  qty: 500
  unit: "g"
- name: "설탕"
  qty: 200
  unit: "g"
</BAKE_PLAN>

위 형식을 정확히 지켜서 답변해줘. 다른 설명은 필요 없어.`;
            
            const response = await context.generateRaw(prompt, '', false, false);
            
            // Parse AI response
            return this.parseBakingPlan(response);
        } catch (error) {
            console.error('AI generation failed:', error);
            // Return a default plan as fallback
            return this.generateDefaultPlan(recipeName, yieldQty, yieldUnit);
        }
    }
    
    // AI 응답 파싱
    parseBakingPlan(response) {
        try {
            // Extract content between <BAKE_PLAN> tags
            const match = response.match(/<BAKE_PLAN>([\s\S]*?)<\/BAKE_PLAN>/);
            if (!match) {
                throw new Error('Invalid format');
            }
            
            const content = match[1];
            const steps = [];
            const ingredients = [];
            
            // Parse steps
            const stepsMatch = content.match(/steps:([\s\S]*?)ingredients:/);
            if (stepsMatch) {
                const stepsText = stepsMatch[1];
                const stepMatches = stepsText.matchAll(/- name: "(.+?)"\s+estimatedTime: "(.+?)"/g);
                for (const stepMatch of stepMatches) {
                    steps.push({
                        name: stepMatch[1],
                        estimatedTime: stepMatch[2]
                    });
                }
            }
            
            // Parse ingredients
            const ingredientsText = content.split('ingredients:')[1];
            if (ingredientsText) {
                // Updated regex to support decimal quantities
                const ingMatches = ingredientsText.matchAll(/- name: "(.+?)"\s+qty: (\d+(?:\.\d+)?)\s+unit: "(.+?)"/g);
                for (const ingMatch of ingMatches) {
                    // Round to 2 decimal places to avoid precision issues
                    const qty = Math.round(parseFloat(ingMatch[2]) * 100) / 100;
                    ingredients.push({
                        name: ingMatch[1],
                        qty: qty,
                        unit: ingMatch[3]
                    });
                }
            }
            
            return { steps, ingredients };
        } catch (error) {
            console.error('Failed to parse AI response:', error);
            return null;
        }
    }
    
    // 기본 계획 생성 (AI 실패 시)
    generateDefaultPlan(recipeName, yieldQty, yieldUnit) {
        const ratios = BakingModule.DEFAULT_INGREDIENT_RATIOS;
        
        return {
            steps: [
                { name: "재료 계량", estimatedTime: "14:00~14:15" },
                { name: "반죽 만들기", estimatedTime: "14:15~14:45" },
                { name: "성형", estimatedTime: "14:45~15:15" },
                { name: "굽기", estimatedTime: "15:15~15:45" },
                { name: "마무리", estimatedTime: "15:45~16:00" }
            ],
            ingredients: [
                { name: "밀가루", qty: Math.round(yieldQty * ratios.FLOUR_PER_UNIT), unit: "g" },
                { name: "설탕", qty: Math.round(yieldQty * ratios.SUGAR_PER_UNIT), unit: "g" },
                { name: "버터", qty: Math.round(yieldQty * ratios.BUTTER_PER_UNIT), unit: "g" },
                { name: "달걀", qty: Math.max(1, Math.round(yieldQty * ratios.EGG_PER_10_UNITS / 10)), unit: "개" }
            ]
        };
    }
    
    // AI 계획 확인 모달
    showAIPlanConfirmationModal(recipeName, yieldQty, yieldUnit, plan) {
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        
        // Check ingredient availability
        const ingredientStatus = plan.ingredients.map(ing => {
            const item = this.inventoryModule?.settings.inventory.items.find(i => 
                i.name === ing.name && i.type === "ingredient"
            );
            const available = item ? item.qty : 0;
            const sufficient = available >= ing.qty;
            
            return {
                ...ing,
                available,
                sufficient,
                status: sufficient ? 'ok' : (available > 0 ? 'low' : 'none')
            };
        });
        
        const hasIssues = ingredientStatus.some(i => !i.sufficient);
        
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>🧁 베이킹 계획 확인</h3>
                <div class="sstssd-plan-summary">
                    <p><strong>📋 ${this.escapeHtml(recipeName)} ×${yieldQty}${yieldUnit}</strong></p>
                </div>
                
                <div class="sstssd-plan-section">
                    <h4>📝 단계:</h4>
                    <div class="sstssd-steps-list">
                        ${plan.steps.map((step, idx) => `
                            <div class="sstssd-step-item">
                                <span class="sstssd-step-num">${idx + 1}.</span>
                                <span class="sstssd-step-name">${this.escapeHtml(step.name)}</span>
                                <span class="sstssd-step-time">${this.escapeHtml(step.estimatedTime)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="sstssd-plan-section">
                    <h4>🥄 필요 재료:</h4>
                    <div class="sstssd-ingredients-list">
                        ${ingredientStatus.map(ing => `
                            <div class="sstssd-ingredient-item sstssd-ingredient-${ing.status}">
                                <span class="sstssd-ingredient-icon">${ing.status === 'ok' ? '✅' : ing.status === 'low' ? '⚠️' : '❌'}</span>
                                <span class="sstssd-ingredient-name">${this.escapeHtml(ing.name)}</span>
                                <span class="sstssd-ingredient-qty">${ing.qty}${ing.unit}</span>
                                <span class="sstssd-ingredient-avail">(보유: ${ing.available}${ing.unit})</span>
                            </div>
                        `).join('')}
                    </div>
                    ${hasIssues ? `
                        <div class="sstssd-warning-box">
                            <p>⚠️ 부족/없는 재료가 있습니다</p>
                            <button type="button" class="sstssd-btn sstssd-btn-sm" id="add-to-shopping">구매 리스트에 추가</button>
                        </div>
                    ` : ''}
                </div>
                
                <div class="sstssd-form-actions">
                    <button type="button" class="sstssd-btn" id="retry-ai">다시 요청</button>
                    <button type="button" class="sstssd-btn" id="edit-plan">수정</button>
                    <button type="button" class="sstssd-btn sstssd-btn-primary" id="confirm-plan">확인</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const overlay = modal.querySelector('.sstssd-modal-overlay');
        const retryBtn = modal.querySelector('#retry-ai');
        const editBtn = modal.querySelector('#edit-plan');
        const confirmBtn = modal.querySelector('#confirm-plan');
        const addToShoppingBtn = modal.querySelector('#add-to-shopping');
        
        if (addToShoppingBtn) {
            addToShoppingBtn.addEventListener('click', () => {
                // Add insufficient ingredients to shopping list
                ingredientStatus.forEach(ing => {
                    if (!ing.sufficient) {
                        const needed = ing.qty - ing.available;
                        this.addToShoppingList(
                            ing.name,
                            needed,
                            ing.unit,
                            "온라인",
                            0,  // Price will need to be set manually
                            [`${recipeName} ×${yieldQty} 제작용`]
                        );
                    }
                });
                alert('부족한 재료를 구매 리스트에 추가했습니다!');
                
                // Re-render baking module to show updated shopping list
                const bakingContainer = document.querySelector('.sstssd-module[data-module="baking"]');
                if (bakingContainer) {
                    this.render(bakingContainer);
                }
            });
        }
        
        retryBtn.addEventListener('click', async () => {
            modal.remove();
            await this.showAIPlanningModal(recipeName, yieldQty, yieldUnit);
        });
        
        editBtn.addEventListener('click', () => {
            modal.remove();
            this.showManualEditModal(recipeName, yieldQty, yieldUnit, plan);
        });
        
        confirmBtn.addEventListener('click', () => {
            this.addRecipe({
                name: recipeName,
                yieldQty: yieldQty,
                yieldUnit: yieldUnit,
                ingredients: plan.ingredients,
                steps: plan.steps
            });
            
            const moduleContainer = document.querySelector('.sstssd-module[data-module="baking"]');
            if (moduleContainer) {
                this.render(moduleContainer);
            }
            
            modal.remove();
        });
        
        overlay.addEventListener('click', () => modal.remove());
    }
    
    // AI 실패 시 모달
    showAIFailureModal(recipeName, yieldQty, yieldUnit, errorMsg) {
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>⚠️ AI 응답 실패</h3>
                <p>${this.escapeHtml(errorMsg)}</p>
                <p>수동으로 입력하시겠습니까?</p>
                <div class="sstssd-form-actions">
                    <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                    <button type="button" class="sstssd-btn" id="retry-ai">다시 시도</button>
                    <button type="button" class="sstssd-btn sstssd-btn-primary" id="manual-input">수동 입력</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const overlay = modal.querySelector('.sstssd-modal-overlay');
        const cancelBtn = modal.querySelector('.sstssd-btn-cancel');
        const retryBtn = modal.querySelector('#retry-ai');
        const manualBtn = modal.querySelector('#manual-input');
        
        cancelBtn.addEventListener('click', () => modal.remove());
        overlay.addEventListener('click', () => modal.remove());
        
        retryBtn.addEventListener('click', async () => {
            modal.remove();
            await this.showAIPlanningModal(recipeName, yieldQty, yieldUnit);
        });
        
        manualBtn.addEventListener('click', () => {
            modal.remove();
            this.showManualAddModal(recipeName, yieldQty, yieldUnit);
        });
    }
    
    // 수동 추가 모달 (구 방식)
    showManualAddModal(recipeName = '', yieldQty = 1, yieldUnit = '개') {
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>🧁 레시피 추가 (수동)</h3>
                <form id="sstssd-add-recipe-form">
                    <div class="sstssd-form-group">
                        <label>제품명</label>
                        <input type="text" name="name" class="sstssd-input" value="${this.escapeHtml(recipeName)}" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>생산량</label>
                        <div style="display: flex; gap: 8px;">
                            <input type="number" name="yieldQty" class="sstssd-input" value="${yieldQty}" required style="flex: 1;">
                            <input type="text" name="yieldUnit" class="sstssd-input" value="${yieldUnit}" required style="flex: 1;">
                        </div>
                    </div>
                    <div class="sstssd-form-group">
                        <label>재료 (JSON 형식)</label>
                        <textarea name="ingredients" class="sstssd-input" rows="5" placeholder='[{"name":"아몬드가루","qty":300,"unit":"g"}]' required></textarea>
                        <small>예시: [{"name":"아몬드가루","qty":300,"unit":"g"},{"name":"설탕","qty":200,"unit":"g"}]</small>
                    </div>
                    <div class="sstssd-form-actions">
                        <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                        <button type="submit" class="sstssd-btn sstssd-btn-primary">추가</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#sstssd-add-recipe-form');
        const cancelBtn = modal.querySelector('.sstssd-btn-cancel');
        const overlay = modal.querySelector('.sstssd-modal-overlay');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            try {
                const ingredients = JSON.parse(formData.get('ingredients'));
                
                this.addRecipe({
                    name: formData.get('name'),
                    yieldQty: parseInt(formData.get('yieldQty')),
                    yieldUnit: formData.get('yieldUnit'),
                    ingredients: ingredients
                });
                
                const moduleContainer = document.querySelector('.sstssd-module[data-module="baking"]');
                if (moduleContainer) {
                    this.render(moduleContainer);
                }
                
                modal.remove();
            } catch (error) {
                alert('재료 JSON 형식이 올바르지 않습니다: ' + error.message);
            }
        });
        
        cancelBtn.addEventListener('click', () => modal.remove());
        overlay.addEventListener('click', () => modal.remove());
    }
    
    // 계획 수정 모달
    showManualEditModal(recipeName, yieldQty, yieldUnit, plan) {
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>✏️ 계획 수정</h3>
                <form id="sstssd-edit-plan-form">
                    <div class="sstssd-form-group">
                        <label>재료 (JSON 형식)</label>
                        <textarea name="ingredients" class="sstssd-input" rows="8">${JSON.stringify(plan.ingredients, null, 2)}</textarea>
                    </div>
                    <div class="sstssd-form-actions">
                        <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                        <button type="submit" class="sstssd-btn sstssd-btn-primary">저장</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#sstssd-edit-plan-form');
        const cancelBtn = modal.querySelector('.sstssd-btn-cancel');
        const overlay = modal.querySelector('.sstssd-modal-overlay');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            try {
                const ingredients = JSON.parse(formData.get('ingredients'));
                plan.ingredients = ingredients;
                
                modal.remove();
                this.showAIPlanConfirmationModal(recipeName, yieldQty, yieldUnit, plan);
            } catch (error) {
                alert('JSON 형식이 올바르지 않습니다: ' + error.message);
            }
        });
        
        cancelBtn.addEventListener('click', () => modal.remove());
        overlay.addEventListener('click', () => modal.remove());
    }
    
    // 레시피 수정 모달
    showEditRecipeModal(id) {
        const recipe = this.settings.baking.recipes.find(r => r.id === id);
        if (!recipe) return;
        
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>✏️ 레시피 수정</h3>
                <form id="sstssd-edit-recipe-form">
                    <div class="sstssd-form-group">
                        <label>제품명</label>
                        <input type="text" name="name" class="sstssd-input" value="${this.escapeHtml(recipe.name)}" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>생산량</label>
                        <div style="display: flex; gap: 8px;">
                            <input type="number" name="yieldQty" class="sstssd-input" value="${recipe.yieldQty}" required style="flex: 1;">
                            <input type="text" name="yieldUnit" class="sstssd-input" value="${recipe.yieldUnit}" required style="flex: 1;">
                        </div>
                    </div>
                    <div class="sstssd-form-group">
                        <label>재료 (JSON 형식)</label>
                        <textarea name="ingredients" class="sstssd-input" rows="5" required>${JSON.stringify(recipe.ingredients)}</textarea>
                    </div>
                    <div class="sstssd-form-actions">
                        <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                        <button type="submit" class="sstssd-btn sstssd-btn-primary">저장</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#sstssd-edit-recipe-form');
        const cancelBtn = modal.querySelector('.sstssd-btn-cancel');
        const overlay = modal.querySelector('.sstssd-modal-overlay');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            try {
                const ingredients = JSON.parse(formData.get('ingredients'));
                
                this.updateRecipe(id, {
                    name: formData.get('name'),
                    yieldQty: parseInt(formData.get('yieldQty')),
                    yieldUnit: formData.get('yieldUnit'),
                    ingredients: ingredients
                });
                
                const moduleContainer = document.querySelector('.sstssd-module[data-module="baking"]');
                if (moduleContainer) {
                    this.render(moduleContainer);
                }
                
                modal.remove();
            } catch (error) {
                alert('재료 JSON 형식이 올바르지 않습니다: ' + error.message);
            }
        });
        
        cancelBtn.addEventListener('click', () => modal.remove());
        overlay.addEventListener('click', () => modal.remove());
    }
    
    // 베이킹 실행 모달
    showBakeModal(recipeId) {
        const recipe = this.settings.baking.recipes.find(r => r.id === recipeId);
        if (!recipe) return;
        
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>🧁 베이킹 실행</h3>
                <form id="sstssd-bake-form">
                    <div class="sstssd-form-group">
                        <label>레시피: ${this.escapeHtml(recipe.name)}</label>
                    </div>
                    <div class="sstssd-form-group">
                        <label>배수 (1배 = ${recipe.yieldQty}${recipe.yieldUnit})</label>
                        <input type="number" name="multiplier" class="sstssd-input" value="1" min="1" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>필요 재료</label>
                        <div id="ingredient-check"></div>
                    </div>
                    <div class="sstssd-form-actions">
                        <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                        <button type="submit" class="sstssd-btn sstssd-btn-primary">베이킹 시작</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#sstssd-bake-form');
        const multiplierInput = form.querySelector('[name="multiplier"]');
        const ingredientCheck = modal.querySelector('#ingredient-check');
        const cancelBtn = modal.querySelector('.sstssd-btn-cancel');
        const overlay = modal.querySelector('.sstssd-modal-overlay');
        
        // 재료 확인 업데이트 함수
        const updateIngredientCheck = () => {
            const multiplier = parseInt(multiplierInput.value) || 1;
            let html = '<ul style="margin: 0; padding-left: 20px;">';
            
            recipe.ingredients.forEach(ing => {
                const required = ing.qty * multiplier;
                const item = this.inventoryModule?.settings.inventory.items.find(i => 
                    i.name === ing.name && i.type === "ingredient"
                );
                const available = item ? item.qty : 0;
                const sufficient = available >= required;
                const icon = sufficient ? '✅' : '❌';
                
                html += `<li>${icon} ${ing.name}: ${required}${ing.unit} (보유: ${available}${ing.unit})</li>`;
            });
            
            html += '</ul>';
            ingredientCheck.innerHTML = html;
        };
        
        // 초기 재료 확인
        updateIngredientCheck();
        
        // 배수 변경 시 재료 확인 업데이트
        multiplierInput.addEventListener('input', updateIngredientCheck);
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const multiplier = parseInt(formData.get('multiplier'));
            
            const result = this.performBaking(recipeId, multiplier);
            
            if (result.success) {
                const finalQty = recipe.yieldQty * multiplier;
                const recipeName = recipe.name;
                
                modal.remove();
                
                // Show Instagram posting option if instagram module is available
                if (this.instagramModule) {
                    this.showInstagramPostOption(recipeName, finalQty, recipe.yieldUnit);
                } else {
                    alert(`${recipeName} ×${finalQty}${recipe.yieldUnit} 제작 완료!`);
                }
                
                // 모든 관련 모듈 다시 렌더링
                const bakingContainer = document.querySelector('.sstssd-module[data-module="baking"]');
                const inventoryContainer = document.querySelector('.sstssd-module[data-module="inventory"]');
                
                if (bakingContainer) {
                    this.render(bakingContainer);
                }
                
                if (inventoryContainer && this.inventoryModule) {
                    this.inventoryModule.render(inventoryContainer);
                }
            } else {
                alert('베이킹 실패: ' + result.error);
            }
        });
        
        cancelBtn.addEventListener('click', () => modal.remove());
        overlay.addEventListener('click', () => modal.remove());
    }
    
    // Instagram 게시 옵션 모달
    showInstagramPostOption(recipeName, qty, unit) {
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>🧁 베이킹 완료!</h3>
                <p>${this.escapeHtml(recipeName)} ×${qty}${unit} 제작 완료!</p>
                <p>인스타그램에 올리시겠습니까?</p>
                <div class="sstssd-form-actions">
                    <button type="button" class="sstssd-btn sstssd-btn-cancel" id="skip-post">안 올림</button>
                    <button type="button" class="sstssd-btn sstssd-btn-primary" id="post-to-insta">올리기</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const skipBtn = modal.querySelector('#skip-post');
        const postBtn = modal.querySelector('#post-to-insta');
        const overlay = modal.querySelector('.sstssd-modal-overlay');
        
        skipBtn.addEventListener('click', () => {
            modal.remove();
        });
        
        postBtn.addEventListener('click', () => {
            modal.remove();
            // Open Instagram post modal with pre-filled baking info
            if (this.instagramModule) {
                this.instagramModule.showAddPostModal(`${recipeName} ${qty}${unit}`);
            }
        });
        
        overlay.addEventListener('click', () => modal.remove());
    }
    
    // 구매 리스트 - 수동 추가 모달
    showAddShoppingItemModal(container) {
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>🛒 구매 항목 추가</h3>
                <form id="sstssd-add-shopping-form">
                    <div class="sstssd-form-group">
                        <label>재료명</label>
                        <input type="text" name="name" class="sstssd-input" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>수량</label>
                        <input type="number" name="qty" class="sstssd-input" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>단위</label>
                        <input type="text" name="unit" class="sstssd-input" value="g" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>가격 (원)</label>
                        <input type="number" name="price" class="sstssd-input" value="0" step="1" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>구매 장소</label>
                        <select name="location" class="sstssd-input">
                            <option value="온라인">온라인</option>
                            <option value="시장/마트">시장/마트</option>
                        </select>
                    </div>
                    <div class="sstssd-form-actions">
                        <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                        <button type="submit" class="sstssd-btn sstssd-btn-primary">추가</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#sstssd-add-shopping-form');
        const cancelBtn = modal.querySelector('.sstssd-btn-cancel');
        const overlay = modal.querySelector('.sstssd-modal-overlay');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            this.addToShoppingList(
                formData.get('name'),
                parseFloat(formData.get('qty')),
                formData.get('unit'),
                formData.get('location'),
                parseInt(formData.get('price')),
                []
            );
            
            modal.remove();
            this.render(container);
        });
        
        cancelBtn.addEventListener('click', () => modal.remove());
        overlay.addEventListener('click', () => modal.remove());
    }
    
    // 구매 리스트 - 수량 수정 모달
    showEditShoppingQtyModal(locationId, itemId, container) {
        const locationList = this.settings.baking.shoppingList.find(list => list.id === locationId);
        if (!locationList) return;
        
        const item = locationList.items.find(i => i.id === itemId);
        if (!item) return;
        
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>수량 수정</h3>
                <form id="sstssd-edit-qty-form">
                    <div class="sstssd-form-group">
                        <label>${this.escapeHtml(item.name)}</label>
                    </div>
                    <div class="sstssd-form-group">
                        <label>수량</label>
                        <input type="number" name="qty" class="sstssd-input" value="${item.qty}" required>
                    </div>
                    <div class="sstssd-form-actions">
                        <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                        <button type="submit" class="sstssd-btn sstssd-btn-primary">저장</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#sstssd-edit-qty-form');
        const cancelBtn = modal.querySelector('.sstssd-btn-cancel');
        const overlay = modal.querySelector('.sstssd-modal-overlay');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            this.updateShoppingListItem(locationId, itemId, {
                qty: parseFloat(formData.get('qty'))
            });
            
            modal.remove();
            this.render(container);
        });
        
        cancelBtn.addEventListener('click', () => modal.remove());
        overlay.addEventListener('click', () => modal.remove());
    }
    
    // 구매 리스트 - 가격 수정 모달
    showEditShoppingPriceModal(locationId, itemId, container) {
        const locationList = this.settings.baking.shoppingList.find(list => list.id === locationId);
        if (!locationList) return;
        
        const item = locationList.items.find(i => i.id === itemId);
        if (!item) return;
        
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>가격 수정</h3>
                <form id="sstssd-edit-price-form">
                    <div class="sstssd-form-group">
                        <label>${this.escapeHtml(item.name)}</label>
                    </div>
                    <div class="sstssd-form-group">
                        <label>가격 (원)</label>
                        <input type="number" name="price" class="sstssd-input" value="${item.price}" step="1" required>
                    </div>
                    <div class="sstssd-form-actions">
                        <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                        <button type="submit" class="sstssd-btn sstssd-btn-primary">저장</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#sstssd-edit-price-form');
        const cancelBtn = modal.querySelector('.sstssd-btn-cancel');
        const overlay = modal.querySelector('.sstssd-modal-overlay');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            this.updateShoppingListItem(locationId, itemId, {
                price: parseInt(formData.get('price'))
            });
            
            modal.remove();
            this.render(container);
        });
        
        cancelBtn.addEventListener('click', () => modal.remove());
        overlay.addEventListener('click', () => modal.remove());
    }
}
