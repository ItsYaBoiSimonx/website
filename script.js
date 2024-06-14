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
