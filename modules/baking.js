// 🧁 베이킹 모듈 (Baking Module)
export class BakingModule {
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
                bakingHistory: []
            };
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
                ...this.settings.baking.bakingHistory.map(h => h.id || 0)
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
    }
    
    // ===== 모달 =====
    // 레시피 추가 모달
    showAddRecipeModal() {
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>🧁 레시피 추가</h3>
                <form id="sstssd-add-recipe-form">
                    <div class="sstssd-form-group">
                        <label>제품명</label>
                        <input type="text" name="name" class="sstssd-input" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>생산량</label>
                        <div style="display: flex; gap: 8px;">
                            <input type="number" name="yieldQty" class="sstssd-input" value="1" required style="flex: 1;">
                            <input type="text" name="yieldUnit" class="sstssd-input" value="개" required style="flex: 1;">
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
}
