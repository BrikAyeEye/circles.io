// Configuration
const PAUSE_BETWEEN_LINES = 2000; // milliseconds
const PAUSE_AFTER_SCENE = 1500;

// State
let housesData = {};
let dialogues = [];
let currentSceneIndex = 0;
let reflections = [];

// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const journeyScreen = document.getElementById('journey-screen');
const beginBtn = document.getElementById('begin-btn');
const introSection = document.getElementById('intro-section');
const introTitle = document.getElementById('intro-title');
const introMessages = document.getElementById('intro-messages');
const dialogueSection = document.getElementById('dialogue-section');
const sceneHeader = document.getElementById('scene-header');
const dialogueLines = document.getElementById('dialogue-lines');
const reflectionSection = document.getElementById('reflection-section');
const reflectionQuestion = document.getElementById('reflection-question');
const reflectionInput = document.getElementById('reflection-input');
const saveReflectionBtn = document.getElementById('save-reflection-btn');
const outroSection = document.getElementById('outro-section');
const outroMessages = document.getElementById('outro-messages');

// Initialize
async function init() {
    // Load data
    try {
        const [housesResponse, dialoguesResponse] = await Promise.all([
            fetch('data/houses.json'),
            fetch('data/dialogues.json')
        ]);
        
        housesData = await housesResponse.json();
        dialogues = await dialoguesResponse.json();
        
        // Load saved reflections from localStorage
        const savedReflections = localStorage.getItem('housesJourneyReflections');
        if (savedReflections) {
            reflections = JSON.parse(savedReflections);
        }
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Error loading journey data. Please refresh the page.');
    }
    
    // Event listeners
    beginBtn.addEventListener('click', startJourney);
    saveReflectionBtn.addEventListener('click', saveReflection);
}

// Start the journey
function startJourney() {
    welcomeScreen.classList.remove('active');
    journeyScreen.classList.add('active');
    
    // Play intro
    playIntro();
}

// Play intro from The Second House
function playIntro() {
    const secondHouse = housesData['2nd'];
    introTitle.textContent = `${secondHouse.name} speaks:`;
    
    const introTexts = [
        'Welcome. I am the keeper of resources, of what you value.',
        'Today, we will explore together.',
        'Listen to the conversations that unfold.',
        'There are no right answers—only what feels true.'
    ];
    
    introMessages.innerHTML = '';
    introTexts.forEach((text, index) => {
        const p = document.createElement('p');
        p.className = 'dialogue-line';
        p.textContent = text;
        introMessages.appendChild(p);
        
        setTimeout(() => {
            p.classList.add('visible');
        }, index * PAUSE_BETWEEN_LINES);
    });
    
    // After intro, start first scene
    setTimeout(() => {
        introSection.classList.add('hidden');
        playNextScene();
    }, introTexts.length * PAUSE_BETWEEN_LINES + PAUSE_AFTER_SCENE);
}

// Play next dialogue scene
function playNextScene() {
    if (currentSceneIndex >= dialogues.length) {
        // All scenes done, show outro
        playOutro();
        return;
    }
    
    const dialogue = dialogues[currentSceneIndex];
    const pair = dialogue.pair;
    const houseA = housesData[pair[0]];
    const houseB = housesData[pair[1]];
    
    // Show scene header
    dialogueSection.classList.remove('hidden');
    sceneHeader.textContent = `${houseA.name} <-> ${houseB.name}`;
    dialogueLines.innerHTML = '';
    
    let question = null;
    let lineIndex = 0;
    
    // Display each line with timed fades
    dialogue.lines.forEach((line, index) => {
        setTimeout(() => {
            if (line.speaker === 'system') {
                question = line.text;
                showSystemQuestion(line.text);
            } else {
                const speakerName = line.speaker === pair[0] ? houseA.name : houseB.name;
                showDialogueLine(speakerName, line.text);
            }
            
            // After all lines, show reflection input
            if (index === dialogue.lines.length - 1 && question) {
                setTimeout(() => {
                    showReflection(question, pair);
                }, PAUSE_BETWEEN_LINES + PAUSE_AFTER_SCENE);
            }
        }, index * PAUSE_BETWEEN_LINES);
    });
}

// Show a dialogue line with fade-in
function showDialogueLine(speakerName, text) {
    const lineDiv = document.createElement('div');
    lineDiv.className = 'dialogue-line';
    
    const speaker = document.createElement('div');
    speaker.className = 'speaker-name';
    speaker.textContent = `${speakerName}:`;
    
    const dialogueText = document.createElement('div');
    dialogueText.className = 'dialogue-text';
    dialogueText.textContent = text;
    
    lineDiv.appendChild(speaker);
    lineDiv.appendChild(dialogueText);
    dialogueLines.appendChild(lineDiv);
    
    // Fade in
    setTimeout(() => {
        lineDiv.classList.add('visible');
    }, 100);
}

// Show system question
function showSystemQuestion(text) {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'system-question';
    questionDiv.textContent = text;
    dialogueLines.appendChild(questionDiv);
    
    setTimeout(() => {
        questionDiv.classList.add('visible');
    }, 100);
}

// Show reflection input
function showReflection(question, pair) {
    dialogueSection.classList.add('hidden');
    reflectionSection.classList.remove('hidden');
    
    reflectionQuestion.textContent = question;
    reflectionInput.value = '';
    reflectionInput.focus();
    
    // Store current scene data for saving
    reflectionInput.dataset.question = question;
    reflectionInput.dataset.pair = JSON.stringify(pair);
}

// Save reflection
function saveReflection() {
    const answer = reflectionInput.value.trim();
    const question = reflectionInput.dataset.question;
    const pair = JSON.parse(reflectionInput.dataset.pair);
    
    if (!answer) {
        alert('Please enter a reflection before saving.');
        return;
    }
    
    const reflection = {
        scene: `${pair[0]} <-> ${pair[1]}`,
        question: question,
        answer: answer,
        time: new Date().toISOString()
    };
    
    reflections.push(reflection);
    
    // Save to localStorage
    localStorage.setItem('housesJourneyReflections', JSON.stringify(reflections));
    
    // Hide reflection section
    reflectionSection.classList.add('hidden');
    
    // Move to next scene
    currentSceneIndex++;
    
    if (currentSceneIndex < dialogues.length) {
        setTimeout(() => {
            playNextScene();
        }, 500);
    } else {
        playOutro();
    }
}

// Play outro
function playOutro() {
    const outroTexts = [
        'The conversation settles.',
        'Take what resonates with you.',
        'The houses will be here when you return.'
    ];
    
    outroSection.classList.remove('hidden');
    outroMessages.innerHTML = '';
    
    outroTexts.forEach((text, index) => {
        const p = document.createElement('p');
        p.className = 'outro-line';
        p.textContent = text;
        outroMessages.appendChild(p);
        
        setTimeout(() => {
            p.classList.add('visible');
        }, index * PAUSE_BETWEEN_LINES);
    });
}

// Start when page loads
document.addEventListener('DOMContentLoaded', init);

