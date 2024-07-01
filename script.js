// Array of greetings in different languages
const greetings = [
    "hello.", // English
    "你好。",
    "Привет.",
    "مرحبا.",
    "hola.",
    "bonjour.",
    "ciao.",
    "olá.",
    "hallo.",
    "salut.",
];

// Function to change the greeting
function changeGreeting() {
    const greetElement = document.querySelector(".greet");
    const randomIndex = Math.floor(Math.random() * greetings.length);
    greetElement.textContent = greetings[randomIndex];
}

// Change the greeting every 2 seconds
setInterval(changeGreeting, 3000);



// Array of greetings in different languages
const languages = [
    "python",
    "c++",
    "frontend",
    "low-level",
    "high-level",
    "game hacking",
];

let currentIndex = 0; // Global index variable

function switchLanguage() {
    const greetElement = document.querySelector(".languages");
    greetElement.textContent = languages[currentIndex];
    currentIndex = (currentIndex + 1) % languages.length; // Increment and loop back to 0 at the end
}

// Change the greeting every 2 seconds
setInterval(switchLanguage, 3000);

if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    // Define the Konami Code sequence
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    // Initialize an array to keep track of the current sequence of keys pressed
    let currentSequence = [];

    // Listen for keydown events
    document.addEventListener('keydown', (event) => {
        // Add the current key to the sequence
        currentSequence.push(event.key);
        // Keep only the last 10 keys pressed
        currentSequence = currentSequence.slice(-10);

        // Check if the current sequence matches the Konami Code
        if (currentSequence.join('') === konamiCode.join('')) {
            // Perform the desired action
            console.log('Konami Code entered!');

            // Create an image element
            const img = document.createElement('img');
            console.log("created element");
            img.src = 'https://media.tenor.com/x75EovU7F1wAAAAe/spunch-bop-spongebob.png';
            img.style.position = 'fixed';
            img.style.left = '50%';
            img.style.top = '50%';
            img.style.transform = 'translate(-50%, -50%)';
            img.style.transition = 'all 2s ease-in-out';
            img.style.width = '0';
            img.style.height = '0';
            img.style.zIndex = '1000';
            
            // Append the image to the body
            document.body.appendChild(img);

            // Animate the image to cover the entire screen
            setTimeout(() => {
                img.style.width = '100vw';
                img.style.height = '100vh';
            }, 100); // Delay to ensure the transition effect is visible

            // Create an audio element and play the MP3
            const audio = new Audio('secret.mp3');
            audio.play();
        }
    });
}


window.addEventListener('load', () => {
    const terminal = document.getElementById('terminal');
    const splashScreen = document.getElementById('splash-screen');

    // Fake terminal messages
    const messages = [
        "Booting up...",
        "Loading simonx.dev...",
        "Preparing content...",
        "Cleanin' up..."
    ];

    let currentMessage = 0;
    let previousLoadingWheel = null; // Keep track of the previous loading wheel

    const logMessage = () => {
        if (currentMessage < messages.length) {
            const p = document.createElement('p');
            p.textContent = messages[currentMessage];
            const loadingWheel = document.createElement('span');
            loadingWheel.textContent = ' /';
            p.appendChild(loadingWheel);
            terminal.appendChild(p);

            // Replace the previous loading wheel with [DONE]
            if (previousLoadingWheel) {
                const DONEText = ' [DONE]';
                previousLoadingWheel.innerHTML = ''; // Clear the loading wheel text
                // Split the DONEText into letters and wrap each pair of letters with a span
                DONEText.split('').forEach((letter, index) => {
                    const span = document.createElement('span');
                    span.textContent = letter;
                    // Assign a unique class to each letter based on its index
                    span.className = `rainbow-${index}`; // Each letter gets a unique class
                    previousLoadingWheel.appendChild(span);
                });
            }
            previousLoadingWheel = loadingWheel; // Update the reference to the current loading wheel

            let wheelState = 0;
            const wheelStates = [' /', ' -', ' \\', ' |']; // Different states of the loading wheel
            const wheelInterval = setInterval(() => {
                if (loadingWheel.textContent === ' [DONE]') {
                    clearInterval(wheelInterval); // Stop the interval if the text is [DONE]
                } else {
                    loadingWheel.textContent = wheelStates[wheelState];
                    wheelState = (wheelState + 1) % wheelStates.length;
                }
            }, 100); // Update the wheel every 250ms

            currentMessage++;
        } else {
            // Once all messages are displayed, mark the last one as DONE
            if (previousLoadingWheel) {
                const DONEText = ' [DONE]';
                previousLoadingWheel.innerHTML = ''; // Clear the loading wheel text
                // Split the DONEText into letters and wrap each letter with a span
                DONEText.split('').forEach((letter, index) => {
                    const span = document.createElement('span');
                    span.textContent = letter;
                    // Assign a unique class to each letter based on its index
                    span.className = `rainbow-${index}`; // Each letter gets a unique class
                    previousLoadingWheel.appendChild(span);
                });
            }
            clearInterval(messageInterval); // Stop the message interval
            // Fade out splash screen logic goes here
            splashScreen.style.transition = 'opacity 2s';
            splashScreen.style.opacity = 0;
            setTimeout(() => splashScreen.style.display = 'none', 2000); // Wait for fade out to finish
        }
    };

    // Start showing messages
    const messageInterval = setInterval(logMessage, 1000);
});