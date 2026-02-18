// 🏪 가게 모듈 (Shop Module)
export class ShopModule {
    constructor(settings, saveCallback, getGlobalSettings, getRpDate, balanceModule, inventoryModule) {
        this.settings = settings;
        this.saveCallback = saveCallback;
        this.getGlobalSettings = getGlobalSettings;
        this.getRpDate = getRpDate;
        this.balanceModule = balanceModule;
        this.inventoryModule = inventoryModule;
        this.moduleName = 'shop';
        this.idCounter = Date.now();
        
        // Constants
        this.DEFAULT_OPERATOR = "시아"; // Default shop owner name
        this.LOW_STOCK_THRESHOLD = 5; // Items with quantity <= this show warning
        
        // Initialize shop data structure if not exists
        if (!this.settings.shop) {
            this.settings.shop = this.getDefaultShopData();
        }
        
        // Initialize sub-accordion state if not exists
        if (!this.settings.shop.subAccordionState) {
            this.settings.shop.subAccordionState = {
                status: true,
                dailySales: true,
                saleInventory: false,
                menu: false,
                staff: false,
                monthlyReport: false
            };
        }
        
        // Initialize ID counter from existing data
        this.idCounter = this.getMaxId();
    }
    
    // Get maximum ID from existing data
    getMaxId() {
        let maxId = Date.now();
        
        if (this.settings.shop) {
            const allIds = [
                ...this.settings.shop.menu.map(m => m.id || 0),
                ...this.settings.shop.sales.map(s => s.id || 0),
                ...this.settings.shop.staff.map(st => st.id || 0),
                ...this.settings.shop.shifts.map(sh => sh.id || 0)
            ];
            
            if (allIds.length > 0) {
                maxId = Math.max(maxId, ...allIds);
            }
        }
        
        return maxId;
    }
    
    // Default data structure
    getDefaultShopData() {
        return {
            isOpen: false,
            menu: [],
            sales: [],
            dailySummary: null,
            monthlyReports: [],
            staff: [],
            shifts: [],
            subAccordionState: {
                status: true,
                dailySales: true,
                saleInventory: false,
                menu: false,
                staff: false,
                monthlyReport: false
            }
        };
    }
    
    // ===== 영업 상태 관리 =====
    toggleShopStatus() {
        const wasOpen = this.settings.shop.isOpen;
        this.settings.shop.isOpen = !wasOpen;
        
        // If closing, show daily settlement
        if (wasOpen && !this.settings.shop.isOpen) {
            this.finalizeDailySales();
            this.showDailySettlementModal();
        }
        
        this.saveCallback();
        return this.settings.shop.isOpen;
    }
    
    // ===== 메뉴 관리 =====
    addMenuItem(data) {
        const newItem = {
            id: ++this.idCounter,
            name: data.name,
            price: data.price || 0,
            costPrice: data.costPrice || 0,
            icon: data.icon || "🍰",
            available: true
        };
        
        this.settings.shop.menu.push(newItem);
        this.saveCallback();
        return newItem;
    }
    
    updateMenuItem(id, data) {
        const item = this.settings.shop.menu.find(m => m.id === id);
        if (item) {
            Object.assign(item, data);
            this.saveCallback();
        }
        return item;
    }
    
    deleteMenuItem(id) {
        const index = this.settings.shop.menu.findIndex(m => m.id === id);
        if (index !== -1) {
            this.settings.shop.menu.splice(index, 1);
            this.saveCallback();
            return true;
        }
        return false;
    }
    
    // Calculate profit margin
    calculateProfitMargin(price, costPrice) {
        if (price <= 0) return 0;
        return Math.round(((price - costPrice) / price) * 100);
    }
    
    // ===== 판매 관리 =====
    addSale(data) {
        const now = new Date(this.getRpDate());
        const newSale = {
            id: ++this.idCounter,
            menuName: data.menuName,
            quantity: data.quantity,
            unitPrice: data.unitPrice,
            totalPrice: data.unitPrice * data.quantity,
            date: this.formatDate(now),
            time: this.formatTime(now),
            operator: data.operator || this.getDefaultOperator()
        };
        
        this.settings.shop.sales.push(newSale);
        
        // Update inventory (decrease sale product stock)
        if (this.inventoryModule) {
            this.inventoryModule.changeItemQty(
                data.menuName,
                -data.quantity,
                `판매 (${data.operator})`,
                "shop"
            );
        }
        
        // Update balance (increase shop operating fund)
        if (this.balanceModule) {
            this.balanceModule.addTransaction({
                type: "income",
                source: "shop",
                category: "매출",
                description: `${data.menuName} ${data.quantity}개 판매`,
                amount: newSale.totalPrice,
                memo: `판매자: ${data.operator}`,
                isRecurring: false
            });
        }
        
        this.saveCallback();
        
        // Show toast notification
        this.showToast(`💰 ${data.menuName} ${data.quantity}개 판매 +${this.formatCurrency(newSale.totalPrice)}`);
        
        return newSale;
    }
    
    // Get today's sales
    getTodaySales() {
        const today = this.formatDate(this.getRpDate());
        return this.settings.shop.sales.filter(s => s.date === today);
    }
    
    // Get daily summary
    getDailySummary() {
        const todaySales = this.getTodaySales();
        
        if (todaySales.length === 0) {
            return {
                date: this.formatDate(this.getRpDate()),
                totalSales: 0,
                totalItems: 0,
                breakdown: []
            };
        }
        
        const breakdown = {};
        todaySales.forEach(sale => {
            if (!breakdown[sale.menuName]) {
                breakdown[sale.menuName] = { menu: sale.menuName, qty: 0, total: 0 };
            }
            breakdown[sale.menuName].qty += sale.quantity;
            breakdown[sale.menuName].total += sale.totalPrice;
        });
        
        return {
            date: this.formatDate(this.getRpDate()),
            totalSales: todaySales.reduce((sum, s) => sum + s.totalPrice, 0),
            totalItems: todaySales.reduce((sum, s) => sum + s.quantity, 0),
            breakdown: Object.values(breakdown).sort((a, b) => b.total - a.total)
        };
    }
    
