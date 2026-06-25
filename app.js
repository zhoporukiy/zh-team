document.addEventListener('DOMContentLoaded', () => {
    // 3D Card Tilt Effect
    const mainCard = document.querySelector('.main-card');
    
    document.addEventListener('mousemove', (e) => {
        if (!mainCard) return;
        
        const xAxis = (window.innerWidth / 2 - e.pageX) / 45;
        const yAxis = (window.innerHeight / 2 - e.pageY) / 45;
        
        // Cap the angles to avoid excessive rotation
        const rotateX = Math.max(Math.min(yAxis, 12), -12);
        const rotateY = Math.max(Math.min(-xAxis, 12), -12);
        
        mainCard.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
    });

    document.addEventListener('mouseleave', () => {
        if (!mainCard) return;
        mainCard.style.transform = 'rotateY(0deg) rotateX(0deg)';
    });

    // Tab Switching Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetEl = document.getElementById(targetTab);
            if (targetEl) targetEl.classList.add('active');
        });
    });

    // Preview Toggle Logic (Telegram vs Discord)
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const previewContainers = document.querySelectorAll('.preview-container');

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPreview = btn.getAttribute('data-preview');

            toggleBtns.forEach(b => b.classList.remove('active'));
            previewContainers.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetEl = document.getElementById(targetPreview + '-preview');
            if (targetEl) targetEl.classList.add('active');
        });
    });

    // ----------------------------------------------------
    // TAB 1: Post Builder & Limit Calculator
    // ----------------------------------------------------
    const textEditor = document.getElementById('text-editor');
    const tgLimitMode = document.getElementById('tg-limit-mode');
    const dsLimitMode = document.getElementById('ds-limit-mode');
    const charProgress = document.getElementById('char-progress');
    const charCounterVal = document.getElementById('char-counter-val');
    const charLimitVal = document.getElementById('char-limit-val');

    // Mini Counters
    const miniTgPost = document.getElementById('mini-tg-post');
    const miniTgCap = document.getElementById('mini-tg-cap');
    const miniDsMsg = document.getElementById('mini-ds-msg');
    const miniDsNitro = document.getElementById('mini-ds-nitro');

    // Preview Render Elements
    const tgPreviewText = document.getElementById('tg-preview-text');
    const dsPreviewText = document.getElementById('ds-preview-text');

    // Quick formatting buttons
    const formatBold = document.getElementById('format-bold');
    const formatItalic = document.getElementById('format-italic');
    const formatSpoiler = document.getElementById('format-spoiler');
    const formatCode = document.getElementById('format-code');
    const formatCodeBlock = document.getElementById('format-codeblock');

    const formattingMap = {
        bold: { start: '**', end: '**' },
        italic: { start: '*', end: '*' },
        spoiler: { start: '||', end: '||' },
        code: { start: '`', end: '`' },
        codeblock: { start: '```\n', end: '\n```' }
    };

    function applyFormatting(type) {
        if (!textEditor) return;
        const startTag = formattingMap[type].start;
        const endTag = formattingMap[type].end;
        
        const start = textEditor.selectionStart;
        const end = textEditor.selectionEnd;
        const text = textEditor.value;
        
        const selectedText = text.substring(start, end);
        const replacement = startTag + selectedText + endTag;
        
        textEditor.value = text.substring(0, start) + replacement + text.substring(end);
        
        // Restore cursor position
        textEditor.focus();
        textEditor.setSelectionRange(start + startTag.length, start + startTag.length + selectedText.length);
        
        updateEditorMetrics();
    }

    if (formatBold) formatBold.addEventListener('click', () => applyFormatting('bold'));
    if (formatItalic) formatItalic.addEventListener('click', () => applyFormatting('italic'));
    if (formatSpoiler) formatSpoiler.addEventListener('click', () => applyFormatting('spoiler'));
    if (formatCode) formatCode.addEventListener('click', () => applyFormatting('code'));
    if (formatCodeBlock) formatCodeBlock.addEventListener('click', () => applyFormatting('codeblock'));

    // Character Limit Values Config
    const limitsConfig = {
        'tg-post': 4096,
        'tg-post-prem': 8192,
        'tg-caption': 1024,
        'tg-caption-prem': 4096,
        'tg-bio': 70,
        'tg-bio-prem': 140,
        'ds-msg': 2000,
        'ds-nitro': 4000,
        'ds-embed-desc': 4096
    };

    // Text formatting parser for previews (Markdown to HTML)
    function parseMarkdown(text, platform) {
        if (!text) return '<i>Пустое сообщение...</i>';
        
        let html = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Code Blocks
        html = html.replace(/```([\s\S]+?)```/g, '<pre><code>$1</code></pre>');
        
        // Inline Code
        html = html.replace(/`([^`\n]+?)`/g, '<code>$1</code>');

        // Bold
        html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
        
        // Italic
        html = html.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
        html = html.replace(/_([^_]+?)_/g, '<em>$1</em>');

        // Spoiler
        if (platform === 'discord') {
            html = html.replace(/\|\|([\s\S]+?)\|\|/g, '<span class="ds-spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>');
        } else {
            html = html.replace(/\|\|([\s\S]+?)\|\|/g, '<span class="tg-spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>');
        }

        // Handle line breaks
        html = html.replace(/\n/g, '<br>');

        return html;
    }

    function updateEditorMetrics() {
        if (!textEditor) return;
        const text = textEditor.value;
        const len = text.length;

        // Update counts
        if (charCounterVal) charCounterVal.textContent = len;

        // Determine current limit based on selected modes
        let currentLimit = 4096; // default
        const activePlatformBtn = document.querySelector('.toggle-btn.active');
        const activePlatform = activePlatformBtn ? activePlatformBtn.getAttribute('data-preview') : 'tg';

        if (activePlatform === 'tg' && tgLimitMode) {
            currentLimit = limitsConfig[tgLimitMode.value] || 4096;
        } else if (activePlatform === 'ds' && dsLimitMode) {
            currentLimit = limitsConfig[dsLimitMode.value] || 2000;
        }

        if (charLimitVal) charLimitVal.textContent = currentLimit;

        // Progress bar percentage
        let pct = (len / currentLimit) * 100;
        if (pct > 100) pct = 100;
        
        if (charProgress) {
            charProgress.style.width = pct + '%';
            charProgress.className = 'progress-bar';
            if (pct >= 90) {
                charProgress.classList.add('danger');
            } else if (pct >= 70) {
                charProgress.classList.add('warning');
            }
        }

        // Update mini counters
        if (miniTgPost) miniTgPost.textContent = `${len}/4096`;
        if (miniTgCap) miniTgCap.textContent = `${len}/1024`;
        if (miniDsMsg) miniDsMsg.textContent = `${len}/2000`;
        if (miniDsNitro) miniDsNitro.textContent = `${len}/4000`;

        // Update previews
        if (tgPreviewText) tgPreviewText.innerHTML = parseMarkdown(text, 'telegram');
        if (dsPreviewText) dsPreviewText.innerHTML = parseMarkdown(text, 'discord');
    }

    if (textEditor) {
        textEditor.addEventListener('input', updateEditorMetrics);
    }
    if (tgLimitMode) {
        tgLimitMode.addEventListener('change', updateEditorMetrics);
    }
    if (dsLimitMode) {
        dsLimitMode.addEventListener('change', updateEditorMetrics);
    }
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', updateEditorMetrics);
    });

    // Initialize metrics
    updateEditorMetrics();


    // ----------------------------------------------------
    // TAB 2: Discord Permissions Calculator
    // ----------------------------------------------------
    const permCheckboxes = document.querySelectorAll('.perm-checkbox');
    const permsInteger = document.getElementById('perms-integer');
    const clientIdInput = document.getElementById('client-id');
    const generatedUrl = document.getElementById('generated-url');
    const copyUrlBtn = document.getElementById('copy-url-btn');

    function calculatePermissions() {
        let permissionsSum = 0n;
        permCheckboxes.forEach(cb => {
            if (cb.checked) {
                permissionsSum += BigInt(cb.getAttribute('data-value'));
            }
        });

        const sumStr = permissionsSum.toString();
        if (permsInteger) permsInteger.textContent = sumStr;

        // Generate Invite URL
        const clientId = clientIdInput ? clientIdInput.value.trim() : '';
        if (clientId && generatedUrl) {
            const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${sumStr}&scope=bot%20applications.commands`;
            generatedUrl.value = url;
            if (copyUrlBtn) copyUrlBtn.removeAttribute('disabled');
        } else if (generatedUrl) {
            generatedUrl.value = 'Введите Client ID бота...';
            if (copyUrlBtn) copyUrlBtn.setAttribute('disabled', 'true');
        }
    }

    permCheckboxes.forEach(cb => {
        cb.addEventListener('change', calculatePermissions);
    });

    if (clientIdInput) {
        clientIdInput.addEventListener('input', calculatePermissions);
    }

    if (copyUrlBtn && generatedUrl) {
        copyUrlBtn.addEventListener('click', () => {
            if (generatedUrl.value && generatedUrl.value !== 'Введите Client ID бота...') {
                navigator.clipboard.writeText(generatedUrl.value).then(() => {
                    const originalText = copyUrlBtn.innerHTML;
                    copyUrlBtn.innerHTML = '<i class="fas fa-check"></i> Скопировано!';
                    copyUrlBtn.style.background = 'var(--accent-green)';
                    copyUrlBtn.style.boxShadow = '0 4px 0 #27ae60';
                    setTimeout(() => {
                        copyUrlBtn.innerHTML = originalText;
                        copyUrlBtn.style.background = '';
                        copyUrlBtn.style.boxShadow = '';
                    }, 2000);
                });
            }
        });
    }

    // ----------------------------------------------------
    // TAB 3: Marketing ROI Calculator
    // ----------------------------------------------------
    const budgetInput = document.getElementById('calc-budget');
    const viewsInput = document.getElementById('calc-views');
    const clicksInput = document.getElementById('calc-clicks');
    const actionInput = document.getElementById('calc-actions');

    const resultCpm = document.getElementById('res-cpm');
    const resultCpc = document.getElementById('res-cpc');
    const resultCpa = document.getElementById('res-cpa');
    const resultCtr = document.getElementById('res-ctr');
    const resultCr = document.getElementById('res-cr');

    function calculateMarketingMetrics() {
        const budget = parseFloat(budgetInput.value) || 0;
        const views = parseFloat(viewsInput.value) || 0;
        const clicks = parseFloat(clicksInput.value) || 0;
        const actions = parseFloat(actionInput.value) || 0;

        // CPM = (Budget / Views) * 1000
        if (views > 0 && budget > 0) {
            resultCpm.textContent = `${((budget / views) * 1000).toFixed(2)} ₽`;
        } else {
            resultCpm.textContent = '0.00 ₽';
        }

        // CPC = Budget / Clicks
        if (clicks > 0 && budget > 0) {
            resultCpc.textContent = `${(budget / clicks).toFixed(2)} ₽`;
        } else {
            resultCpc.textContent = '0.00 ₽';
        }

        // CPA = Budget / Actions
        if (actions > 0 && budget > 0) {
            resultCpa.textContent = `${(budget / actions).toFixed(2)} ₽`;
        } else {
            resultCpa.textContent = '0.00 ₽';
        }

        // CTR = (Clicks / Views) * 100
        if (views > 0 && clicks > 0) {
            resultCtr.textContent = `${((clicks / views) * 100).toFixed(2)}%`;
        } else {
            resultCtr.textContent = '0.00%';
        }

        // CR = (Actions / Clicks) * 100
        if (clicks > 0 && actions > 0) {
            resultCr.textContent = `${((actions / clicks) * 100).toFixed(2)}%`;
        } else {
            resultCr.textContent = '0.00%';
        }
    }

    [budgetInput, viewsInput, clicksInput, actionInput].forEach(inp => {
        if (inp) inp.addEventListener('input', calculateMarketingMetrics);
    });
});
