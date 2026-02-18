// Side Dashboard Extension for SillyTavern
// Main entry point

import { extension_settings, getContext } from '../../../extensions.js';
import { saveSettingsDebounced, eventSource, event_types } from '../../../../script.js';
import { TodoModule } from './modules/todo.js';
import { ScheduleModule } from './modules/schedule.js';
import { BalanceModule } from './modules/balance.js';
import { InventoryModule } from './modules/inventory.js';
import { BakingModule } from './modules/baking.js';

const MODULE_NAME = 'sstssd';

// Tag detection regex patterns
const FIN_IN_REGEX = /<FIN_IN>(.+?)\|(\d+)<\/FIN_IN>/g;
const FIN_OUT_REGEX = /<FIN_OUT>(.+?)\|(\d+)<\/FIN_OUT>/g;

// Extension state
let panelElement = null;
let todoModule = null;
let scheduleModule = null;
let balanceModule = null;
let inventoryModule = null;
let bakingModule = null;
let observer = null;
let currentChatId = null;

// Initialize extension settings
function initSettings() {
    if (!extension_settings[MODULE_NAME]) {
        extension_settings[MODULE_NAME] = {
            chats: {},  // Chat-specific data
            globalSettings: {
                panelOpen: true,
                openModules: ['todo', 'schedule', 'balance', 'inventory', 'baking']
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
        const openModules = extension_settings[MODULE_NAME].openModules || ['todo', 'schedule', 'balance', 'inventory', 'baking'];
        
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
            openModules: ['todo', 'schedule', 'balance', 'inventory', 'baking']
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
            baking: null  // Will be initialized by BakingModule
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
    const urgentCount = todoModule ? todoModule.getUrgentCount() : 0;
    const nextClass = scheduleModule ? scheduleModule.getNextClass() : null;
    const upcomingAppointments = scheduleModule ? scheduleModule.getUpcomingAppointments() : [];

    let summaryParts = [];

    // Add balance info
    if (balanceModule && chatData && chatData.balance) {
        const shopEnabled = chatData.balance.shopMode?.enabled;
        if (shopEnabled) {
            const personalTotal = chatData.balance.living + balanceModule.getTotalSavings();
            const shopFund = chatData.balance.shopMode.operatingFund;
            summaryParts.push(`💳 개인: ${formatCurrency(personalTotal)} | 🏪 가게: ${formatCurrency(shopFund)}`);
        } else {
            const totalAssets = balanceModule.getTotalAssets();
            summaryParts.push(`💳 잔고: ${formatCurrency(totalAssets)}`);
        }
    }

    // Add roleplay date display
    if (chatData) {
        if (chatData.rpDate) {
            const source = chatData.rpDateSource === 'auto' ? '자동 감지됨' : '수동 설정';
            summaryParts.push(`📅 롤플 날짜: ${chatData.rpDate} (${source}) <button class="sstssd-btn-edit-date" id="sstssd-edit-date-btn" title="날짜 수정">[수정]</button>`);
        } else {
            summaryParts.push(`📅 롤플 날짜: 미설정 <button class="sstssd-btn-edit-date" id="sstssd-edit-date-btn" title="날짜 설정">[설정]</button>`);
        }
    }

    if (urgentCount > 0) {
        summaryParts.push(`⚠️ 마감임박 ${urgentCount}건`);
    }

    if (nextClass) {
        summaryParts.push(`🕐 다음 수업: ${nextClass.startTime} ${nextClass.subject}`);
    }

    if (upcomingAppointments.length > 0) {
        const nextApt = upcomingAppointments[0];
        const aptDate = new Date(nextApt.date);
        summaryParts.push(`📌 다음 약속: ${aptDate.getMonth() + 1}/${aptDate.getDate()} ${nextApt.title}`);
    }

    if (summaryParts.length === 0) {
        summaryParts.push('오늘 일정이 없습니다');
    }

    summaryEl.innerHTML = `<div class="sstssd-summary-text">${summaryParts.map(part => `<span class="sstssd-summary-item">${part}</span>`).join('')}</div>`;
    
    // Attach event listener to date edit button
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
        
        // Initialize Baking module with chat-specific data, global settings getter, and inventory module
        bakingModule = new BakingModule(chatData, saveSettings, getGlobalSettings, getRpDate, inventoryModule);
        const bakingContainer = document.querySelector('.sstssd-module[data-module="baking"]');
        if (bakingContainer) {
            bakingModule.render(bakingContainer);
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
export { MODULE_NAME, todoModule, scheduleModule, balanceModule, inventoryModule, bakingModule, getRpDate };
