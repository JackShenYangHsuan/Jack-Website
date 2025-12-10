/**
 * SpeakCoach - Topic Generator Module
 * Handles loading and selecting random practice topics
 */

const TopicGenerator = (function() {
    'use strict';

    // Topic bank - 20 topics per category (80 total)
    const topics = {
        opinion: [
            "What's one habit everyone should adopt and why?",
            "Is remote work better than office work?",
            "Should college education be free for everyone?",
            "Is social media doing more harm than good?",
            "Should voting be mandatory?",
            "Is it better to be a specialist or a generalist?",
            "Should companies have a 4-day work week?",
            "Is artificial intelligence a threat to humanity?",
            "Should parents limit children's screen time?",
            "Is it better to rent or buy a home?",
            "Should tipping culture be abolished?",
            "Is competition healthy or harmful?",
            "Should we prioritize economic growth or environmental protection?",
            "Is failure necessary for success?",
            "Should schools teach financial literacy?",
            "Is it ethical to eat meat?",
            "Should billionaires exist?",
            "Is privacy more important than security?",
            "Should athletes be role models?",
            "Is technology making us less human?"
        ],
        story: [
            "Tell me about a time you failed and what you learned.",
            "Describe a moment that changed your perspective on life.",
            "Share a story about helping someone in an unexpected way.",
            "Tell me about your proudest accomplishment.",
            "Describe a risk you took that paid off.",
            "Share a time when you had to stand up for yourself.",
            "Tell me about a mentor who shaped who you are.",
            "Describe your most memorable travel experience.",
            "Share a time when you had to adapt quickly to change.",
            "Tell me about a difficult decision you had to make.",
            "Describe a time you surprised yourself.",
            "Share a story about overcoming a fear.",
            "Tell me about a time you led a team through a challenge.",
            "Describe a moment when you felt truly grateful.",
            "Share a time when you had to apologize and make things right.",
            "Tell me about something you built or created from scratch.",
            "Describe your first job and what it taught you.",
            "Share a time when you changed someone's mind.",
            "Tell me about a friendship that shaped you.",
            "Describe a setback that turned into an opportunity."
        ],
        explain: [
            "Explain how a search engine works to a 10-year-old.",
            "Explain why the sky is blue.",
            "Explain what makes a good leader.",
            "Explain how compound interest works.",
            "Explain how habits form in the brain.",
            "Explain the concept of supply and demand.",
            "Explain how vaccines work.",
            "Explain why exercise is good for mental health.",
            "Explain what blockchain is.",
            "Explain how airplanes stay in the air.",
            "Explain what makes a story compelling.",
            "Explain how credit scores work.",
            "Explain the greenhouse effect.",
            "Explain why sleep is important.",
            "Explain how to build trust with someone.",
            "Explain what machine learning is.",
            "Explain how to manage stress effectively.",
            "Explain what makes a team effective.",
            "Explain how the stock market works.",
            "Explain why diversity matters in organizations."
        ],
        persuade: [
            "Convince me to read more books.",
            "Convince me to try your favorite hobby.",
            "Convince me to visit your hometown.",
            "Convince me to learn a new language.",
            "Convince me to wake up earlier.",
            "Convince me to start exercising regularly.",
            "Convince me to try meditation.",
            "Convince me to delete social media.",
            "Convince me to start a side project.",
            "Convince me to travel solo.",
            "Convince me to learn to cook.",
            "Convince me to journal daily.",
            "Convince me to volunteer in my community.",
            "Convince me to invest in the stock market.",
            "Convince me to adopt a pet.",
            "Convince me to take a public speaking class.",
            "Convince me to go back to school.",
            "Convince me to start a podcast.",
            "Convince me to move to a new city.",
            "Convince me to spend less time on my phone."
        ]
    };

    const categories = Object.keys(topics);

    /**
     * Get a random topic from a specific category or any category
     * @param {string} [category] - Optional category to pick from
     * @returns {{ text: string, category: string }}
     */
    function getRandomTopic(category) {
        // If no category specified, pick a random one
        const selectedCategory = category && topics[category]
            ? category
            : categories[Math.floor(Math.random() * categories.length)];

        const categoryTopics = topics[selectedCategory];
        const randomIndex = Math.floor(Math.random() * categoryTopics.length);

        return {
            text: categoryTopics[randomIndex],
            category: selectedCategory
        };
    }

    /**
     * Get all available categories
     * @returns {string[]}
     */
    function getCategories() {
        return [...categories];
    }

    /**
     * Format category name for display
     * @param {string} category
     * @returns {string}
     */
    function formatCategoryName(category) {
        const names = {
            opinion: 'Opinion',
            story: 'Story',
            explain: 'Explain',
            persuade: 'Persuade'
        };
        return names[category] || category;
    }

    // Public API
    return {
        getRandomTopic,
        getCategories,
        formatCategoryName
    };
})();

// Export for testing (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TopicGenerator;
}