    // Finalize daily sales (called when closing)
    finalizeDailySales() {
        const summary = this.getDailySummary();
        this.settings.shop.dailySummary = summary;
        this.updateMonthlyReport(summary);
        this.saveCallback();
    }
    
    // ===== 월별 리포트 =====
    updateMonthlyReport(dailySummary) {
        const date = new Date(this.getRpDate());
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        let report = this.settings.shop.monthlyReports.find(r => r.month === monthKey);
        
        if (!report) {
            report = {
                month: monthKey,
                totalRevenue: 0,
                totalCost: 0,
                laborCost: 0,
                otherExpense: 0,
                netProfit: 0,
                salesCount: 0,
                topMenu: ""
            };
            this.settings.shop.monthlyReports.push(report);
        }
        
        report.totalRevenue += dailySummary.totalSales;
        report.salesCount += dailySummary.totalItems;
        
        // Calculate top menu
        const menuTotals = {};
        this.settings.shop.sales
            .filter(s => s.date.startsWith(monthKey))
            .forEach(s => {
                if (!menuTotals[s.menuName]) menuTotals[s.menuName] = 0;
                menuTotals[s.menuName] += s.quantity;
            });
        
        if (Object.keys(menuTotals).length > 0) {
            report.topMenu = Object.entries(menuTotals).sort((a, b) => b[1] - a[1])[0][0];
        }
        
        this.saveCallback();
    }
    
    // ===== 알바 관리 =====
    addStaff(data) {
        const newStaff = {
            id: ++this.idCounter,
            name: data.name,
            hourlyWage: data.hourlyWage || 12000,
            skills: data.skills || [],
            status: "registered",
            totalHours: 0,
            totalPaid: 0
        };
        
        this.settings.shop.staff.push(newStaff);
        this.saveCallback();
        return newStaff;
    }
    
    updateStaff(id, data) {
        const staff = this.settings.shop.staff.find(s => s.id === id);
        if (staff) {
            Object.assign(staff, data);
            this.saveCallback();
        }
        return staff;
    }
    
    deleteStaff(id) {
        const index = this.settings.shop.staff.findIndex(s => s.id === id);
        if (index !== -1) {
            this.settings.shop.staff.splice(index, 1);
            this.saveCallback();
            return true;
        }
        return false;
    }
    
    // ===== 근무 관리 =====
    addShift(data) {
        const newShift = {
            id: ++this.idCounter,
            staffId: data.staffId,
            staffName: data.staffName,
            date: data.date,
            startTime: data.startTime,
            endTime: data.endTime,
            hours: data.hours,
            wage: data.wage,
            salesDuring: 0,
            status: "scheduled",
            memo: data.memo || ""
        };
        
        this.settings.shop.shifts.push(newShift);
        this.saveCallback();
        return newShift;
    }
    
    updateShift(id, data) {
        const shift = this.settings.shop.shifts.find(s => s.id === id);
        if (shift) {
            Object.assign(shift, data);
            this.saveCallback();
        }
        return shift;
    }
    
    deleteShift(id) {
        const index = this.settings.shop.shifts.findIndex(s => s.id === id);
        if (index !== -1) {
            this.settings.shop.shifts.splice(index, 1);
            this.saveCallback();
            return true;
        }
        return false;
    }
    
    // Pay shift wage
    payShiftWage(shiftId) {
        const shift = this.settings.shop.shifts.find(s => s.id === shiftId);
        if (!shift || shift.status === "paid") {
            return { success: false, error: "Invalid shift or already paid" };
        }
        
        // Deduct from shop operating fund
        if (this.balanceModule) {
            this.balanceModule.addTransaction({
                type: "expense",
                source: "shop",
                category: "인건비",
                description: `${shift.staffName} 급여 (${shift.date})`,
                amount: shift.wage,
                memo: `${shift.hours}시간 근무`,
                isRecurring: false
            });
        }
        
        // Update shift status
        shift.status = "paid";
        
        // Update staff total
        const staff = this.settings.shop.staff.find(s => s.id === shift.staffId);
        if (staff) {
            staff.totalHours += shift.hours;
            staff.totalPaid += shift.wage;
        }
        
        this.saveCallback();
        return { success: true };
    }
    
    // Get upcoming shifts
    getUpcomingShifts() {
        const today = this.formatDate(this.getRpDate());
        return this.settings.shop.shifts
            .filter(s => s.date >= today && s.status === "scheduled")
            .sort((a, b) => a.date.localeCompare(b.date));
    }
    
    // Get past shifts
    getPastShifts() {
        const today = this.formatDate(this.getRpDate());
        return this.settings.shop.shifts
            .filter(s => s.date < today || s.status !== "scheduled")
            .sort((a, b) => b.date.localeCompare(a.date));
    }
    
    // ===== 판매용 재고 =====
    getSaleInventory() {
        if (!this.inventoryModule || !this.inventoryModule.settings.inventory) {
            return [];
        }
        
        return this.inventoryModule.settings.inventory.items
            .filter(item => item.type === "product")
            .map(item => ({
                ...item,
                lowStock: item.qty <= this.LOW_STOCK_THRESHOLD
            }));
    }
    
