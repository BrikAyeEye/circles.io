// Configuration
const CONFIG = {
    textPause: { min: 1000, max: 3000 }, // 1-3s between lines
    housePause: { min: 10000, max: 30000 }, // 10-30s after reflection
    typingSpeed: { casual: 30, moderate: 50, deep: 80 }, // ms per character based on depth
};

// Relationship depth levels
const RELATIONSHIP_DEPTH = {
    GETTING_TO_KNOW: { min: 0, max: 5, label: "getting to know", typingSpeed: CONFIG.typingSpeed.casual },
    BUILDING_RAPPORT: { min: 6, max: 15, label: "building rapport", typingSpeed: CONFIG.typingSpeed.moderate },
    KNOWING_YOU: { min: 16, max: Infinity, label: "knowing you", typingSpeed: CONFIG.typingSpeed.deep }
};

// Prewritten opener paths (each with tailored reply options)
const PRELUDE_PATHS = [
    {
        opener: "the stars are shining bright tonight. chittychat or you wanna hand me your keys right away?",
        options: [
            {
                label: "easy there.",
                response: "copy that. i can loiter on the threshold a bit longer."
            },
            {
                label: "yeah, let's stroll.",
                response: "cool. i'll keep it loose and notice the scenery first."
            },
            {
                label: "give me a sec first.",
                response: "take it. i'm happy to hover till you're ready to drop coordinates."
            }
        ]
    },
    {
        opener: "welcome stranger. what brings you to this part of the universe?",
        options: [
            {
                label: "i came for money clues.",
                response: "then we'll aim the lens at 2nd/6th/10th and see what hums."
            },
            {
                label: "mostly meaning.",
                response: "got it. i'll keep an ear on the mythic echoes, less on the hustle."
            },
            {
                label: "just curious.",
                response: "curiosity is perfect fuel. we'll wander and see what flickers."
            }
        ]
    },
    {
        opener: "listen mate. i was born an astro sceptic and then i somehow built this ai version of myself — because...",
        options: [
            {
                label: "fine, prove it.",
                response: "fair. i'll stay grounded, show receipts from your chart."
            },
            {
                label: "i'm sceptic too.",
                response: "same. we can treat this like field notes, not gospel."
            },
            {
                label: "let's talk before charts.",
                response: "cool. we can hang in human terrain before diving into ephemeris land."
            }
        ]
    }
];
const BREATH_PROMPTS = [
    "take a breath with me. no rush to reply.",
    "sip a little air, let the last line settle.",
    "notice what moved (or didn’t). we can hang here for a moment.",
    "soften your shoulders, see what lands.",
    "stay with the sensation for a beat before typing."
];

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
    relationshipDepth: 0, // Total exchanges across all sessions
    introOptionSelected: false,
};

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const pauseIndicator = document.getElementById('pause-indicator');
const pauseTimer = document.getElementById('pause-timer');
const inputContainer = document.getElementById('input-container');
const exportBtn = document.getElementById('export-btn');
const exportModal = document.getElementById('export-modal');
const exportData = document.getElementById('export-data');
const closeExport = document.getElementById('close-export');
const copyExport = document.getElementById('copy-export');
const downloadExport = document.getElementById('download-export');
let introOptionsElement = null;

// Bridge API URL - change this to your server URL
// For local testing: 'http://localhost:5000'
// For ngrok: 'https://your-ngrok-url.ngrok.io'
const BRIDGE_URL = 'https://orenda-api-7kjq.onrender.com';  // Render backend API

