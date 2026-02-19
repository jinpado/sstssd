// Side Dashboard Extension for SillyTavern
// Main entry point

import { extension_settings, getContext } from '../../../extensions.js';
import { saveSettingsDebounced, eventSource, event_types } from '../../../../script.js';
import { TodoModule } from './modules/todo.js';
import { ScheduleModule } from './modules/schedule.js';
import { BalanceModule } from './modules/balance.js';
import { InventoryModule } from './modules/inventory.js';
import { BakingModule } from './modules/baking.js';
import { ShopModule } from './modules/shop.js';
import { InstagramModule } from './modules/instagram.js';

const MODULE_NAME = 'sstssd';

// Tag detection regex patterns
const FIN_IN_REGEX = /<FIN_IN>(.+?)\|(\d+)\s*<\/FIN_IN>/g;
const FIN_OUT_REGEX = /<FIN_OUT>(.+?)\|(\d+)\s*<\/FIN_OUT>/g;
const SALE_REGEX = /<SALE>(.+?)\|(\d+)\|(\d+)\s*<\/SALE>/g;
const GIFT_REGEX = /<GIFT>(.+?)\|(\d+)\|(.+?)\s*<\/GIFT>/g;
const BAKE_REGEX = /<BAKE>(.+?)\|(\d+)(?:\|(.+?))?\s*<\/BAKE>/g;
const SHOP_REGEX = /<SHOP>(.+?)\|(\d+)\|(.+?)\|(\d+)(?:\|(.+?))?\s*<\/SHOP>/g;

// Extension state
let panelElement = null;
let todoModule = null;
let scheduleModule = null;
let balanceModule = null;
let inventoryModule = null;
let bakingModule = null;
let shopModule = null;
let instagramModule = null;
let observer = null;
let currentChatId = null;

// Initialize extension settings
function initSettings() {
    if (!extension_settings[MODULE_NAME]) {
        extension_settings[MODULE_NAME] = {
            chats: {},  // Chat-specific data
            globalSettings: {
                panelOpen: true,
                openModules: ['todo', 'schedule', 'balance', 'inventory', 'baking', 'shop', 'instagram']
            }
        };
    }
    
    // Migrate old data structure if it exists
    if (extension_settings[MODULE_NAME].todo || extension_settings[MODULE_NAME].schedule) {
        console.log('SSTSSD: Migrating old data structure to new format');
        const oldData = {
            todo: extension_settings[MODULE_NAME].todo || { items: [] },
            schedule: extension_settings[MODULE_NAME].schedule || {
                mode: 'semester',
                timetable: {
                    '월': [], '화': [], '수': [], '목': [], '금': [], '토': [], '일': []
                },
                appointments: []
            }
        };
        
        // Preserve global settings if they exist
        const panelOpen = extension_settings[MODULE_NAME].panelOpen !== undefined ? 
            extension_settings[MODULE_NAME].panelOpen : true;
        const openModules = extension_settings[MODULE_NAME].openModules || ['todo', 'schedule', 'balance', 'inventory', 'baking', 'shop', 'instagram'];
        
        // Restructure to new format
        extension_settings[MODULE_NAME] = {
            chats: {
                'legacyPreChatIsolation': oldData
            },
            globalSettings: {
                panelOpen: panelOpen,
                openModules: openModules
            }
        };
        
        // Remove old fields
        delete extension_settings[MODULE_NAME].todo;
        delete extension_settings[MODULE_NAME].schedule;
        
        saveSettings();
    }
    
    // Ensure globalSettings exists
    if (!extension_settings[MODULE_NAME].globalSettings) {
        extension_settings[MODULE_NAME].globalSettings = {
            panelOpen: true,
            openModules: ['todo', 'schedule', 'balance', 'inventory', 'baking', 'shop', 'instagram']
        };
    }
    
    // Ensure chats object exists
    if (!extension_settings[MODULE_NAME].chats) {
        extension_settings[MODULE_NAME].chats = {};
    }
}

// Get current chat data (or create default)
function getCurrentChatData() {
    const context = getContext();
    const chatId = context.chatId;
    
    if (!chatId) {
        return null; // Not in a chat
    }
    
    // Initialize chat data if it doesn't exist
    if (!extension_settings[MODULE_NAME].chats[chatId]) {
        extension_settings[MODULE_NAME].chats[chatId] = {
            rpDate: null,  // Roleplay current date (null = use real time)
            rpDateSource: null,  // "auto" (tag detection) | "manual" (manual setting)
            todo: { items: [] },
            schedule: {
                mode: 'semester',
                timetable: {
                    '월': [], '화': [], '수': [], '목': [], '금': [], '토': [], '일': []
                },
                appointments: []
            },
            balance: null,  // Will be initialized by BalanceModule
            inventory: null,  // Will be initialized by InventoryModule
            baking: null,  // Will be initialized by BakingModule
            shop: null,  // Will be initialized by ShopModule
            instagram: null  // Will be initialized by InstagramModule
        };
    }
    
    return extension_settings[MODULE_NAME].chats[chatId];
}

// Get global settings with proper fallback
function getGlobalSettings() {
    return extension_settings[MODULE_NAME].globalSettings;
}

