// Configuration
const CONFIG = {
    textPause: { min: 1000, max: 3000 }, // 1-3s between lines
    housePause: { min: 10000, max: 30000 }, // 10-30s after reflection
    typingSpeed: 30, // ms per character
};

// State
let config = {};
let houses = {};
let flowState = {
    stage: 'intro', // intro, birthData, reflection, houseProbing, wrap
    currentHouseIndex: 0,
    userBirthData: null,
    userIntent: null,
    sessionLog: [],
    housesToProbe: ['2nd', '6th', '10th'], // core triangle first
};

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const pauseIndicator = document.getElementById('pause-indicator');
const pauseTimer = document.getElementById('pause-timer');
const inputContainer = document.getElementById('input-container');

// Initialize
async function init() {
    try {
        const [configResponse, housesResponse] = await Promise.all([
            fetch('data/config.json'),
            fetch('data/houses.json')
        ]);
        
        config = await configResponse.json();
        houses = await housesResponse.json();
        
        // Load session log from localStorage
        const savedLog = localStorage.getItem('orendaSessionLog');
        if (savedLog) {
            flowState.sessionLog = JSON.parse(savedLog);
        }
        
        // Event listeners
        sendBtn.addEventListener('click', handleSend);
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sendBtn.disabled) {
                    handleSend();
                }
            }
        });
        
        userInput.addEventListener('input', () => {
            // Auto-resize textarea
            userInput.style.height = 'auto';
            userInput.style.height = userInput.scrollHeight + 'px';
        });
        
        // Start conversation
        setTimeout(() => {
            startIntro();
        }, 500);
        
    } catch (error) {
        console.error('Error loading data:', error);
        addMessage('system', 'Error loading data. Please refresh the page.');
    }
}

// Start intro
async function startIntro() {
    const introMessages = [
        'hey there',
        'i\'m astra',
        'wanna explore how you make a living through your chart?',
        'you can paste your birth data or just tell me your date of birth'
    ];
    
    for (let i = 0; i < introMessages.length; i++) {
        await addAstraMessage(introMessages[i]);
        if (i < introMessages.length - 1) {
            await delay(getRandomDelay(CONFIG.textPause));
        }
    }
    
    flowState.stage = 'birthData';
    enableInput();
}

// Handle send
async function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;
    
    // Add user message
    addUserMessage(text);
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Log user input
    flowState.sessionLog.push({
        type: 'user',
        text: text,
        timestamp: new Date().toISOString()
    });
    saveSessionLog();
    
    // Disable input while processing
    disableInput();
    
    // Process based on flow stage
    if (flowState.stage === 'birthData') {
        await handleBirthData(text);
    } else if (flowState.stage === 'intent') {
        await handleIntent(text);
    } else if (flowState.stage === 'houseProbing') {
        await handleHouseResponse(text);
    } else if (flowState.stage === 'wrap') {
        await handleWrapResponse(text);
    }
}

// Handle birth data input
async function handleBirthData(text) {
    flowState.userBirthData = text;
    
    // Echo something user wrote
    const echoPhrase = extractEchoPhrase(text);
    
    await delay(1000);
    await addAstraMessage(`so ${echoPhrase}...`);
    await delay(getRandomDelay(CONFIG.textPause));
    
    // Reflect chart basics (simplified for prototype)
    await addAstraMessage('looking at your chart');
    await delay(getRandomDelay(CONFIG.textPause));
    await addAstraMessage('what brings you here today?');
    await delay(getRandomDelay(CONFIG.textPause));
    await addAstraMessage('general curiosity, work, money, hobbies?');
    
    flowState.stage = 'intent';
    await pauseBeforeNextInput();
}

// Handle intent
async function handleIntent(text) {
    flowState.userIntent = text;
    
    const echoPhrase = extractEchoPhrase(text);
    
    await delay(1000);
    await addAstraMessage(`${echoPhrase}, got it`);
    await delay(getRandomDelay(CONFIG.textPause));
    
    // Start probing core triangle
    flowState.stage = 'houseProbing';
    flowState.currentHouseIndex = 0;
    await probeNextHouse();
}

// Probe next house
async function probeNextHouse() {
    if (flowState.currentHouseIndex >= flowState.housesToProbe.length) {
        // Check if we should probe meaning/spiritual axis
        if (flowState.housesToProbe.length === 3) {
            // Add 5th, 11th if relevant
            flowState.housesToProbe.push('5th', '11th');
            flowState.currentHouseIndex = 3;
            await probeNextHouse();
            return;
        } else {
            // All houses done, wrap up
            flowState.stage = 'wrap';
            await wrapUp();
            return;
        }
    }
    
    const houseKey = flowState.housesToProbe[flowState.currentHouseIndex];
    const house = houses[houseKey];
    
    if (!house) {
        flowState.currentHouseIndex++;
        await probeNextHouse();
        return;
    }
    
    await delay(1000);
    
    // Reflect on house (one idea per reply)
    const reflection = generateHouseReflection(house, houseKey);
    await addAstraMessage(reflection);
    
    // Log Astra response
    flowState.sessionLog.push({
        type: 'astra',
        text: reflection,
        house: houseKey,
        timestamp: new Date().toISOString()
    });
    saveSessionLog();
    
    await pauseBeforeNextInput();
}

