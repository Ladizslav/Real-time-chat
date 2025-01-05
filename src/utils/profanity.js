const axios = require('axios');

async function checkProfanity(content) {
    try {
        const response = await axios.get('https://www.purgomalum.com/service/containsprofanity', {
            params: { text: content },
        });
        return response.data === 'true';
    } catch (error) {
        console.error('Error checking profanity:', error);
        return false; 
    }
}

module.exports = { checkProfanity };