// Initialize
async function init() {
    console.log('init() called');
    try {
        console.log('Fetching data files...');
        const [configResponse, housesResponse] = await Promise.all([
            fetch('data/config.json'),
            fetch('data/houses.json')
        ]);
        
        console.log('Config response:', configResponse.status);
        console.log('Houses response:', housesResponse.status);
        
        if (!configResponse.ok) {
            throw new Error(`Failed to load config.json: ${configResponse.status}`);
        }
        if (!housesResponse.ok) {
            throw new Error(`Failed to load houses.json: ${housesResponse.status}`);
        }
        
        config = await configResponse.json();
        houses = await housesResponse.json();
        console.log('Data loaded successfully');
        
        // Check if DOM elements exist
        if (!chatMessages) {
            throw new Error('chat-messages element not found');
        }
        if (!userInput) {
            throw new Error('user-input element not found');
        }
        console.log('DOM elements found');
        
        // Load session log and relationship depth from localStorage
        const savedLog = localStorage.getItem('orendaSessionLog');
        if (savedLog) {
            flowState.sessionLog = JSON.parse(savedLog);
        }
        
        // Load relationship depth (total exchanges across all sessions)
        const savedDepth = localStorage.getItem('orendaRelationshipDepth');
        if (savedDepth) {
            flowState.relationshipDepth = parseInt(savedDepth) || 0;
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
        
        // Export functionality
        if (exportBtn) {
            exportBtn.addEventListener('click', showExportModal);
        }
        if (closeExport) {
            closeExport.addEventListener('click', () => exportModal.classList.add('hidden'));
        }
        if (copyExport) {
            copyExport.addEventListener('click', copyExportData);
        }
        if (downloadExport) {
            downloadExport.addEventListener('click', downloadExportData);
        }
        // Close modal when clicking outside
        if (exportModal) {
            exportModal.addEventListener('click', (e) => {
                if (e.target === exportModal) {
                    exportModal.classList.add('hidden');
                }
            });
        }
        
        // Try to get bridge stance in background (non-blocking)
        // This runs in parallel and won't block the app from starting
        (async () => {
            try {
                console.log('Attempting bridge warm-up...');
                const bridgePromise = fetch(`${BRIDGE_URL}/warm-up`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ max_turns: 2 })  // Reduced to 2 for faster response
                });
                
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 30000)  // 30s timeout
                );
                
                const bridgeResponse = await Promise.race([bridgePromise, timeoutPromise]);
                
                if (bridgeResponse.ok) {
                    const bridgeData = await bridgeResponse.json();
                    if (bridgeData.success) {
                        console.log('Bridge stance loaded:', bridgeData.summary.substring(0, 100) + '...');
                        flowState.bridgeStance = bridgeData.summary;
                    } else {
                        console.log('Bridge warm-up failed:', bridgeData.error);
                    }
                } else {
                    console.log('Bridge warm-up HTTP error:', bridgeResponse.status);
                }
            } catch (error) {
                console.log('Bridge not available or timed out:', error.message);
                console.log('Continuing without warm-up - responses will use default tone');
            }
        })();
        
        // Start conversation (don't wait for bridge)
        console.log('Setting timeout for startIntro...');
        setTimeout(() => {
            console.log('Timeout fired, calling startIntro()');
            startIntro();
        }, 500);
        
    } catch (error) {
        console.error('Error loading data:', error);
        addMessage('system', 'Error loading data. Please refresh the page.');
    }
}

// Start intro
async function startIntro() {
    console.log('Starting intro...');
    
    const path = getPreludePath();
    flowState.preludePath = path;
    
    await addAstraMessage(path.opener);
    await delay(getRandomDelay(CONFIG.textPause));
    
    showIntroOptions(path.options);
}

function showIntroOptions(options) {
    if (!Array.isArray(options)) {
        flowState.stage = 'birthData';
        enableInput();
        return;
    }
    
    disableInput();
    
    // Remove any existing intro options
    if (introOptionsElement) {
        introOptionsElement.remove();
    }
    
    // Create container for all three option bubbles
    introOptionsElement = document.createElement('div');
    introOptionsElement.className = 'intro-options-container';

    // Create three separate message bubbles (one per option)
    options.forEach(option => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user intro-option-bubble';
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble intro-option';
        bubble.textContent = option.label;
        bubble.addEventListener('click', () => handleIntroOption(option));
        
        messageDiv.appendChild(bubble);
        introOptionsElement.appendChild(messageDiv);
    });
    
    chatMessages.appendChild(introOptionsElement);
    scrollToBottom();
}

async function handleIntroOption(option) {
    if (flowState.introOptionSelected) return;
    flowState.introOptionSelected = true;
    
    await delay(150);
    
    if (introOptionsElement) {
        introOptionsElement.remove();
        introOptionsElement = null;
    }
    
    addUserMessage(option.label);
    flowState.sessionLog.push({
        type: 'user',
        text: option.label,
        stage: 'intro-option',
        timestamp: new Date().toISOString()
    });
    saveSessionLog();
    
    await delay(getRandomDelay(CONFIG.textPause));
    
    await addAstraMessage(option.response);
    flowState.sessionLog.push({
        type: 'astra',
        text: option.response,
        stage: 'intro-response',
        timestamp: new Date().toISOString()
    });
    saveSessionLog();
    
    // No more canned guidance - LLM will guide them after first user input
    flowState.stage = 'gatheringBirthData';  // LLM handles everything from here
    if (flowState.relationshipDepth === 0) {
        flowState.relationshipDepth = 1;
    }
    saveSessionLog();
    
    enableInput();
    console.log('Intro complete, input enabled after option selection');
}

