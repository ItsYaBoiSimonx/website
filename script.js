// Array of greetings in different languages
const greetings = [
    "hello.",
    "bonjour.",
    "hola.",
    "ciao.",
    "guten tag.",
    "namaste.",
    "salaam.",
    "merhaba.",
    "hi."
];

// Function to change the greeting
function changeGreeting() {
    const greetElement = document.querySelector(".greet");
    const randomIndex = Math.floor(Math.random() * greetings.length);
    greetElement.textContent = greetings[randomIndex];
}

// Change the greeting every 2 seconds
setInterval(changeGreeting, 2000);