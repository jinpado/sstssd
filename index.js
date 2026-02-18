// Side Dashboard Extension for SillyTavern
// Main entry point

import { extension_settings, getContext } from '../../../extensions.js';
import { saveSettingsDebounced, eventSource, event_types } from '../../../../script.js';
import { TodoModule } from './modules/todo.js';
import { ScheduleModule } from './modules/schedule.js';

const MODULE_NAME = 'sstssd';

// Extension state
let panelElement = null;
let todoModule = null;
let scheduleModule = null;
let observer = null;
let currentChatId = null;

// Initialize extension settings
function initSettings() {
    if (!extension_settings[MODULE_NAME]) {
        extension_settings[MODULE_NAME] = {
            chats: {},  // Chat-specific data
            globalSettings: {
                panelOpen: true,
                openModules: ['todo', 'schedule']
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
        const openModules = extension_settings[MODULE_NAME].openModules || ['todo', 'schedule'];
        
        // Restructure to new format
        extension_settings[MODULE_NAME] = {
            chats: {
                '_migrated_default': oldData
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
            openModules: ['todo', 'schedule']
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
            todo: { items: [] },
            schedule: {
                mode: 'semester',
                timetable: {
                    '월': [], '화': [], '수': [], '목': [], '금': [], '토': [], '일': []
                },
                appointments: []
            }
        };
    }
    
    return extension_settings[MODULE_NAME].chats[chatId];
}

// Get global settings with proper fallback
function getGlobalSettings() {
    return extension_settings[MODULE_NAME].globalSettings;
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
            <div class="sstssd-module" data-module="todo">
                <!-- Todo module content -->
            </div>
            <div class="sstssd-module" data-module="schedule">
                <!-- Schedule module content -->
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

    const urgentCount = todoModule ? todoModule.getUrgentCount() : 0;
    const nextClass = scheduleModule ? scheduleModule.getNextClass() : null;
    const upcomingAppointments = scheduleModule ? scheduleModule.getUpcomingAppointments() : [];

    let summaryParts = [];

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

    summaryEl.innerHTML = `<div class="sstssd-summary-text">${summaryParts.join(' · ')}</div>`;
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
    const todoContainer = document.querySelector('.sstssd-module[data-module="todo"]');
    const scheduleContainer = document.querySelector('.sstssd-module[data-module="schedule"]');
    
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
        
        // Pass both chat data and a function to get global settings
        chatData.getGlobalSettings = getGlobalSettings;
        
        // Initialize Todo module with chat-specific data
        todoModule = new TodoModule(chatData, saveSettings);
        const todoContainer = document.querySelector('.sstssd-module[data-module="todo"]');
        if (todoContainer) {
            todoModule.render(todoContainer);
        }

        // Initialize Schedule module with chat-specific data
        scheduleModule = new ScheduleModule(chatData, saveSettings);
        const scheduleContainer = document.querySelector('.sstssd-module[data-module="schedule"]');
        if (scheduleContainer) {
            scheduleModule.render(scheduleContainer);
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
                        // Future: Parse tags like <TASKS>, <TIMELINE>, <FIN_IN>, <FIN_OUT>
                        // For now, just setup the structure
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
export { MODULE_NAME, todoModule, scheduleModule };
