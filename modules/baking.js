// 🧁 베이킹 모듈 (Baking Module)
export class BakingModule {
    // Default ingredient ratios for fallback recipe generation
    static DEFAULT_INGREDIENT_RATIOS = {
        FLOUR_PER_UNIT: 10,     // 10g flour per unit
        SUGAR_PER_UNIT: 5,      // 5g sugar per unit
        BUTTER_PER_UNIT: 3,     // 3g butter per unit
        EGG_PER_10_UNITS: 1     // 1 egg per 10 units
    };
    
    // Default ingredient prices (KRW) for fallback plan
    static DEFAULT_INGREDIENT_PRICES = {
        // 그램(g) 또는 개(ea) 단위 가격 (원)
        // 기준: 2024~2025 한국 온라인 제과재료 도매 시세
        
        // 기본 재료 (Basic ingredients)
        '밀가루': 10,         // 10원/g (약 1kg = 10,000원)
        '박력분': 10,         // 10원/g (약 1kg = 10,000원)
        '강력분': 10,         // 10원/g (약 1kg = 10,000원)
        'FLOUR_PRICE_PER_GRAM': 10,    // 10원/g (약 1kg = 10,000원)
        '설탕': 10,           // 10원/g (약 1kg = 10,000원)
        'SUGAR_PRICE_PER_GRAM': 10,    // 10원/g (약 1kg = 10,000원)
        '버터': 25,           // 25원/g (450g = 11,000원)
        '무염버터': 25,       // 25원/g (450g = 11,000원)
        'BUTTER_PRICE_PER_GRAM': 25,   // 25원/g (450g = 11,000원)
        '달걀': 400,          // 400원/개 (30개 = 12,000원)
        'EGG_PRICE_EACH': 400,         // 400원/개 (30개 = 12,000원)
        
        // 유제품 (Dairy)
        '우유': 3,            // 3원/ml (1L = 3,000원)
        'MILK_PRICE_PER_ML': 3,        // 3원/ml (1L = 3,000원)
        '생크림': 8,          // 8원/ml (1L = 8,000원)
        'CREAM_PRICE_PER_ML': 8,       // 8원/ml (1L = 8,000원)
        '크림치즈': 20,       // 20원/g (200g = 4,000원)
        'CREAM_CHEESE_PRICE_PER_GRAM': 20, // 20원/g (200g = 4,000원)
        '마스카르포네': 30,   // 30원/g (250g = 7,500원)
        '요거트': 3,          // 3원/g (500g = 1,500원)
        
        // 제빵용 재료 (Baking ingredients)
        '아몬드가루': 30,     // 30원/g (500g = 15,000원)
        'ALMOND_FLOUR_PRICE_PER_GRAM': 30, // 30원/g (500g = 15,000원)
        '코코아파우더': 40,   // 40원/g (200g = 8,000원)
        'COCOA_PRICE_PER_GRAM': 40,    // 40원/g (200g = 8,000원)
        '베이킹파우더': 15,   // 15원/g (200g = 3,000원)
        'BAKING_POWDER_PRICE_PER_GRAM': 15, // 15원/g (200g = 3,000원)
        '베이킹소다': 10,     // 10원/g (100g = 1,000원)
        '바닐라익스트랙': 100, // 100원/ml (100ml = 10,000원)
        '바닐라에센스': 100,  // 100원/ml (100ml = 10,000원)
        'VANILLA_PRICE_PER_ML': 100,   // 100원/ml (100ml = 10,000원)
        '소금': 3,            // 3원/g (500g = 1,500원)
        'SALT_PRICE_PER_GRAM': 3,      // 3원/g (500g = 1,500원)
        '이스트': 20,         // 20원/g (50g = 1,000원)
        '젤라틴': 60,         // 60원/g (100g = 6,000원)
        'GELATIN_PRICE_PER_GRAM': 60,  // 60원/g (100g = 6,000원)
        '슈가파우더': 15,     // 15원/g (500g = 7,500원)
        'POWDERED_SUGAR_PRICE_PER_GRAM': 15, // 15원/g (500g = 7,500원)
        
        // 초콜릿 (Chocolate)
        '다크초콜릿': 30,     // 30원/g (200g = 6,000원)
        '밀크초콜릿': 30,     // 30원/g (200g = 6,000원)
        '화이트초콜릿': 30,   // 30원/g (200g = 6,000원)
        '초콜릿칩': 30,       // 30원/g (200g = 6,000원)
        '초콜릿': 30,         // 30원/g (200g = 6,000원)
        'CHOCOLATE_PRICE_PER_GRAM': 30, // 30원/g (200g = 6,000원)
        
        // 과일 및 견과류 (Fruits & Nuts)
        '딸기': 16,           // 16원/g (500g = 8,000원)
        'STRAWBERRY_PRICE_PER_GRAM': 16, // 16원/g (500g = 8,000원)
        '블루베리': 30,       // 30원/g (200g = 6,000원)
        'BLUEBERRY_PRICE_PER_GRAM': 30, // 30원/g (200g = 6,000원)
        '레몬': 3000,         // 3,000원/개
        '라즈베리': 60,       // 60원/g (125g = 7,500원)
        '아몬드': 35,         // 35원/g (200g = 7,000원)
        '호두': 40,           // 40원/g (200g = 8,000원)
        
        // 기타 (Others)
        '꿀': 20,             // 20원/g (500g = 10,000원)
        '메이플시럽': 30,     // 30원/ml (200ml = 6,000원)
        '연유': 10,           // 10원/g (400g = 4,000원)
        '카라멜': 25,         // 25원/g (200g = 5,000원)
        '식용색소': 50,       // 50원/ml (10ml = 500원)
        
        // Default fallback for unknown ingredients
        'DEFAULT_PER_GRAM': 15,        // 15원/g for weight-based unknown ingredients
        'DEFAULT_PER_ML': 10,          // 10원/ml for volume-based unknown ingredients
        'DEFAULT_PER_PIECE': 500       // 500원/개 for count-based unknown ingredients
    };
    
