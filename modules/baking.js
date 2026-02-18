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
                    ingredients.push({
                        name: ingMatch[1],
                        qty: parseFloat(ingMatch[2]),
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
                { name: "달걀", qty: Math.max(1, Math.round(yieldQty / 10)), unit: "개" }
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
                if (this.inventoryModule) {
                    ingredientStatus.forEach(ing => {
                        if (!ing.sufficient) {
                            const needed = ing.qty - ing.available;
                            this.inventoryModule.addShoppingItem({
                                name: ing.name,
                                qty: needed,
                                unit: ing.unit
                            });
                        }
                    });
                    alert('부족한 재료를 구매 리스트에 추가했습니다!');
                    
                    // Re-render inventory module
                    const inventoryContainer = document.querySelector('.sstssd-module[data-module="inventory"]');
                    if (inventoryContainer && this.inventoryModule) {
                        this.inventoryModule.render(inventoryContainer);
                    }
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
}