function getPreludePath() {
    if (!Array.isArray(PRELUDE_PATHS) || PRELUDE_PATHS.length === 0) {
        return {
            opener: "hey there. wanna explore how you make a living through your chart?",
            options: [
                { label: "sure.", response: "cool, let's ease in." },
                { label: "maybe.", response: "we can stay tentative." },
                { label: "nah.", response: "all good, we can just talk." }
            ]
        };
    }
    const index = Math.floor(Math.random() * PRELUDE_PATHS.length);
    return PRELUDE_PATHS[index];
}

function getBreathPrompt() {
    if (!Array.isArray(BREATH_PROMPTS) || BREATH_PROMPTS.length === 0) {
        return "take a breath, feel where this lands in your body";
    }
    const index = Math.floor(Math.random() * BREATH_PROMPTS.length);
    return BREATH_PROMPTS[index];
}

function shouldMicroPause(char) {
    const punctuation = ['.', ',', '—', '-', '…', '?', '!'];
    return punctuation.includes(char) && Math.random() < 0.65;
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
    if (flowState.stage === 'gatheringBirthData') {
        await handleGatheringBirthData(text);
    } else if (flowState.stage === 'birthData') {
        await handleBirthData(text);
    } else if (flowState.stage === 'intent') {
        await handleIntent(text);
    } else if (flowState.stage === 'houseProbing') {
        await handleHouseResponse(text);
    } else if (flowState.stage === 'wrap') {
        await handleWrapResponse(text);
    }
}

// Handle gathering birth data - LLM guides user to provide DOB/place/time
async function handleGatheringBirthData(text) {
    // Check if text looks like birth data (date, or mentions date/time/place)
    const looksLikeBirthData = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})|(born|birth|dob|date of birth|time|place|location)/i.test(text);
    
    if (looksLikeBirthData) {
        // User provided birth data, extract and move forward
        flowState.userBirthData = text;
        flowState.stage = 'birthData';
        await handleBirthData(text);
        return;
    }
    
    // Otherwise, use LLM to guide them toward providing birth data
    try {
        const depthLevel = getRelationshipDepthLevel();
        const conversationHistory = getRecentConversationHistory();
        
        // Add context hint about the goal - keep it light and casual
        const guidedMessage = `${text}\n\n[Context: Your goal is to guide the user to provide their birth data (date of birth, time if known, and place/city). You can ask for it directly, or suggest they get it from https://astro.cafeastrology.com/natal.php if they prefer. Be natural and conversational - don't sound like a form. Keep it SHORT and LIGHT - no deep astro analysis yet, just friendly guidance.]`;
        
        const response = await fetch(`${BRIDGE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_message: guidedMessage,
                relationship_depth: flowState.relationshipDepth,
                depth_level: depthLevel.label,
                conversation_history: conversationHistory
            })
        });
        
        const data = await response.json();
        if (data.success) {
            await addAstraMessage(data.response);
            flowState.sessionLog.push({
                type: 'astra',
                text: data.response,
                stage: 'gatheringBirthData-response',
                timestamp: new Date().toISOString()
            });
            incrementRelationshipDepth();
            saveSessionLog();
        } else {
            // Fallback
            await addAstraMessage(`i hear you. to get started, i'll need your birth data - date, time if you know it, and place. or you can grab it from cafeastrology.com and paste it here.`);
        }
    } catch (error) {
        console.error('Error generating gathering birth data response:', error);
        await addAstraMessage(`i hear you. to get started, i'll need your birth data - date, time if you know it, and place.`);
    }
    
    await pauseBeforeNextInput();
}