    // Get default operator (owner or staff if on shift)
    getDefaultOperator() {
        const today = this.formatDate(this.getRpDate());
        const todayShift = this.settings.shop.shifts.find(s => 
            s.date === today && s.status === "scheduled"
        );
        
        if (todayShift) {
            return todayShift.staffName;
        }
        
        return this.DEFAULT_OPERATOR;
    }
    
    // ===== 유틸리티 =====
    formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    formatTime(date) {
        const d = new Date(date);
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    
    formatCurrency(amount) {
        return amount.toLocaleString('ko-KR') + '원';
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Show toast notification
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'sstssd-toast sstssd-sale-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('sstssd-toast-show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('sstssd-toast-show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // ===== UI 렌더링 =====
    render(container) {
        // Check if shop mode is enabled
        if (!this.settings.balance || !this.settings.balance.shopMode || !this.settings.balance.shopMode.enabled) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = '';
        
        const shopName = this.settings.balance.shopMode.shopName || "가게";
        const isOpen = this.settings.shop.isOpen;
        const dailySummary = this.getDailySummary();
        const todaySales = this.getTodaySales().slice(0, 10); // Recent 10
        const saleInventory = this.getSaleInventory();
        const upcomingShifts = this.getUpcomingShifts().slice(0, 5);
        const pastShifts = this.getPastShifts().slice(0, 5);
        
        // Preserve accordion state
        const contentEl = container.querySelector('.sstssd-module-content');
        let isModuleOpen = contentEl ? contentEl.classList.contains('sstssd-module-open') : false;
        
        if (!contentEl && this.getGlobalSettings) {
            const globalSettings = this.getGlobalSettings();
            isModuleOpen = globalSettings.openModules.includes(this.moduleName);
        }
        
        const subState = this.settings.shop.subAccordionState;
        
        container.innerHTML = `
            <div class="sstssd-module-header sstssd-shop-section" data-module="${this.moduleName}">
                <div class="sstssd-module-title">
                    <span class="sstssd-module-icon">🏪</span>
                    <span>${this.escapeHtml(shopName)}</span>
                </div>
                <button class="sstssd-module-toggle">${isModuleOpen ? '▲' : '▼'}</button>
            </div>
            <div class="sstssd-module-content ${isModuleOpen ? 'sstssd-module-open' : ''}" data-module="${this.moduleName}">
                
                <!-- 영업 상태 -->
                <div class="sstssd-sub-section">
                    <div class="sstssd-sub-header" data-section="status">
                        <span>🏪 영업 상태</span>
                        <button class="sstssd-sub-toggle">${subState.status ? '▲' : '▼'}</button>
                    </div>
                    <div class="sstssd-sub-content ${subState.status ? 'sstssd-sub-open' : ''}">
                        <div class="sstssd-shop-status-container">
                            <button class="sstssd-shop-status-btn ${isOpen ? 'sstssd-shop-open' : 'sstssd-shop-closed'}" 
                                    data-action="toggle-status">
                                ${isOpen ? '🟢 OPEN 영업중' : '🔴 CLOSED 영업종료'}
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- 오늘 매출 -->
                <div class="sstssd-sub-section">
                    <div class="sstssd-sub-header" data-section="dailySales">
                        <span>💰 오늘 매출</span>
                        <button class="sstssd-sub-toggle">${subState.dailySales ? '▲' : '▼'}</button>
                    </div>
                    <div class="sstssd-sub-content ${subState.dailySales ? 'sstssd-sub-open' : ''}">
                        <div class="sstssd-shop-summary">
                            <div class="sstssd-shop-summary-title">📊 오늘</div>
                            <div class="sstssd-shop-summary-item">
                                <span>매출:</span>
                                <span class="sstssd-amount-positive">+${this.formatCurrency(dailySummary.totalSales)}</span>
                            </div>
                            <div class="sstssd-shop-summary-item">
                                <span>판매:</span>
                                <span>${dailySummary.totalItems}건</span>
                            </div>
                            
                            ${dailySummary.breakdown.length > 0 ? `
                                <div class="sstssd-shop-breakdown">
                                    <div class="sstssd-shop-breakdown-title">인기 메뉴:</div>
                                    ${dailySummary.breakdown.slice(0, 3).map((item, idx) => `
                                        <div class="sstssd-shop-breakdown-item">
                                            ${idx + 1}. ${this.escapeHtml(item.menu)} (${item.qty}건) +${this.formatCurrency(item.total)}
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                        
                        ${todaySales.length > 0 ? `
                            <div class="sstssd-shop-sales-history">
                                <div class="sstssd-shop-sales-title">📋 판매 내역</div>
                                ${todaySales.map(sale => `
                                    <div class="sstssd-shop-sale-item">
                                        <span class="sstssd-shop-sale-time">${sale.time}</span>
                                        <span class="sstssd-shop-sale-desc">${this.escapeHtml(sale.menuName)} ×${sale.quantity}</span>
                                        <span class="sstssd-amount-positive">+${this.formatCurrency(sale.totalPrice)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="sstssd-empty">오늘 판매 내역이 없습니다</div>
                        `}
                    </div>
                </div>
                
                <!-- 판매용 재고 -->
                <div class="sstssd-sub-section">
                    <div class="sstssd-sub-header" data-section="saleInventory">
                        <span>🏪 판매용 재고</span>
                        <button class="sstssd-sub-toggle">${subState.saleInventory ? '▲' : '▼'}</button>
                    </div>
                    <div class="sstssd-sub-content ${subState.saleInventory ? 'sstssd-sub-open' : ''}">
                        ${saleInventory.length > 0 ? `
                            ${saleInventory.map(item => `
                                <div class="sstssd-sale-inventory-item ${item.lowStock ? 'sstssd-low-stock' : ''}">
                                    <span class="sstssd-sale-inventory-name">${this.escapeHtml(item.name)}</span>
                                    <span class="sstssd-sale-inventory-qty">${item.qty}${item.unit}</span>
                                    ${item.lowStock ? '<span class="sstssd-warning-badge">⚠️ 품절임박</span>' : ''}
                                    ${item.qty === 0 ? '<span class="sstssd-out-badge">품절</span>' : ''}
                                </div>
                            `).join('')}
                        ` : `
                            <div class="sstssd-empty">판매용 재고가 없습니다</div>
                        `}
                    </div>
                </div>
                
                <!-- 메뉴판 -->
                <div class="sstssd-sub-section">
                    <div class="sstssd-sub-header" data-section="menu">
                        <span>📋 메뉴판</span>
                        <button class="sstssd-sub-toggle">${subState.menu ? '▲' : '▼'}</button>
                    </div>
                    <div class="sstssd-sub-content ${subState.menu ? 'sstssd-sub-open' : ''}">
                        ${this.settings.shop.menu.length > 0 ? `
                            ${this.settings.shop.menu.map(item => this.renderMenuItem(item)).join('')}
                        ` : `
                            <div class="sstssd-empty">메뉴가 없습니다</div>
                        `}
                        <div class="sstssd-menu-actions">
                            <button class="sstssd-btn sstssd-btn-add" data-action="add-menu">+ 메뉴 추가</button>
                        </div>
                    </div>
                </div>
                
                <!-- 알바 관리 -->
                <div class="sstssd-sub-section">
                    <div class="sstssd-sub-header" data-section="staff">
                        <span>👥 알바 관리</span>
                        <button class="sstssd-sub-toggle">${subState.staff ? '▲' : '▼'}</button>
                    </div>
                    <div class="sstssd-sub-content ${subState.staff ? 'sstssd-sub-open' : ''}">
                        <!-- 알바 풀 -->
                        <div class="sstssd-staff-pool">
                            <div class="sstssd-staff-pool-title">👥 알바 풀</div>
                            ${this.settings.shop.staff.length > 0 ? `
                                ${this.settings.shop.staff.map(staff => this.renderStaffItem(staff)).join('')}
                            ` : `
                                <div class="sstssd-empty">등록된 알바가 없습니다</div>
                            `}
                            <button class="sstssd-btn sstssd-btn-add" data-action="add-staff">+ 알바 등록</button>
                        </div>
                        
                        <!-- 근무 배정 -->
                        <div class="sstssd-shifts-section">
                            <div class="sstssd-shifts-title">📅 근무 배정</div>
                            
                            ${upcomingShifts.length > 0 ? `
                                <div class="sstssd-shifts-upcoming">
                                    <div class="sstssd-shifts-subtitle">다가오는 근무</div>
                                    ${upcomingShifts.map(shift => this.renderShiftItem(shift, true)).join('')}
                                </div>
                            ` : ''}
                            
                            <button class="sstssd-btn sstssd-btn-add" data-action="add-shift">+ 근무 추가</button>
                            
                            ${pastShifts.length > 0 ? `
                                <div class="sstssd-shifts-past">
                                    <div class="sstssd-shifts-subtitle">지난 근무</div>
                                    ${pastShifts.map(shift => this.renderShiftItem(shift, false)).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <!-- 월별 리포트 -->
                <div class="sstssd-sub-section">
                    <div class="sstssd-sub-header" data-section="monthlyReport">
                        <span>📊 월별 리포트</span>
                        <button class="sstssd-sub-toggle">${subState.monthlyReport ? '▲' : '▼'}</button>
                    </div>
                    <div class="sstssd-sub-content ${subState.monthlyReport ? 'sstssd-sub-open' : ''}">
                        ${this.settings.shop.monthlyReports.length > 0 ? `
                            ${this.settings.shop.monthlyReports.slice(0, 3).reverse().map(report => this.renderMonthlyReport(report)).join('')}
                        ` : `
                            <div class="sstssd-empty">월별 리포트가 없습니다</div>
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
    
    // Render menu item
    renderMenuItem(item) {
        const margin = this.calculateProfitMargin(item.price, item.costPrice);
        return `
            <div class="sstssd-menu-item ${!item.available ? 'sstssd-menu-unavailable' : ''}">
                <div class="sstssd-menu-info">
                    <span class="sstssd-menu-icon">${item.icon}</span>
                    <div class="sstssd-menu-details">
                        <div class="sstssd-menu-name">${this.escapeHtml(item.name)}</div>
                        <div class="sstssd-menu-price">
                            @${this.formatCurrency(item.price)}
                            ${item.costPrice > 0 ? `
                                <span class="sstssd-menu-cost">원가 ${this.formatCurrency(item.costPrice)} | 이익률 ${margin}%</span>
                            ` : ''}
                        </div>
                    </div>
                    <span class="sstssd-menu-status ${item.available ? 'sstssd-status-available' : 'sstssd-status-unavailable'}">
                        ${item.available ? '[판매중]' : '[중지]'}
                    </span>
                </div>
                <div class="sstssd-menu-actions">
                    <button class="sstssd-btn sstssd-btn-sm" data-action="edit-menu" data-id="${item.id}">✏️</button>
                    <button class="sstssd-btn sstssd-btn-sm" data-action="delete-menu" data-id="${item.id}">🗑</button>
                </div>
            </div>
        `;
    }
    
    // Render staff item
    renderStaffItem(staff) {
        const stars = (count) => '★'.repeat(count) + '☆'.repeat(3 - count);
        return `
            <div class="sstssd-staff-item">
                <div class="sstssd-staff-info">
                    <div class="sstssd-staff-name">${this.escapeHtml(staff.name)}</div>
                    <div class="sstssd-staff-wage">시급 ${this.formatCurrency(staff.hourlyWage)}</div>
                    ${staff.skills.length > 0 ? `
                        <div class="sstssd-staff-skills">
                            ${staff.skills.map(skill => `
                                <span class="sstssd-skill-item">
                                    ${skill.icon} <span class="sstssd-staff-stars">${stars(skill.stars)}</span>
                                </span>
                            `).join(' ')}
                        </div>
                    ` : ''}
                    <div class="sstssd-staff-total">누적: ${staff.totalHours}시간 / ${this.formatCurrency(staff.totalPaid)} 지급</div>
                </div>
                <button class="sstssd-btn sstssd-btn-sm" data-action="edit-staff" data-id="${staff.id}">편집</button>
            </div>
        `;
    }
    
    // Render shift item
    renderShiftItem(shift, isUpcoming) {
        return `
            <div class="sstssd-shift-item">
                <div class="sstssd-shift-info">
                    <div class="sstssd-shift-date">${shift.date} ${shift.startTime}~${shift.endTime}</div>
                    <div class="sstssd-shift-staff">👤 ${this.escapeHtml(shift.staffName)} (${shift.hours}h, ${this.formatCurrency(shift.wage)})</div>
                    ${shift.status === "paid" ? `
                        <span class="sstssd-paid-badge">✅ 지급 완료 ${this.formatCurrency(shift.wage)}</span>
                    ` : shift.status === "completed" ? `
                        <span class="sstssd-unpaid-badge">⬜ 미지급 ${this.formatCurrency(shift.wage)}</span>
                    ` : ''}
                </div>
                <div class="sstssd-shift-actions">
                    ${isUpcoming ? `
                        <button class="sstssd-btn sstssd-btn-sm" data-action="edit-shift" data-id="${shift.id}">수정</button>
                        <button class="sstssd-btn sstssd-btn-sm" data-action="delete-shift" data-id="${shift.id}">취소</button>
                    ` : shift.status === "completed" ? `
                        <button class="sstssd-btn sstssd-btn-sm" data-action="pay-shift" data-id="${shift.id}">지급 처리</button>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    // Render monthly report
    renderMonthlyReport(report) {
        const [year, month] = report.month.split('-');
        return `
            <div class="sstssd-monthly-report">
                <div class="sstssd-report-title">📅 ${year}년 ${parseInt(month)}월</div>
                <div class="sstssd-report-item">
                    <span>매출:</span>
                    <span class="sstssd-amount-positive">+${this.formatCurrency(report.totalRevenue)}</span>
                </div>
                <div class="sstssd-report-item">
                    <span>판매 건수:</span>
                    <span>${report.salesCount}건</span>
                </div>
                ${report.topMenu ? `
                    <div class="sstssd-report-item">
                        <span>인기 메뉴:</span>
                        <span>${this.escapeHtml(report.topMenu)}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // ===== 이벤트 리스너 =====
    attachEventListeners(container) {
        // Sub-accordion toggles
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
                    
                    this.settings.shop.subAccordionState[section] = !isOpen;
                    this.saveCallback();
                }
            });
        });
        
        // Toggle shop status
        const statusBtn = container.querySelector('[data-action="toggle-status"]');
        if (statusBtn) {
            statusBtn.addEventListener('click', () => {
                this.toggleShopStatus();
                this.render(container);
            });
        }
        
        // Menu actions
        const addMenuBtn = container.querySelector('[data-action="add-menu"]');
        if (addMenuBtn) {
            addMenuBtn.addEventListener('click', () => this.showAddMenuModal());
        }
        
        const editMenuBtns = container.querySelectorAll('[data-action="edit-menu"]');
        editMenuBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.showEditMenuModal(id);
            });
        });
        
        const deleteMenuBtns = container.querySelectorAll('[data-action="delete-menu"]');
        deleteMenuBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                if (confirm('정말 삭제하시겠습니까?')) {
                    this.deleteMenuItem(id);
                    this.render(container);
                }
            });
        });
        
        // Staff actions
        const addStaffBtn = container.querySelector('[data-action="add-staff"]');
        if (addStaffBtn) {
            addStaffBtn.addEventListener('click', () => this.showAddStaffModal());
        }
        
        const editStaffBtns = container.querySelectorAll('[data-action="edit-staff"]');
        editStaffBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.showEditStaffModal(id);
            });
        });
        
        // Shift actions
        const addShiftBtn = container.querySelector('[data-action="add-shift"]');
        if (addShiftBtn) {
            addShiftBtn.addEventListener('click', () => this.showAddShiftModal());
        }
        
        const editShiftBtns = container.querySelectorAll('[data-action="edit-shift"]');
        editShiftBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.showEditShiftModal(id);
            });
        });
        
        const deleteShiftBtns = container.querySelectorAll('[data-action="delete-shift"]');
        deleteShiftBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                if (confirm('정말 취소하시겠습니까?')) {
                    this.deleteShift(id);
                    this.render(container);
                }
            });
        });
        
        const payShiftBtns = container.querySelectorAll('[data-action="pay-shift"]');
        payShiftBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                const result = this.payShiftWage(id);
                if (result.success) {
                    this.showToast('✅ 급여 지급 완료');
                    this.render(container);
                } else {
                    alert(result.error);
                }
            });
        });
    }
    
    // ===== 모달들 =====
    showAddMenuModal() {
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>📋 메뉴 추가</h3>
                <form id="sstssd-add-menu-form">
                    <div class="sstssd-form-group">
                        <label>메뉴명</label>
                        <input type="text" name="name" class="sstssd-input" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>가격</label>
                        <input type="number" name="price" class="sstssd-input" value="0" step="1" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>원가 (선택)</label>
                        <input type="number" name="costPrice" class="sstssd-input" value="0" step="1">
                    </div>
                    <div class="sstssd-form-group">
                        <label>아이콘</label>
                        <input type="text" name="icon" class="sstssd-input" value="🍰">
                    </div>
                    <div class="sstssd-form-actions">
                        <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                        <button type="submit" class="sstssd-btn sstssd-btn-primary">추가</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#sstssd-add-menu-form');
        const cancelBtn = modal.querySelector('.sstssd-btn-cancel');
        const overlay = modal.querySelector('.sstssd-modal-overlay');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            this.addMenuItem({
                name: formData.get('name'),
                price: parseInt(formData.get('price')),
                costPrice: parseInt(formData.get('costPrice')),
                icon: formData.get('icon')
            });
            
            const moduleContainer = document.querySelector('.sstssd-module[data-module="shop"]');
            if (moduleContainer) {
                this.render(moduleContainer);
            }
            
            modal.remove();
        });
        
        cancelBtn.addEventListener('click', () => modal.remove());
        overlay.addEventListener('click', () => modal.remove());
    }
    
    showEditMenuModal(id) {
        const item = this.settings.shop.menu.find(m => m.id === id);
        if (!item) return;
        
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>✏️ 메뉴 수정</h3>
                <form id="sstssd-edit-menu-form">
                    <div class="sstssd-form-group">
                        <label>메뉴명</label>
                        <input type="text" name="name" class="sstssd-input" value="${this.escapeHtml(item.name)}" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>가격</label>
                        <input type="number" name="price" class="sstssd-input" value="${item.price}" step="1" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>원가 (선택)</label>
                        <input type="number" name="costPrice" class="sstssd-input" value="${item.costPrice}" step="1">
                    </div>
                    <div class="sstssd-form-group">
                        <label>아이콘</label>
                        <input type="text" name="icon" class="sstssd-input" value="${item.icon}">
                    </div>
                    <div class="sstssd-form-group">
                        <label>
                            <input type="checkbox" name="available" ${item.available ? 'checked' : ''}>
                            판매 가능
                        </label>
                    </div>
                    <div class="sstssd-form-actions">
                        <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                        <button type="submit" class="sstssd-btn sstssd-btn-primary">저장</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#sstssd-edit-menu-form');
        const cancelBtn = modal.querySelector('.sstssd-btn-cancel');
        const overlay = modal.querySelector('.sstssd-modal-overlay');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            this.updateMenuItem(id, {
                name: formData.get('name'),
                price: parseInt(formData.get('price')),
                costPrice: parseInt(formData.get('costPrice')),
                icon: formData.get('icon'),
                available: formData.get('available') === 'on'
            });
            
            const moduleContainer = document.querySelector('.sstssd-module[data-module="shop"]');
            if (moduleContainer) {
                this.render(moduleContainer);
            }
            
            modal.remove();
        });
        
        cancelBtn.addEventListener('click', () => modal.remove());
        overlay.addEventListener('click', () => modal.remove());
    }
    
    showAddStaffModal() {
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>👥 알바 등록</h3>
                <form id="sstssd-add-staff-form">
                    <div class="sstssd-form-group">
                        <label>이름</label>
                        <input type="text" name="name" class="sstssd-input" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>시급</label>
                        <input type="number" name="hourlyWage" class="sstssd-input" value="12000" step="1" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>능력치 (선택, 쉼표로 구분: 이름|아이콘|별)</label>
                        <input type="text" name="skills" class="sstssd-input" placeholder="예: 화술|🗣️|3,포장|📦|2">
                        <small>별은 1~3개</small>
                    </div>
                    <div class="sstssd-form-actions">
                        <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                        <button type="submit" class="sstssd-btn sstssd-btn-primary">등록</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#sstssd-add-staff-form');
        const cancelBtn = modal.querySelector('.sstssd-btn-cancel');
        const overlay = modal.querySelector('.sstssd-modal-overlay');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            const skillsStr = formData.get('skills');
            const skills = skillsStr ? skillsStr.split(',').map(s => {
                const parts = s.trim().split('|');
                return {
                    name: parts[0] || '',
                    icon: parts[1] || '⭐',
                    stars: Math.min(3, Math.max(1, parseInt(parts[2]) || 1))
                };
            }) : [];
            
            this.addStaff({
                name: formData.get('name'),
                hourlyWage: parseInt(formData.get('hourlyWage')),
                skills: skills
            });
            
            const moduleContainer = document.querySelector('.sstssd-module[data-module="shop"]');
            if (moduleContainer) {
                this.render(moduleContainer);
            }
            
            modal.remove();
        });
        
        cancelBtn.addEventListener('click', () => modal.remove());
        overlay.addEventListener('click', () => modal.remove());
    }
    
    showEditStaffModal(id) {
        const staff = this.settings.shop.staff.find(s => s.id === id);
        if (!staff) return;
        
        const skillsStr = staff.skills.map(s => `${s.name}|${s.icon}|${s.stars}`).join(',');
        
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>✏️ 알바 편집</h3>
                <form id="sstssd-edit-staff-form">
                    <div class="sstssd-form-group">
                        <label>이름</label>
                        <input type="text" name="name" class="sstssd-input" value="${this.escapeHtml(staff.name)}" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>시급</label>
                        <input type="number" name="hourlyWage" class="sstssd-input" value="${staff.hourlyWage}" step="1" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>능력치 (선택, 쉼표로 구분: 이름|아이콘|별)</label>
                        <input type="text" name="skills" class="sstssd-input" value="${this.escapeHtml(skillsStr)}" placeholder="예: 화술|🗣️|3,포장|📦|2">
                        <small>별은 1~3개</small>
                    </div>
                    <div class="sstssd-form-actions">
                        <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                        <button type="submit" class="sstssd-btn sstssd-btn-primary">저장</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#sstssd-edit-staff-form');
        const cancelBtn = modal.querySelector('.sstssd-btn-cancel');
        const overlay = modal.querySelector('.sstssd-modal-overlay');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            const skillsStr = formData.get('skills');
            const skills = skillsStr ? skillsStr.split(',').map(s => {
                const parts = s.trim().split('|');
                return {
                    name: parts[0] || '',
                    icon: parts[1] || '⭐',
                    stars: Math.min(3, Math.max(1, parseInt(parts[2]) || 1))
                };
            }) : [];
            
            this.updateStaff(id, {
                name: formData.get('name'),
                hourlyWage: parseInt(formData.get('hourlyWage')),
                skills: skills
            });
            
            const moduleContainer = document.querySelector('.sstssd-module[data-module="shop"]');
            if (moduleContainer) {
                this.render(moduleContainer);
            }
            
            modal.remove();
        });
        
        cancelBtn.addEventListener('click', () => modal.remove());
        overlay.addEventListener('click', () => modal.remove());
    }
    
    showAddShiftModal() {
        if (this.settings.shop.staff.length === 0) {
            alert('먼저 알바를 등록해주세요');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>📅 근무 추가</h3>
                <form id="sstssd-add-shift-form">
                    <div class="sstssd-form-group">
                        <label>누구</label>
                        <select name="staffId" class="sstssd-input" required>
                            ${this.settings.shop.staff.map(s => `
                                <option value="${s.id}" data-wage="${s.hourlyWage}">${this.escapeHtml(s.name)} (시급 ${this.formatCurrency(s.hourlyWage)})</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="sstssd-form-group">
                        <label>날짜</label>
                        <input type="date" name="date" class="sstssd-input" value="${this.formatDate(this.getRpDate())}" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>시작 시간</label>
                        <input type="time" name="startTime" class="sstssd-input" value="10:00" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>종료 시간</label>
                        <input type="time" name="endTime" class="sstssd-input" value="17:00" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>메모</label>
                        <input type="text" name="memo" class="sstssd-input">
                    </div>
                    <div class="sstssd-form-group">
                        <div id="sstssd-wage-estimate">예상 급여: 계산 중...</div>
                    </div>
                    <div class="sstssd-form-actions">
                        <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                        <button type="submit" class="sstssd-btn sstssd-btn-primary">등록</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#sstssd-add-shift-form');
        const cancelBtn = modal.querySelector('.sstssd-btn-cancel');
        const overlay = modal.querySelector('.sstssd-modal-overlay');
        const wageEstimate = modal.querySelector('#sstssd-wage-estimate');
        
        const updateWageEstimate = () => {
            const staffSelect = form.querySelector('[name="staffId"]');
            const startTime = form.querySelector('[name="startTime"]').value;
            const endTime = form.querySelector('[name="endTime"]').value;
            
            if (staffSelect && startTime && endTime) {
                const selectedOption = staffSelect.selectedOptions[0];
                const wage = parseInt(selectedOption.dataset.wage);
                
                const [startH, startM] = startTime.split(':').map(Number);
                const [endH, endM] = endTime.split(':').map(Number);
                const hours = (endH + endM / 60) - (startH + startM / 60);
                
                if (hours > 0) {
                    const totalWage = Math.round(wage * hours);
                    wageEstimate.textContent = `예상 급여: ${this.formatCurrency(totalWage)} (${hours.toFixed(1)}시간)`;
                }
            }
        };
        
        form.querySelector('[name="staffId"]').addEventListener('change', updateWageEstimate);
        form.querySelector('[name="startTime"]').addEventListener('change', updateWageEstimate);
        form.querySelector('[name="endTime"]').addEventListener('change', updateWageEstimate);
        updateWageEstimate();
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            const staffId = parseInt(formData.get('staffId'));
            const staff = this.settings.shop.staff.find(s => s.id === staffId);
            
            const startTime = formData.get('startTime');
            const endTime = formData.get('endTime');
            
            const [startH, startM] = startTime.split(':').map(Number);
            const [endH, endM] = endTime.split(':').map(Number);
            const hours = (endH + endM / 60) - (startH + startM / 60);
            
            if (hours <= 0) {
                alert('종료 시간은 시작 시간보다 늦어야 합니다');
                return;
            }
            
            this.addShift({
                staffId: staffId,
                staffName: staff.name,
                date: formData.get('date'),
                startTime: startTime,
                endTime: endTime,
                hours: parseFloat(hours.toFixed(1)),
                wage: Math.round(staff.hourlyWage * hours),
                memo: formData.get('memo')
            });
            
            const moduleContainer = document.querySelector('.sstssd-module[data-module="shop"]');
            if (moduleContainer) {
                this.render(moduleContainer);
            }
            
            modal.remove();
        });
        
        cancelBtn.addEventListener('click', () => modal.remove());
        overlay.addEventListener('click', () => modal.remove());
    }
    
    showEditShiftModal(id) {
        const shift = this.settings.shop.shifts.find(s => s.id === id);
        if (!shift) return;
        
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>✏️ 근무 수정</h3>
                <form id="sstssd-edit-shift-form">
                    <div class="sstssd-form-group">
                        <label>누구</label>
                        <select name="staffId" class="sstssd-input" required>
                            ${this.settings.shop.staff.map(s => `
                                <option value="${s.id}" data-wage="${s.hourlyWage}" ${s.id === shift.staffId ? 'selected' : ''}>
                                    ${this.escapeHtml(s.name)} (시급 ${this.formatCurrency(s.hourlyWage)})
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="sstssd-form-group">
                        <label>날짜</label>
                        <input type="date" name="date" class="sstssd-input" value="${shift.date}" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>시작 시간</label>
                        <input type="time" name="startTime" class="sstssd-input" value="${shift.startTime}" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>종료 시간</label>
                        <input type="time" name="endTime" class="sstssd-input" value="${shift.endTime}" required>
                    </div>
                    <div class="sstssd-form-group">
                        <label>메모</label>
                        <input type="text" name="memo" class="sstssd-input" value="${this.escapeHtml(shift.memo)}">
                    </div>
                    <div class="sstssd-form-group">
                        <div id="sstssd-wage-estimate">예상 급여: 계산 중...</div>
                    </div>
                    <div class="sstssd-form-actions">
                        <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                        <button type="submit" class="sstssd-btn sstssd-btn-primary">저장</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#sstssd-edit-shift-form');
        const cancelBtn = modal.querySelector('.sstssd-btn-cancel');
        const overlay = modal.querySelector('.sstssd-modal-overlay');
        const wageEstimate = modal.querySelector('#sstssd-wage-estimate');
        
        const updateWageEstimate = () => {
            const staffSelect = form.querySelector('[name="staffId"]');
            const startTime = form.querySelector('[name="startTime"]').value;
            const endTime = form.querySelector('[name="endTime"]').value;
            
            if (staffSelect && startTime && endTime) {
                const selectedOption = staffSelect.selectedOptions[0];
                const wage = parseInt(selectedOption.dataset.wage);
                
                const [startH, startM] = startTime.split(':').map(Number);
                const [endH, endM] = endTime.split(':').map(Number);
                const hours = (endH + endM / 60) - (startH + startM / 60);
                
                if (hours > 0) {
                    const totalWage = Math.round(wage * hours);
                    wageEstimate.textContent = `예상 급여: ${this.formatCurrency(totalWage)} (${hours.toFixed(1)}시간)`;
                }
            }
        };
        
        form.querySelector('[name="staffId"]').addEventListener('change', updateWageEstimate);
        form.querySelector('[name="startTime"]').addEventListener('change', updateWageEstimate);
        form.querySelector('[name="endTime"]').addEventListener('change', updateWageEstimate);
        updateWageEstimate();
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            const staffId = parseInt(formData.get('staffId'));
            const staff = this.settings.shop.staff.find(s => s.id === staffId);
            
            const startTime = formData.get('startTime');
            const endTime = formData.get('endTime');
            
            const [startH, startM] = startTime.split(':').map(Number);
            const [endH, endM] = endTime.split(':').map(Number);
            const hours = (endH + endM / 60) - (startH + startM / 60);
            
            if (hours <= 0) {
                alert('종료 시간은 시작 시간보다 늦어야 합니다');
                return;
            }
            
            this.updateShift(id, {
                staffId: staffId,
                staffName: staff.name,
                date: formData.get('date'),
                startTime: startTime,
                endTime: endTime,
                hours: parseFloat(hours.toFixed(1)),
                wage: Math.round(staff.hourlyWage * hours),
                memo: formData.get('memo')
            });
            
            const moduleContainer = document.querySelector('.sstssd-module[data-module="shop"]');
            if (moduleContainer) {
                this.render(moduleContainer);
            }
            
            modal.remove();
        });
        
        cancelBtn.addEventListener('click', () => modal.remove());
        overlay.addEventListener('click', () => modal.remove());
    }
    
    showDailySettlementModal() {
        const summary = this.settings.shop.dailySummary;
        if (!summary) return;
        
        const saleInventory = this.getSaleInventory();
        const todayOperator = this.getDefaultOperator();
        
        const modal = document.createElement('div');
        modal.className = 'sstssd-modal';
        modal.innerHTML = `
            <div class="sstssd-modal-overlay"></div>
            <div class="sstssd-modal-content">
                <h3>📊 오늘 영업 정산</h3>
                <div class="sstssd-settlement">
                    <div class="sstssd-settlement-date">📅 ${summary.date}</div>
                    
                    <div class="sstssd-settlement-section">
                        <div class="sstssd-settlement-item">
                            <span>매출:</span>
                            <span class="sstssd-amount-positive">+${this.formatCurrency(summary.totalSales)}</span>
                        </div>
                        <div class="sstssd-settlement-item">
                            <span>판매 건수:</span>
                            <span>${summary.totalItems}건</span>
                        </div>
                    </div>
                    
                    ${summary.breakdown.length > 0 ? `
                        <div class="sstssd-settlement-section">
                            <div class="sstssd-settlement-title">인기 메뉴:</div>
                            ${summary.breakdown.slice(0, 3).map((item, idx) => `
                                <div class="sstssd-settlement-item">
                                    ${idx + 1}. ${this.escapeHtml(item.menu)} ${item.qty}건
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    ${saleInventory.length > 0 ? `
                        <div class="sstssd-settlement-section">
                            <div class="sstssd-settlement-title">남은 재고:</div>
                            ${saleInventory.map(item => `
                                <div class="sstssd-settlement-item">
                                    ${this.escapeHtml(item.name)} ${item.qty}${item.unit}
                                    ${item.qty === 0 ? '<span class="sstssd-out-badge">(품절)</span>' : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="sstssd-settlement-section">
                        <div class="sstssd-settlement-item">
                            오늘 운영자: ${this.escapeHtml(todayOperator)}
                        </div>
                    </div>
                </div>
                <div class="sstssd-form-actions">
                    <button type="button" class="sstssd-btn sstssd-btn-primary" id="sstssd-settlement-confirm">확인</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const confirmBtn = modal.querySelector('#sstssd-settlement-confirm');
        confirmBtn.addEventListener('click', () => modal.remove());
    }
}