// Validate date string
function isValidDateString(dateStr) {
    return !isNaN(new Date(dateStr).getTime());
}

// Get roleplay date or fallback to real date
function getRpDate() {
    const chatData = getCurrentChatData();
    
    if (chatData?.rpDate) {
        return new Date(chatData.rpDate);
    }
    // rpDate가 없으면 현실 시간 폴백
    return new Date();
}

// Update roleplay date
function updateRpDate(date, source) {
    const chatData = getCurrentChatData();
    if (!chatData) return;
    
    chatData.rpDate = date;
    chatData.rpDateSource = source;
    saveSettings();
}

// Save settings callback
function saveSettings() {
    try {
        saveSettingsDebounced();
    } catch (error) {
        console.error('SSTSSD: Failed to save settings', error);
    }
}

// Create panel HTML structure
function createPanel() {
    const panel = document.createElement('div');
    panel.className = 'sstssd-panel';
    panel.id = 'sstssd-panel';
    
    const globalSettings = getGlobalSettings();
    if (!globalSettings.panelOpen) {
        panel.classList.add('sstssd-panel-closed');
    }

    panel.innerHTML = `
        <div class="sstssd-header">
            <div class="sstssd-header-content">
                <h2 class="sstssd-title">Side Dashboard</h2>
                <button class="sstssd-close-btn" id="sstssd-close-btn" title="패널 닫기">✕</button>
            </div>
            <div class="sstssd-summary" id="sstssd-summary">
                <!-- Summary will be populated by updateSummary() -->
            </div>
        </div>
        <div class="sstssd-body">
            <div class="sstssd-module" data-module="balance">
                <!-- Balance module content -->
            </div>
            <div class="sstssd-module" data-module="todo">
                <!-- Todo module content -->
            </div>
            <div class="sstssd-module" data-module="schedule">
                <!-- Schedule module content -->
            </div>
            <div class="sstssd-module" data-module="inventory">
                <!-- Inventory module content -->
            </div>
            <div class="sstssd-module" data-module="baking">
                <!-- Baking module content -->
            </div>
            <div class="sstssd-module" data-module="shop">
                <!-- Shop module content -->
            </div>
            <div class="sstssd-module" data-module="instagram">
                <!-- Instagram module content -->
            </div>
        </div>
    `;

    return panel;
}

// Create floating toggle button for mobile
function createToggleButton() {
    const button = document.createElement('button');
    button.className = 'sstssd-toggle-btn';
    button.id = 'sstssd-toggle-btn';
    button.innerHTML = '📊';
    button.title = '대시보드 열기';
    
    const globalSettings = getGlobalSettings();
    if (globalSettings.panelOpen) {
        button.style.display = 'none';
    }

    return button;
}

// Update dashboard summary bar
function updateSummary() {
    const summaryEl = document.getElementById('sstssd-summary');
    if (!summaryEl) return;

    const chatData = getCurrentChatData();
    let summaryParts = [];

    // 1. 📅 롤플 날짜 (항상 표시)
    const rpDate = getRpDate();
    const dateStr = `${rpDate.getFullYear()}-${String(rpDate.getMonth()+1).padStart(2,'0')}-${String(rpDate.getDate()).padStart(2,'0')}`;
    summaryParts.push(`📅 ${dateStr} <button id="sstssd-edit-date-btn" class="sstssd-edit-date-btn" title="날짜 수정">✏️</button>`);

    // 2. 💳 개인 자산 (항상 표시)
    if (balanceModule && chatData && chatData.balance) {
        const personalTotal = chatData.balance.living + balanceModule.getTotalSavings();
        summaryParts.push(`💳 개인: ${formatCurrency(personalTotal)}`);
    }

    // 3. 🏪 가게 자금 (가게 모드 ON일 때만)
    if (balanceModule && chatData?.balance?.shopMode?.enabled) {
        const shopFund = chatData.balance.shopMode.operatingFund;
        summaryParts.push(`🏪 가게: ${formatCurrency(shopFund)}`);
    }

    // 4. 🎓 다음 수업 (학기 중 + 수업 있을 때)
    if (scheduleModule) {
        const nextClass = scheduleModule.getNextClass();
        if (nextClass) {
            summaryParts.push(`🎓 다음 수업: ${nextClass.startTime} ${nextClass.subject}`);
        }
    }

    // 5. 📌 다음 약속 (약속 있을 때)
    if (scheduleModule) {
        const upcomingAppointments = scheduleModule.getUpcomingAppointments();
        if (upcomingAppointments && upcomingAppointments.length > 0) {
            const next = upcomingAppointments[0];
            summaryParts.push(`📌 다음 약속: ${next.date} ${next.title}`);
        }
    }

    // 6. 🏪 영업 상태 (가게 모드 ON일 때만)
    if (shopModule && chatData?.balance?.shopMode?.enabled && chatData.shop) {
        const isOpen = chatData.shop.isOpen;
        summaryParts.push(`🏪 영업: ${isOpen ? '🟢 OPEN' : '🔴 CLOSED'}`);
    }

    // 7. 📱 팔로워 (항상 표시)
    if (instagramModule && chatData?.instagram) {
        const followers = chatData.instagram.followers;
        const change = chatData.instagram.followerChange || 0;
        if (change > 0) {
            summaryParts.push(`📱 팔로워: ${followers.toLocaleString('ko-KR')} (+${change})`);
        } else {
            summaryParts.push(`📱 팔로워: ${followers.toLocaleString('ko-KR')}`);
        }
    }

    if (summaryParts.length === 0) {
        summaryParts.push('오늘 일정이 없습니다');
    }

    // 세로 줄바꿈으로 표시
    summaryEl.innerHTML = `<div class="sstssd-summary-text">${summaryParts.map(part => `<div class="sstssd-summary-item">${part}</div>`).join('')}</div>`;
    
    // Date edit button listener
    const editDateBtn = document.getElementById('sstssd-edit-date-btn');
    if (editDateBtn) {
        editDateBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showDateSettingModal();
        });
    }
}