// Handle birth data input (after we've confirmed they provided it)
async function handleBirthData(text) {
    flowState.userBirthData = text;
    
    // Use LLM to respond to birth data naturally
    try {
        const depthLevel = getRelationshipDepthLevel();
        const conversationHistory = getRecentConversationHistory();
        
        const response = await fetch(`${BRIDGE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_message: text,
                relationship_depth: flowState.relationshipDepth,
                depth_level: depthLevel.label,
                conversation_history: conversationHistory
            })
        });
        
        const data = await response.json();
        if (data.success) {
            await addAstraMessage(data.response);
            flowState.sessionLog.push({
                type: 'astra',
                text: data.response,
                stage: 'birthData-response',
                timestamp: new Date().toISOString()
            });
            incrementRelationshipDepth();
            saveSessionLog();
        } else {
            // Fallback to simple echo if API fails
            await addAstraMessage(`so ${extractEchoPhrase(text)}...`);
        }
    } catch (error) {
        console.error('Error generating birth data response:', error);
        await addAstraMessage(`so ${extractEchoPhrase(text)}...`);
    }
    
    flowState.stage = 'intent';
    await pauseBeforeNextInput();
}

// Handle intent
async function handleIntent(text) {
    flowState.userIntent = text;
    
    // Use LLM to acknowledge intent naturally before moving to houses
    try {
        const depthLevel = getRelationshipDepthLevel();
        const conversationHistory = getRecentConversationHistory();
        
        const response = await fetch(`${BRIDGE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_message: text,
                relationship_depth: flowState.relationshipDepth,
                depth_level: depthLevel.label,
                conversation_history: conversationHistory
            })
        });
        
        const data = await response.json();
        if (data.success) {
            await addAstraMessage(data.response);
            flowState.sessionLog.push({
                type: 'astra',
                text: data.response,
                stage: 'intent-response',
                timestamp: new Date().toISOString()
            });
            incrementRelationshipDepth();
            saveSessionLog();
        } else {
            // Fallback
            await addAstraMessage(`${extractEchoPhrase(text)}, got it`);
        }
    } catch (error) {
        console.error('Error generating intent response:', error);
        await addAstraMessage(`${extractEchoPhrase(text)}, got it`);
    }
    
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
    
    // Reflect on house (one idea per reply) - now using Mistral
    const reflection = await generateHouseReflection(house, houseKey);
    await addAstraMessage(reflection);
    
    // Log Astra response
    flowState.sessionLog.push({
        type: 'astra',
        text: reflection,
        house: houseKey,
        timestamp: new Date().toISOString()
    });
    
    // Increment relationship depth after complete exchange (user + astra)
    incrementRelationshipDepth();
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
    
    // Reflect and relate to chart (one idea) - now using Mistral
    const followUp = await generateHouseFollowUp(house, currentHouseKey, text);
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
    
    // Increment relationship depth after complete exchange (user + astra)
    incrementRelationshipDepth();
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

// Get recent conversation history for context (last 6 messages = 3 exchanges)
function getRecentConversationHistory() {
    const recent = flowState.sessionLog.slice(-6); // Last 6 messages (3 user + 3 astra)
    return recent.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
    }));
}

