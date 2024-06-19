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
    "hej.",
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
    "javascript",
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