// Handle house response
async function handleHouseResponse(text) {
    const echoPhrase = extractEchoPhrase(text);
    const currentHouseKey = flowState.housesToProbe[flowState.currentHouseIndex];
    const house = houses[currentHouseKey];
    
    await delay(1000);
    await addAstraMessage(`${echoPhrase}`);
    await delay(getRandomDelay(CONFIG.textPause));
    
    // Reflect and relate to chart (one idea)
    const followUp = generateHouseFollowUp(house, currentHouseKey, text);
    await addAstraMessage(followUp);
    
    // Log
    flowState.sessionLog.push({
        type: 'user',
        text: text,
        house: currentHouseKey,
        timestamp: new Date().toISOString()
    });
    flowState.sessionLog.push({
        type: 'astra',
        text: followUp,
        house: currentHouseKey,
        timestamp: new Date().toISOString()
    });
    saveSessionLog();
    
    // Move to next house or continue
    flowState.currentHouseIndex++;
    await pauseBeforeNextInput();
    
    if (flowState.currentHouseIndex < flowState.housesToProbe.length) {
        // Small delay before next house probe
        setTimeout(async () => {
            await probeNextHouse();
        }, 2000);
    } else {
        // Check if more houses to probe
        if (flowState.housesToProbe.length === 3) {
            flowState.housesToProbe.push('5th', '11th');
            flowState.currentHouseIndex = 3;
            setTimeout(async () => {
                await probeNextHouse();
            }, 2000);
        } else {
            flowState.stage = 'wrap';
            setTimeout(async () => {
                await wrapUp();
            }, 2000);
        }
    }
}

// Wrap up
async function wrapUp() {
    await delay(1000);
    await addAstraMessage('that\'s what i see in your chart');
    await delay(getRandomDelay(CONFIG.textPause));
    await addAstraMessage('any questions for next time?');
    
    flowState.stage = 'wrap';
    await pauseBeforeNextInput();
}

// Handle wrap response
async function handleWrapResponse(text) {
    const echoPhrase = extractEchoPhrase(text);
    
    await delay(1000);
    await addAstraMessage(`${echoPhrase}`);
    await delay(getRandomDelay(CONFIG.textPause));
    await addAstraMessage('cool, we can explore that next time');
    
    await pauseBeforeNextInput();
}

// Generate house reflection (simplified - in real version would use LLM)
function generateHouseReflection(house, houseKey) {
    const themes = house.themes.join(', ');
    const simpleReflections = {
        '2nd': `your 2nd house is about resources, what you value. ${house.voice}`,
        '6th': `your 6th house shows how you work, your craft. ${house.voice}`,
        '10th': `your 10th house is your public path, what you build. ${house.voice}`,
        '5th': `your 5th house is about creating, playing, expressing. ${house.voice}`,
        '11th': `your 11th house is community, hopes, collective vision. ${house.voice}`,
        '8th': `your 8th house is transformation, shared resources. ${house.voice}`
    };
    
    return simpleReflections[houseKey] || `your ${houseKey} house: ${themes}. ${house.voice}`;
}

// Generate house follow-up (simplified)
function generateHouseFollowUp(house, houseKey, userText) {
    // In real version, this would use LLM to reflect on user's response
    // For prototype, simple echo-based response
    const shortResponses = [
        `yeah, that connects to ${house.themes[0]}`,
        `i see that in your ${houseKey} house`,
        `that makes sense with ${house.name}`,
        `the ${houseKey} house shows that`
    ];
    
    return shortResponses[Math.floor(Math.random() * shortResponses.length)];
}

// Extract echo phrase from user text
function extractEchoPhrase(text) {
    // Simple extraction - take first few words or a key phrase
    const words = text.trim().split(/\s+/);
    if (words.length <= 3) {
        return words.join(' ');
    }
    // Take first 2-4 words
    const length = Math.min(4, Math.max(2, Math.floor(words.length / 2)));
    return words.slice(0, length).join(' ');
}

// Add user message
function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;
    
    messageDiv.appendChild(bubble);
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Add Astra message with typing simulation
async function addAstraMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message astra';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    messageDiv.appendChild(bubble);
    chatMessages.appendChild(messageDiv);
    
    // Show typing indicator
    const typingIndicator = createTypingIndicator();
    bubble.appendChild(typingIndicator);
    scrollToBottom();
    
    // Simulate typing
    await typeMessage(bubble, text, typingIndicator);
    
    scrollToBottom();
}

// Type message character by character
async function typeMessage(element, text, typingIndicator) {
    // Remove typing indicator
    if (typingIndicator && typingIndicator.parentNode) {
        typingIndicator.remove();
    }
    
    element.textContent = '';
    
    for (let i = 0; i < text.length; i++) {
        element.textContent += text[i];
        await delay(CONFIG.typingSpeed);
        
        // Scroll periodically
        if (i % 10 === 0) {
            scrollToBottom();
        }
    }
    
    scrollToBottom();
}

// Create typing indicator
function createTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        indicator.appendChild(dot);
    }
    
    return indicator;
}

// Pause before next input
async function pauseBeforeNextInput() {
    const pauseDuration = getRandomDelay(CONFIG.housePause);
    
    pauseIndicator.classList.remove('hidden');
    pauseTimer.textContent = '';
    
    // Countdown
    let remaining = Math.ceil(pauseDuration / 1000);
    const countdownInterval = setInterval(() => {
        remaining--;
        if (remaining > 0) {
            pauseTimer.textContent = `${remaining}s`;
        } else {
            pauseTimer.textContent = '';
        }
    }, 1000);
    
    await delay(pauseDuration);
    
    clearInterval(countdownInterval);
    pauseIndicator.classList.add('hidden');
    pauseTimer.textContent = '';
    
    enableInput();
}

// Enable input
function enableInput() {
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
}

// Disable input
function disableInput() {
    userInput.disabled = true;
    sendBtn.disabled = true;
}

// Scroll to bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Utility functions
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomDelay(range) {
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

function saveSessionLog() {
    localStorage.setItem('orendaSessionLog', JSON.stringify(flowState.sessionLog));
}

// Start when page loads
document.addEventListener('DOMContentLoaded', init);

