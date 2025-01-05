const axios = require('axios');

const checkProfanity = async (content) => {
    try {
        const response = await axios.get('https://www.purgomalum.com/service/containsprofanity', {
            params: { text: content },
        });
        return response.data === 'true';
    } catch (error) {
        console.error('Profanity API error:', error);
        return false; 
    }
};

module.exports = { checkProfanity };
