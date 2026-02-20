// 💳 잔고 모듈 (Balance Module)
export class BalanceModule {
    constructor(settings, saveCallback, getGlobalSettings, getRpDate) {
        this.settings = settings;
        this.saveCallback = saveCallback;
        this.getGlobalSettings = getGlobalSettings;
        this.getRpDate = getRpDate;
        this.moduleName = 'balance';
        
        // Initialize balance data structure if not exists
        if (!this.settings.balance) {
            this.settings.balance = this.getDefaultBalanceData();
        }
        
        // Initialize sub-accordion state if not exists
        if (!this.settings.balance.subAccordionState) {
            this.settings.balance.subAccordionState = {
                savingsGoals: false,
                recurringTransactions: false,
                transactionHistory: false,
                monthlySummary: false,
                shopMode: false
            };
        }
        
        // Initialize ID counter from existing data
        this.idCounter = this.getMaxId();
        
        // Check for recurring income/expenses on date change
        this.processRecurringTransactions();
    }

    // Get maximum ID from existing data
    getMaxId() {
        let maxId = Date.now();
        
        if (this.settings.balance) {
            const allIds = [
                ...this.settings.balance.goals.map(g => g.id || 0),
                ...this.settings.balance.recurringIncome.map(i => i.id || 0),
                ...this.settings.balance.recurringExpense.map(e => e.id || 0),
                ...this.settings.balance.transactions.map(t => t.id || 0),
                ...(this.settings.balance.shopMode.unpaidWages || []).map(w => w.id || 0),
                ...(this.settings.balance.shopMode.shopRecurringExpense || []).map(e => e.id || 0)
            ];
            
            if (allIds.length > 0) {
                maxId = Math.max(maxId, ...allIds);
            }
        }
        
        return maxId;
    }

    // Default data structure
    getDefaultBalanceData() {
        return {
            living: 50000000,  // 생활비 (시작 5천만원)
            goals: [],  // 저축 목표들
            recurringIncome: [],  // 고정 수입
            recurringExpense: [],  // 고정 지출
            transactions: [],  // 거래 내역
            monthlySummaries: [],  // 월별 요약
            shopMode: {
                enabled: false,
                shopName: "가게",
                operatingFund: 0,
                payrollMode: "monthly",  // "daily" | "monthly"
                unpaidWages: [],
                shopRecurringExpense: [],
                warningThreshold: 500000,
                shopMonthlySummaries: []
            },
            lastProcessedDate: null  // Track last date for recurring transactions
        };
    }

    // ===== 총 자산 계산 =====
    getTotalAssets() {
        const living = this.settings.balance.living;
        const savings = this.getTotalSavings();
        const shopFund = this.settings.balance.shopMode.enabled ? this.settings.balance.shopMode.operatingFund : 0;
        return living + savings + shopFund;
    }

