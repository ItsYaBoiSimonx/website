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