// Format currency helper
function formatCurrency(amount) {
    return amount.toLocaleString('ko-KR') + '원';
}

// Toggle panel visibility
function togglePanel() {
    const panel = document.getElementById('sstssd-panel');
    const toggleBtn = document.getElementById('sstssd-toggle-btn');
    
    if (!panel || !toggleBtn) return;

    const isOpen = !panel.classList.contains('sstssd-panel-closed');
    
    if (isOpen) {
        panel.classList.add('sstssd-panel-closed');
        toggleBtn.style.display = 'block';
    } else {
        panel.classList.remove('sstssd-panel-closed');
        toggleBtn.style.display = 'none';
    }

    const globalSettings = getGlobalSettings();
    globalSettings.panelOpen = !isOpen;
    saveSettings();
}

// Toggle module accordion
function toggleModule(moduleName) {
    const moduleEl = document.querySelector(`.sstssd-module[data-module="${moduleName}"]`);
    if (!moduleEl) return;

    const content = moduleEl.querySelector('.sstssd-module-content');
    const toggle = moduleEl.querySelector('.sstssd-module-toggle');
    
    if (!content || !toggle) return;

    const isOpen = content.classList.contains('sstssd-module-open');
    
    const globalSettings = getGlobalSettings();
    
    if (isOpen) {
        content.classList.remove('sstssd-module-open');
        toggle.textContent = '▼';
        const index = globalSettings.openModules.indexOf(moduleName);
        if (index > -1) {
            globalSettings.openModules.splice(index, 1);
        }
    } else {
        content.classList.add('sstssd-module-open');
        toggle.textContent = '▲';
        if (!globalSettings.openModules.includes(moduleName)) {
            globalSettings.openModules.push(moduleName);
        }
    }

    saveSettings();
}

// Show panel
function showPanel() {
    const panel = document.getElementById('sstssd-panel');
    if (panel) {
        panel.style.display = '';
    }
}

// Hide panel
function hidePanel() {
    const panel = document.getElementById('sstssd-panel');
    if (panel) {
        panel.style.display = 'none';
    }
}