    getTotalSavings() {
        return this.settings.balance.goals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0);
    }

    // ===== 저축 관리 =====
    // 저축에 넣기
    transferToSavings(amount, goalId) {
        if (amount <= 0 || this.settings.balance.living < amount) {
            return { success: false, error: "금액이 부족합니다" };
        }

        const goal = this.settings.balance.goals.find(g => g.id === goalId);
        if (!goal) {
            return { success: false, error: "목표를 찾을 수 없습니다" };
        }

        this.settings.balance.living -= amount;
        goal.currentAmount = (goal.currentAmount || 0) + amount;
        
        // Add transaction
        this.addTransaction({
            type: "expense",
            source: "personal",
            category: "저축",
            description: `저축 (${goal.name})`,
            amount: amount,
            memo: `${goal.name}에 저축`,
            isRecurring: false,
            skipBalanceUpdate: true
        });

        this.saveCallback();
        return { success: true };
    }

    // 저축에서 빼기
    withdrawFromSavings(amount, goalId) {
        if (amount <= 0) {
            return { success: false, error: "잘못된 금액입니다" };
        }

        const goal = this.settings.balance.goals.find(g => g.id === goalId);
        if (!goal || goal.currentAmount < amount) {
            return { success: false, error: "금액이 부족합니다" };
        }

        goal.currentAmount -= amount;
        this.settings.balance.living += amount;
        
        // Add transaction
        this.addTransaction({
            type: "income",
            source: "personal",
            category: "저축인출",
            description: `저축 인출 (${goal.name})`,
            amount: amount,
            memo: `${goal.name}에서 인출`,
            isRecurring: false,
            skipBalanceUpdate: true
        });

        this.saveCallback();
        return { success: true };
    }

    // 저축 목표 추가
    addGoal(data) {
        const newGoal = {
            id: ++this.idCounter,
            name: data.name,
            icon: data.icon || "💰",
            targetAmount: data.targetAmount,
            currentAmount: 0,
            createdAt: this.formatDate(this.getRpDate()),
            subItems: data.subItems || []
        };
        
        this.settings.balance.goals.push(newGoal);
        this.saveCallback();
        return newGoal;
    }

    // 저축 목표 수정
    updateGoal(id, data) {
        const goal = this.settings.balance.goals.find(g => g.id === id);
        if (goal) {
            Object.assign(goal, data);
            this.saveCallback();
        }
        return goal;
    }

    // 저축 목표 삭제 (저축액은 생활비로 환원)
    deleteGoal(id) {
        const index = this.settings.balance.goals.findIndex(g => g.id === id);
        if (index !== -1) {
            const goal = this.settings.balance.goals[index];
            this.settings.balance.living += (goal.currentAmount || 0);
            this.settings.balance.goals.splice(index, 1);
            this.saveCallback();
            return true;
        }
        return false;
    }

    // ===== 고정 수입/지출 관리 =====
    addRecurringIncome(data) {
        const newIncome = {
            id: ++this.idCounter,
            name: data.name,
            type: data.type,  // "fixed" or "range"
            fixedAmount: data.type === "fixed" ? data.fixedAmount : null,
            minAmount: data.type === "range" ? data.minAmount : null,
            maxAmount: data.type === "range" ? data.maxAmount : null,
            dayOfMonth: data.dayOfMonth,
            source: data.source || "personal",  // "personal" or "shop"
            enabled: true
        };
        
        this.settings.balance.recurringIncome.push(newIncome);
        this.saveCallback();
        return newIncome;
    }

    updateRecurringIncome(id, data) {
        const income = this.settings.balance.recurringIncome.find(i => i.id === id);
        if (income) {
            Object.assign(income, data);
            this.saveCallback();
        }
        return income;
    }

    deleteRecurringIncome(id) {
        const income = this.settings.balance.recurringIncome.find(i => i.id === id);
        if (income && income.source === 'SNS') {
            alert('인스타 연동 항목은 삭제할 수 없습니다');
            return false;
        }
        
        const index = this.settings.balance.recurringIncome.findIndex(i => i.id === id);
        if (index !== -1) {
            this.settings.balance.recurringIncome.splice(index, 1);
            this.saveCallback();
            return true;
        }
        return false;
    }

    addRecurringExpense(data, isShop = false) {
        const newExpense = {
            id: ++this.idCounter,
            name: data.name,
            amount: data.amount,
            dayOfMonth: data.dayOfMonth,
            enabled: true
        };
        
        if (isShop) {
            this.settings.balance.shopMode.shopRecurringExpense.push(newExpense);
        } else {
            this.settings.balance.recurringExpense.push(newExpense);
        }
        this.saveCallback();
        return newExpense;
    }

    updateRecurringExpense(id, data, isShop = false) {
        const expenses = isShop ? 
            this.settings.balance.shopMode.shopRecurringExpense : 
            this.settings.balance.recurringExpense;
        const expense = expenses.find(e => e.id === id);
        if (expense) {
            Object.assign(expense, data);
            this.saveCallback();
        }
        return expense;
    }

    deleteRecurringExpense(id, isShop = false) {
        const expenses = isShop ? 
            this.settings.balance.shopMode.shopRecurringExpense : 
            this.settings.balance.recurringExpense;
        const index = expenses.findIndex(e => e.id === id);
        if (index !== -1) {
            expenses.splice(index, 1);
            this.saveCallback();
            return true;
        }
        return false;
    }

    // ===== 거래 내역 관리 =====
    addTransaction(data) {
        const newTransaction = {
            id: ++this.idCounter,
            date: data.date || this.formatDate(this.getRpDate()),
            type: data.type,  // "income" | "expense"
            source: data.source || "personal",  // "personal" | "shop"
            category: data.category || "",
            description: data.description || "",
            amount: data.amount,
            memo: data.memo || "",
            isRecurring: data.isRecurring || false,
            createdAt: this.formatDate(this.getRpDate())
        };
        
        this.settings.balance.transactions.unshift(newTransaction);  // Add to beginning
        
        // Update balance based on transaction (skip if caller already updated balance directly)
        if (!data.skipBalanceUpdate) {
            if (data.source === "shop" && this.settings.balance.shopMode.enabled) {
                if (data.type === "income") {
                    this.settings.balance.shopMode.operatingFund += data.amount;
                } else {
                    this.settings.balance.shopMode.operatingFund -= data.amount;
                }
            } else {
                if (data.type === "income") {
                    this.settings.balance.living += data.amount;
                } else {
                    this.settings.balance.living -= data.amount;
                }
            }
        }
        
        this.saveCallback();
        return newTransaction;
    }

    deleteTransaction(id) {
        const index = this.settings.balance.transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            const transaction = this.settings.balance.transactions[index];
            
            // Reverse the transaction effect
            if (transaction.source === "shop") {
                if (transaction.type === "income") {
                    this.settings.balance.shopMode.operatingFund -= transaction.amount;
                } else {
                    this.settings.balance.shopMode.operatingFund += transaction.amount;
                }
            } else {
                if (transaction.type === "income") {
                    this.settings.balance.living -= transaction.amount;
                } else {
                    this.settings.balance.living += transaction.amount;
                }
            }
            
            this.settings.balance.transactions.splice(index, 1);
            this.saveCallback();
            return true;
        }
        return false;
    }

    getFilteredTransactions(filter = "all") {
        return this.settings.balance.transactions.filter(t => {
            if (filter === "all") return true;
            if (filter === "income") return t.type === "income";
            if (filter === "expense") return t.type === "expense";
            if (filter === "personal") return t.source === "personal";
            if (filter === "shop") return t.source === "shop";
            return true;
        });
    }

    // ===== 고정 거래 자동 처리 =====
    processRecurringTransactions() {
        const rpDate = this.getRpDate();
        const today = this.formatDate(rpDate);
        const currentDay = rpDate.getDate();
        
        // 이번 달의 마지막 날 계산
        const lastDayOfMonth = new Date(rpDate.getFullYear(), rpDate.getMonth() + 1, 0).getDate();
        
        // Skip if already processed today
        if (this.settings.balance.lastProcessedDate === today) {
            return;
        }
        
        // Helper: 설정일이 이번 달에 매칭되는지 확인
        const isDayMatch = (dayOfMonth) => {
            if (dayOfMonth === currentDay) return true;
            // 설정일이 이번 달의 마지막 날보다 크면, 마지막 날에 실행
            if (dayOfMonth > lastDayOfMonth && currentDay === lastDayOfMonth) return true;
            return false;
        };
        
        // Process recurring income
        this.settings.balance.recurringIncome.forEach(income => {
            if (income.enabled && isDayMatch(income.dayOfMonth)) {
                const amount = income.type === "fixed" ? 
                    income.fixedAmount : 
                    this.randomInRange(income.minAmount, income.maxAmount);
                
                // Use source from income settings, default to personal
                const source = income.source || "personal";
                
                this.addTransaction({
                    type: "income",
                    source: source,
                    category: income.name,
                    description: income.name,
                    amount: amount,
                    memo: "고정 수입",
                    isRecurring: true
                });
            }
        });
        
        // Process recurring expenses
        this.settings.balance.recurringExpense.forEach(expense => {
            if (expense.enabled && isDayMatch(expense.dayOfMonth)) {
                this.addTransaction({
                    type: "expense",
                    source: "personal",
                    category: expense.name,
                    description: expense.name,
                    amount: expense.amount,
                    memo: "고정 지출",
                    isRecurring: true
                });
            }
        });
        
        // Process shop recurring expenses
        if (this.settings.balance.shopMode.enabled) {
            this.settings.balance.shopMode.shopRecurringExpense.forEach(expense => {
                if (expense.enabled && isDayMatch(expense.dayOfMonth)) {
                    this.addTransaction({
                        type: "expense",
                        source: "shop",
                        category: expense.name,
                        description: expense.name,
                        amount: expense.amount,
                        memo: "고정 지출",
                        isRecurring: true
                    });
                }
            });
        }
        
        this.settings.balance.lastProcessedDate = today;
        this.saveCallback();
    }

    // Random amount in range (10,000 unit)
    randomInRange(min, max) {
        const unit = 10000;
        const minUnits = Math.ceil(min / unit);
        const maxUnits = Math.floor(max / unit);
        const randomUnits = minUnits + Math.floor(Math.random() * (maxUnits - minUnits + 1));
        return randomUnits * unit;
    }

    // ===== 월별 요약 =====
    getCurrentMonthSummary() {
        const rpDate = this.getRpDate();
        const currentMonth = this.formatMonth(rpDate);
        
        const monthTransactions = this.settings.balance.transactions.filter(t => {
            return t.date.startsWith(currentMonth) && t.source === "personal";
        });
        
        const totalIncome = monthTransactions
            .filter(t => t.type === "income")
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpense = monthTransactions
            .filter(t => t.type === "expense")
            .reduce((sum, t) => sum + t.amount, 0);
        
        const categories = {};
        monthTransactions
            .filter(t => t.type === "expense")
            .forEach(t => {
                if (!categories[t.category]) {
                    categories[t.category] = 0;
                }
                categories[t.category] += t.amount;
            });
        
        return {
            month: currentMonth,
            totalIncome,
            totalExpense,
            netIncome: totalIncome - totalExpense,
            categories
        };
    }

    getShopMonthSummary() {
        if (!this.settings.balance.shopMode.enabled) {
            return null;
        }
        
        const rpDate = this.getRpDate();
        const currentMonth = this.formatMonth(rpDate);
        
        const shopTransactions = this.settings.balance.transactions.filter(t => {
            return t.date.startsWith(currentMonth) && t.source === "shop";
        });
        
        const totalIncome = shopTransactions
            .filter(t => t.type === "income")
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = {};
        shopTransactions
            .filter(t => t.type === "expense")
            .forEach(t => {
                if (!expenses[t.category]) {
                    expenses[t.category] = 0;
                }
                expenses[t.category] += t.amount;
            });
        
        const totalExpense = Object.values(expenses).reduce((sum, v) => sum + v, 0);
        
        return {
            month: currentMonth,
            totalIncome,
            expenses,
            totalExpense,
            netIncome: totalIncome - totalExpense
        };
    }

    // ===== 가게 모드 =====
    toggleShopMode(enabled, initialFund = 0) {
        this.settings.balance.shopMode.enabled = enabled;
        if (enabled && initialFund > 0) {
            this.settings.balance.shopMode.operatingFund = initialFund;
        }
        this.saveCallback();
    }

    transferPersonalToShop(amount) {
        if (amount <= 0 || this.settings.balance.living < amount) {
            return { success: false, error: "금액이 부족합니다" };
        }
        
        this.settings.balance.living -= amount;
        this.settings.balance.shopMode.operatingFund += amount;
        
        this.addTransaction({
            type: "expense",
            source: "personal",
            category: "가게이체",
            description: "개인 → 가게 이체",
            amount: amount,
            memo: "운영비 충전",
            skipBalanceUpdate: true
        });
        
        this.saveCallback();
        return { success: true };
    }

    transferShopToPersonal(amount, toSavings = false, goalId = null) {
        if (amount <= 0 || this.settings.balance.shopMode.operatingFund < amount) {
            return { success: false, error: "금액이 부족합니다" };
        }
        
        this.settings.balance.shopMode.operatingFund -= amount;
        
        if (toSavings && goalId) {
            const goal = this.settings.balance.goals.find(g => g.id === goalId);
            if (goal) {
                goal.currentAmount += amount;
            }
        } else {
            this.settings.balance.living += amount;
        }
        
        this.addTransaction({
            type: "income",
            source: "personal",
            category: "가게인출",
            description: "가게 → 개인 이체",
            amount: amount,
            memo: toSavings ? "저축으로 이체" : "생활비로 이체",
            skipBalanceUpdate: true
        });
        
        this.saveCallback();
        return { success: true };
    }

    addUnpaidWage(data) {
        const wage = {
            id: ++this.idCounter,
            name: data.name,
            hours: data.hours,
            hourlyRate: data.hourlyRate,
            amount: data.hours * data.hourlyRate,
            date: data.date || this.formatDate(this.getRpDate())
        };
        
        this.settings.balance.shopMode.unpaidWages.push(wage);
        this.saveCallback();
        return wage;
    }

    payWage(id) {
        const index = this.settings.balance.shopMode.unpaidWages.findIndex(w => w.id === id);
        if (index !== -1) {
            const wage = this.settings.balance.shopMode.unpaidWages[index];
            
            if (this.settings.balance.shopMode.operatingFund < wage.amount) {
                return { success: false, error: "운영비가 부족합니다" };
            }
            
            this.addTransaction({
                type: "expense",
                source: "shop",
                category: "알바비",
                description: `알바비 지급 (${wage.name})`,
                amount: wage.amount,
                memo: `${wage.hours}시간 × ${wage.hourlyRate}원`
            });
            
            this.settings.balance.shopMode.unpaidWages.splice(index, 1);
            this.saveCallback();
            return { success: true };
        }
        return { success: false, error: "급여를 찾을 수 없습니다" };
    }

    // ===== UI 렌더링 =====
    render(container) {
        const contentEl = container.querySelector('.sstssd-module-content');
        let isOpen = contentEl ? contentEl.classList.contains('sstssd-module-open') : false;
        
        if (!contentEl && this.getGlobalSettings) {
            const globalSettings = this.getGlobalSettings();
            isOpen = globalSettings.openModules.includes(this.moduleName);
        }

        const totalAssets = this.getTotalAssets();
        const living = this.settings.balance.living;
        const savings = this.getTotalSavings();
        const shopEnabled = this.settings.balance.shopMode.enabled;
        const shopFund = this.settings.balance.shopMode.operatingFund;

        container.innerHTML = `
            <div class="sstssd-module-header" data-module="${this.moduleName}">
                <div class="sstssd-module-title">
                    <span class="sstssd-module-icon">💳</span>
                    <span>잔고</span>
                </div>
                <button class="sstssd-module-toggle">${isOpen ? '▲' : '▼'}</button>
            </div>
            <div class="sstssd-module-content ${isOpen ? 'sstssd-module-open' : ''}" data-module="${this.moduleName}">
                ${this.renderBalanceOverview(totalAssets, living, savings, shopEnabled, shopFund)}
                ${this.renderSavingsGoals()}
                ${this.renderRecurringTransactions()}
                ${this.renderTransactionHistory()}
                ${this.renderMonthlySummary()}
                ${shopEnabled ? this.renderShopReport() : ''}
                ${this.renderShopModeToggle()}
            </div>
        `;

        this.attachEventListeners(container);
        
        if (typeof window.sstsdUpdateSummary === 'function') {
            window.sstsdUpdateSummary();
        }
    }

    renderBalanceOverview(totalAssets, living, savings, shopEnabled, shopFund) {
        if (shopEnabled) {
            const shopSummary = this.getShopMonthSummary();
            const unpaidWages = this.settings.balance.shopMode.unpaidWages;
            const lowFundWarning = shopFund < this.settings.balance.shopMode.warningThreshold;
            
            return `
                <div class="sstssd-balance-overview">
                    <div class="sstssd-balance-total">
                        📊 전체 자산: <strong>${this.formatCurrency(totalAssets)}</strong>
                    </div>
                    <div class="sstssd-balance-section">
                        <div class="sstssd-balance-item">
                            <span class="sstssd-balance-label">👤 개인</span>
                        </div>
                        <div class="sstssd-balance-subitem">
                            ├ 💰 생활비 <span class="sstssd-balance-amount">${this.formatCurrency(living)}</span>
                        </div>
                        <div class="sstssd-balance-subitem">
                            └ 🏦 저축 <span class="sstssd-balance-amount">${this.formatCurrency(savings)}</span>
                        </div>
                    </div>
                    <div class="sstssd-balance-section">
                        <div class="sstssd-balance-item">
                            <span class="sstssd-balance-label">🏪 가게 [${this.escapeHtml(this.settings.balance.shopMode.shopName)}]</span>
                        </div>
                        <div class="sstssd-balance-subitem">
                            ├ 💰 운영비 <span class="sstssd-balance-amount ${lowFundWarning ? 'sstssd-balance-warning' : ''}">${this.formatCurrency(shopFund)}</span>
                        </div>
                        ${shopSummary ? `
                        <div class="sstssd-balance-subitem">
                            ├ 📈 이번 달 순이익
                        </div>
                        <div class="sstssd-balance-subitem">
                            │  <span class="sstssd-balance-amount ${shopSummary.netIncome >= 0 ? 'sstssd-balance-positive' : 'sstssd-balance-negative'}">${shopSummary.netIncome >= 0 ? '+' : ''}${this.formatCurrency(shopSummary.netIncome)}</span>
                        </div>
                        ` : ''}
                        ${unpaidWages.length > 0 ? `
                        <div class="sstssd-balance-subitem">
                            └ ⚠️ 미지급 알바비
                        </div>
                        ${unpaidWages.map(w => `
                        <div class="sstssd-balance-subitem">
                               ${w.name} ${this.formatCurrency(w.amount)}
                        </div>
                        `).join('')}
                        ` : ''}
                    </div>
                    <div class="sstssd-balance-actions">
                        <button class="sstssd-btn sstssd-btn-sm" data-action="transfer-personal-to-shop">개인 → 가게</button>
                        <button class="sstssd-btn sstssd-btn-sm" data-action="transfer-shop-to-personal">가게 → 개인</button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="sstssd-balance-overview">
                    <div class="sstssd-balance-total">
                        총 자산: <strong>${this.formatCurrency(totalAssets)}</strong>
                    </div>
                    <div class="sstssd-balance-section">
                        <div class="sstssd-balance-item">
                            💰 생활비 <span class="sstssd-balance-amount">${this.formatCurrency(living)}</span>
                        </div>
                        <div class="sstssd-balance-item">
                            🏦 저축 합계 <span class="sstssd-balance-amount">${this.formatCurrency(savings)}</span>
                        </div>
                    </div>
                    <div class="sstssd-balance-actions">
                        <button class="sstssd-btn sstssd-btn-sm" data-action="to-savings">저축에 넣기</button>
                        <button class="sstssd-btn sstssd-btn-sm" data-action="from-savings">저축에서 빼기</button>
                    </div>
                </div>
            `;
        }
    }

    renderSavingsGoals() {
        const goals = this.settings.balance.goals;
        const isOpen = this.settings.balance.subAccordionState.savingsGoals;
        
        return `
            <div class="sstssd-section">
                <div class="sstssd-balance-section-header" data-section="savingsGoals">
                    <span class="sstssd-section-title">🎯 저축 목표들</span>
                    <span class="sstssd-balance-section-arrow ${isOpen ? 'open' : ''}">▶</span>
                </div>
                <div class="sstssd-balance-section-content ${isOpen ? 'open' : ''}">
                    ${goals.length === 0 ? '<div class="sstssd-empty">저축 목표가 없습니다</div>' : ''}
                    ${goals.map(goal => this.renderGoal(goal)).join('')}
                    <button class="sstssd-btn sstssd-btn-add" data-action="add-goal">+ 목표 추가</button>
                </div>
            </div>
        `;
    }

    renderGoal(goal) {
        const progress = goal.targetAmount > 0 ? 
            Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
        
        return `
            <div class="sstssd-goal-item" data-id="${goal.id}">
                <div class="sstssd-goal-header">
                    <span class="sstssd-goal-icon">${goal.icon}</span>
                    <span class="sstssd-goal-name">${this.escapeHtml(goal.name)}</span>
                </div>
                <div class="sstssd-progress-container">
                    <div class="sstssd-progress-bar sstssd-progress-balance">
                        <div class="sstssd-progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="sstssd-progress-label">
                        ${this.formatCurrency(goal.currentAmount)}/${this.formatCurrency(goal.targetAmount)} (${progress}%)
                    </div>
                </div>
                ${goal.subItems && goal.subItems.length > 0 ? `
                <div class="sstssd-goal-subitems">
                    ${goal.subItems.map(item => `
                    <div class="sstssd-goal-subitem">
                        ├── ${this.escapeHtml(item.name)} <span class="sstssd-goal-subitem-amount">${this.formatCurrency(item.amount)}</span>
                    </div>
                    `).join('')}
                </div>
                ` : ''}
                <div class="sstssd-goal-actions">
                    <button class="sstssd-btn sstssd-btn-sm" data-action="edit-goal" data-id="${goal.id}">수정</button>
                    <button class="sstssd-btn sstssd-btn-sm" data-action="edit-subitems" data-id="${goal.id}">세부 항목 편집</button>
                    <button class="sstssd-btn sstssd-btn-sm sstssd-btn-delete" data-action="delete-goal" data-id="${goal.id}">삭제</button>
                </div>
            </div>
        `;
    }

    renderRecurringTransactions() {
        const income = this.settings.balance.recurringIncome;
        const expense = this.settings.balance.recurringExpense;
        const isOpen = this.settings.balance.subAccordionState.recurringTransactions;
        
        return `
            <div class="sstssd-section">
                <div class="sstssd-balance-section-header" data-section="recurringTransactions">
                    <span class="sstssd-section-title">📌 고정 수입/지출</span>
                    <span class="sstssd-balance-section-arrow ${isOpen ? 'open' : ''}">▶</span>
                </div>
                <div class="sstssd-balance-section-content ${isOpen ? 'open' : ''}">
                    <div class="sstssd-subsection">
                        <div class="sstssd-subsection-title">📥 고정 수입</div>
                        ${income.length === 0 ? '<div class="sstssd-empty">고정 수입이 없습니다</div>' : ''}
                        ${income.map(i => this.renderRecurringIncome(i)).join('')}
                        <button class="sstssd-btn sstssd-btn-sm" data-action="add-recurring-income">+ 수입 추가</button>
                    </div>
                    <div class="sstssd-subsection">
                        <div class="sstssd-subsection-title">📤 고정 지출</div>
                        ${expense.length === 0 ? '<div class="sstssd-empty">고정 지출이 없습니다</div>' : ''}
                        ${expense.map(e => this.renderRecurringExpense(e)).join('')}
                        <button class="sstssd-btn sstssd-btn-sm" data-action="add-recurring-expense">+ 지출 추가</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderRecurringIncome(income) {
        const isSNS = income.source === 'SNS';
        const amountText = income.type === "fixed" ? 
            this.formatCurrency(income.fixedAmount) : 
            `${this.formatCurrency(income.minAmount)}~${this.formatCurrency(income.maxAmount)} (랜덤)`;
        
        return `
            <div class="sstssd-recurring-item ${income.enabled ? '' : 'sstssd-recurring-disabled'} ${isSNS ? 'sstssd-recurring-locked' : ''}">
                <div class="sstssd-recurring-header">
                    <span>${this.escapeHtml(income.name || income.source)} ${isSNS ? '🔒' : ''}</span>
                    <span class="sstssd-recurring-day">매월 ${income.dayOfMonth}일</span>
                </div>
                <div class="sstssd-recurring-amount">└ ${amountText}${isSNS ? ' <span class="sstssd-auto-sync-label">(자동 연동)</span>' : ''}</div>
                <div class="sstssd-recurring-actions">
                    ${!isSNS ? `
                        <button class="sstssd-btn sstssd-btn-xs" data-action="toggle-recurring-income" data-id="${income.id}">
                            ${income.enabled ? '비활성화' : '활성화'}
                        </button>
                        <button class="sstssd-btn sstssd-btn-xs sstssd-btn-delete" data-action="delete-recurring-income" data-id="${income.id}">삭제</button>
                    ` : `
                        <span class="sstssd-locked-message">인스타그램 연동 항목</span>
                    `}
                </div>
            </div>
        `;
    }

    renderRecurringExpense(expense, isShop = false) {
        return `
            <div class="sstssd-recurring-item ${expense.enabled ? '' : 'sstssd-recurring-disabled'}">
                <div class="sstssd-recurring-header">
                    <span>${this.escapeHtml(expense.name)}</span>
                    <span class="sstssd-recurring-day">매월 ${expense.dayOfMonth}일</span>
                </div>
                <div class="sstssd-recurring-amount">${this.formatCurrency(expense.amount)}</div>
                <div class="sstssd-recurring-actions">
                    <button class="sstssd-btn sstssd-btn-xs" data-action="toggle-recurring-expense${isShop ? '-shop' : ''}" data-id="${expense.id}">
                        ${expense.enabled ? '비활성화' : '활성화'}
                    </button>
                    <button class="sstssd-btn sstssd-btn-xs sstssd-btn-delete" data-action="delete-recurring-expense${isShop ? '-shop' : ''}" data-id="${expense.id}">삭제</button>
                </div>
            </div>
        `;
    }

    renderTransactionHistory() {
        const transactions = this.settings.balance.transactions.slice(0, 5);
        const hasMore = this.settings.balance.transactions.length > 5;
        const shopEnabled = this.settings.balance.shopMode.enabled;
        const isOpen = this.settings.balance.subAccordionState.transactionHistory;
        
        return `
            <div class="sstssd-section">
                <div class="sstssd-balance-section-header" data-section="transactionHistory">
                    <span class="sstssd-section-title">📋 거래 내역</span>
                    <span class="sstssd-balance-section-arrow ${isOpen ? 'open' : ''}">▶</span>
                </div>
                <div class="sstssd-balance-section-content ${isOpen ? 'open' : ''}">
                    <div class="sstssd-section-header">
                        ${hasMore ? '<button class="sstssd-btn sstssd-btn-xs" data-action="show-all-transactions">전체</button>' : ''}
                    </div>
                    ${shopEnabled ? `
                    <div class="sstssd-transaction-filters">
                        <button class="sstssd-btn sstssd-btn-xs sstssd-filter-active" data-filter="all">전체</button>
                        <button class="sstssd-btn sstssd-btn-xs" data-filter="personal">개인</button>
                        <button class="sstssd-btn sstssd-btn-xs" data-filter="shop">가게</button>
                    </div>
                    ` : ''}
                    <div class="sstssd-transaction-list" id="sstssd-transaction-list">
                        ${transactions.length === 0 ? '<div class="sstssd-empty">거래 내역이 없습니다</div>' : ''}
                        ${transactions.map(t => this.renderTransaction(t)).join('')}
                    </div>
                    <button class="sstssd-btn sstssd-btn-add" data-action="add-transaction">+ 수동 추가</button>
                </div>
            </div>
        `;
    }

    renderTransaction(t) {
        const icon = t.type === "income" ? "📥" : "📤";
        const sourceIcon = t.source === "shop" ? "🏪" : "👤";
        const amountClass = t.type === "income" ? "sstssd-balance-positive" : "sstssd-balance-negative";
        const sign = t.type === "income" ? "+" : "-";
        const badge = t.isRecurring ? '<span class="sstssd-badge sstssd-badge-recurring">[고정]</span>' : '';
        
        return `
            <div class="sstssd-transaction-item" data-id="${t.id}" data-source="${t.source}">
                <div class="sstssd-transaction-header">
                    <span class="sstssd-transaction-date">${t.date}</span>
                    <span class="sstssd-transaction-icons">${icon}${this.settings.balance.shopMode.enabled ? sourceIcon : ''}</span>
                    <span class="sstssd-transaction-desc">${this.escapeHtml(t.description || t.category)}</span>
                    ${badge}
                </div>
                <div class="sstssd-transaction-footer">
                    <span class="sstssd-transaction-amount ${amountClass}">${sign}${this.formatCurrency(t.amount)}</span>
                    ${!t.isRecurring ? `<button class="sstssd-btn sstssd-btn-xs sstssd-btn-delete" data-action="delete-transaction" data-id="${t.id}">삭제</button>` : ''}
                </div>
                ${t.memo ? `<div class="sstssd-transaction-memo">${this.escapeHtml(t.memo)}</div>` : ''}
            </div>
        `;
    }

    renderMonthlySummary() {
        const summary = this.getCurrentMonthSummary();
        const categories = Object.entries(summary.categories);
        const maxAmount = Math.max(...Object.values(summary.categories), 1);
        const isOpen = this.settings.balance.subAccordionState.monthlySummary;
        
        return `
            <div class="sstssd-section">
                <div class="sstssd-balance-section-header" data-section="monthlySummary">
                    <span class="sstssd-section-title">📊 이번 달 요약</span>
                    <span class="sstssd-balance-section-arrow ${isOpen ? 'open' : ''}">▶</span>
                </div>
                <div class="sstssd-balance-section-content ${isOpen ? 'open' : ''}">
                    <div class="sstssd-summary-stats">
                        <div class="sstssd-summary-row">
                            <span>📥 총 수입:</span>
                            <span class="sstssd-balance-positive">+${this.formatCurrency(summary.totalIncome)}</span>
                        </div>
                        <div class="sstssd-summary-row">
                            <span>📤 총 지출:</span>
                            <span class="sstssd-balance-negative">-${this.formatCurrency(summary.totalExpense)}</span>
                        </div>
                        <div class="sstssd-summary-row">
                            <span>📈 순수익:</span>
                            <span class="${summary.netIncome >= 0 ? 'sstssd-balance-positive' : 'sstssd-balance-negative'}">
                                ${summary.netIncome >= 0 ? '+' : ''}${this.formatCurrency(summary.netIncome)}
                            </span>
                        </div>
                    </div>
                    ${categories.length > 0 ? `
                    <div class="sstssd-summary-categories">
                        <div class="sstssd-subsection-title">지출 비중:</div>
                        ${categories.map(([name, amount]) => {
                            const percentage = Math.round((amount / summary.totalExpense) * 100);
                            const barWidth = Math.round((amount / maxAmount) * 100);
                            return `
                            <div class="sstssd-category-row">
                                <div class="sstssd-category-label">${this.escapeHtml(name)}</div>
                                <div class="sstssd-category-bar-container">
                                    <div class="sstssd-category-bar" style="width: ${barWidth}%"></div>
                                </div>
                                <div class="sstssd-category-percentage">${percentage}%</div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderShopReport() {
        const summary = this.getShopMonthSummary();
        if (!summary) return '';
        
        const expenses = Object.entries(summary.expenses);
        
        return `
            <div class="sstssd-section">
                <div class="sstssd-section-title">📊 가게 월별 리포트</div>
                <div class="sstssd-summary-stats">
                    <div class="sstssd-summary-row">
                        <span>매출:</span>
                        <span class="sstssd-balance-positive">+${this.formatCurrency(summary.totalIncome)}</span>
                    </div>
                    ${expenses.length > 0 ? `
                    <div class="sstssd-summary-subsection">
                        <div>지출 내역:</div>
                        ${expenses.map(([name, amount]) => `
                        <div class="sstssd-summary-row sstssd-summary-indent">
                            <span>${this.escapeHtml(name)}</span>
                            <span class="sstssd-balance-negative">-${this.formatCurrency(amount)}</span>
                        </div>
                        `).join('')}
                    </div>
                    ` : ''}
                    <div class="sstssd-summary-row">
                        <span>지출 합계:</span>
                        <span class="sstssd-balance-negative">-${this.formatCurrency(summary.totalExpense)}</span>
                    </div>
                    <div class="sstssd-summary-row">
                        <span>순이익:</span>
                        <span class="${summary.netIncome >= 0 ? 'sstssd-balance-positive' : 'sstssd-balance-negative'}">
                            ${summary.netIncome >= 0 ? '+' : ''}${this.formatCurrency(summary.netIncome)}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    renderShopModeToggle() {
        const enabled = this.settings.balance.shopMode.enabled;
        const isOpen = this.settings.balance.subAccordionState.shopMode;
        
        return `
            <div class="sstssd-section">
                <div class="sstssd-balance-section-header" data-section="shopMode">
                    <span class="sstssd-section-title">⚙️ 가게 모드</span>
                    <span class="sstssd-balance-section-arrow ${isOpen ? 'open' : ''}">▶</span>
                </div>
                <div class="sstssd-balance-section-content ${isOpen ? 'open' : ''}">
                    <div class="sstssd-shop-mode-toggle">
                        <label>🏪 가게 모드:</label>
                        <label class="sstssd-toggle">
                            <input type="checkbox" ${enabled ? 'checked' : ''} data-action="toggle-shop-mode">
                            <span class="sstssd-toggle-slider"></span>
                        </label>
                        <span>${enabled ? 'ON' : 'OFF'}</span>
                    </div>
                    ${enabled ? `
                    <div class="sstssd-shop-settings">
                        <div class="sstssd-form-group">
                            <label>가게 이름:</label>
                            <input type="text" class="sstssd-input sstssd-input-sm" 
                                   value="${this.escapeHtml(this.settings.balance.shopMode.shopName)}" 
                                   data-action="update-shop-name">
                        </div>
                        <div class="sstssd-form-group">
                            <label>알바비 지급:</label>
                            <select class="sstssd-input sstssd-input-sm" data-action="update-payroll-mode">
                                <option value="daily" ${this.settings.balance.shopMode.payrollMode === 'daily' ? 'selected' : ''}>당일</option>
                                <option value="monthly" ${this.settings.balance.shopMode.payrollMode === 'monthly' ? 'selected' : ''}>월말</option>
                            </select>
                        </div>
                        <div class="sstssd-form-group">
                            <label>운영비 경고 (원):</label>
                            <input type="number" class="sstssd-input sstssd-input-sm" 
                                   value="${this.settings.balance.shopMode.warningThreshold}" 
                                   data-action="update-warning-threshold" step="1">
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // ===== 이벤트 리스너 =====
    attachEventListeners(container) {
        // Sub-accordion toggles (event delegation)
        container.querySelectorAll('.sstssd-balance-section-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const section = header.dataset.section;
                if (!section) return;
                
                // Toggle state
                this.settings.balance.subAccordionState[section] = !this.settings.balance.subAccordionState[section];
                this.saveCallback();
                
                // Toggle UI
                const content = header.nextElementSibling;
                const arrow = header.querySelector('.sstssd-balance-section-arrow');
                
                if (content && content.classList.contains('sstssd-balance-section-content')) {
                    content.classList.toggle('open');
                }
                if (arrow) {
                    arrow.classList.toggle('open');
                }
            });
        });
        
        // 저축 이체
        const toSavingsBtn = container.querySelector('[data-action="to-savings"]');
        if (toSavingsBtn) {
            toSavingsBtn.addEventListener('click', () => this.showTransferToSavingsModal());
        }

        const fromSavingsBtn = container.querySelector('[data-action="from-savings"]');
        if (fromSavingsBtn) {
            fromSavingsBtn.addEventListener('click', () => this.showTransferFromSavingsModal());
        }

        // 저축 목표 관리
        const addGoalBtn = container.querySelector('[data-action="add-goal"]');
        if (addGoalBtn) {
            addGoalBtn.addEventListener('click', () => this.showAddGoalModal());
        }

        container.querySelectorAll('[data-action="edit-goal"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.showEditGoalModal(id);
            });
        });

        container.querySelectorAll('[data-action="edit-subitems"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.showEditSubItemsModal(id);
            });
        });

        container.querySelectorAll('[data-action="delete-goal"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                if (confirm('이 저축 목표를 삭제하시겠습니까? 저축액은 생활비로 환원됩니다.')) {
                    this.deleteGoal(id);
                    this.render(container);
                }
            });
        });

        // 고정 수입/지출
        const addIncomeBtn = container.querySelector('[data-action="add-recurring-income"]');
        if (addIncomeBtn) {
            addIncomeBtn.addEventListener('click', () => this.showAddRecurringIncomeModal());
        }

        const addExpenseBtn = container.querySelector('[data-action="add-recurring-expense"]');
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', () => this.showAddRecurringExpenseModal());
        }

        container.querySelectorAll('[data-action="toggle-recurring-income"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                const income = this.settings.balance.recurringIncome.find(i => i.id === id);
                if (income) {
                    income.enabled = !income.enabled;
                    this.saveCallback();
                    this.render(container);
                }
            });
        });

        container.querySelectorAll('[data-action="delete-recurring-income"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                if (confirm('이 고정 수입을 삭제하시겠습니까?')) {
                    this.deleteRecurringIncome(id);
                    this.render(container);
                }
            });
        });

        container.querySelectorAll('[data-action="toggle-recurring-expense"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                const expense = this.settings.balance.recurringExpense.find(e => e.id === id);
                if (expense) {
                    expense.enabled = !expense.enabled;
                    this.saveCallback();
                    this.render(container);
                }
            });
        });

        container.querySelectorAll('[data-action="delete-recurring-expense"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                if (confirm('이 고정 지출을 삭제하시겠습니까?')) {
                    this.deleteRecurringExpense(id);
                    this.render(container);
                }
            });
        });

        // 거래 내역
        const addTransactionBtn = container.querySelector('[data-action="add-transaction"]');
        if (addTransactionBtn) {
            addTransactionBtn.addEventListener('click', () => this.showAddTransactionModal());
        }

        container.querySelectorAll('[data-action="delete-transaction"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                if (confirm('이 거래를 삭제하시겠습니까?')) {
                    this.deleteTransaction(id);
                    this.render(container);
                }
            });
        });

        const showAllBtn = container.querySelector('[data-action="show-all-transactions"]');
        if (showAllBtn) {
            showAllBtn.addEventListener('click', () => this.showAllTransactionsModal());
        }

        // 거래 필터
        container.querySelectorAll('.sstssd-transaction-filters button').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.sstssd-transaction-filters button').forEach(b => {
                    b.classList.remove('sstssd-filter-active');
                });
                btn.classList.add('sstssd-filter-active');
                
                const filter = btn.dataset.filter;
                this.applyTransactionFilter(container, filter);
            });
        });

        // 가게 모드
        const shopToggle = container.querySelector('[data-action="toggle-shop-mode"]');
        if (shopToggle) {
            shopToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.showEnableShopModeModal();
                } else {
                    this.toggleShopMode(false);
                    this.render(container);
                }
            });
        }

        const shopNameInput = container.querySelector('[data-action="update-shop-name"]');
        if (shopNameInput) {
            shopNameInput.addEventListener('change', (e) => {
                this.settings.balance.shopMode.shopName = e.target.value;
                this.saveCallback();
            });
        }

        const payrollModeSelect = container.querySelector('[data-action="update-payroll-mode"]');
        if (payrollModeSelect) {
            payrollModeSelect.addEventListener('change', (e) => {
                this.settings.balance.shopMode.payrollMode = e.target.value;
                this.saveCallback();
            });
        }

        const warningThresholdInput = container.querySelector('[data-action="update-warning-threshold"]');
        if (warningThresholdInput) {
            warningThresholdInput.addEventListener('change', (e) => {
                this.settings.balance.shopMode.warningThreshold = parseInt(e.target.value) || 0;
                this.saveCallback();
                this.render(container);
            });
        }

        const personalToShopBtn = container.querySelector('[data-action="transfer-personal-to-shop"]');
        if (personalToShopBtn) {
            personalToShopBtn.addEventListener('click', () => this.showTransferPersonalToShopModal());
        }

        const shopToPersonalBtn = container.querySelector('[data-action="transfer-shop-to-personal"]');
        if (shopToPersonalBtn) {
            shopToPersonalBtn.addEventListener('click', () => this.showTransferShopToPersonalModal());
        }
    }

    applyTransactionFilter(container, filter) {
        const listEl = container.querySelector('#sstssd-transaction-list');
        if (!listEl) return;
        
        const transactions = this.getFilteredTransactions(filter).slice(0, 5);
        listEl.innerHTML = transactions.length === 0 ? 
            '<div class="sstssd-empty">거래 내역이 없습니다</div>' :
            transactions.map(t => this.renderTransaction(t)).join('');
        
        // Re-attach delete listeners
        const moduleContainer = document.querySelector('.sstssd-module[data-module="balance"]');
        listEl.querySelectorAll('[data-action="delete-transaction"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                if (confirm('이 거래를 삭제하시겠습니까?')) {
                    this.deleteTransaction(id);
                    if (moduleContainer) {
                        this.render(moduleContainer);
                    }
                }
            });
        });
    }

    // ===== 모달 =====
    showTransferToSavingsModal() {
        const goals = this.settings.balance.goals;
        if (goals.length === 0) {
            alert('먼저 저축 목표를 추가해주세요.');
            return;
        }

        const modal = this.createModal(`
            <h3>저축에 넣기</h3>
            <form id="sstssd-balance-form">
                <div class="sstssd-form-group">
                    <label>금액 <span class="sstssd-required">*</span></label>
                    <input type="number" name="amount" required class="sstssd-input" min="1" step="1">
                </div>
                <div class="sstssd-form-group">
                    <label>목표 선택 <span class="sstssd-required">*</span></label>
                    <select name="goalId" required class="sstssd-input">
                        ${goals.map(g => `<option value="${g.id}">${this.escapeHtml(g.name)}</option>`).join('')}
                    </select>
                </div>
                <div class="sstssd-form-actions">
                    <button type="submit" class="sstssd-btn sstssd-btn-primary">저장</button>
                    <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                </div>
            </form>
        `);

        const form = modal.querySelector('#sstssd-balance-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const result = this.transferToSavings(
                parseInt(formData.get('amount')),
                parseInt(formData.get('goalId'))
            );
            
            if (result.success) {
                modal.remove();
                this.render(document.querySelector('.sstssd-module[data-module="balance"]'));
            } else {
                alert(result.error);
            }
        });

        modal.querySelector('.sstssd-btn-cancel').addEventListener('click', () => modal.remove());
    }

    showTransferFromSavingsModal() {
        const goals = this.settings.balance.goals.filter(g => g.currentAmount > 0);
        if (goals.length === 0) {
            alert('인출 가능한 저축 목표가 없습니다.');
            return;
        }

        const modal = this.createModal(`
            <h3>저축에서 빼기</h3>
            <form id="sstssd-balance-form">
                <div class="sstssd-form-group">
                    <label>목표 선택 <span class="sstssd-required">*</span></label>
                    <select name="goalId" required class="sstssd-input">
                        ${goals.map(g => `<option value="${g.id}">${this.escapeHtml(g.name)} (${this.formatCurrency(g.currentAmount)})</option>`).join('')}
                    </select>
                </div>
                <div class="sstssd-form-group">
                    <label>금액 <span class="sstssd-required">*</span></label>
                    <input type="number" name="amount" required class="sstssd-input" min="1" step="1">
                </div>
                <div class="sstssd-form-actions">
                    <button type="submit" class="sstssd-btn sstssd-btn-primary">인출</button>
                    <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                </div>
            </form>
        `);

        const form = modal.querySelector('#sstssd-balance-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const result = this.withdrawFromSavings(
                parseInt(formData.get('amount')),
                parseInt(formData.get('goalId'))
            );
            
            if (result.success) {
                modal.remove();
                this.render(document.querySelector('.sstssd-module[data-module="balance"]'));
            } else {
                alert(result.error);
            }
        });

        modal.querySelector('.sstssd-btn-cancel').addEventListener('click', () => modal.remove());
    }

    showAddGoalModal() {
        const modal = this.createModal(`
            <h3>저축 목표 추가</h3>
            <form id="sstssd-balance-form">
                <div class="sstssd-form-group">
                    <label>이름 <span class="sstssd-required">*</span></label>
                    <input type="text" name="name" required class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>아이콘</label>
                    <input type="text" name="icon" placeholder="🧁" class="sstssd-input" maxlength="2">
                </div>
                <div class="sstssd-form-group">
                    <label>목표 금액 (원) <span class="sstssd-required">*</span></label>
                    <input type="number" name="targetAmount" required class="sstssd-input" min="1" step="1">
                </div>
                <div class="sstssd-form-actions">
                    <button type="submit" class="sstssd-btn sstssd-btn-primary">추가</button>
                    <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                </div>
            </form>
        `);

        const form = modal.querySelector('#sstssd-balance-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            this.addGoal({
                name: formData.get('name'),
                icon: formData.get('icon') || "💰",
                targetAmount: parseInt(formData.get('targetAmount'))
            });
            modal.remove();
            this.render(document.querySelector('.sstssd-module[data-module="balance"]'));
        });

        modal.querySelector('.sstssd-btn-cancel').addEventListener('click', () => modal.remove());
    }

    showEditGoalModal(id) {
        const goal = this.settings.balance.goals.find(g => g.id === id);
        if (!goal) return;

        const modal = this.createModal(`
            <h3>저축 목표 수정</h3>
            <form id="sstssd-balance-form">
                <div class="sstssd-form-group">
                    <label>이름 <span class="sstssd-required">*</span></label>
                    <input type="text" name="name" value="${this.escapeHtml(goal.name)}" required class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>아이콘</label>
                    <input type="text" name="icon" value="${goal.icon}" class="sstssd-input" maxlength="2">
                </div>
                <div class="sstssd-form-group">
                    <label>목표 금액 (원) <span class="sstssd-required">*</span></label>
                    <input type="number" name="targetAmount" value="${goal.targetAmount}" required class="sstssd-input" min="1" step="1">
                </div>
                <div class="sstssd-form-actions">
                    <button type="submit" class="sstssd-btn sstssd-btn-primary">저장</button>
                    <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                </div>
            </form>
        `);

        const form = modal.querySelector('#sstssd-balance-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            this.updateGoal(id, {
                name: formData.get('name'),
                icon: formData.get('icon') || "💰",
                targetAmount: parseInt(formData.get('targetAmount'))
            });
            modal.remove();
            this.render(document.querySelector('.sstssd-module[data-module="balance"]'));
        });

        modal.querySelector('.sstssd-btn-cancel').addEventListener('click', () => modal.remove());
    }

    showEditSubItemsModal(id) {
        const goal = this.settings.balance.goals.find(g => g.id === id);
        if (!goal) return;

        const subItems = goal.subItems || [];
        
        const modal = this.createModal(`
            <h3>세부 항목 편집: ${this.escapeHtml(goal.name)}</h3>
            <div id="sstssd-subitems-list">
                ${subItems.map((item, idx) => `
                <div class="sstssd-subitem-row" data-index="${idx}">
                    <input type="text" value="${this.escapeHtml(item.name)}" class="sstssd-input sstssd-input-sm" placeholder="항목명">
                    <input type="number" value="${item.amount}" class="sstssd-input sstssd-input-sm" placeholder="금액" min="0" step="1">
                    <button type="button" class="sstssd-btn sstssd-btn-xs sstssd-btn-delete" data-action="remove-subitem" data-index="${idx}">삭제</button>
                </div>
                `).join('')}
            </div>
            <button type="button" class="sstssd-btn sstssd-btn-sm" id="add-subitem">+ 항목 추가</button>
            <div class="sstssd-form-actions">
                <button type="button" class="sstssd-btn sstssd-btn-primary" id="save-subitems">저장</button>
                <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
            </div>
        `);

        const listEl = modal.querySelector('#sstssd-subitems-list');
        let itemCounter = subItems.length;

        modal.querySelector('#add-subitem').addEventListener('click', () => {
            const div = document.createElement('div');
            div.className = 'sstssd-subitem-row';
            div.dataset.index = ++this.idCounter;  // Use proper ID counter
            div.innerHTML = `
                <input type="text" class="sstssd-input sstssd-input-sm" placeholder="항목명">
                <input type="number" class="sstssd-input sstssd-input-sm" placeholder="금액" min="0" step="1">
                <button type="button" class="sstssd-btn sstssd-btn-xs sstssd-btn-delete" data-action="remove-subitem">삭제</button>
            `;
            listEl.appendChild(div);
            
            div.querySelector('[data-action="remove-subitem"]').addEventListener('click', () => {
                div.remove();
            });
        });

        listEl.querySelectorAll('[data-action="remove-subitem"]').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.sstssd-subitem-row').remove();
            });
        });

        modal.querySelector('#save-subitems').addEventListener('click', () => {
            const rows = modal.querySelectorAll('.sstssd-subitem-row');
            const newSubItems = [];
            rows.forEach((row, idx) => {
                const nameInput = row.querySelector('input[type="text"]');
                const amountInput = row.querySelector('input[type="number"]');
                const name = nameInput.value.trim();
                const amount = parseInt(amountInput.value) || 0;
                
                if (name && amount > 0) {
                    newSubItems.push({ id: idx + 1, name, amount });
                }
            });
            
            // Calculate total from subitems
            const totalFromSub = newSubItems.reduce((sum, item) => sum + item.amount, 0);
            
            this.updateGoal(id, {
                subItems: newSubItems,
                targetAmount: totalFromSub > 0 ? totalFromSub : goal.targetAmount
            });
            
            modal.remove();
            this.render(document.querySelector('.sstssd-module[data-module="balance"]'));
        });

        modal.querySelector('.sstssd-btn-cancel').addEventListener('click', () => modal.remove());
    }

    showAddRecurringIncomeModal() {
        const shopEnabled = this.settings.balance.shopMode.enabled;
        
        const modal = this.createModal(`
            <h3>고정 수입 추가</h3>
            <form id="sstssd-balance-form">
                <div class="sstssd-form-group">
                    <label>수입 이름 <span class="sstssd-required">*</span></label>
                    <input type="text" name="name" required class="sstssd-input">
                </div>
                ${shopEnabled ? `
                <div class="sstssd-form-group">
                    <label>계정 <span class="sstssd-required">*</span></label>
                    <select name="source" class="sstssd-input">
                        <option value="personal">개인</option>
                        <option value="shop">가게</option>
                    </select>
                </div>
                ` : ''}
                <div class="sstssd-form-group">
                    <label>유형 <span class="sstssd-required">*</span></label>
                    <select name="type" class="sstssd-input" id="income-type">
                        <option value="fixed">고정 금액</option>
                        <option value="range">범위 (랜덤)</option>
                    </select>
                </div>
                <div class="sstssd-form-group" id="fixed-amount-group">
                    <label>금액 (원) <span class="sstssd-required">*</span></label>
                    <input type="number" name="fixedAmount" class="sstssd-input" min="1" step="1">
                </div>
                <div class="sstssd-form-group" id="range-amount-group" style="display: none;">
                    <label>최소 금액 (원) <span class="sstssd-required">*</span></label>
                    <input type="number" name="minAmount" class="sstssd-input" min="1" step="1">
                    <label>최대 금액 (원) <span class="sstssd-required">*</span></label>
                    <input type="number" name="maxAmount" class="sstssd-input" min="1" step="1">
                </div>
                <div class="sstssd-form-group">
                    <label>입금일 (매월) <span class="sstssd-required">*</span></label>
                    <input type="number" name="dayOfMonth" required class="sstssd-input" min="1" max="31">
                </div>
                <div class="sstssd-form-actions">
                    <button type="submit" class="sstssd-btn sstssd-btn-primary">추가</button>
                    <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                </div>
            </form>
        `);

        const form = modal.querySelector('#sstssd-balance-form');
        const typeSelect = modal.querySelector('#income-type');
        const fixedGroup = modal.querySelector('#fixed-amount-group');
        const rangeGroup = modal.querySelector('#range-amount-group');

        typeSelect.addEventListener('change', () => {
            if (typeSelect.value === 'fixed') {
                fixedGroup.style.display = '';
                rangeGroup.style.display = 'none';
                fixedGroup.querySelector('input').required = true;
                rangeGroup.querySelectorAll('input').forEach(i => i.required = false);
            } else {
                fixedGroup.style.display = 'none';
                rangeGroup.style.display = '';
                fixedGroup.querySelector('input').required = false;
                rangeGroup.querySelectorAll('input').forEach(i => i.required = true);
            }
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const type = formData.get('type');
            
            this.addRecurringIncome({
                name: formData.get('name'),
                type: type,
                source: formData.get('source') || 'personal',
                fixedAmount: type === 'fixed' ? parseInt(formData.get('fixedAmount')) : null,
                minAmount: type === 'range' ? parseInt(formData.get('minAmount')) : null,
                maxAmount: type === 'range' ? parseInt(formData.get('maxAmount')) : null,
                dayOfMonth: parseInt(formData.get('dayOfMonth'))
            });
            
            modal.remove();
            this.render(document.querySelector('.sstssd-module[data-module="balance"]'));
        });

        modal.querySelector('.sstssd-btn-cancel').addEventListener('click', () => modal.remove());
    }

    showAddRecurringExpenseModal() {
        const modal = this.createModal(`
            <h3>고정 지출 추가</h3>
            <form id="sstssd-balance-form">
                <div class="sstssd-form-group">
                    <label>지출 이름 <span class="sstssd-required">*</span></label>
                    <input type="text" name="name" required class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>금액 (원) <span class="sstssd-required">*</span></label>
                    <input type="number" name="amount" required class="sstssd-input" min="1" step="1">
                </div>
                <div class="sstssd-form-group">
                    <label>납부일 (매월) <span class="sstssd-required">*</span></label>
                    <input type="number" name="dayOfMonth" required class="sstssd-input" min="1" max="31">
                </div>
                <div class="sstssd-form-actions">
                    <button type="submit" class="sstssd-btn sstssd-btn-primary">추가</button>
                    <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                </div>
            </form>
        `);

        const form = modal.querySelector('#sstssd-balance-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            this.addRecurringExpense({
                name: formData.get('name'),
                amount: parseInt(formData.get('amount')),
                dayOfMonth: parseInt(formData.get('dayOfMonth'))
            });
            
            modal.remove();
            this.render(document.querySelector('.sstssd-module[data-module="balance"]'));
        });

        modal.querySelector('.sstssd-btn-cancel').addEventListener('click', () => modal.remove());
    }

    showAddTransactionModal() {
        const shopEnabled = this.settings.balance.shopMode.enabled;
        
        const modal = this.createModal(`
            <h3>거래 수동 추가</h3>
            <form id="sstssd-balance-form">
                <div class="sstssd-form-group">
                    <label>유형 <span class="sstssd-required">*</span></label>
                    <select name="type" required class="sstssd-input">
                        <option value="income">수입</option>
                        <option value="expense">지출</option>
                    </select>
                </div>
                ${shopEnabled ? `
                <div class="sstssd-form-group">
                    <label>출처 <span class="sstssd-required">*</span></label>
                    <select name="source" required class="sstssd-input">
                        <option value="personal">개인</option>
                        <option value="shop">가게</option>
                    </select>
                </div>
                ` : ''}
                <div class="sstssd-form-group">
                    <label>카테고리</label>
                    <input type="text" name="category" class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>설명 <span class="sstssd-required">*</span></label>
                    <input type="text" name="description" required class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>금액 (원) <span class="sstssd-required">*</span></label>
                    <input type="number" name="amount" required class="sstssd-input" min="1" step="1">
                </div>
                <div class="sstssd-form-group">
                    <label>메모</label>
                    <textarea name="memo" rows="3" class="sstssd-input"></textarea>
                </div>
                <div class="sstssd-form-group">
                    <label>날짜</label>
                    <input type="date" name="date" value="${this.formatDate(this.getRpDate())}" class="sstssd-input">
                </div>
                <div class="sstssd-form-actions">
                    <button type="submit" class="sstssd-btn sstssd-btn-primary">추가</button>
                    <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                </div>
            </form>
        `);

        const form = modal.querySelector('#sstssd-balance-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            this.addTransaction({
                type: formData.get('type'),
                source: shopEnabled ? formData.get('source') : 'personal',
                category: formData.get('category') || formData.get('description'),
                description: formData.get('description'),
                amount: parseInt(formData.get('amount')),
                memo: formData.get('memo'),
                date: formData.get('date'),
                isRecurring: false
            });
            
            modal.remove();
            this.render(document.querySelector('.sstssd-module[data-module="balance"]'));
        });

        modal.querySelector('.sstssd-btn-cancel').addEventListener('click', () => modal.remove());
    }

    showAllTransactionsModal() {
        const transactions = this.settings.balance.transactions;
        
        const modal = this.createModal(`
            <h3>전체 거래 내역</h3>
            <div class="sstssd-transaction-list sstssd-transaction-list-full">
                ${transactions.map(t => this.renderTransaction(t)).join('')}
            </div>
            <div class="sstssd-form-actions">
                <button type="button" class="sstssd-btn sstssd-btn-cancel">닫기</button>
            </div>
        `);

        // Re-attach delete listeners
        modal.querySelectorAll('[data-action="delete-transaction"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                if (confirm('이 거래를 삭제하시겠습니까?')) {
                    this.deleteTransaction(id);
                    modal.remove();
                    this.render(document.querySelector('.sstssd-module[data-module="balance"]'));
                }
            });
        });

        modal.querySelector('.sstssd-btn-cancel').addEventListener('click', () => modal.remove());
    }

    showEnableShopModeModal() {
        const modal = this.createModal(`
            <h3>가게 모드 활성화</h3>
            <form id="sstssd-balance-form">
                <div class="sstssd-form-group">
                    <label>가게 이름</label>
                    <input type="text" name="shopName" value="${this.escapeHtml(this.settings.balance.shopMode.shopName)}" class="sstssd-input">
                </div>
                <div class="sstssd-form-group">
                    <label>초기 운영비 (원)</label>
                    <input type="number" name="initialFund" value="0" class="sstssd-input" min="0" step="1">
                    <small>생활비에서 차감되어 운영비로 이동합니다</small>
                </div>
                <div class="sstssd-form-actions">
                    <button type="submit" class="sstssd-btn sstssd-btn-primary">활성화</button>
                    <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                </div>
            </form>
        `);

        const form = modal.querySelector('#sstssd-balance-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const shopName = formData.get('shopName') || "가게";
            const initialFund = parseInt(formData.get('initialFund')) || 0;
            
            if (initialFund > this.settings.balance.living) {
                alert('생활비가 부족합니다.');
                return;
            }
            
            this.settings.balance.shopMode.shopName = shopName;
            if (initialFund > 0) {
                this.settings.balance.living -= initialFund;
            }
            this.toggleShopMode(true, initialFund);
            
            modal.remove();
            this.render(document.querySelector('.sstssd-module[data-module="balance"]'));
        });

        modal.querySelector('.sstssd-btn-cancel').addEventListener('click', () => {
            // Uncheck the toggle
            const toggle = document.querySelector('[data-action="toggle-shop-mode"]');
            if (toggle) toggle.checked = false;
            modal.remove();
        });
    }

    showTransferPersonalToShopModal() {
        const modal = this.createModal(`
            <h3>개인 → 가게 이체</h3>
            <form id="sstssd-balance-form">
                <div class="sstssd-form-group">
                    <label>금액 (원) <span class="sstssd-required">*</span></label>
                    <input type="number" name="amount" required class="sstssd-input" min="1" step="1">
                    <small>생활비: ${this.formatCurrency(this.settings.balance.living)}</small>
                </div>
                <div class="sstssd-form-actions">
                    <button type="submit" class="sstssd-btn sstssd-btn-primary">이체</button>
                    <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                </div>
            </form>
        `);

        const form = modal.querySelector('#sstssd-balance-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const result = this.transferPersonalToShop(parseInt(formData.get('amount')));
            
            if (result.success) {
                modal.remove();
                this.render(document.querySelector('.sstssd-module[data-module="balance"]'));
            } else {
                alert(result.error);
            }
        });

        modal.querySelector('.sstssd-btn-cancel').addEventListener('click', () => modal.remove());
    }

    showTransferShopToPersonalModal() {
        const modal = this.createModal(`
            <h3>가게 → 개인 이체</h3>
            <form id="sstssd-balance-form">
                <div class="sstssd-form-group">
                    <label>금액 (원) <span class="sstssd-required">*</span></label>
                    <input type="number" name="amount" required class="sstssd-input" min="1" step="1">
                    <small>운영비: ${this.formatCurrency(this.settings.balance.shopMode.operatingFund)}</small>
                </div>
                <div class="sstssd-form-group">
                    <label>이체 대상</label>
                    <select name="destination" class="sstssd-input">
                        <option value="living">생활비</option>
                        <option value="savings">저축</option>
                    </select>
                </div>
                <div class="sstssd-form-group" id="goal-select-group" style="display: none;">
                    <label>저축 목표 선택</label>
                    <select name="goalId" class="sstssd-input">
                        ${this.settings.balance.goals.map(g => `<option value="${g.id}">${this.escapeHtml(g.name)}</option>`).join('')}
                    </select>
                </div>
                <div class="sstssd-form-actions">
                    <button type="submit" class="sstssd-btn sstssd-btn-primary">이체</button>
                    <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                </div>
            </form>
        `);

        const form = modal.querySelector('#sstssd-balance-form');
        const destSelect = form.querySelector('[name="destination"]');
        const goalGroup = form.querySelector('#goal-select-group');

        destSelect.addEventListener('change', () => {
            if (destSelect.value === 'savings') {
                goalGroup.style.display = '';
            } else {
                goalGroup.style.display = 'none';
            }
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const dest = formData.get('destination');
            const goalId = dest === 'savings' ? parseInt(formData.get('goalId')) : null;
            
            const result = this.transferShopToPersonal(
                parseInt(formData.get('amount')),
                dest === 'savings',
                goalId
            );
            
            if (result.success) {
                modal.remove();
                this.render(document.querySelector('.sstssd-module[data-module="balance"]'));
            } else {
                alert(result.error);
            }
        });

        modal.querySelector('.sstssd-btn-cancel').addEventListener('click', () => modal.remove());
    }

    // ===== 헬퍼 함수 =====
    createModal(content) {
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                ${content}
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.querySelector('.sstssd-modal-overlay').addEventListener('click', () => modal.remove());
        
        return modal;
    }

    formatCurrency(amount) {
        return amount.toLocaleString('ko-KR') + '원';
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatMonth(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