    constructor(settings, saveCallback, getGlobalSettings, getRpDate, inventoryModule, instagramModule = null, balanceModule = null, getContextFn = null) {
        this.settings = settings;
        this.saveCallback = saveCallback;
        this.getGlobalSettings = getGlobalSettings;
        this.getRpDate = getRpDate;
        this.inventoryModule = inventoryModule;
        this.instagramModule = instagramModule;
        this.balanceModule = balanceModule;
        this.getContextFn = getContextFn;
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
            steps: data.steps || [],  // [{ name: "단계명", estimatedTime: "예상시간", status: "pending" }]
            yieldQty: data.yieldQty || 1,
            yieldUnit: data.yieldUnit || "개",
            deadline: data.deadline || null,  // 납품일
            status: data.status || "pending",  // "pending" | "in_progress" | "completed"
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
    // 베이킹 수행 (내부 완료 전용)
    performBaking(recipeId, multiplier = 1) {
        const recipe = this.settings.baking.recipes.find(r => r.id === recipeId);
        if (!recipe) {
            return { success: false, error: "레시피를 찾을 수 없습니다" };
        }
        
        // 재료 확인 & 차감 (보유 시에만 - RP에서 이미 구매했을 수 있음)
        if (this.inventoryModule && recipe.ingredients && recipe.ingredients.length > 0) {
            for (const ingredient of recipe.ingredients) {
                const requiredQty = ingredient.qty * multiplier;
                const item = this.inventoryModule.findIngredientFuzzy(ingredient.name);
                
                // 보유량이 충분하면 차감, 아니면 스킵 (이미 RP에서 구매했을 수 있음)
                if (item && item.qty >= requiredQty) {
                    this.inventoryModule.changeItemQty(
                        ingredient.name,
                        -requiredQty,
                        `${recipe.name} ×${recipe.yieldQty * multiplier} 제작`,
                        "baking"
                    );
                }
            }
            
            // 완제품은 항상 추가
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
    
    // 레시피 완료 (사이드바 "완료" 버튼용)
    completeRecipe(recipeId) {
        const recipe = this.settings.baking.recipes.find(r => r.id === recipeId);
        if (!recipe) {
            return { success: false, error: "레시피를 찾을 수 없습니다" };
        }
        
        const multiplier = recipe.multiplier || 1;
        
        // 1. 재료 차감 (보유 시에만)
        if (this.inventoryModule && recipe.ingredients && recipe.ingredients.length > 0) {
            for (const ingredient of recipe.ingredients) {
                const requiredQty = ingredient.qty * multiplier;
                const item = this.inventoryModule.findIngredientFuzzy(ingredient.name);
                
                if (item && item.qty >= requiredQty) {
                    this.inventoryModule.changeItemQty(
                        ingredient.name,
                        -requiredQty,
                        `${recipe.name} 제작`,
                        "baking"
                    );
                }
            }
        }
        
        // 2. 완제품 재고 추가
        if (this.inventoryModule) {
            this.inventoryModule.addProduct({
                name: recipe.name,
                qty: recipe.yieldQty * multiplier,
                unit: recipe.yieldUnit,
                reason: `${recipe.name} ×${recipe.yieldQty * multiplier} 제작 완료`
            });
        }
        
        // 3. 이력 기록
        const totalCost = recipe.ingredients ? 
            recipe.ingredients.reduce((sum, i) => sum + (i.price || 0), 0) : 0;
        
        const historyEntry = {
            id: ++this.idCounter,
            recipeName: recipe.name,
            yieldQty: recipe.yieldQty * multiplier,
            yieldUnit: recipe.yieldUnit,
            steps: recipe.steps ? [...recipe.steps] : [],
            ingredients: recipe.ingredients ? [...recipe.ingredients] : [],
            totalCost: totalCost * multiplier,
            date: this.formatDate(this.getRpDate())
        };
        this.settings.baking.bakingHistory.unshift(historyEntry);
        
        // 이력은 최근 30건만 유지
        if (this.settings.baking.bakingHistory.length > 30) {
            this.settings.baking.bakingHistory = this.settings.baking.bakingHistory.slice(0, 30);
        }
        
        // 4. 레시피 상태 변경: completed로 변경 (완료된 레시피는 UI에서 자동으로 숨김 처리)
        recipe.status = 'completed';
        recipe.completedAt = this.formatDate(this.getRpDate());
        
        this.saveCallback();
        
        // 5. 인스타 업로드 여부 확인 (UI에서 처리 - 여기서는 플래그만 반환)
        return { 
            success: true, 
            recipe: recipe,
            showInstagramPrompt: true 
        };
    }
    
    // Start step-by-step baking (separate from performBaking)
    startBaking(recipeId, multiplier = 1) {
        const recipe = this.settings.baking.recipes.find(r => r.id === recipeId);
        if (!recipe) {
            return { success: false, error: "레시피를 찾을 수 없습니다" };
        }
        
        // Check if already in progress
        if (recipe.status === 'in_progress') {
            return { success: false, error: "이미 진행 중인 레시피입니다" };
        }
        
        // ❌ Removed ingredient check — AI will handle ingredient availability
        
        // Initialize step tracking
        recipe.status = 'in_progress';
        recipe.currentStep = 0;
        recipe.multiplier = multiplier;
        
        // Initialize steps with status if they exist
        if (recipe.steps && recipe.steps.length > 0) {
            recipe.steps.forEach(step => {
                step.status = 'pending';
            });
        }
        
        this.saveCallback();
        return { success: true, recipe };
    }
    
    // Start baking via QR command integration
    async startBakingViaQR(recipeId, multiplier = 1) {
        const recipe = this.settings.baking.recipes.find(r => r.id === recipeId);
        if (!recipe) {
            return { success: false, error: "레시피를 찾을 수 없습니다" };
        }
        
        // Check if already in progress
        if (recipe.status === 'in_progress') {
            return { success: false, error: "이미 진행 중인 레시피입니다" };
        }
        
        // ❌ Removed ingredient check — AI will inform about missing ingredients via <SHOP> tags
        // ❌ Removed steps required check — AI will generate recipe-specific steps
        
        // Set recipe to in_progress
        recipe.status = 'in_progress';
        recipe.currentStep = 0;
        recipe.multiplier = multiplier;
        recipe.startedAt = this.formatDate(this.getRpDate());
        
        // Initialize steps with status if they exist
        if (recipe.steps && recipe.steps.length > 0) {
            recipe.steps.forEach(step => {
                step.status = 'pending';
            });
        }
        
        this.saveCallback();
        
        // Try to execute QR slash commands
        try {
            const context = window.getContext?.() || (typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : null);
            if (context?.executeSlashCommandsWithOptions) {
                // Set bake_menu variable
                await context.executeSlashCommandsWithOptions(
                    `/setvar key=bake_menu "${recipe.name} ×${recipe.yieldQty * multiplier}${recipe.yieldUnit}"`
                );
                // Set bake_active flag
                await context.executeSlashCommandsWithOptions(
                    `/setvar key=bake_active "true"`
                );
                // Set bake_data with detailed info (steps empty if not yet generated)
                const stepsInfo = recipe.steps && recipe.steps.length > 0 ? 
                    recipe.steps.map(s => s.name).join(' | ') : 
                    'AI 생성 대기';
                await context.executeSlashCommandsWithOptions(
                    `/setvar key=bake_data "menu:${recipe.name}|qty:${recipe.yieldQty * multiplier}|unit:${recipe.yieldUnit}|steps:${stepsInfo}"`
                );
                console.log('SSTSSD: QR variables set for baking:', recipe.name);
            }
        } catch (error) {
            console.warn('SSTSSD: Failed to execute QR commands (will continue without QR integration)', error);
        }
        
        // Re-render sidebar UI
        const container = document.querySelector('.sstssd-module[data-module="baking"]');
        if (container) this.render(container);
        
        return { success: true, recipe };
    }
    
    // Start a specific step
    startStep(recipeId, stepIndex) {
        const recipe = this.settings.baking.recipes.find(r => r.id === recipeId);
        if (!recipe || !recipe.steps || !recipe.steps[stepIndex]) {
            return { success: false, error: "단계를 찾을 수 없습니다" };
        }
        
        const step = recipe.steps[stepIndex];
        step.status = 'in_progress';
        recipe.currentStep = stepIndex;
        
        this.saveCallback();
        
        // Notify RP context if available
        this.notifyBakingEvent('step_start', recipe, step);
        
        return { success: true, step };
    }
    
    // Pause a specific step
    pauseStep(recipeId, stepIndex) {
        const recipe = this.settings.baking.recipes.find(r => r.id === recipeId);
        if (!recipe || !recipe.steps || !recipe.steps[stepIndex]) {
            return { success: false, error: "단계를 찾을 수 없습니다" };
        }
        
        const step = recipe.steps[stepIndex];
        step.status = 'paused';
        
        this.saveCallback();
        
        // Notify RP context if available
        this.notifyBakingEvent('step_pause', recipe, step);
        
        return { success: true, step };
    }
    
    // Complete a specific step
    completeStep(recipeId, stepIndex) {
        const recipe = this.settings.baking.recipes.find(r => r.id === recipeId);
        if (!recipe || !recipe.steps || !recipe.steps[stepIndex]) {
            return { success: false, error: "단계를 찾을 수 없습니다" };
        }
        
        const step = recipe.steps[stepIndex];
        step.status = 'completed';
        
        // Check if this is the last step
        const isLastStep = stepIndex === recipe.steps.length - 1;
        
        if (isLastStep) {
            // Complete baking: deduct ingredients (if available) and add product
            const multiplier = recipe.multiplier || 1;
            
            if (this.inventoryModule) {
                // 재료 차감 (보유 시에만 - RP에서 이미 구매했을 수 있음)
                if (recipe.ingredients && recipe.ingredients.length > 0) {
                    for (const ingredient of recipe.ingredients) {
                        const requiredQty = ingredient.qty * multiplier;
                        const item = this.inventoryModule.findIngredientFuzzy(ingredient.name);
                        
                        // 보유량이 충분하면 차감, 아니면 스킵
                        if (item && item.qty >= requiredQty) {
                            this.inventoryModule.changeItemQty(
                                ingredient.name,
                                -requiredQty,
                                `${recipe.name} ×${recipe.yieldQty * multiplier} 제작`,
                                "baking"
                            );
                        }
                    }
                }
                
                // 완제품은 항상 추가
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
            
            // Mark recipe as completed (removes from recipe list)
            recipe.status = 'completed';
            recipe.completedAt = this.formatDate(this.getRpDate());
            recipe.currentStep = null;
            recipe.multiplier = null;
            recipe.startedAt = null;
            
            this.saveCallback();
            
            // Notify completion
            this.notifyBakingEvent('baking_complete', recipe, step);
            
            return { success: true, completed: true, recipe };
        } else {
            // Move to next step
            recipe.currentStep = stepIndex + 1;
            
            this.saveCallback();
            
            // Notify step completion
            this.notifyBakingEvent('step_complete', recipe, step);
            
            return { success: true, completed: false, nextStep: recipe.steps[stepIndex + 1] };
        }
    }
    
    // Cancel step-by-step baking
    cancelStepBaking(recipeId) {
        const recipe = this.settings.baking.recipes.find(r => r.id === recipeId);
        if (!recipe) {
            return { success: false, error: "레시피를 찾을 수 없습니다" };
        }
        
        recipe.status = 'pending';
        recipe.currentStep = null;
        if (recipe.steps) {
            recipe.steps.forEach(step => {
                step.status = 'pending';
            });
        }
        
        this.saveCallback();
        return { success: true };
    }
    
    // Update recipe progress from <BAKE> tag (called from observer)
    updateFromBakeTag(bakeTagData) {
        if (!bakeTagData || !bakeTagData.menu) return;
        
        // Extract recipe name from menu (e.g., "딸기 타르트 ×6개" → "딸기 타르트")
        const menuText = bakeTagData.menu.trim();
        const recipeName = menuText.replace(/\s*×.*$/, '').trim();
        
        // Find matching recipe by name with better matching logic
        let recipe = this.settings.baking.recipes.find(r => {
            if (r.status !== 'in_progress') return false;
            
            // Try exact match first
            if (r.name === recipeName) return true;
            
            // Try case-insensitive exact match
            if (r.name.toLowerCase() === recipeName.toLowerCase()) return true;
            
            // Only use fuzzy matching as last resort for very similar names
            const nameNormalized = r.name.toLowerCase().replace(/\s+/g, '');
            const recipeNormalized = recipeName.toLowerCase().replace(/\s+/g, '');
            return nameNormalized === recipeNormalized;
        });
        
        if (!recipe) {
            console.log('SSTSSD: No matching in-progress recipe for BAKE tag, auto-creating:', recipeName);
            
            // Auto-create recipe from BAKE tag (QR direct start)
            // Parse menu text for yield quantity: "마카롱(기본) × 30개" → yieldQty: 30, yieldUnit: "개"
            const menuMatch = menuText.match(/(.+?)\s*[×x]\s*(\d+)\s*(개|판|호|세트|kg|g|ml)?/i);
            let yieldQty = 1;
            let yieldUnit = "개";
            
            if (menuMatch) {
                yieldQty = parseInt(menuMatch[2]);
                yieldUnit = menuMatch[3] || "개";
            }
            
            // Create new recipe with AI-provided steps
            const newRecipe = {
                id: ++this.idCounter,
                name: recipeName,
                ingredients: [],  // Will be filled from SHOP tag
                steps: bakeTagData.parsedSteps ? bakeTagData.parsedSteps.map(ps => ({
                    name: ps.name || '단계',
                    estimatedTime: ps.estimatedTime || '',
                    status: ps.status || 'pending'
                })) : [],
                yieldQty: yieldQty,
                yieldUnit: yieldUnit,
                deadline: null,
                status: "in_progress",
                createdAt: this.formatDate(this.getRpDate())
            };
            
            this.settings.baking.recipes.push(newRecipe);
            recipe = newRecipe;
            console.log('SSTSSD: Auto-created recipe from BAKE tag:', recipe);
        }
        
        // Handle new detailed steps format from AI
        if (bakeTagData.parsedSteps && bakeTagData.parsedSteps.length > 0) {
            // If recipe has no steps yet, create them from AI data
            if (!recipe.steps || recipe.steps.length === 0) {
                recipe.steps = bakeTagData.parsedSteps.map(ps => ({
                    name: ps.name || '단계',
                    estimatedTime: ps.estimatedTime || '',
                    status: ps.status || 'pending'
                }));
                console.log('SSTSSD: Recipe steps initialized from BAKE tag:', recipe.steps);
            } else {
                // Update existing steps status
                recipe.steps.forEach((step, idx) => {
                    if (idx < bakeTagData.parsedSteps.length) {
                        const parsedStep = bakeTagData.parsedSteps[idx];
                        step.status = parsedStep.status || 'pending';
                        
                        // Update step name and time if they were empty
                        if (!step.name && parsedStep.name) {
                            step.name = parsedStep.name;
                        }
                        if (!step.estimatedTime && parsedStep.estimatedTime) {
                            step.estimatedTime = parsedStep.estimatedTime;
                        }
                        
                        // Track current step
                        if (step.status === 'in_progress') {
                            recipe.currentStep = idx;
                        }
                    }
                });
            }
        } else if (bakeTagData.steps && recipe.steps) {
            // Fallback: old format with just icon array ['✅', '✅', '🔄', '⬜', '⬜']
            const stepStatuses = bakeTagData.steps;
            
            recipe.steps.forEach((step, idx) => {
                if (idx < stepStatuses.length) {
                    const statusIcon = stepStatuses[idx];
                    if (statusIcon === '✅') {
                        step.status = 'completed';
                    } else if (statusIcon === '🔄') {
                        step.status = 'in_progress';
                        recipe.currentStep = idx;
                    } else if (statusIcon === '⏸️') {
                        step.status = 'paused';
                    } else {
                        step.status = 'pending';
                    }
                }
            });
        }
        
        // Check if baking is complete (PCT = 100%)
        if (bakeTagData.pct >= 100) {
            console.log('SSTSSD: Baking complete detected, finalizing:', recipe.name);
            
            // Mark all steps as completed
            if (recipe.steps && recipe.steps.length > 0) {
                recipe.steps.forEach(step => {
                    step.status = 'completed';
                });
            }
            
            // Call completeStep to finalize (will deduct ingredients, add product, reset to pending)
            const lastStepIndex = recipe.steps ? recipe.steps.length - 1 : -1;
            if (lastStepIndex >= 0) {
                this.completeStep(recipe.id, lastStepIndex);
            } else {
                // No steps defined, manually complete
                recipe.status = 'completed';
                recipe.completedAt = this.formatDate(this.getRpDate());
                this.saveCallback();
            }
        } else {
            this.saveCallback();
        }
        
        // Re-render baking module
        const bakingContainer = document.querySelector('.sstssd-module[data-module="baking"]');
        if (bakingContainer) {
            this.render(bakingContainer);
        }
    }
    
    // Notify baking events for RP integration
    notifyBakingEvent(eventType, recipe, step) {
        // This will be used by the main index.js to inject into RP prompts
        // Store the current event for buildDashboardPrompt to pick up
        if (!this.settings.baking.currentEvent) {
            this.settings.baking.currentEvent = null;
        }
        
        this.settings.baking.currentEvent = {
            type: eventType,
            recipeName: recipe.name,
            stepName: step ? step.name : null,
            timestamp: Date.now()
        };
        
        // Clear event after 5 seconds (to avoid stale events)
        const eventTimestamp = this.settings.baking.currentEvent.timestamp;
        setTimeout(() => {
            if (this.settings.baking.currentEvent && 
                this.settings.baking.currentEvent.timestamp === eventTimestamp) {
                this.settings.baking.currentEvent = null;
            }
        }, 5000);
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
    
    // 구매 리스트 추가 (상세 형식 - SHOP 태그용)
    addDetailedShoppingList(data) {
        const newList = {
            id: ++this.idCounter,
            location: data.store || "온라인",
            store: data.store || "온라인",
            when: data.when || "",
            items: data.items.map(item => ({
                id: ++this.idCounter,
                name: item.name,
                qty: item.qty,
                unit: item.unit,
                price: item.price,
                sources: ["AI 자동 감지"]
            })),
            totalPrice: data.totalPrice || data.items.reduce((sum, item) => sum + (item.price || 0), 0),
            status: data.status || "pending",
            linkedRecipe: data.linkedRecipe || null,
            createdAt: this.formatDate(this.getRpDate())
        };
        
        this.settings.baking.shoppingList.push(newList);
        this.saveCallback();
        return newList;
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
    async completePurchase(locationId) {
        const locationList = this.settings.baking.shoppingList.find(list => list.id === locationId);
        if (!locationList) return { success: false, error: "리스트를 찾을 수 없습니다" };
        
        const location = locationList.location || locationList.store;
        const totalPrice = locationList.totalPrice;
        
        // 1. 재고에 전부 추가
        if (this.inventoryModule) {
            locationList.items.forEach(item => {
                const existingItem = this.inventoryModule.findIngredientFuzzy(item.name);
                
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
                        category: this.inventoryModule.guessCategory(item.name),
                        minStock: 0,
                        type: "ingredient",
                        reason: `구매 (${location})`,
                        source: "purchase"
                    });
                }
            });
        }
        
        // 2. 잔고에서 차감 및 거래 내역 추가
        if (this.balanceModule) {
            const linkedRecipeName = locationList.linkedRecipe ? 
                (this.settings.baking.recipes.find(r => r.id === locationList.linkedRecipe)?.name || '') : '';
            
            const shopEnabled = this.balanceModule.settings?.balance?.shopMode?.enabled || false;
            
            this.balanceModule.addTransaction({
                type: "expense",
                source: shopEnabled ? "shop" : "personal",
                category: "재료 구매",
                description: `${location} 구매${linkedRecipeName ? ': ' + linkedRecipeName : ''} (${locationList.items.length}개 항목)`,
                amount: totalPrice,
                memo: "구매 리스트 완료"
            });
        } else if (this.settings.balance) {
            // Fallback to direct manipulation if balanceModule is not available
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
            
            const linkedRecipeName = locationList.linkedRecipe ? 
                (this.settings.baking.recipes.find(r => r.id === locationList.linkedRecipe)?.name || '') : '';
            
            this.settings.balance.transactions.unshift({
                id: ++this.idCounter,
                type: "expense",
                category: "재료비",
                description: `재료 구매 (${linkedRecipeName ? linkedRecipeName + ' 준비' : location})`,
                amount: totalPrice,
                date: this.formatDate(this.getRpDate()),
                source: shopEnabled ? "shop" : "personal",
                memo: "구매 리스트 완료",
                createdAt: this.formatDate(this.getRpDate())
            });
        }
        
        // 4. QR 변수(inventory) 동기화
        try {
            const context = window.getContext?.() || (typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : null);
            if (context?.executeSlashCommandsWithOptions && this.inventoryModule) {
                const inventoryStr = this.inventoryModule.settings.inventory.items
                    .filter(i => i.type === "ingredient")
                    .map(i => `${i.name}:${i.qty}:${i.unit}`)
                    .join(' ; ');
                await context.executeSlashCommandsWithOptions(
                    `/setvar key=inventory "${inventoryStr}"`
                );
                console.log('SSTSSD: QR inventory synced after purchase');
            }
        } catch (e) {
            console.warn('SSTSSD: QR inventory sync failed', e);
            // Graceful fallback - don't fail the purchase
        }
        
        // 5. 구매 리스트 상태 업데이트 (삭제 대신 상태 변경)
        locationList.status = "purchased";
        locationList.purchasedAt = this.formatDate(this.getRpDate());
        
        this.saveCallback();
        return { success: true, totalPrice, itemCount: locationList.items.length };
    }
    
    // 전체 구매 완료
    async completeAllPurchases() {
        let totalPrice = 0;
        let totalItems = 0;
        const locations = [...this.settings.baking.shoppingList];
        
        for (const list of locations) {
            const result = await this.completePurchase(list.id);
            if (result.success) {
                totalPrice += result.totalPrice;
                totalItems += result.itemCount;
            }
        }
        
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
        
        // Separate recipes by status
        const inProgressRecipes = recipes.filter(r => r.status === 'in_progress');
        const pendingRecipes = recipes.filter(r => !r.status || r.status === 'pending');
        
        // Get today's completed history
        const today = this.formatDate(this.getRpDate());
        const todayHistory = history.filter(h => h.date === today);
        const olderHistory = history.filter(h => h.date !== today);
        
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
                <!-- 진행 중인 레시피 -->
                ${inProgressRecipes.length > 0 ? `
                    <div class="sstssd-section sstssd-baking-section-in-progress">
                        <div class="sstssd-section-title">🔄 진행 중</div>
                        ${inProgressRecipes.map(recipe => this.renderRecipeItem(recipe)).join('')}
                    </div>
                ` : ''}
                
                <!-- 대기 중인 레시피 -->
                <div class="sstssd-section sstssd-baking-section-pending">
                    <div class="sstssd-section-title">📖 레시피 목록</div>
                    ${pendingRecipes.length > 0 ? `
                        ${pendingRecipes.map(recipe => this.renderRecipeItem(recipe)).join('')}
                    ` : `
                        <div class="sstssd-empty">레시피가 없습니다</div>
                    `}
                    <button class="sstssd-btn sstssd-btn-add" data-action="add-recipe">+ 레시피 추가</button>
                </div>
                
                <!-- 오늘 완료된 베이킹 -->
                ${todayHistory.length > 0 ? `
                    <div class="sstssd-section sstssd-baking-section-completed">
                        <div class="sstssd-section-title">✅ 오늘 완료</div>
                        ${todayHistory.map(h => this.renderHistoryItem(h)).join('')}
                    </div>
                ` : ''}
                
                <!-- 구매 리스트 -->
                ${this.renderShoppingList()}
                
                <!-- 이전 베이킹 이력 -->
                ${olderHistory.length > 0 ? `
                    <div class="sstssd-section">
                        <div class="sstssd-section-title">📜 이전 이력</div>
                        ${olderHistory.map(h => this.renderHistoryItem(h)).join('')}
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
        const isInProgress = recipe.status === 'in_progress';
        const multiplier = recipe.multiplier || 1;
        
        if (isInProgress && recipe.steps && recipe.steps.length > 0) {
            // Render step-by-step UI
            const currentStep = recipe.currentStep || 0;
            const completedSteps = recipe.steps.filter(s => s.status === 'completed').length;
            const progressPercent = (completedSteps / recipe.steps.length) * 100;
            const isComplete = progressPercent >= 100;
            
            // Find linked shopping list
            const linkedShoppingList = this.settings.baking.shoppingList.find(
                list => list.linkedRecipe === recipe.id && list.status === 'pending'
            );
            
            return `
                <div class="sstssd-baking-item sstssd-baking-in-progress" data-id="${recipe.id}">
                    <div class="sstssd-baking-header">
                        <span class="sstssd-baking-name">${this.escapeHtml(recipe.name)}</span>
                        <span class="sstssd-baking-yield">(×${recipe.yieldQty * multiplier}${recipe.yieldUnit})</span>
                        <span class="sstssd-baking-status">${isComplete ? '✅ 완료 가능' : '🔄 진행 중'}</span>
                    </div>
                    
                    <div class="sstssd-baking-progress-bar">
                        <div class="sstssd-baking-progress-fill" style="width: ${progressPercent}%"></div>
                        <span class="sstssd-baking-progress-text">${completedSteps}/${recipe.steps.length} 단계 완료</span>
                    </div>
                    
                    <div class="sstssd-baking-steps">
                        ${recipe.steps.map((step, idx) => this.renderStepItem(recipe, step, idx)).join('')}
                    </div>
                    
                    ${linkedShoppingList ? `
                        <div class="sstssd-recipe-shopping-list">
                            <div class="sstssd-section-title">🛒 구매 필요</div>
                            ${this.renderShoppingListLocation(linkedShoppingList)}
                        </div>
                    ` : ''}
                    
                    <div class="sstssd-baking-actions">
                        ${isComplete ? `
                            <button class="sstssd-btn sstssd-btn-sm sstssd-btn-success" data-action="complete-recipe" data-id="${recipe.id}">✅ 완료</button>
                        ` : ''}
                        <button class="sstssd-btn sstssd-btn-sm sstssd-btn-danger" data-action="cancel-step-baking" data-id="${recipe.id}">❌ 취소</button>
                    </div>
                </div>
            `;
        } else {
            // Render normal UI
            const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0;
            const hasSteps = recipe.steps && recipe.steps.length > 0;
            
            return `
                <div class="sstssd-baking-item" data-id="${recipe.id}">
                    <div class="sstssd-baking-header">
                        <span class="sstssd-baking-name">${this.escapeHtml(recipe.name)}</span>
                        <span class="sstssd-baking-yield">(${recipe.yieldQty}${recipe.yieldUnit})</span>
                        ${recipe.deadline ? `<span class="sstssd-baking-deadline">📅 ${recipe.deadline}</span>` : ''}
                    </div>
                    <div class="sstssd-baking-ingredients">
                        ${hasIngredients ? 
                            recipe.ingredients.map(ing => `
                                <span class="sstssd-ingredient-tag">${ing.name} ${ing.qty}${ing.unit}</span>
                            `).join('') :
                            '<span class="sstssd-ai-placeholder">📋 재료: 시작 시 AI가 자동 계산</span>'
                        }
                    </div>
                    ${!hasSteps ? '<div class="sstssd-ai-placeholder-steps">📝 단계: 시작 시 AI가 자동 계산</div>' : ''}
                    <div class="sstssd-baking-actions">
                        <button class="sstssd-btn sstssd-btn-sm sstssd-btn-success sstssd-btn-start-baking" data-action="start-step-baking" data-id="${recipe.id}">▶ 시작</button>
                        <button class="sstssd-btn sstssd-btn-sm" data-action="edit-recipe" data-id="${recipe.id}">✏️</button>
                        <button class="sstssd-btn sstssd-btn-sm" data-action="delete-recipe" data-id="${recipe.id}">🗑</button>
                    </div>
                </div>
            `;
        }
    }
    
    // 단계 항목 렌더링
    renderStepItem(recipe, step, stepIndex) {
        const isCurrent = recipe.currentStep === stepIndex;
        const statusIcon = {
            'pending': '⬜',
            'in_progress': '🔄',
            'paused': '⏸️',
            'completed': '✅'
        }[step.status || 'pending'];
        
        const canStart = step.status === 'pending' || step.status === 'paused';
        const canPause = step.status === 'in_progress';
        const canComplete = step.status === 'in_progress';
        
        return `
            <div class="sstssd-baking-step ${isCurrent ? 'sstssd-baking-step-current' : ''} sstssd-baking-step-${step.status || 'pending'}" data-step-index="${stepIndex}">
                <div class="sstssd-baking-step-header">
                    <span class="sstssd-baking-step-icon">${statusIcon}</span>
                    <span class="sstssd-baking-step-name">${this.escapeHtml(step.name)}</span>
                    <span class="sstssd-baking-step-time">${step.estimatedTime}</span>
                </div>
                <div class="sstssd-baking-step-actions">
                    ${canStart ? `
                        <button class="sstssd-btn sstssd-btn-xs sstssd-btn-success" 
                                data-action="start-step" 
                                data-recipe-id="${recipe.id}" 
                                data-step-index="${stepIndex}">
                            ${step.status === 'paused' ? '▶ 재개' : '▶ 시작'}
                        </button>
                    ` : ''}
                    ${canPause ? `
                        <button class="sstssd-btn sstssd-btn-xs" 
                                data-action="pause-step" 
                                data-recipe-id="${recipe.id}" 
                                data-step-index="${stepIndex}">⏸ 일시정지</button>
                    ` : ''}
                    ${canComplete ? `
                        <button class="sstssd-btn sstssd-btn-xs sstssd-btn-primary" 
                                data-action="complete-step" 
                                data-recipe-id="${recipe.id}" 
                                data-step-index="${stepIndex}">✅ 완료</button>
                    ` : ''}
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
        const shoppingList = (this.settings.baking.shoppingList || []).filter(list => list.status === 'pending');
        
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
                    <span class="sstssd-amount">${this.formatCurrency(totalPrice)}원</span>
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
        const locationIcon = (locationList.location || locationList.store) === "온라인" ? "🌐" : "🏪";
        const locationName = locationList.store || locationList.location || "온라인";
        const linkedRecipe = locationList.linkedRecipe ? 
            this.settings.baking.recipes.find(r => r.id === locationList.linkedRecipe) : null;
        
        return `
            <div class="sstssd-shopping-location" data-location-id="${locationList.id}">
                <div class="sstssd-shopping-location-header">
                    ${locationIcon} ${this.escapeHtml(locationName)}
                    ${linkedRecipe ? `<span class="sstssd-linked-recipe">→ ${this.escapeHtml(linkedRecipe.name)}</span>` : ''}
                </div>
                ${locationList.when ? `<div class="sstssd-shopping-when">⏰ ${this.escapeHtml(locationList.when)}</div>` : ''}
                ${locationList.items.map(item => this.renderShoppingListItem(item, locationList.id, locationName)).join('')}
                <div class="sstssd-shopping-subtotal">
                    <span>💰 총액:</span>
                    <span class="sstssd-amount">${this.formatCurrency(locationList.totalPrice)}원</span>
                </div>
                <button class="sstssd-btn sstssd-btn-sm sstssd-btn-primary" 
                        data-action="complete-purchase" 
                        data-location-id="${locationList.id}">
                    🛒 구매 완료
                </button>
            </div>
        `;
    }
    
    // 구매 리스트 항목 렌더링
    renderShoppingListItem(item, locationId, currentLocation) {
        const isUnpriced = !item.price || item.price === 0;
        
        return `
            <div class="sstssd-shopping-item ${isUnpriced ? 'sstssd-shopping-item-unpriced' : ''}" data-item-id="${item.id}">
                <div class="sstssd-shopping-item-main">
                    <span class="sstssd-shopping-bullet">🔸</span>
                    <div class="sstssd-shopping-item-info">
                        <div class="sstssd-shopping-item-name">
                            ${this.escapeHtml(item.name)} — ${item.qty}${item.unit}
                            ${isUnpriced ? '<span class="sstssd-price-unconfirmed">💡 가격 미확인</span>' : ''}
                        </div>
                        ${item.sources && item.sources.length > 0 ? `
                            <div class="sstssd-shopping-item-sources">
                                └ ${item.sources.join(' + ')}
                            </div>
                        ` : ''}
                    </div>
                    <span class="sstssd-shopping-price">${isUnpriced ? '직접 입력 필요' : this.formatCurrency(item.price) + '원'}</span>
                </div>
                <div class="sstssd-shopping-item-actions">
                    <button class="sstssd-btn sstssd-btn-xs" data-action="edit-shopping-item" data-location-id="${locationId}" data-item-id="${item.id}">✏️</button>
                    <button class="sstssd-btn sstssd-btn-xs" data-action="delete-shopping-item" data-location-id="${locationId}" data-item-id="${item.id}">🗑</button>
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
        
        // 단계별 베이킹 시작 버튼
        const startStepBakingBtns = container.querySelectorAll('[data-action="start-step-baking"]');
        startStepBakingBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.showStepBakingConfirmModal(id);
            });
        });
        
        // 단계별 베이킹 취소 버튼
        const cancelStepBakingBtns = container.querySelectorAll('[data-action="cancel-step-baking"]');
        cancelStepBakingBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                if (confirm('단계별 베이킹을 취소하시겠습니까?')) {
                    this.cancelStepBaking(id);
                    this.render(container);
                }
            });
        });
        
        // 단계 시작 버튼
        const startStepBtns = container.querySelectorAll('[data-action="start-step"]');
        startStepBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = parseInt(btn.dataset.recipeId);
                const stepIndex = parseInt(btn.dataset.stepIndex);
                this.startStep(recipeId, stepIndex);
                this.render(container);
            });
        });
        
        // 단계 일시정지 버튼
        const pauseStepBtns = container.querySelectorAll('[data-action="pause-step"]');
        pauseStepBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = parseInt(btn.dataset.recipeId);
                const stepIndex = parseInt(btn.dataset.stepIndex);
                this.pauseStep(recipeId, stepIndex);
                this.render(container);
            });
        });
        
        // 단계 완료 버튼
        const completeStepBtns = container.querySelectorAll('[data-action="complete-step"]');
        completeStepBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = parseInt(btn.dataset.recipeId);
                const stepIndex = parseInt(btn.dataset.stepIndex);
                const result = this.completeStep(recipeId, stepIndex);
                
                if (result.success && result.completed) {
                    // Show Instagram posting option if available
                    const recipe = this.settings.baking.recipes.find(r => r.id === recipeId);
                    if (recipe && this.instagramModule) {
                        const multiplier = recipe.multiplier || 1;
                        this.showInstagramPostOption(recipe.name, recipe.yieldQty * multiplier, recipe.yieldUnit);
                    } else {
                        alert('베이킹 완료!');
                    }
                    
                    // Re-render all related modules
                    this.render(container);
                    const inventoryContainer = document.querySelector('.sstssd-module[data-module="inventory"]');
                    if (inventoryContainer && this.inventoryModule) {
                        this.inventoryModule.render(inventoryContainer);
                    }
                } else {
                    this.render(container);
                }
            });
        });
        
        // 레시피 완료 버튼 (PCT 100% 도달 시)
        const completeRecipeBtns = container.querySelectorAll('[data-action="complete-recipe"]');
        completeRecipeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = parseInt(btn.dataset.id);
                const recipe = this.settings.baking.recipes.find(r => r.id === recipeId);
                if (!recipe) return;
                
                if (confirm(`🧁 ${recipe.name} 제작을 완료하시겠습니까?`)) {
                    const result = this.completeRecipe(recipeId);
                    if (result.success) {
                        // Instagram upload prompt
                        if (result.showInstagramPrompt && this.instagramModule) {
                            const uploadToInsta = confirm(`📱 ${recipe.name} 완성!\n인스타그램에 올릴까요?`);
                            if (uploadToInsta) {
                                // Call Instagram module to create post
                                if (typeof this.instagramModule.showAddPostModal === 'function') {
                                    this.instagramModule.showAddPostModal(recipe.name);
                                }
                            }
                        }
                        
                        alert(`✅ ${recipe.name} 완료!\n완제품 ${recipe.yieldQty}${recipe.yieldUnit} 재고에 추가되었습니다.`);
                        this.render(container);
                        
                        // 재고 모듈도 다시 렌더링
                        const inventoryContainer = document.querySelector('.sstssd-module[data-module="inventory"]');
                        if (inventoryContainer && this.inventoryModule) {
                            this.inventoryModule.render(inventoryContainer);
                        }
                    } else {
                        alert('완료 실패: ' + result.error);
                    }
                }
            });
        });
        
        // 구매 리스트 - 장소별 구매 완료 버튼
        const completePurchaseBtns = container.querySelectorAll('[data-action="complete-purchase"]');
        completePurchaseBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const locationId = parseInt(btn.dataset.locationId);
                if (confirm('이 장소의 구매를 완료하시겠습니까?')) {
                    const result = await this.completePurchase(locationId);
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
                        if (balanceContainer && this.balanceModule) {
                            this.balanceModule.render(balanceContainer);
                        }
                        
                        if (typeof window.sstsdUpdateSummary === 'function') {
                            window.sstsdUpdateSummary();
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
            completeAllBtn.addEventListener('click', async () => {
                if (confirm('전체 구매를 완료하시겠습니까?')) {
                    const result = await this.completeAllPurchases();
                    if (result.success) {
                        alert(`전체 구매 완료! ${result.totalItems}개 항목, 총 ${this.formatCurrency(result.totalPrice)}원`);
                        this.render(container);
                        
                        // 재고 모듈도 다시 렌더링
                        const inventoryContainer = document.querySelector('.sstssd-module[data-module="inventory"]');
                        if (inventoryContainer && this.inventoryModule) {
                            this.inventoryModule.render(inventoryContainer);
                        }
                        
                        // 잔고 모듈도 다시 렌더링
                        const balanceContainer = document.querySelector('.sstssd-module[data-module="balance"]');
                        if (balanceContainer && this.balanceModule) {
                            this.balanceModule.render(balanceContainer);
                        }
                        
                        if (typeof window.sstsdUpdateSummary === 'function') {
                            window.sstsdUpdateSummary();
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
                // Try multiple approaches to get the context
                if (typeof window !== 'undefined') {
                    context = typeof window.getContext === 'function' ? window.getContext() : null;
                    if (!context && typeof window.SillyTavern !== 'undefined') {
                        context = window.SillyTavern.getContext?.();
                    }
                }
                // Also try the injected getContext if available
                if (!context && this.getContextFn) {
                    context = this.getContextFn();
                }
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
  estimatedPrice: 4000
- name: "설탕"
  qty: 200
  unit: "g"
  estimatedPrice: 2000
</BAKE_PLAN>

위 형식을 정확히 지켜서 답변해줘. estimatedPrice는 대한민국 온라인 기준 가격(원)으로 작성해줘.
가격 예시: 밀가루 1kg = 8,000~12,000원, 설탕 1kg = 8,000~10,000원, 버터 200g = 4,000~6,000원, 달걀 10개 = 3,000~4,000원
다른 설명은 필요 없어.`;
            
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
                // Updated regex to support decimal quantities and optional estimatedPrice
                const ingMatches = ingredientsText.matchAll(/- name: "(.+?)"\s+qty: (\d+(?:\.\d+)?)\s+unit: "(.+?)"(?:\s+estimatedPrice: (\d+))?/g);
                for (const ingMatch of ingMatches) {
                    // Round to 2 decimal places to avoid precision issues
                    const qty = Math.round(parseFloat(ingMatch[2]) * 100) / 100;
                    const name = ingMatch[1];
                    const unit = ingMatch[3];
                    
                    const ingredient = {
                        name: name,
                        qty: qty,
                        unit: unit
                    };
                    
                    // Add estimatedPrice if present, otherwise calculate from defaults
                    if (ingMatch[4]) {
                        ingredient.estimatedPrice = parseInt(ingMatch[4]);
                    } else {
                        ingredient.estimatedPrice = this.estimateIngredientPrice(name, qty, unit);
                    }
                    
                    ingredients.push(ingredient);
                }
            }
            
            return { steps, ingredients };
        } catch (error) {
            console.error('Failed to parse AI response:', error);
            return null;
        }
    }
    
    // Estimate ingredient price from defaults
    estimateIngredientPrice(name, qty, unit) {
        const prices = BakingModule.DEFAULT_INGREDIENT_PRICES;
        
        // Try exact name match first
        if (prices[name] !== undefined) {
            return Math.round(qty * prices[name]);
        }
        
        // Try partial match (case insensitive)
        const nameLower = name.toLowerCase();
        for (const [key, value] of Object.entries(prices)) {
            if (key.toLowerCase().includes(nameLower) || nameLower.includes(key.toLowerCase())) {
                return Math.round(qty * value);
            }
        }
        
        // Fallback based on unit
        const unitLower = unit.toLowerCase();
        if (unitLower === 'g' || unitLower === '그램') {
            return Math.round(qty * prices.DEFAULT_PER_GRAM);
        } else if (unitLower === 'ml' || unitLower === '밀리리터') {
            return Math.round(qty * prices.DEFAULT_PER_ML);
        } else if (unitLower === '개' || unitLower === 'ea' || unitLower === 'piece') {
            return Math.round(qty * prices.DEFAULT_PER_PIECE);
        }
        
        // Last resort: assume weight-based
        return Math.round(qty * prices.DEFAULT_PER_GRAM);
    }
    
    // 기본 계획 생성 (AI 실패 시)
    generateDefaultPlan(recipeName, yieldQty, yieldUnit) {
        const ratios = BakingModule.DEFAULT_INGREDIENT_RATIOS;
        const prices = BakingModule.DEFAULT_INGREDIENT_PRICES;
        
        return {
            steps: [
                { name: "재료 계량", estimatedTime: "14:00~14:15" },
                { name: "반죽 만들기", estimatedTime: "14:15~14:45" },
                { name: "성형", estimatedTime: "14:45~15:15" },
                { name: "굽기", estimatedTime: "15:15~15:45" },
                { name: "마무리", estimatedTime: "15:45~16:00" }
            ],
            ingredients: [
                { name: "밀가루", qty: Math.round(yieldQty * ratios.FLOUR_PER_UNIT), unit: "g", estimatedPrice: Math.round(yieldQty * ratios.FLOUR_PER_UNIT * prices.FLOUR_PRICE_PER_GRAM) },
                { name: "설탕", qty: Math.round(yieldQty * ratios.SUGAR_PER_UNIT), unit: "g", estimatedPrice: Math.round(yieldQty * ratios.SUGAR_PER_UNIT * prices.SUGAR_PRICE_PER_GRAM) },
                { name: "버터", qty: Math.round(yieldQty * ratios.BUTTER_PER_UNIT), unit: "g", estimatedPrice: Math.round(yieldQty * ratios.BUTTER_PER_UNIT * prices.BUTTER_PRICE_PER_GRAM) },
                { name: "달걀", qty: Math.max(1, Math.round(yieldQty * ratios.EGG_PER_10_UNITS / 10)), unit: "개", estimatedPrice: Math.max(1, Math.round(yieldQty * ratios.EGG_PER_10_UNITS / 10)) * prices.EGG_PRICE_EACH }
            ]
        };
    }
    
    // AI 계획 확인 모달
    showAIPlanConfirmationModal(recipeName, yieldQty, yieldUnit, plan) {
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        
        // Check ingredient availability
        const ingredientStatus = plan.ingredients.map(ing => {
            const item = this.inventoryModule?.findIngredientFuzzy(ing.name);
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
                        // AI가 전체 qty에 대한 estimatedPrice를 줬으므로, 부족분에 비례하여 가격 계산
                        let price = 0;
                        if (ing.estimatedPrice && ing.estimatedPrice > 0 && ing.qty > 0) {
                            price = Math.round((needed / ing.qty) * ing.estimatedPrice);
                        }
                        this.addToShoppingList(
                            ing.name,
                            needed,
                            ing.unit,
                            "온라인",
                            price,
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
                const item = this.inventoryModule?.findIngredientFuzzy(ing.name);
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
    
    // Show step-by-step baking confirmation modal
    showStepBakingConfirmModal(recipeId) {
        const recipe = this.settings.baking.recipes.find(r => r.id === recipeId);
        if (!recipe) return;
        
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>▶ 베이킹 시작</h3>
                <form id="sstssd-step-bake-form">
                    <div class="sstssd-form-group">
                        <label>레시피: ${this.escapeHtml(recipe.name)}</label>
                    </div>
                    <div class="sstssd-form-group">
                        <label>배수 (1배 = ${recipe.yieldQty}${recipe.yieldUnit})</label>
                        <input type="number" name="multiplier" class="sstssd-input" value="1" min="1" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>총 단계</label>
                        <div>${recipe.steps ? recipe.steps.length : 0}단계</div>
                    </div>
                    <div class="sstssd-form-group">
                        <label>필요 재료</label>
                        <div id="ingredient-check"></div>
                    </div>
                    <p style="color: #9ca3af; font-size: 13px;">
                        💡 베이킹을 시작하면 QR 시스템과 연동됩니다. AI가 BAKE 태그로 진행 상황을 업데이트하며, 100% 완료 시 자동으로 재료가 차감되고 완제품이 추가됩니다.
                    </p>
                    <div class="sstssd-form-actions">
                        <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                        <button type="submit" class="sstssd-btn sstssd-btn-primary">▶ 시작</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#sstssd-step-bake-form');
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
                const item = this.inventoryModule?.findIngredientFuzzy(ing.name);
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
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const multiplier = parseInt(formData.get('multiplier'));
            
            const result = await this.startBakingViaQR(recipeId, multiplier);
            
            if (result.success) {
                modal.remove();
                alert('베이킹을 시작합니다! QR로 진행 상황을 관리하세요.');
                
                // Re-render baking module
                const bakingContainer = document.querySelector('.sstssd-module[data-module="baking"]');
                if (bakingContainer) {
                    this.render(bakingContainer);
                }
            } else {
                alert('시작 실패: ' + result.error);
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