// Show "no chat selected" message
function showNoChatMessage() {
    const summaryEl = document.getElementById('sstssd-summary');
    if (summaryEl) {
        summaryEl.innerHTML = '<div class="sstssd-summary-text">채팅방을 선택해주세요</div>';
    }
    
    // Clear module contents
    const balanceContainer = document.querySelector('.sstssd-module[data-module="balance"]');
    const todoContainer = document.querySelector('.sstssd-module[data-module="todo"]');
    const scheduleContainer = document.querySelector('.sstssd-module[data-module="schedule"]');
    const inventoryContainer = document.querySelector('.sstssd-module[data-module="inventory"]');
    const bakingContainer = document.querySelector('.sstssd-module[data-module="baking"]');
    const shopContainer = document.querySelector('.sstssd-module[data-module="shop"]');
    const instagramContainer = document.querySelector('.sstssd-module[data-module="instagram"]');
    
    if (balanceContainer) {
        balanceContainer.innerHTML = `
            <div class="sstssd-module-header" data-module="balance">
                <div class="sstssd-module-title">
                    <span class="sstssd-module-icon">💳</span>
                    <span>잔고</span>
                </div>
                <button class="sstssd-module-toggle">▼</button>
            </div>
            <div class="sstssd-module-content" data-module="balance">
                <div class="sstssd-empty">채팅방을 선택해주세요</div>
            </div>
        `;
    }
    
    if (todoContainer) {
        todoContainer.innerHTML = `
            <div class="sstssd-module-header" data-module="todo">
                <div class="sstssd-module-title">
                    <span class="sstssd-module-icon">📝</span>
                    <span>할일</span>
                </div>
                <button class="sstssd-module-toggle">▼</button>
            </div>
            <div class="sstssd-module-content" data-module="todo">
                <div class="sstssd-empty">채팅방을 선택해주세요</div>
            </div>
        `;
    }
    
    if (scheduleContainer) {
        scheduleContainer.innerHTML = `
            <div class="sstssd-module-header" data-module="schedule">
                <div class="sstssd-module-title">
                    <span class="sstssd-module-icon">📅</span>
                    <span>스케줄</span>
                </div>
                <button class="sstssd-module-toggle">▼</button>
            </div>
            <div class="sstssd-module-content" data-module="schedule">
                <div class="sstssd-empty">채팅방을 선택해주세요</div>
            </div>
        `;
    }
    
    if (inventoryContainer) {
        inventoryContainer.innerHTML = `
            <div class="sstssd-module-header" data-module="inventory">
                <div class="sstssd-module-title">
                    <span class="sstssd-module-icon">📦</span>
                    <span>재고</span>
                </div>
                <button class="sstssd-module-toggle">▼</button>
            </div>
            <div class="sstssd-module-content" data-module="inventory">
                <div class="sstssd-empty">채팅방을 선택해주세요</div>
            </div>
        `;
    }
    
    if (bakingContainer) {
        bakingContainer.innerHTML = `
            <div class="sstssd-module-header" data-module="baking">
                <div class="sstssd-module-title">
                    <span class="sstssd-module-icon">🧁</span>
                    <span>베이킹</span>
                </div>
                <button class="sstssd-module-toggle">▼</button>
            </div>
            <div class="sstssd-module-content" data-module="baking">
                <div class="sstssd-empty">채팅방을 선택해주세요</div>
            </div>
        `;
    }
    
    if (shopContainer) {
        shopContainer.innerHTML = `
            <div class="sstssd-module-header" data-module="shop">
                <div class="sstssd-module-title">
                    <span class="sstssd-module-icon">🏪</span>
                    <span>가게</span>
                </div>
                <button class="sstssd-module-toggle">▼</button>
            </div>
            <div class="sstssd-module-content" data-module="shop">
                <div class="sstssd-empty">채팅방을 선택해주세요</div>
            </div>
        `;
    }
    
    if (instagramContainer) {
        instagramContainer.innerHTML = `
            <div class="sstssd-module-header" data-module="instagram">
                <div class="sstssd-module-title">
                    <span class="sstssd-module-icon">📱</span>
                    <span class="sstssd-insta-header">Instagram</span>
                </div>
                <button class="sstssd-module-toggle">▼</button>
            </div>
            <div class="sstssd-module-content" data-module="instagram">
                <div class="sstssd-empty">채팅방을 선택해주세요</div>
            </div>
        `;
    }
}