// Generate house reflection using Mistral API
async function generateHouseReflection(house, houseKey) {
    try {
        const stance = flowState.bridgeStance || 'Warm, reflective, curious about meaning and patterns.';
        const houseContext = `${house.name}: ${house.themes.join(', ')}. ${house.voice}`;
        const depthLevel = getRelationshipDepthLevel();
        const conversationHistory = getRecentConversationHistory();
        
        const response = await fetch(`${BRIDGE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_message: `I'm exploring my ${houseKey} house`,
                house_name: houseContext,
                bridge_stance: stance,
                relationship_depth: flowState.relationshipDepth,
                depth_level: depthLevel.label,
                conversation_history: conversationHistory
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
            return data.response;
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    } catch (error) {
        console.error('Error generating reflection:', error);
        // Fallback to simple message if API fails
        return `let's explore your ${houseKey} house together...`;
    }
}

// Generate house follow-up using Mistral API
async function generateHouseFollowUp(house, houseKey, userText) {
    try {
        const stance = flowState.bridgeStance || 'Warm, reflective, curious about meaning and patterns.';
        const houseContext = `${house.name}: ${house.themes.join(', ')}. ${house.voice}`;
        const depthLevel = getRelationshipDepthLevel();
        const conversationHistory = getRecentConversationHistory();
        
        const response = await fetch(`${BRIDGE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_message: userText,
                house_name: houseContext,
                bridge_stance: stance,
                relationship_depth: flowState.relationshipDepth,
                depth_level: depthLevel.label,
                conversation_history: conversationHistory
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
            return data.response;
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    } catch (error) {
        console.error('Error generating follow-up:', error);
        // Fallback to simple echo if API fails
        return `yeah, ${extractEchoPhrase(userText)}...`;
    }
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

// Type message character by character with variable speed based on relationship depth
async function typeMessage(element, text, typingIndicator) {
    // Small thinking delay before anything appears
    const thinkingDelay = Math.random() < 0.8 ? getRandomDelay({ min: 250, max: 900 }) : 0;
    if (thinkingDelay) {
        await delay(thinkingDelay);
    }

    // Remove typing indicator
    if (typingIndicator && typingIndicator.parentNode) {
        typingIndicator.remove();
    }
    
    // Get typing speed based on relationship depth
    const depthLevel = getRelationshipDepthLevel();
    const typingSpeed = depthLevel.typingSpeed;
    
    element.textContent = '';
    
    for (let i = 0; i < text.length; i++) {
        element.textContent += text[i];
        await delay(typingSpeed);
        
        // Micro-pause on punctuation to mimic reflective speech
        if (shouldMicroPause(text[i])) {
            const pauseLength = typingSpeed * (4 + Math.random() * 6);
            await delay(pauseLength);
        } else if (i === Math.floor(text.length / 2) && Math.random() < 0.3) {
            const midPause = typingSpeed * (6 + Math.random() * 8);
            await delay(midPause);
        }

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
    const showBreath = Math.random() < 0.7;
    
    if (showBreath) {
        const prompt = getBreathPrompt();
        pauseIndicator.classList.remove('hidden', 'fade-out');
        pauseIndicator.classList.add('fade-in');
        pauseTimer.textContent = '';
        const textEl = pauseIndicator.querySelector('.pause-text');
        if (textEl) {
            textEl.textContent = prompt;
        }
        await delay(pauseDuration);
        pauseIndicator.classList.remove('fade-in');
        pauseIndicator.classList.add('fade-out');
        await delay(400);
    } else {
        await delay(pauseDuration);
    }
    
    pauseIndicator.classList.add('hidden');
    pauseTimer.textContent = '';
    const defaultText = pauseIndicator.querySelector('.pause-text');
    if (defaultText) {
        defaultText.textContent = "take a breath, feel where this lands in your body";
    }
    enableInput();
}

// Enable input
function enableInput() {
    console.log('enableInput() called');
    if (!userInput) {
        console.error('userInput element not found!');
        return;
    }
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
    console.log('Input enabled. userInput.disabled =', userInput.disabled);
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
    localStorage.setItem('orendaRelationshipDepth', flowState.relationshipDepth.toString());
}

// Get current relationship depth level
function getRelationshipDepthLevel() {
    const depth = flowState.relationshipDepth;
    if (depth <= RELATIONSHIP_DEPTH.GETTING_TO_KNOW.max) {
        return RELATIONSHIP_DEPTH.GETTING_TO_KNOW;
    } else if (depth <= RELATIONSHIP_DEPTH.BUILDING_RAPPORT.max) {
        return RELATIONSHIP_DEPTH.BUILDING_RAPPORT;
    } else {
        return RELATIONSHIP_DEPTH.KNOWING_YOU;
    }
}

// Increment relationship depth (called after each exchange)
function incrementRelationshipDepth() {
    flowState.relationshipDepth++;
    saveSessionLog();
}

// Export session data
function showExportModal() {
    const exportPayload = {
        session_log: flowState.sessionLog,
        relationship_depth: flowState.relationshipDepth,
        user_birth_data: flowState.userBirthData,
        user_intent: flowState.userIntent,
        exported_at: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(exportPayload, null, 2);
    exportData.value = jsonString;
    exportModal.classList.remove('hidden');
}

function copyExportData() {
    exportData.select();
    document.execCommand('copy');
    
    // Show feedback
    const btn = copyExport;
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.opacity = '0.7';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.opacity = '1';
    }, 2000);
}

function downloadExportData() {
    const data = exportData.value;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orenda-session-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Start when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired');
    init().catch(error => {
        console.error('Init failed:', error);
        // Try to show error to user
        if (chatMessages) {
            chatMessages.innerHTML = `<div style="color: red; padding: 1rem;">Error: ${error.message}</div>`;
        }
    });
});