// Show date setting modal
function showDateSettingModal() {
    const chatData = getCurrentChatData();
    if (!chatData) return;
    
    const currentDate = chatData.rpDate || '';
    
    const modal = document.createElement('div');
    modal.className = 'sstssd-modal';
    modal.innerHTML = `
        <div class="sstssd-modal-overlay"></div>
        <div class="sstssd-modal-content">
            <h3>📅 롤플 날짜 설정</h3>
            <form id="sstssd-date-form">
                <div class="sstssd-form-group">
                    <label>날짜</label>
                    <input type="date" name="rpDate" value="${currentDate}" class="sstssd-input" required>
                </div>
                <div class="sstssd-form-actions">
                    <button type="button" class="sstssd-btn sstssd-btn-reset" id="sstssd-reset-date">초기화</button>
                    <button type="button" class="sstssd-btn sstssd-btn-cancel">취소</button>
                    <button type="submit" class="sstssd-btn sstssd-btn-primary">저장</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    
    const form = modal.querySelector('#sstssd-date-form');
    const resetBtn = modal.querySelector('#sstssd-reset-date');
    const cancelBtn = modal.querySelector('.sstssd-btn-cancel');
    const overlay = modal.querySelector('.sstssd-modal-overlay');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const newDate = formData.get('rpDate');
        
        // Validate date
        if (isValidDateString(newDate)) {
            updateRpDate(newDate, 'manual');
            renderAllModules();
            modal.remove();
        }
    });
    
    resetBtn.addEventListener('click', () => {
        updateRpDate(null, null);
        renderAllModules();
        modal.remove();
    });
    
    cancelBtn.addEventListener('click', () => modal.remove());
    overlay.addEventListener('click', () => modal.remove());
}

// Re-render all modules
function renderAllModules() {
    initModules();
    updateSummary();
}

// Initialize modules
function initModules() {
    try {
        const chatData = getCurrentChatData();
        
        // If no chat is selected, show message and return
        if (!chatData) {
            showNoChatMessage();
            return;
        }
        
        const globalSettings = getGlobalSettings();
        
        // Initialize Balance module with chat-specific data and global settings getter
        balanceModule = new BalanceModule(chatData, saveSettings, getGlobalSettings, getRpDate);
        const balanceContainer = document.querySelector('.sstssd-module[data-module="balance"]');
        if (balanceContainer) {
            balanceModule.render(balanceContainer);
        }
        
        // Initialize Todo module with chat-specific data and global settings getter
        todoModule = new TodoModule(chatData, saveSettings, getGlobalSettings, getRpDate);
        const todoContainer = document.querySelector('.sstssd-module[data-module="todo"]');
        if (todoContainer) {
            todoModule.render(todoContainer);
        }

        // Initialize Schedule module with chat-specific data and global settings getter
        scheduleModule = new ScheduleModule(chatData, saveSettings, getGlobalSettings, getRpDate);
        const scheduleContainer = document.querySelector('.sstssd-module[data-module="schedule"]');
        if (scheduleContainer) {
            scheduleModule.render(scheduleContainer);
        }
        
        // Initialize Inventory module with chat-specific data and global settings getter
        inventoryModule = new InventoryModule(chatData, saveSettings, getGlobalSettings, getRpDate);
        const inventoryContainer = document.querySelector('.sstssd-module[data-module="inventory"]');
        if (inventoryContainer) {
            inventoryModule.render(inventoryContainer);
        }
        
        // Initialize Instagram module with chat-specific data, global settings getter, balance and todo modules
        instagramModule = new InstagramModule(chatData, saveSettings, getGlobalSettings, getRpDate, balanceModule, todoModule);
        const instagramContainer = document.querySelector('.sstssd-module[data-module="instagram"]');
        if (instagramContainer) {
            instagramModule.render(instagramContainer);
        }
        
        // Initialize Baking module with chat-specific data, global settings getter, inventory and instagram modules
        bakingModule = new BakingModule(chatData, saveSettings, getGlobalSettings, getRpDate, inventoryModule, instagramModule);
        const bakingContainer = document.querySelector('.sstssd-module[data-module="baking"]');
        if (bakingContainer) {
            bakingModule.render(bakingContainer);
        }
        
        // Initialize Shop module with chat-specific data, global settings getter, balance and inventory modules
        shopModule = new ShopModule(chatData, saveSettings, getGlobalSettings, getRpDate, balanceModule, inventoryModule);
        const shopContainer = document.querySelector('.sstssd-module[data-module="shop"]');
        if (shopContainer) {
            shopModule.render(shopContainer);
        }

        // Set initial module states from global settings
        globalSettings.openModules.forEach(moduleName => {
            const content = document.querySelector(`.sstssd-module-content[data-module="${moduleName}"]`);
            const toggle = document.querySelector(`.sstssd-module[data-module="${moduleName}"] .sstssd-module-toggle`);
            if (content) {
                content.classList.add('sstssd-module-open');
            }
            if (toggle) {
                toggle.textContent = '▲';
            }
        });

        // Update summary
        updateSummary();
    } catch (error) {
        console.error('SSTSSD: Failed to initialize modules', error);
    }
}

// Reload modules for current chat
function reloadModules() {
    const context = getContext();
    currentChatId = context.chatId;
    
    if (!currentChatId) {
        showNoChatMessage();
        showPanel(); // Show panel with "select chat" message
        return;
    }
    
    showPanel();
    initModules();
}

// Attach event listeners
function attachEventListeners() {
    // Close button
    const closeBtn = document.getElementById('sstssd-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', togglePanel);
    }

    // Toggle button
    const toggleBtn = document.getElementById('sstssd-toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', togglePanel);
    }

    // Module toggles - using event delegation on the body
    const panelBody = document.querySelector('.sstssd-body');
    if (panelBody) {
        panelBody.addEventListener('click', (e) => {
            // Find if clicked element is within a module header
            const header = e.target.closest('.sstssd-module-header');
            if (!header) return;
            
            // Don't toggle if clicking on buttons inside the header (except toggle button)
            if (e.target.tagName === 'BUTTON' && !e.target.classList.contains('sstssd-module-toggle')) {
                return;
            }
            
            const moduleName = header.dataset.module;
            if (moduleName) {
                toggleModule(moduleName);
            }
        });
    }
}

// Initialize MutationObserver for chat monitoring
function initObserver() {
    try {
        observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const text = node.textContent || '';
                        
                        // Parse DATE tags from AI responses
                        const dateMatch = text.match(/<DATE>(\d{4}-\d{2}-\d{2})<\/DATE>/);
                        if (dateMatch) {
                            const newDate = dateMatch[1];
                            // Validate date
                            if (isValidDateString(newDate)) {
                                console.log(`SSTSSD: Auto-detected roleplay date: ${newDate}`);
                                updateRpDate(newDate, 'auto');
                                renderAllModules();
                            }
                        }
                        
                        // Parse FIN_IN tags (income)
                        const finInMatches = text.matchAll(FIN_IN_REGEX);
                        for (const match of finInMatches) {
                            const description = match[1];
                            const amount = parseInt(match[2]);
                            if (balanceModule && amount > 0) {
                                console.log(`SSTSSD: Auto-detected income: ${description} ${amount}원`);
                                const chatData = getCurrentChatData();
                                const shopEnabled = chatData?.balance?.shopMode?.enabled;
                                balanceModule.addTransaction({
                                    type: "income",
                                    source: shopEnabled ? "shop" : "personal",
                                    category: "자동감지",
                                    description: description,
                                    amount: amount,
                                    memo: "AI 응답에서 자동 감지"
                                });
                                renderAllModules();
                            }
                        }
                        
                        // Parse FIN_OUT tags (expense)
                        const finOutMatches = text.matchAll(FIN_OUT_REGEX);
                        for (const match of finOutMatches) {
                            const description = match[1];
                            const amount = parseInt(match[2]);
                            if (balanceModule && amount > 0) {
                                console.log(`SSTSSD: Auto-detected expense: ${description} ${amount}원`);
                                const chatData = getCurrentChatData();
                                const shopEnabled = chatData?.balance?.shopMode?.enabled;
                                balanceModule.addTransaction({
                                    type: "expense",
                                    source: shopEnabled ? "shop" : "personal",
                                    category: "자동감지",
                                    description: description,
                                    amount: amount,
                                    memo: "AI 응답에서 자동 감지"
                                });
                                renderAllModules();
                            }
                        }
                        
                        // Parse SALE tags (shop sales)
                        const saleMatches = text.matchAll(SALE_REGEX);
                        for (const match of saleMatches) {
                            const menuName = match[1];
                            const quantity = parseInt(match[2]);
                            const unitPrice = parseInt(match[3]);
                            if (shopModule && quantity > 0 && unitPrice > 0) {
                                console.log(`SSTSSD: Auto-detected sale: ${menuName} ${quantity}개 @${unitPrice}원`);
                                const chatData = getCurrentChatData();
                                if (chatData?.balance?.shopMode?.enabled) {
                                    // Use shopModule's default operator logic (will check shifts or use owner)
                                    shopModule.addSale({
                                        menuName: menuName,
                                        quantity: quantity,
                                        unitPrice: unitPrice
                                        // operator: omitted to use default from getDefaultOperator()
                                    });
                                    renderAllModules();
                                }
                            }
                        }
                        
                        // Parse GIFT tags (gifting products)
                        const giftMatches = text.matchAll(GIFT_REGEX);
                        for (const match of giftMatches) {
                            const productName = match[1];
                            const quantity = parseInt(match[2]);
                            const recipient = match[3];
                            if (inventoryModule && quantity > 0) {
                                console.log(`SSTSSD: Auto-detected gift: ${productName} ${quantity}개 → ${recipient}`);
                                // Find product in inventory
                                const product = inventoryModule.settings.inventory.items.find(i => 
                                    i.name === productName && i.type === "product"
                                );
                                if (product) {
                                    inventoryModule.updateItem(product.id, {
                                        qty: Math.max(0, product.qty - quantity),
                                        reason: `${recipient}에게 선물`,
                                        source: "gift"
                                    });
                                    renderAllModules();
                                }
                            }
                        }
                        
                        // Parse BAKE tags (baking plans from AI)
                        const bakeMatches = text.matchAll(BAKE_REGEX);
                        for (const match of bakeMatches) {
                            const menuName = match[1];
                            const quantity = parseInt(match[2]);
                            const deadline = match[3] || null;
                            if (bakingModule && quantity > 0) {
                                console.log(`SSTSSD: Auto-detected baking plan: ${menuName} ${quantity}개`);
                                bakingModule.addRecipe({
                                    name: menuName,
                                    yieldQty: quantity,
                                    deadline: deadline
                                });
                                renderAllModules();
                            }
                        }
                        
                        // Parse SHOP tags (shopping items from AI)
                        const shopMatches = text.matchAll(SHOP_REGEX);
                        const shopItems = [];
                        for (const match of shopMatches) {
                            shopItems.push({
                                name: match[1],
                                qty: parseInt(match[2]),
                                unit: match[3],
                                price: parseInt(match[4]),
                                location: match[5] || "온라인"
                            });
                        }
                        if (shopItems.length > 0 && bakingModule) {
                            console.log(`SSTSSD: Auto-detected ${shopItems.length} shopping items`);
                            // Group by location
                            const grouped = {};
                            shopItems.forEach(item => {
                                if (!grouped[item.location]) grouped[item.location] = [];
                                grouped[item.location].push(item);
                            });
                            
                            Object.entries(grouped).forEach(([location, items]) => {
                                items.forEach(item => {
                                    bakingModule.addToShoppingList(
                                        item.name,
                                        item.qty,
                                        item.unit,
                                        location,
                                        item.price,
                                        ["AI 자동 감지"]
                                    );
                                });
                            });
                            renderAllModules();
                        }
                    }
                }
            }
        });

        // Observe the chat element
        const chatElement = document.getElementById('chat');
        if (chatElement) {
            observer.observe(chatElement, { childList: true, subtree: true });
        }
    } catch (error) {
        console.error('SSTSSD: Failed to initialize observer', error);
    }
}

// Build system prompt injection from all modules
function buildDashboardPrompt() {
    const chatData = getCurrentChatData();
    if (!chatData) return '';
    
    let prompt = '\n[📊 Side Dashboard - Current State]\n';
    
    // Date
    if (chatData.rpDate) {
        prompt += `\n[📅 Date] ${chatData.rpDate}\n`;
    }
    
    // Balance
    if (balanceModule && chatData.balance) {
        const living = chatData.balance.living;
        const savings = balanceModule.getTotalSavings();
        prompt += `\n[💳 Balance]\n`;
        prompt += `생활비: ${living.toLocaleString()}원\n`;
        prompt += `저축: ${savings.toLocaleString()}원\n`;
        
        if (chatData.balance.shopMode?.enabled) {
            prompt += `가게 운영비: ${chatData.balance.shopMode.operatingFund.toLocaleString()}원\n`;
        }
    }
    
    // Schedule
    if (scheduleModule && chatData.schedule) {
        const todaySchedule = scheduleModule.getTodaySchedule();
        if (todaySchedule.length > 0) {
            prompt += `\n[📅 Today's Schedule]\n`;
            todaySchedule.forEach(item => {
                prompt += `- ${item.startTime || '시간 미정'} ${item.title}\n`;
            });
        }
    }
    
    // Todo
    if (todoModule && chatData.todo) {
        const { urgent, inProgress } = todoModule.categorizeItems();
        if (urgent.length > 0 || inProgress.length > 0) {
            prompt += `\n[📝 Tasks]\n`;
            urgent.forEach(item => prompt += `- ⚠️ ${item.title} (${todoModule.calculateDday(item.deadline)})\n`);
            inProgress.forEach(item => prompt += `- ${item.title} (${todoModule.calculateDday(item.deadline)})\n`);
        }
    }
    
    // Inventory
    if (inventoryModule && chatData.inventory) {
        const alerts = inventoryModule.getAlerts();
        const products = inventoryModule.getProducts();
        
        prompt += `\n[📦 Inventory]\n`;
        if (alerts.low.length > 0 || alerts.out.length > 0) {
            alerts.out.forEach(item => prompt += `- ❌ ${item.name}: 없음\n`);
            alerts.low.forEach(item => prompt += `- ⚠️ ${item.name}: ${item.qty}${item.unit} (최소 ${item.minStock})\n`);
        }
        if (products.length > 0) {
            prompt += `완제품:\n`;
            products.forEach(p => prompt += `- ${p.name} ${p.qty}${p.unit}\n`);
        }
    }
    
    // Baking
    if (bakingModule && chatData.baking) {
        const activeRecipes = chatData.baking.recipes.filter(r => r.status === 'in_progress');
        if (activeRecipes.length > 0) {
            prompt += `\n[🧁 Baking In Progress]\n`;
            activeRecipes.forEach(r => {
                const multiplier = r.multiplier || 1;
                prompt += `레시피: ${r.name} ×${r.yieldQty * multiplier}${r.yieldUnit}\n`;
                
                if (r.deadline) {
                    prompt += `납품 기한: ${r.deadline}\n`;
                }
                
                // Add step progress
                if (r.steps && r.steps.length > 0) {
                    const currentStepIndex = r.currentStep || 0;
                    const currentStep = r.steps[currentStepIndex];
                    const completedSteps = r.steps.filter(s => s.status === 'completed').length;
                    
                    prompt += `현재 단계: "${currentStep.name}" (${completedSteps + 1}/${r.steps.length}단계)\n`;
                    prompt += `예상 시간: ${currentStep.estimatedTime}\n`;
                    
                    if (currentStep.status === 'in_progress') {
                        prompt += `상태: 진행 중 🔄\n`;
                        prompt += `→ 캐릭터가 이 단계의 작업을 하고 있는 것으로 묘사해주세요. 구체적인 동작과 감각을 포함해주세요.\n`;
                    } else if (currentStep.status === 'paused') {
                        prompt += `상태: 일시정지 ⏸️ (다른 작업 가능)\n`;
                    }
                }
                prompt += `\n`;
            });
        }
        
        // Add event notifications
        if (chatData.baking.currentEvent) {
            const event = chatData.baking.currentEvent;
            const eventAge = Date.now() - event.timestamp;
            
            // Only show recent events (within 5 seconds)
            if (eventAge < 5000) {
                prompt += `\n[🔔 Recent Baking Event]\n`;
                
                switch (event.type) {
                    case 'step_start':
                        prompt += `시아가 "${event.stepName}" 단계를 시작합니다.\n`;
                        prompt += `→ 이 단계에서 시아가 무엇을 하는지 구체적으로 묘사해주세요.\n`;
                        break;
                    case 'step_pause':
                        prompt += `시아가 "${event.stepName}" 작업을 잠시 멈추고 다른 일을 합니다.\n`;
                        break;
                    case 'step_complete':
                        prompt += `시아가 "${event.stepName}" 단계를 마쳤습니다.\n`;
                        prompt += `→ 완료된 작업의 결과물을 간단히 언급해주세요.\n`;
                        break;
                    case 'baking_complete':
                        prompt += `${event.recipeName} 베이킹이 완전히 완료되었습니다! 🎉\n`;
                        prompt += `→ 완성된 제품의 외관과 향을 묘사해주세요.\n`;
                        break;
                }
                prompt += `\n`;
            }
        }
    }
    
    // Instagram
    if (instagramModule && chatData.instagram) {
        const ig = chatData.instagram;
        prompt += `\n[📱 Instagram @${ig.username}]\n`;
        prompt += `팔로워: ${ig.followers.toLocaleString()}\n`;
        
        const pendingDMs = ig.dms.filter(d => d.status === 'pending');
        if (pendingDMs.length > 0) {
            prompt += `DM 주문 대기: ${pendingDMs.length}건 (응답은 선택사항입니다)\n`;
        }
    }
    
    // Shop
    if (shopModule && chatData.balance?.shopMode?.enabled && chatData.shop) {
        const shop = chatData.shop;
        const shopName = chatData.balance.shopMode.shopName || "가게";
        prompt += `\n[🏪 Shop - "${shopName}"]\n`;
        prompt += `영업 상태: ${shop.isOpen ? 'OPEN' : 'CLOSED'}\n`;
        
        if (shop.isOpen) {
            // Show available stock
            const saleProducts = inventoryModule ? 
                inventoryModule.settings.inventory.items.filter(i => i.type === "sale_product") : [];
            if (saleProducts.length > 0) {
                prompt += `판매 가능:\n`;
                saleProducts.forEach(p => {
                    const menuItem = shop.menu.find(m => m.name === p.name);
                    const price = menuItem ? menuItem.price : 0;
                    prompt += `- ${p.name} ${p.qty}개 @${price.toLocaleString()}원`;
                    if (p.qty <= 5) prompt += ' ⚠️ 품절 임박';
                    if (p.qty <= 0) prompt += ' ❌ 품절';
                    prompt += '\n';
                });
            }
            
            // Check if staff is operating today
            const today = scheduleModule ? scheduleModule.formatDate(getRpDate()) : '';
            const todayShift = shop.shifts.find(s => s.date === today && s.status !== 'cancelled');
            if (todayShift) {
                const staffMember = shop.staff.find(st => st.id === todayShift.staffId);
                if (staffMember) {
                    prompt += `\n오늘 운영: ${staffMember.name} (알바)\n`;
                    prompt += `사장 부재 시: 판매와 포장만 가능, 베이킹 불가\n`;
                    if (staffMember.skills) {
                        staffMember.skills.forEach(s => {
                            prompt += `- ${s.icon} ${s.name} ${'★'.repeat(s.stars)}${'☆'.repeat(3 - s.stars)}\n`;
                        });
                    }
                }
            }
        }
        
        prompt += `\nWhen customer buys, use: <SALE>품명|수량|단가</SALE>\n`;
        prompt += `When giving gifts, use: <GIFT>품명|수량|받는사람</GIFT>\n`;
    }
    
    // Tag instructions
    prompt += `\n[Available Tags]\n`;
    prompt += `<FIN_IN>항목|금액</FIN_IN> — 수입 발생 시\n`;
    prompt += `<FIN_OUT>항목|금액</FIN_OUT> — 지출 발생 시\n`;
    prompt += `<GIFT>품명|수량|받는사람</GIFT> — 선물/증정 시\n`;
    if (chatData.balance?.shopMode?.enabled) {
        prompt += `<SALE>품명|수량|단가</SALE> — 판매 발생 시\n`;
    }
    prompt += `<BAKE>메뉴명|수량|납품일(선택)</BAKE> — 베이킹 계획 시\n`;
    prompt += `<SHOP>재료명|수량|단위|가격|장소(선택)</SHOP> — 재료 구매 필요 시\n`;
    
    return prompt;
}

// Main initialization function
async function init() {
    try {
        console.log('SSTSSD: Initializing Side Dashboard extension');

        // Initialize settings
        initSettings();

        // Create and insert panel
        panelElement = createPanel();
        document.body.appendChild(panelElement);

        // Create and insert toggle button
        const toggleBtn = createToggleButton();
        document.body.appendChild(toggleBtn);

        // Get initial chat context
        const context = getContext();
        currentChatId = context.chatId;

        // Initialize modules
        initModules();

        // Attach event listeners
        attachEventListeners();

        // Initialize observer
        initObserver();

        // Expose updateSummary globally for modules to call
        window.sstsdUpdateSummary = updateSummary;
        
        // Register prompt injection for AI context
        eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY, (promptData) => {
            try {
                const dashboardPrompt = buildDashboardPrompt();
                if (dashboardPrompt && promptData) {
                    console.log('SSTSSD: Injecting dashboard state into AI prompt');
                    // Add as system message to the prompt
                    if (Array.isArray(promptData)) {
                        promptData.push({
                            role: 'system',
                            content: dashboardPrompt
                        });
                    } else if (promptData.messages && Array.isArray(promptData.messages)) {
                        promptData.messages.push({
                            role: 'system',
                            content: dashboardPrompt
                        });
                    } else if (promptData.prompt !== undefined) {
                        // If it has a prompt property, append to it
                        promptData.prompt += dashboardPrompt;
                    }
                }
            } catch (error) {
                console.error('SSTSSD: Failed to inject dashboard prompt', error);
            }
        });

        // Listen for chat changes
        eventSource.on(event_types.CHAT_CHANGED, () => {
            console.log('SSTSSD: Chat changed, reloading modules');
            reloadModules();
        });

        console.log('SSTSSD: Side Dashboard extension initialized successfully');
    } catch (error) {
        console.error('SSTSSD: Failed to initialize extension', error);
    }
}

// Extension entry point
jQuery(async () => {
    try {
        await init();
    } catch (error) {
        console.error('SSTSSD: Fatal error during initialization', error);
    }
});

// Export for potential use by other extensions
export { MODULE_NAME, todoModule, scheduleModule, balanceModule, inventoryModule, bakingModule, shopModule, getRpDate };
